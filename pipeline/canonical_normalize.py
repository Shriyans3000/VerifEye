import json
import re


def canonical_normalize_product(structured_product: dict, ocr_data: list[dict] = None) -> dict:
    """
    Deterministically normalizes and canonicalizes structured product data and evidence items.
    Ensures identical inputs to the compliance engine regardless of LLM key order or whitespace formatting.
    Attaches image_index to evidence items if missing by looking up original OCR data.
    """
    if not isinstance(structured_product, dict):
        structured_product = {}

    # Build OCR lookup table by index
    ocr_lookup = {}
    if ocr_data and isinstance(ocr_data, list):
        for idx, item in enumerate(ocr_data):
            ocr_lookup[idx] = item

    # Standard fields schema
    schema_fields = [
        "product_name",
        "manufacturer",
        "manufacturer_address",
        "country_of_origin",
        "mrp",
        "net_quantity",
        "unit_sale_price",
        "packed_date",
        "manufacturing_date",
        "expiry_date",
        "use_by_date",
        "best_before",
        "batch_number",
        "tax_inclusive_mrp",
        "fssai_number",
        "dimensions",
    ]

    canonical = {}

    for field in schema_fields:
        val = structured_product.get(field)
        if isinstance(val, str):
            val = val.strip()
            if not val or val.lower() == "null" or val.lower() == "none":
                val = None
        canonical[field] = val

    # Normalize evidence dictionary
    raw_ev = structured_product.get("evidence")
    if not isinstance(raw_ev, dict):
        raw_ev = {}

    # Deterministically bind manufacturer_address if evidence is attached or OCR data has address text
    addr_ev = raw_ev.get("manufacturer_address")
    if addr_ev and isinstance(addr_ev, dict) and ocr_data:
        # Collect all OCR regions that form part of manufacturer address
        addr_texts = []
        for item in ocr_data:
            t = str(item.get("text", ""))
            if re.search(r"(?:VILE PARLE|CROSSING|MUMBAI|MH-?\d{6}|\bPIN\b|\bROAD\b|\bSTREET\b|\bPLOT\b|\bVILLAGE\b|\bDISTRICT\b|\bSTATE\b)", t, re.I):
                addr_texts.append(t.strip())
        if addr_texts:
            canonical["manufacturer_address"] = " ".join(addr_texts)

    # Standardize string fields from exact evidence text if evidence is present
    for field in schema_fields:
        if field in ["tax_inclusive_mrp", "manufacturer_address"]:
            continue
        ev_item = raw_ev.get(field)
        if ev_item and isinstance(ev_item, dict) and ev_item.get("ocr_id") is not None:
            ocr_id = ev_item.get("ocr_id")
            if isinstance(ocr_id, int) and ocr_id in ocr_lookup:
                ev_text = ocr_lookup[ocr_id].get("text", "").strip()
                if field == "manufacturer" and ev_text:
                    canonical["manufacturer"] = ev_text
                elif field == "packed_date" and ev_text:
                    # extract actual date substring from OCR region text
                    dm = re.search(r"\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b", ev_text)
                    if dm:
                        canonical["packed_date"] = dm.group(0)

    canonical_ev = {}
    ev_keys = [
        "product_name", "manufacturer", "manufacturer_address", "country_of_origin",
        "mrp", "net_quantity", "unit_sale_price", "packed_date", "manufacturing_date",
        "expiry_date", "use_by_date", "best_before", "batch_number",
        "consumer_care_phone", "consumer_care_email", "tax_inclusive_mrp",
        "fssai_number", "dimensions"
    ]

    for key in ev_keys:
        ev_item = raw_ev.get(key)
        if isinstance(ev_item, dict):
            ocr_id = ev_item.get("ocr_id")
            if ocr_id is not None and not isinstance(ocr_id, int):
                try:
                    ocr_id = int(ocr_id)
                except (ValueError, TypeError):
                    ocr_id = None

            image_index = ev_item.get("image_index")
            if image_index is None and ocr_id is not None and ocr_id in ocr_lookup:
                image_index = ocr_lookup[ocr_id].get("image_index", 0)
            elif image_index is None:
                image_index = 0

            conf = ev_item.get("confidence")
            if conf is not None:
                try:
                    conf = round(float(conf), 4)
                except (ValueError, TypeError):
                    conf = None

            bbox = ev_item.get("bbox")
            if not isinstance(bbox, list):
                bbox = None

            text = ev_item.get("text")
            if isinstance(text, str):
                text = text.strip()

            canonical_ev[key] = {
                "ocr_id": ocr_id,
                "image_index": image_index,
                "text": text,
                "confidence": conf,
                "bbox": bbox
            }
        else:
            canonical_ev[key] = None

    # Deterministically bind consumer care evidence from OCR data if available
    if ocr_data:
        for item in ocr_data:
            text = str(item.get("text", ""))
            if re.search(r"(?:PHONE|TEL|CELL|CALL|MOBILE|022-|\b\d{10}\b)", text, re.I):
                if not canonical_ev.get("consumer_care_phone"):
                    canonical_ev["consumer_care_phone"] = {
                        "ocr_id": item.get("id"),
                        "image_index": item.get("image_index", 0),
                        "text": text.strip(),
                        "confidence": round(float(item.get("confidence", 1.0)), 4),
                        "bbox": item.get("bbox")
                    }
            if re.search(r"(?:EMAIL|CS@|SUPPORT@|@)", text, re.I):
                if not canonical_ev.get("consumer_care_email"):
                    canonical_ev["consumer_care_email"] = {
                        "ocr_id": item.get("id"),
                        "image_index": item.get("image_index", 0),
                        "text": text.strip(),
                        "confidence": round(float(item.get("confidence", 1.0)), 4),
                        "bbox": item.get("bbox")
                    }

    canonical["evidence"] = canonical_ev
    return canonical
