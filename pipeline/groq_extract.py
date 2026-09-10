import copy
import hashlib
import json
import os

from pathlib import Path

import httpx  # pyrefly: ignore [missing-import] # type: ignore
from dotenv import load_dotenv  # pyrefly: ignore [missing-import] # type: ignore
from groq import Groq  # pyrefly: ignore [missing-import] # type: ignore

from pipeline.canonical_normalize import canonical_normalize_product

load_dotenv()

_EXTRACTION_CACHE: dict[str, dict] = {}

SYSTEM_PROMPT = """
You are an information extraction engine for VerifEye, a system that analyzes Indian packaged commodity labels.
Extract only information supported by the supplied PaddleOCR evidence.

Return ONLY valid JSON matching this schema:
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
  "consumer_care": {"phone": null, "email": null},
  "tax_inclusive_mrp": null,
  "fssai_number": null,
  "dimensions": null,
  "food_category": null,
  "ingredients": null,
  "preservatives": [],
  "nutrition": {
    "serving_size": null,
    "basis_g": null,
    "energy_kcal": null,
    "total_fat_g": null,
    "saturated_fat_g": null,
    "trans_fat_g": null,
    "carbohydrates_g": null,
    "total_sugar_g": null,
    "added_sugar_g": null,
    "sodium_mg": null,
    "salt_g": null
  },
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
    "dimensions": null,
    "food_category": null,
    "ingredients": null
  }
}

Rules:
1. Every evidence object must contain ocr_id, image_index, exact OCR text, confidence, and bbox.
2. Never fabricate OCR IDs, confidence values, bounding boxes, or OCR text.
3. Extract ingredients exactly as supported by OCR. Do not complete or infer the list.
4. Identify preservatives only when explicitly present in the ingredients/additive declaration.
5. Each preservative must be an object with name, ins_number, amount_mg_per_kg, and evidence.
6. Set amount_mg_per_kg only when the amount is explicitly printed; otherwise use null.
7. Extract food_category only when supported by the label; otherwise use null.
8. Product name means the common/generic commodity name, not the brand name.
9. Manufacturer means the full manufacturer, packer, or importer name and address.
10. FSSAI number must be explicitly associated with FSSAI, FSSAI No, or FSSAI LIC.
11. Consumer-care phone and email must be actually present in OCR evidence.
12. Tax-inclusive MRP is true only for explicit wording such as INCL. OF ALL TAXES; otherwise use null.
13. Dimensions must be explicitly declared; never infer them.
14. Dates must retain their exact text and their explicit label. Recognize PKD/PACKED as packed_date,
MFG/MANUFACTURED as manufacturing_date, EXP/EXPIRY as expiry_date, USE BY as use_by_date,
and BEST BEFORE/BBE as best_before.
15. Never convert one type of date into another. An unlabeled date must not be assigned to any date field.
16. Do not calculate dates or normalize their format.
17. If OCR does not support a field, return null for that field and its evidence.
18. For every non-null field extracted, you MUST include its supporting evidence object in the evidence dictionary (with ocr_id, image_index, text, confidence, bbox).
19. Extract nutritional metrics into "nutrition" if present on the label. Never invent nutrition values.
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

    ocr_evidence = []
    for index, item in enumerate(ocr_data):
        text = str(item.get("text", "")).strip()
        if not text:
            continue
        item_id = item.get("id")
        if item_id is None:
            item_id = index
        conf = item.get("confidence")
        if conf is not None:
            try:
                conf = round(float(conf), 2)
            except (ValueError, TypeError):
                conf = 0.0
        bbox = item.get("bbox")
        if bbox and isinstance(bbox, list):
            try:
                bbox = [round(float(b), 1) for b in bbox]
            except (ValueError, TypeError):
                pass

        ocr_evidence.append({
            "id": item_id,
            "image_index": item.get("image_index", 0),
            "text": text,
            "confidence": conf,
            "bbox": bbox
        })

    compact_evidence = json.dumps(ocr_evidence, separators=(',', ':'), ensure_ascii=False)
    compact_hints = json.dumps(normalized_data.get("associations", {}), separators=(',', ':'), ensure_ascii=False)

    cache_key = hashlib.sha256(f"{compact_evidence}::{compact_hints}".encode("utf-8")).hexdigest()
    if cache_key in _EXTRACTION_CACHE:
        return copy.deepcopy(_EXTRACTION_CACHE[cache_key])

    user_prompt = f"""Extract product information from this PaddleOCR evidence. Use numeric IDs and image_index values exactly.

OCR EVIDENCE:
{compact_evidence}

NORMALIZATION HINTS:
{compact_hints}"""

    # Active Groq models as of 2026 — prioritize models with available token quota
    models_to_try = [
        "qwen/qwen3.8-27b",           # Active, high-accuracy 27B model (separate quota)
        "groq/compound-mini",          # Fast compound fallback
        "qwen/qwen3.6-27b",           # Fast fallback
        "openai/gpt-oss-120b",        # Best quality 120B reasoning model (when daily TPD quota available)
        "openai/gpt-oss-20b",         # Fast reasoning fallback (when daily TPD quota available)
    ]

    # Create client once outside the loop
    client = Groq(
        api_key=api_key,
        timeout=httpx.Timeout(60.0, connect=30.0),
        max_retries=0,  # We handle retries manually via model fallback
    )

    response = None
    last_err = None
    for model_name in models_to_try:
        call_kwargs = {
            "model": model_name,
            "temperature": 0.0,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ]
        }
        if "gpt-oss" in model_name:
            call_kwargs["extra_body"] = {"reasoning_effort": "low"}
            call_kwargs["response_format"] = {"type": "json_object"}
        elif "compound" in model_name:
            call_kwargs["response_format"] = {"type": "json_object"}
            call_kwargs["max_tokens"] = 700
        else:
            call_kwargs["max_tokens"] = 950

        for attempt in range(4):
            try:
                response = client.chat.completions.create(**call_kwargs)
                if response and response.choices and response.choices[0].message.content:
                    raw_text = response.choices[0].message.content.strip()
                    # Strip reasoning tags if present
                    if "</think>" in raw_text:
                        raw_text = raw_text.split("</think>", 1)[1].strip()
                    # Strip markdown wrapping if present
                    if "```json" in raw_text:
                        raw_text = raw_text.split("```json", 1)[1].split("```", 1)[0].strip()
                    elif raw_text.startswith("```"):
                        raw_text = raw_text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
                    try:
                        structured_data = json.loads(raw_text)
                    except json.JSONDecodeError:
                        import re as _re
                        cleaned = _re.sub(r',\s*([\]}])', r'\1', raw_text)
                        try:
                            structured_data = json.loads(cleaned)
                        except json.JSONDecodeError:
                            json_match = _re.search(r'(\{[\s\S]*\})', cleaned)
                            parsed_candidate = None
                            if json_match:
                                try:
                                    parsed_candidate = json.loads(json_match.group(1))
                                except Exception:
                                    pass
                            if parsed_candidate is not None:
                                structured_data = parsed_candidate
                            else:
                                # Resilient repair for truncated JSON
                                repaired = cleaned.strip()
                                if repaired.count('"') % 2 != 0:
                                    repaired += '"'
                                repaired = _re.sub(r',\s*$', '', repaired)
                                open_brackets = repaired.count('[') - repaired.count(']')
                                open_braces = repaired.count('{') - repaired.count('}')
                                repaired += (']' * max(0, open_brackets)) + ('}' * max(0, open_braces))
                                structured_data = json.loads(repaired)

                    result = canonical_normalize_product(structured_data, ocr_data)
                    _EXTRACTION_CACHE[cache_key] = copy.deepcopy(result)
                    return result
            except Exception as error:
                error_str = str(error)
                if "json_validate_failed" in error_str and "response_format" in call_kwargs:
                    call_kwargs.pop("response_format", None)
                    continue
                if "model_decommissioned" in error_str or "decommissioned" in error_str:
                    import logging as _log
                    _log.getLogger("verifeye.groq").warning(
                        f"Model '{model_name}' is decommissioned, skipping to next fallback."
                    )
                    break
                if "rate_limit" in error_str.lower() or "429" in error_str:
                    import re as _re
                    # Daily token quota exhausted (TPD):
                    # Do not sleep and retry the same model; immediately advance to the next fallback model.
                    if "tokens per day" in error_str.lower() or "tpd" in error_str.lower():
                        import logging as _log
                        _log.getLogger("verifeye.groq").warning(
                            f"Model '{model_name}' daily token limit (TPD) reached, advancing to next fallback."
                        )
                        last_err = error
                        break

                    # Reduce max tokens if requested by Groq OTPM
                    if ("reduce max_tokens" in error_str.lower() or "otpm" in error_str.lower()) and "max_tokens" in call_kwargs:
                        call_kwargs["max_tokens"] = 450

                    if attempt < 2:
                        import time as _time
                        wait_sec = 2.0
                        match = _re.search(r"try again in ([\d\.]+)s", error_str)
                        if match:
                            parsed_wait = float(match.group(1))
                            if parsed_wait > 8.0:
                                last_err = error
                                break
                            wait_sec = min(parsed_wait + 0.5, 6.0)
                        else:
                            m_match = _re.search(r"try again in (\d+)m([\d\.]+)s", error_str)
                            if m_match:
                                last_err = error
                                break
                        _time.sleep(wait_sec)
                        continue
                    last_err = error
                    break

    import logging as _log
    _log.getLogger("verifeye.groq").warning(
        f"Groq inference unavailable ({last_err}); using deterministic normalized OCR extraction."
    )
    if isinstance(normalized_data, dict):
        fallback_data = {
            "product_name": normalized_data.get("product_name"),
            "manufacturer": normalized_data.get("manufacturer"),
            "manufacturer_address": normalized_data.get("manufacturer_address"),
            "country_of_origin": normalized_data.get("country_of_origin") or "India",
            "mrp": normalized_data.get("mrp"),
            "net_quantity": normalized_data.get("net_quantity"),
            "unit_sale_price": normalized_data.get("unit_sale_price"),
            "packed_date": normalized_data.get("date_packed"),
            "manufacturing_date": normalized_data.get("date_mfg"),
            "expiry_date": normalized_data.get("date_expiry"),
            "use_by_date": normalized_data.get("date_use_by"),
            "best_before": normalized_data.get("date_best_before"),
            "batch_number": normalized_data.get("batch_number"),
            "consumer_care": {
                "phone": normalized_data.get("phone"),
                "email": normalized_data.get("email"),
            },
            "tax_inclusive_mrp": bool(normalized_data.get("tax_inclusive")),
            "fssai_number": normalized_data.get("fssai_number"),
            "ingredients": normalized_data.get("ingredients"),
            "preservatives": [],
            "evidence": {}
        }
        if not fallback_data["ingredients"] and ocr_data:
            for item in ocr_data:
                t = str(item.get("text", ""))
                if "ingredient" in t.lower():
                    fallback_data["ingredients"] = t
                    break
        if ocr_data:
            try:
                from pipeline.nutrition_analysis import extract_nutrition_from_ocr
                nut_raw, _, nut_ev = extract_nutrition_from_ocr(ocr_data)
                if any(v is not None for k, v in nut_raw.items() if k not in ["basis_value", "basis_text", "scale_factor"]):
                    fallback_data["nutrition"] = nut_raw
                    for ek, ev_val in nut_ev.items():
                        if ek not in fallback_data["evidence"]:
                            fallback_data["evidence"][ek] = ev_val
            except Exception:
                pass
        result = canonical_normalize_product(fallback_data, ocr_data)
        _EXTRACTION_CACHE[cache_key] = copy.deepcopy(result)
        return result

    raise last_err or RuntimeError("All Groq models failed to produce a response.")


def main():
    base = Path(__file__).resolve().parent.parent
    ocr_file = Path("ocr_result.json") if Path("ocr_result.json").exists() else base / "ocr_result.json"
    norm_file = Path("normalized_ocr.json") if Path("normalized_ocr.json").exists() else base / "normalized_ocr.json"
    out_file = Path("structured_product.json") if Path("structured_product.json").exists() else base / "structured_product.json"

    with open(ocr_file, "r", encoding="utf-8") as file:
        ocr_data = json.load(file)
    try:
        with open(norm_file, "r", encoding="utf-8") as file:
            normalized_data = json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        normalized_data = {}

    structured_data = extract_structured_product(ocr_data, normalized_data)
    with open(out_file, "w", encoding="utf-8") as file:
        json.dump(structured_data, file, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    main()
