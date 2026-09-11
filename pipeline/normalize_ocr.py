import json
import re
from pathlib import Path


def norm(s):
    return re.sub(r"\s+", " ", str(s or "").strip())


def compact(s):
    return re.sub(r"[^A-Z0-9.,]", "", norm(s).upper())


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
            "image_index": item.get("image_index", 0),
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

    # Date regex: standard delimited dates AND dot-matrix compressed dates preceded by explicit date keywords
    date_pattern = r"(?:PKD|PACKED|PACKING|MFG|MANUFACT(?:URED)?|DATE|USE\s*BY|BEST\s*BEFORE|EXP(?:IRY)?)[.:\s]*(?:\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|\d{4,8})"
    date_region = find_best(regions, date_pattern)
    if not date_region:
        # Fallback to standard delimited date anywhere near date keywords
        date_region = find_best(regions, r"(?:PKD|PACKED|MFG|MANUFACT(?:URED)?|DATE|USE\s*BY|BEST\s*BEFORE|EXP(?:IRY)?)\b.*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}")

    # Net quantity regex: explicit Net Qty header or standalone standard metric measurement
    net_qty_rx = re.compile(r"(?:NET\s*(?:WT|WEIGHT|QTY|QUANTITY)|NET\s*:)\s*[:.]?\s*(\d+(?:\.\d+)?\s*(?:g|gm|gms|kg|ml|l|litre|litres|piece|pieces|n|u)\b)", re.I)
    net_qty_region = None
    net_qty_candidate = None
    for item in regions:
        m = net_qty_rx.search(item["text"])
        if m:
            net_qty_candidate = m.group(1)
            net_qty_region = item
            break
    if not net_qty_candidate:
        net_qty_region = find_best(regions, r"\b\d+(?:\.\d+)?\s*(?:g|gm|gms|kg|ml|l|litre|litres)\b")
        if net_qty_region:
            qm = re.search(r"\b\d+(?:\.\d+)?\s*(?:g|gm|gms|kg|ml|l|litre|litres)\b", net_qty_region["text"], re.I)
            net_qty_candidate = qm.group(0) if qm else net_qty_region["text"]

    # Batch / Lot number candidate
    batch_rx = re.compile(r"(?:^|\b)(?:BATCH|LOT)(?:\s*(?:NO|NUMBER|\.))?\s*[:.]?\s*([A-Z0-9/-]+)", re.I)
    batch_region = None
    batch_candidate = None
    for item in regions:
        bm = batch_rx.search(item["text"])
        if bm and bm.group(1).upper() not in ("NO", "NUMBER", "DATE", "CODE"):
            batch_candidate = bm.group(1)
            batch_region = item
            break
    if not batch_candidate:
        batch_region = find_best(regions, r"(?:^|\b)(?:BATCH|LOT)\b")

    # Consumer care candidate (phone / email)
    phone_region = find_best(regions, r"(?:CALL|PHONE|TEL|HELPLINE|MOBILE|CARE)\s*[:.]?\s*(\+?91[-\s]?)?[0-9\s-]{8,15}")
    email_region = find_best(regions, r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")

    # Specific date candidates
    mfg_date_region = find_best(regions, r"(?:MFG|MANUFACT(?:URED)?|PKD|PACKED|PACKING)\b.*(?:\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|\d{4,8})")
    exp_date_region = find_best(regions, r"(?:USE\s*BY|BEST\s*BEFORE|EXP(?:IRY)?)\b.*(?:\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|\d{4,8})")

    # Manufacturer candidate
    mfg_name_region = find_best(regions, r"(?:MFD\s*BY|MANUFACTURED\s*BY|PACKED\s*BY|MKTD\s*BY|MARKETED\s*BY)\s*[:.]?\s*(.+)")

    associations = {
        "mrp_candidate": mrp,
        "mrp_evidence": mrp_region,
        "tax_inclusive_mrp": True if tax_region else None,
        "tax_inclusive_evidence": tax_region,
        "unit_sale_price_candidate": usp_region["text"] if usp_region else None,
        "unit_sale_price_evidence": usp_region,
        "date_candidate_evidence": date_region,
        "net_quantity_candidate": net_qty_candidate,
        "net_quantity_evidence": net_qty_region,
        "batch_candidate": batch_candidate,
        "batch_evidence": batch_region,
        "phone_evidence": phone_region,
        "email_evidence": email_region,
        "mfg_date_evidence": mfg_date_region,
        "exp_date_evidence": exp_date_region,
        "manufacturer_evidence": mfg_name_region,
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
