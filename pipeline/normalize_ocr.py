import json
import re
from pathlib import Path


def norm(s):
    return re.sub(r"\s+", " ", str(s or "").strip())


def compact(s):
    return re.sub(r"[^A-Z0-9.,1.]", "", norm(s).upper())


def find_best(items, pattern):
    rx = re.compile(pattern, re.I)
    hits = []
    for i, item in enumerate(items):
        text = norm(item.get("text", ""))
        if rx.search(text):
            hits.append((i, item))
    hits.sort(key=lambda x: (-(float(x[1].get("confidence", 0) or 0)), x[0]))
    return hits[0][1] if hits else None


def normalize_ocr_data(raw_ocr: list[dict]) -> dict:
    regions = []
    for i, item in enumerate(raw_ocr):
        regions.append({
            "id": i,
            "text": norm(item.get("text", "")),
            "confidence": item.get("confidence"),
            "bbox": item.get("bbox"),
        })

    mrp = None
    mrp_region = None
    mrp_rx = re.compile(r"(?:^|\b)(?:MRP|MAX(?:IMUM)?\s*RETAIL\s*PRICE)\s*[:.]?\s*(?:RS\.?|₹)?\s*([0-9]+(?:[.,][0-9]{1,2})?)", re.I)
    rupee_rx = re.compile(r"(?:RS\.?|₹)\s*([0-9]+(?:[.,][0-9]{1,2})?)", re.I)
    for item in regions:
        text = item["text"]
        m = mrp_rx.search(text)
        if m:
            mrp = m.group(1).replace(",", "")
            mrp_region = item
            break
    if mrp is None:
        for item in regions:
            text = item["text"]
            if re.search(r"\bMRP\b", text, re.I):
                m = rupee_rx.search(text)
                if m:
                    mrp = m.group(1).replace(",", "")
                    mrp_region = item
                    break

    tax_region = None
    for item in regions:
        if re.search(r"\bINCL\.?\s*OF\s*ALL\s*TAX(?:ES)?\b", item["text"], re.I):
            tax_region = item
            break

    usp_region = find_best(regions, r"(?:RS\.?|₹)\s*[0-9]+(?:[.,][0-9]+)?\s+PER\s+(?:G|KG|ML|L|LITRE|LITER|CM|M|UNIT|NUMBER|NO\.?\b)")

    date_region = find_best(regions, r"(?:PKD|PACKED|MFG|MANUFACT(?:URED)?|DATE|USE\s*BY|BEST\s*BEFORE|EXP(?:IRY)?)\b.*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}")

    associations = {
        "mrp_candidate": mrp,
        "mrp_evidence": mrp_region,
        "tax_inclusive_mrp": True if tax_region else None,
        "tax_inclusive_evidence": tax_region,
        "unit_sale_price_candidate": usp_region["text"] if usp_region else None,
        "unit_sale_price_evidence": usp_region,
        "date_candidate_evidence": date_region,
    }

    return {
        "regions": regions,
        "associations": associations,
    }


def main():
    base_dir = Path(__file__).resolve().parent.parent
    input_file = Path("ocr_result.json")
    if not input_file.exists():
        input_file = base_dir / "ocr_result.json"

    with open(input_file, "r", encoding="utf-8") as f:
        raw = json.load(f)

    output = normalize_ocr_data(raw)

    output_file = Path("normalized_ocr.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print("OCR normalization complete.")
    print(f"Input regions: {len(output['regions'])}")
    print(f"MRP candidate: {output['associations']['mrp_candidate']}")
    print(f"Output: {output_file}")


if __name__ == "__main__":
    main()
