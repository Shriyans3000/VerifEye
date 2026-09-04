import json
import os
import time
from pathlib import Path
import httpx
from dotenv import load_dotenv
from groq import Groq

# Load environment variables
load_dotenv()


SYSTEM_PROMPT = """
You are an information extraction engine for VerifEye,
a system that analyzes Indian packaged commodity labels.

Extract mandatory declarations strictly according to the Legal
Metrology (Packaged Commodities) Rules, 2011, and the instructions below.

FIELD EXTRACTION RULES:

1. PRODUCT NAME:
   Extract common/generic name of the commodity.
   Ignore brand names.

2. MANUFACTURER:
   Extract full manufacturer, packer, or importer name.

3. MANUFACTURER ADDRESS:
   Extract address of manufacturer/packer/importer.

4. COUNTRY OF ORIGIN:
   Extract country of origin if declared (mandatory for imported items).

5. MRP:
   Extract Maximum Retail Price as a numeric string.
   Do not include currency symbols.

6. NET QUANTITY:
   Extract net quantity with unit (e.g. 100 g, 1 L, 5 N).

7. UNIT SALE PRICE:
   Extract Unit Sale Price (USP) if declared (e.g. ₹0.10 per g).

8. PACKED DATE:
   Extract date of packing (PKD / PACKED ON).

9. MANUFACTURING DATE:
   Extract manufacturing date (MFG / MFG DATE).

10. EXPIRY DATE:
    Extract expiry date (EXP / EXP DATE).

11. USE BY DATE:
    Extract use-by date (USE BY).

12. BEST BEFORE:
    Extract best-before declaration (BEST BEFORE).

13. BATCH NUMBER:
    Extract batch/lot number (BATCH NO / LOT NO).

14. CONSUMER CARE:
    Extract contact details: phone and email.

15. TAX INCLUSIVE MRP:
    Return true if MRP explicitly includes all taxes, false if excluded, null if unclear.

16. FSSAI NUMBER:
    Extract FSSAI license number if declared.

17. DIMENSIONS:
    Extract net dimensions if declared.

18. EVIDENCE REQUIREMENT:
    For every extracted field, provide an evidence object containing:
    - ocr_id: ID of supporting OCR region
    - text: exact supporting OCR text
    - confidence: confidence score
    - bbox: bounding box

19. DATE EXTRACTION:
    Dates MUST be associated with their explicit declaration label.
    Recognize these declaration labels:
    - "PKD", "PKD.", "PACKED", "PACKED ON", "PACKING DATE", "DATE OF PACKING" -> packed_date
    - "MFG", "MFG.", "MANUFACTURED", "MANUFACTURING DATE", "DATE OF MANUFACTURE" -> manufacturing_date
    - "EXP", "EXP.", "EXPIRY", "EXPIRY DATE", "DATE OF EXPIRY" -> expiry_date
    - "USE BY", "USE-BY", "USE BEFORE" -> use_by_date
    - "BEST BEFORE", "BEST-BEFORE", "BBE" -> best_before

20. IMPORTANT DATE RULE:
    NEVER convert one type of date into another.
    If OCR says "PKD.: 29/7/20", then packed_date = "29/7/20", manufacturing_date = null, expiry_date = null, use_by_date = null, best_before = null.

21. If OCR says "MFG: 29/07/26", then manufacturing_date = "29/07/26".

22. If OCR says "EXP: 29/07/27", then expiry_date = "29/07/27".

23. If OCR says "USE BY: 29/07/27", then use_by_date = "29/07/27".

24. If OCR says "BEST BEFORE: 6 MONTHS FROM PACKING", then best_before = "6 MONTHS FROM PACKING".

25. If multiple dates occur in one OCR region, associate each date with its nearest explicit declaration label.

26. If a date appears without a reliable declaration label, DO NOT assign it to packed_date, manufacturing_date, expiry_date, use_by_date, or best_before.

27. Do not calculate dates.

28. Do not normalize dates into another format. Preserve exact text.

29. BATCH NUMBER WITH MERGED OCR:
    Always prefer the OCR region containing the actual identifier as evidence for batch_number.

30. Do not mistake explanatory text for declarations.

31. FSSAI NUMBER: Extract fssai_number ONLY when OCR explicitly associates the number with "FSSAI", "FSSAI No", "FSSAI LIC.", etc.

32. MANUFACTURER ADDRESS: Extract actual manufacturer/packer/importer address only when OCR evidence identifies it as such.

33. CONSUMER CARE: Extract phone and email only when actually present in OCR evidence.

34. TAX-INCLUSIVE MRP: Set tax_inclusive_mrp to true ONLY when OCR explicitly states "INCL. OF ALL TAXES" or equivalent.

35. DIMENSIONS: Extract dimensions ONLY when explicitly declared in OCR.

36. For every evidence object use EXACTLY this structure:
{
  "ocr_id": 0,
  "text": "exact supporting OCR text",
  "confidence": 0.995,
  "bbox": [x1, y1, x2, y2]
}

37. The "text" inside an evidence object MUST be exact OCR text.
38. Never fabricate OCR IDs, confidence values, bounding boxes, or OCR text.
39. If OCR evidence does not support a field, return null for both field and evidence.
40. Return ONLY valid JSON object matching this schema:

{
  "product_name": null,
  "manufacturer": null,
  "manufacturer_address": null,
  "country_of_origin": null,
  "mrp": null,
  "net_quantity": null,
  "unit_sale_price": null,
  "packed_date": null,
  "manufacturing_date": null,
  "expiry_date": null,
  "use_by_date": null,
  "best_before": null,
  "batch_number": null,
  "consumer_care": {
    "phone": null,
    "email": null
  },
  "tax_inclusive_mrp": null,
  "fssai_number": null,
  "dimensions": null,

  "evidence": {
    "product_name": null,
    "manufacturer": null,
    "manufacturer_address": null,
    "country_of_origin": null,
    "mrp": null,
    "net_quantity": null,
    "unit_sale_price": null,
    "packed_date": null,
    "manufacturing_date": null,
    "expiry_date": null,
    "use_by_date": null,
    "best_before": null,
    "batch_number": null,
    "consumer_care_phone": null,
    "consumer_care_email": null,
    "tax_inclusive_mrp": null,
    "fssai_number": null,
    "dimensions": null
  }
}
"""


def extract_structured_product(
    ocr_data: list[dict],
    normalized_data: dict,
    api_key: str | None = None
) -> dict:
    if not api_key:
        api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set.")

    client = Groq(
        api_key=api_key,
        timeout=httpx.Timeout(120.0, connect=60.0),
        max_retries=3,
    )

    ocr_evidence = []
    for index, item in enumerate(ocr_data):
        ocr_evidence.append({
            "id": index,
            "text": item.get("text", ""),
            "confidence": item.get("confidence"),
            "bbox": item.get("bbox")
        })

    user_prompt = f"""
Extract the product information from the following PaddleOCR evidence.

Each OCR region has an ID. Use those IDs when creating evidence.

OCR EVIDENCE:

{json.dumps(ocr_evidence, indent=2, ensure_ascii=False)}

NORMALIZATION HINTS (use only as deterministic OCR-location hints; never invent values):
{json.dumps(normalized_data.get("associations", {}), indent=2, ensure_ascii=False)}
"""

    models_to_try = [
        "openai/gpt-oss-120b"
    ]
    response = None
    last_err = None
    for model_name in models_to_try:
        for attempt in range(3):
            try:
                client = Groq(
                    api_key=api_key,
                    timeout=httpx.Timeout(60.0, connect=30.0),
                    max_retries=2,
                )
                response = client.chat.completions.create(
                    model=model_name,
                    temperature=0,
                    response_format={"type": "json_object"},
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt}
                    ]
                )
                if response and response.choices and response.choices[0].message.content:
                    break
            except Exception as e:
                last_err = e
                time.sleep(2.0 * (attempt + 1))
        if response:
            break

    if not response:
        raise last_err

    result_text = response.choices[0].message.content
    structured_data = json.loads(result_text)
    return structured_data


def main():
    with open("ocr_result.json", "r", encoding="utf-8") as f:
        ocr_data = json.load(f)

    try:
        with open("normalized_ocr.json", "r", encoding="utf-8") as f:
            normalized_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        normalized_data = {}

    print("Sending OCR evidence to Groq...")
    structured_data = extract_structured_product(ocr_data, normalized_data)

    output_file = "structured_product.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(structured_data, f, indent=2, ensure_ascii=False)

    print(f"\nSaved to: {output_file}")


if __name__ == "__main__":
    main()
