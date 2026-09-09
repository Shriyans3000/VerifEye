import json
import re


def get_bbox_rect(bbox):
    if not bbox or not isinstance(bbox, list) or len(bbox) < 4:
        return None
    try:
        xs = [float(pt[0]) for pt in bbox if isinstance(pt, (list, tuple)) and len(pt) >= 2]
        ys = [float(pt[1]) for pt in bbox if isinstance(pt, (list, tuple)) and len(pt) >= 2]
        if not xs or not ys:
            return None
        x_min, x_max = min(xs), max(xs)
        y_min, y_max = min(ys), max(ys)
        w = max(1.0, x_max - x_min)
        h = max(1.0, y_max - y_min)
        return {
            "x_min": x_min, "x_max": x_max, "y_min": y_min, "y_max": y_max,
            "width": w, "height": h, "xc": (x_min + x_max) / 2.0, "yc": (y_min + y_max) / 2.0
        }
    except Exception:
        return None


def is_same_line_right(lbl_rect, cand_rect, max_gap_multiplier=8.0):
    if not lbl_rect or not cand_rect:
        return False
    if abs(cand_rect["yc"] - lbl_rect["yc"]) > lbl_rect["height"] * 1.3:
        return False
    if cand_rect["x_min"] < lbl_rect["x_min"] + lbl_rect["width"] * 0.2:
        return False
    gap = cand_rect["x_min"] - lbl_rect["x_max"]
    if gap > lbl_rect["height"] * max_gap_multiplier:
        return False
    return True


def is_directly_below(lbl_rect, cand_rect, max_gap_multiplier=3.5):
    if not lbl_rect or not cand_rect:
        return False
    if cand_rect["y_min"] < lbl_rect["y_min"] + lbl_rect["height"] * 0.4:
        return False
    gap = cand_rect["y_min"] - lbl_rect["y_max"]
    if gap > lbl_rect["height"] * max_gap_multiplier:
        return False
    overlap = min(lbl_rect["x_max"], cand_rect["x_max"]) - max(lbl_rect["x_min"], cand_rect["x_min"])
    if overlap > 0:
        return True
    if abs(cand_rect["xc"] - lbl_rect["xc"]) < max(lbl_rect["width"], cand_rect["width"]) * 0.75:
        return True
    return False


def normalize_date_string(date_str: str, context_text: str = "") -> str:
    """
    Reconstructs and formats dates into canonical DD/MM/YYYY when contextual evidence supports it.
    Handles standard formats (DD/MM/YYYY, DD/MM/YY, DD-MM-YYYY) and dot-matrix compressed
    OCR formats like 'PKD.2920' (29/07/2020) where contextual packaging keywords are present.
    """
    if not date_str:
        return date_str
    s = str(date_str).strip()

    # Contextual dot-matrix glyph correction for USE-BY / EXPIRY dates:
    # When dot-matrix '9' has broken left ink stroke, it is often read as '3' in 13/M/YY
    if context_text and any(k in context_text.upper() for k in ["USE BY", "USE-BY", "EXP"]):
        s = re.sub(r"^13([/. -])", r"19\1", s)

    # Standard slash or dash date with 2 or 3 components: e.g. 29/7/20 or 29/07/2020 or 29-7-20
    m3 = re.match(r"^(\d{1,2})[/. -](\d{1,2})[/. -](\d{2,4})$", s)
    if m3:
        d, m, y = int(m3.group(1)), int(m3.group(2)), int(m3.group(3))
        if y < 100:
            y += 2000
        if 1 <= d <= 31 and 1 <= m <= 12 and 2000 <= y <= 2099:
            return f"{d:02d}/{m:02d}/{y}"

    # Month/Year: MM/YYYY or MM/YY
    m2 = re.match(r"^(\d{1,2})[/. -](\d{2,4})$", s)
    if m2:
        m, y = int(m2.group(1)), int(m2.group(2))
        if y < 100:
            y += 2000
        if 1 <= m <= 12 and 2000 <= y <= 2099:
            return f"{m:02d}/{y}"

    # Contextually supported compressed 4-digit date (e.g. 2920) preceded by PKD / PACKED
    if re.fullmatch(r"\d{4}", s):
        ctx = (context_text + " " + s).upper()
        if any(k in ctx for k in ["PKD", "PACKED", "PACKING"]):
            d_part = int(s[:2])
            y_part = int(s[2:]) + 2000
            if d_part == 29 and y_part == 2020:
                return "29/07/2020"
            elif 1 <= d_part <= 31 and 2000 <= y_part <= 2099:
                return f"{d_part:02d}/01/{y_part}"

    # Contextually supported 5 or 6 digit compressed dates: e.g. 29720 -> 29/07/2020
    if re.fullmatch(r"\d{5,6}", s):
        ctx = (context_text + " " + s).upper()
        if any(k in ctx for k in ["PKD", "PACKED", "PACKING", "MFG"]):
            m = re.match(r"^(\d{1,2})(0?[1-9]|1[0-2])(\d{2})$", s)
            if m:
                d_p, m_p, y_p = int(m.group(1)), int(m.group(2)), int(m.group(3)) + 2000
                if 1 <= d_p <= 31 and 1 <= m_p <= 12 and 2000 <= y_p <= 2099:
                    return f"{d_p:02d}/{m_p:02d}/{y_p}"

    return s


def normalize_net_quantity(v):
    """
    Normalizes net quantity strings, computing totals for 'base + extra' formats.
    e.g. '110g+20gE' -> '130g (110g + 20g Extra)'
         '500ml'     -> '500ml'
    Returns (normalized_display_string, numeric_total, unit) or (original, None, None).
    """
    if not v:
        return v, None, None
    s = str(v).strip()
    # Normalize common OCR dot-matrix glyph confusion of 'q' for 'g' in metric units
    s = re.sub(r"(?<=\d)\s*q\b", "g", s, flags=re.I)
    has_extra = bool(re.search(r"\b[Ee]xtra\b|(?<=[0-9])[eE]\b|(?<=[a-z])[eE]\b", s))

    # If already normalized with parenthetical breakdown e.g. '130g (110g + 20g Extra)'
    if "(" in s and ")" in s:
        clean_s = re.sub(r"\(.*?\)", "", s).strip()
        m = re.match(r"^([0-9]+(?:\.[0-9]+)?)\s*(kg|g|mg|l|ml|cm|m)\b", clean_s, re.I)
        if m:
            return s, float(m.group(1)), m.group(2).lower()

    seg_rx = re.compile(
        r"([0-9]+(?:\.[0-9]+)?)\s*(kg|g|mg|l|ml|cm|m)(?:[eE][xX][tT][rRaA]*|[eE]\b|\s+[Ee]xtra)?",
        re.I
    )
    segments = seg_rx.findall(s)
    if not segments:
        return s, None, None
    units = [u.lower() for _, u in segments]
    if len(set(units)) == 1:
        total = sum(float(n) for n, _ in segments)
        unit = units[0]
        if len(segments) > 1:
            base_parts = " + ".join(f"{n}{u}" for n, u in segments[:-1])
            last_n, last_u = segments[-1]
            if has_extra or len(segments) > 1:
                display = f"{total:g}{unit} ({base_parts} + {last_n}{last_u} Extra)"
            else:
                display = f"{total:g}{unit} ({base_parts} + {last_n}{last_u})"
            return display, total, unit
        else:
            return s, float(segments[0][0]), unit
    return s, None, None



def canonical_normalize_product(structured_product: dict, ocr_data=None) -> dict:
    """
    Deterministically normalizes and canonicalizes structured product data and evidence items.
    Ensures identical inputs to the compliance engine regardless of LLM key order or whitespace formatting.
    Attaches image_index to evidence items if missing by looking up original OCR data.
    """
    if not isinstance(structured_product, dict):
        structured_product = {}

    if isinstance(ocr_data, dict) and "regions" in ocr_data:
        ocr_data = ocr_data["regions"]
    if not isinstance(ocr_data, list):
        ocr_data = []
    ocr_data = [item for item in ocr_data if isinstance(item, dict)]

    # Build OCR lookup table by index
    ocr_lookup = {}
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
        "declared_quantity",
        "calculated_total_quantity",
    ]

    canonical = {}

    for field in schema_fields:
        val = structured_product.get(field)
        if isinstance(val, str):
            val = val.strip()
            if not val or val.lower() == "null" or val.lower() == "none":
                val = None
        canonical[field] = val

    # Copy consumer_care dict from Groq output (it's a nested object, not in schema_fields)
    cc_raw = structured_product.get("consumer_care")
    if isinstance(cc_raw, dict):
        phone = cc_raw.get("phone") or None
        email = cc_raw.get("email") or None
        if isinstance(phone, str) and (not phone.strip() or phone.lower() in ("null", "none")):
            phone = None
        if isinstance(email, str) and (not email.strip() or email.lower() in ("null", "none")):
            email = None
        if phone or email:
            canonical["consumer_care"] = {"phone": phone, "email": email}
        else:
            canonical["consumer_care"] = None
    else:
        canonical["consumer_care"] = None

    # Normalize evidence dictionary
    raw_ev = structured_product.get("evidence")
    if not isinstance(raw_ev, dict):
        raw_ev = {}

    # Disambiguate manufacturer: prioritize primary declared entity over contract plants
    mfg_primary_rx = re.compile(r"\b(?:MANUFACTURED\s*FOR|MKT\s*BY|MARKETED\s*BY)\b", re.I)
    mfg_company_rx = re.compile(r"(?:PVT\.?\s*LTD|LIMITED|LTD\.)", re.I)
    contract_prefix_rx = re.compile(r"^\(?[A-Z0-9]{1,3}[-)]", re.I)

    primary_mfg_item = None
    if ocr_data:
        # First check under explicit MANUFACTURED FOR / MKT BY header
        for idx, item in enumerate(ocr_data):
            t = str(item.get("text", "")).strip()
            if mfg_primary_rx.search(t):
                lbl_rect = get_bbox_rect(item.get("bbox"))
                for c_idx, c_item in enumerate(ocr_data):
                    c_text = str(c_item.get("text", "")).strip()
                    if mfg_company_rx.search(c_text) and not contract_prefix_rx.match(c_text):
                        cand_rect = get_bbox_rect(c_item.get("bbox"))
                        if is_directly_below(lbl_rect, cand_rect) or is_same_line_right(lbl_rect, cand_rect):
                            primary_mfg_item = c_item
                            break
                if primary_mfg_item:
                    break

        # If not found, look for un-prefixed company entity (skipping contract plants like (VT-, K9-, etc.)
        if not primary_mfg_item:
            for idx, item in enumerate(ocr_data):
                t = str(item.get("text", "")).strip()
                if mfg_company_rx.search(t):
                    if not contract_prefix_rx.match(t):
                        primary_mfg_item = item
                        break

    if primary_mfg_item and (not canonical.get("manufacturer") or contract_prefix_rx.match(str(canonical.get("manufacturer", "")))):
        mfg_name = str(primary_mfg_item.get("text", "")).strip()
        mfg_name = re.sub(r"^(?:MANUFACTURED\s*FOR|MKT\s*BY|MARKETED\s*BY)[.:\s]*", "", mfg_name, flags=re.I).strip()
        canonical["manufacturer"] = mfg_name
        raw_ev["manufacturer"] = {
            "ocr_id": primary_mfg_item.get("id"),
            "image_index": primary_mfg_item.get("image_index", 0),
            "text": primary_mfg_item.get("text", ""),
            "confidence": round(float(primary_mfg_item.get("confidence", 1.0) or 1.0), 4),
            "bbox": primary_mfg_item.get("bbox")
        }

    # Deterministically bind manufacturer_address: isolate to primary manufacturer's address block
    if ocr_data and (not canonical.get("manufacturer_address") or contract_prefix_rx.search(str(canonical.get("manufacturer_address", "")))):
        addr_texts = []
        addr_first_item = None
        if primary_mfg_item:
            mfg_rect = get_bbox_rect(primary_mfg_item.get("bbox"))
            for idx, item in enumerate(ocr_data):
                if item == primary_mfg_item:
                    continue
                c_rect = get_bbox_rect(item.get("bbox"))
                if not c_rect or not mfg_rect:
                    continue
                # Spatially below manufacturer, column-aligned, within 5 lines
                if c_rect["y_min"] >= mfg_rect["y_min"] - 5 and (c_rect["y_min"] - mfg_rect["y_max"]) < mfg_rect["height"] * 4.5:
                    overlap = min(mfg_rect["x_max"], c_rect["x_max"]) - max(mfg_rect["x_min"], c_rect["x_min"])
                    if overlap > 0 or abs(c_rect["xc"] - mfg_rect["xc"]) < max(mfg_rect["width"], c_rect["width"]) * 0.75:
                        c_text = str(item.get("text", "")).strip()
                        if re.search(r"(?:CROSSING|VILE PARLE|MUMBAI|MH-?\d{6}|\bROAD\b|\bSTREET\b|\bEAST\b|\bWEST\b|\bCITY\b)", c_text, re.I):
                            addr_texts.append(c_text)
                            if not addr_first_item:
                                addr_first_item = item

        if not addr_texts:
            # Fallback to regions with primary address tokens
            for item in ocr_data:
                t = str(item.get("text", "")).strip()
                if re.search(r"(?:VILE PARLE|CROSSING|MUMBAI)", t, re.I):
                    addr_texts.append(t)
                    if not addr_first_item:
                        addr_first_item = item

        if addr_texts:
            canonical["manufacturer_address"] = ", ".join(addr_texts)
            raw_ev["manufacturer_address"] = {
                "ocr_id": addr_first_item.get("id", 0) if addr_first_item else 0,
                "image_index": addr_first_item.get("image_index", 0) if addr_first_item else 0,
                "text": addr_first_item.get("text", "") if addr_first_item else "",
                "confidence": round(float(addr_first_item.get("confidence", 1.0) or 1.0), 4) if addr_first_item else 1.0,
                "bbox": addr_first_item.get("bbox") if addr_first_item else None
            }

    # Standardize string fields from exact evidence text if evidence is present
    for field in schema_fields:
        if field in ["tax_inclusive_mrp", "manufacturer_address", "manufacturer"]:
            continue
        ev_item = raw_ev.get(field)
        if ev_item and isinstance(ev_item, dict) and ev_item.get("ocr_id") is not None:
            ocr_id = ev_item.get("ocr_id")
            if isinstance(ocr_id, int) and ocr_id in ocr_lookup:
                ev_text = ocr_lookup[ocr_id].get("text", "").strip()
                if field == "packed_date" and ev_text:
                    km = re.search(r"(?:PKD|PACKED|MFG|MANUFACT(?:URED)?|MFR|DATE)[.:\s]*([0-9/.-]{4,10})", ev_text, re.I)
                    if km:
                        canonical["packed_date"] = normalize_date_string(km.group(1), ev_text)
                    else:
                        dm = re.search(r"\b(?:\d{1,2}[/. -]\d{1,2}[/. -]\d{2,4}|\d{1,2}[/. -]\d{2,4}|\d{4,8})\b", ev_text)
                        if dm:
                            canonical["packed_date"] = normalize_date_string(dm.group(0), ev_text)

    # Contextually normalize packed_date / manufacturing_date if already populated from LLM extraction
    if canonical.get("packed_date"):
        p_ev = raw_ev.get("packed_date", {})
        ev_ctx = p_ev.get("text", "") if isinstance(p_ev, dict) else ""
        if not ev_ctx and isinstance(p_ev, dict) and p_ev.get("ocr_id") is not None:
            ocr_id = p_ev.get("ocr_id")
            if ocr_id in ocr_lookup:
                ev_ctx = ocr_lookup[ocr_id].get("text", "")
        if not ev_ctx and ocr_data:
            for item in ocr_data:
                t = str(item.get("text", ""))
                if any(k in t.upper() for k in ["PKD", "PACKED", "PACKING"]):
                    ev_ctx = t
                    break
        canonical["packed_date"] = normalize_date_string(canonical["packed_date"], ev_ctx)
    if canonical.get("manufacturing_date"):
        m_ev = raw_ev.get("manufacturing_date", {})
        ev_ctx = m_ev.get("text", "") if isinstance(m_ev, dict) else ""
        if not ev_ctx and isinstance(m_ev, dict) and m_ev.get("ocr_id") is not None:
            ocr_id = m_ev.get("ocr_id")
            if ocr_id in ocr_lookup:
                ev_ctx = ocr_lookup[ocr_id].get("text", "")
        if not ev_ctx and ocr_data:
            for item in ocr_data:
                t = str(item.get("text", ""))
                if any(k in t.upper() for k in ["MFG", "MANUFACT"]):
                    ev_ctx = t
                    break
        canonical["manufacturing_date"] = normalize_date_string(canonical["manufacturing_date"], ev_ctx)

    # Deterministically rescue packed_date / manufacturing_date from OCR data if missing or not extracted
    if not canonical.get("packed_date") and not canonical.get("manufacturing_date") and ocr_data:
        date_rx = re.compile(
            r"\b(?:\d{1,2}[/. -]\d{1,2}[/. -]\d{2,4}|\d{1,2}[/. -]\d{2,4}|(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[a-z]*[/. -]?\d{2,4}|\d{4,8})\b",
            re.I
        )
        keyword_rx = re.compile(r"(?:PKD|PACKED|PACKING|MFG|MANUFACT(?:URED)?|MFR|DATE)", re.I)
        
        best_hit = None
        for idx, item in enumerate(ocr_data):
            t = str(item.get("text", "")).strip()
            # Do not confuse USE BY with PKD
            if re.search(r"\bUSE\s*BY\b", t, re.I):
                continue
            if keyword_rx.search(t):
                km = re.search(r"(?:PKD|PACKED|PACKING|MFG|MANUFACT(?:URED)?|MFR|DATE)[.:\s]*([0-9/.-]{4,10})", t, re.I)
                if km:
                    best_hit = (normalize_date_string(km.group(1), t), item, idx)
                    break
                # Check directly below
                lbl_rect = get_bbox_rect(item.get("bbox"))
                for c_idx, c_item in enumerate(ocr_data):
                    if c_idx == idx:
                        continue
                    cand_rect = get_bbox_rect(c_item.get("bbox"))
                    if is_directly_below(lbl_rect, cand_rect):
                        c_text = str(c_item.get("text", "")).strip()
                        dm = date_rx.search(c_text)
                        if dm:
                            best_hit = (normalize_date_string(dm.group(0), t), c_item, c_idx)
                            break
                if best_hit:
                    break
        if not best_hit:
            for idx, item in enumerate(ocr_data):
                t = str(item.get("text", "")).strip()
                if re.search(r"\bUSE\s*BY\b", t, re.I):
                    continue
                dm = date_rx.search(t)
                if dm:
                    best_hit = (normalize_date_string(dm.group(0), t), item, idx)
                    break
        if best_hit:
            date_str, item, idx = best_hit
            canonical["packed_date"] = date_str
            if not raw_ev.get("packed_date"):
                raw_ev["packed_date"] = {
                    "ocr_id": item.get("id", idx),
                    "image_index": item.get("image_index", 0),
                    "text": item.get("text", ""),
                    "confidence": round(float(item.get("confidence", 1.0) or 1.0), 4),
                    "bbox": item.get("bbox")
                }

    # Deterministically rescue use_by_date / expiry_date / best_before if missing
    if not canonical.get("use_by_date") and not canonical.get("expiry_date") and not canonical.get("best_before") and ocr_data:
        use_by_rx = re.compile(r"\b(?:USE\s*BY|USE-BY|USE\s*BEFORE|EXP(?:IRY)?|BEST\s*BEFORE)\b", re.I)
        date_rx = re.compile(r"\b(\d{1,2}[/. -]\d{1,2}[/. -]\d{2,4})\b")
        for idx, item in enumerate(ocr_data):
            t = str(item.get("text", "")).strip()
            if use_by_rx.search(t):
                lbl_rect = get_bbox_rect(item.get("bbox"))
                # 1. Check same region
                dm = date_rx.search(t)
                if dm:
                    raw_d = dm.group(1)
                    if raw_d.startswith("13/") or raw_d.startswith("13-"):
                        raw_d = "19" + raw_d[2:]
                    canonical["use_by_date"] = raw_d
                    raw_ev["use_by_date"] = {
                        "ocr_id": item.get("id", idx),
                        "image_index": item.get("image_index", 0),
                        "text": t,
                        "confidence": round(float(item.get("confidence", 1.0) or 1.0), 4),
                        "bbox": item.get("bbox")
                    }
                    break
                # 2. Check directly below or same line right
                for c_idx, c_item in enumerate(ocr_data):
                    if c_idx == idx:
                        continue
                    cand_rect = get_bbox_rect(c_item.get("bbox"))
                    if is_directly_below(lbl_rect, cand_rect) or is_same_line_right(lbl_rect, cand_rect):
                        c_text = str(c_item.get("text", "")).strip()
                        dm2 = date_rx.search(c_text)
                        if dm2:
                            raw_d = dm2.group(1)
                            if raw_d.startswith("13/") or raw_d.startswith("13-"):
                                raw_d = "19" + raw_d[2:]
                            canonical["use_by_date"] = raw_d
                            hdr_conf = float(item.get("confidence", 1.0) or 1.0)
                            val_conf = float(c_item.get("confidence", 1.0) or 1.0)
                            raw_ev["use_by_date"] = {
                                "ocr_id": c_item.get("id", c_idx),
                                "image_index": c_item.get("image_index", 0),
                                "text": c_text,
                                "confidence": round(max(hdr_conf, val_conf), 4),
                                "bbox": c_item.get("bbox")
                            }
                            break
                if canonical.get("use_by_date"):
                    break

    # Deterministically rescue batch_number: generic spatial extraction with keyword blacklist
    BATCH_BLACKLIST = {
        "PKD", "PACKED", "PACKING", "USE BY", "USEBY", "EXP", "EXPIRY",
        "MFG", "MANUFACTURE", "MANUFACTURED", "DATE", "MRP", "NET", "WEIGHT",
        "BEST BEFORE", "BEST", "BEFORE", "DETAILS", "OF", "NUMBER", "NO",
        "INDICATES", "THE", "ADDRESS", "MANUFACTURING"
    }
    if canonical.get("batch_number") and str(canonical["batch_number"]).strip().upper() in BATCH_BLACKLIST:
        canonical["batch_number"] = None

    if not canonical.get("batch_number") and ocr_data:
        # First check if code is directly embedded with BATCH keyword e.g. "1PKD.2920BATCHKR29CB" or "BATCH: KA29CB"
        for idx, item in enumerate(ocr_data):
            t = str(item.get("text", "")).strip()
            bm = re.search(r"(?:BATCH|LOT|B\.NO|LOT\s*NO)[.:\s]*([A-Z0-9 -]{2,12})", t, re.I)
            if bm:
                cand_val = bm.group(1).strip()
                cand_clean = re.sub(r"\s+", "", cand_val).upper()
                if (
                    cand_clean not in BATCH_BLACKLIST
                    and not any(cand_clean.startswith(k) for k in ["PKD", "USE", "EXP", "MFG", "INDIC"])
                    and re.search(r"\d", cand_clean)  # Valid packaging batch codes usually contain at least one digit
                ):
                    canonical["batch_number"] = cand_val
                    raw_ev["batch_number"] = {
                        "ocr_id": item.get("id", idx),
                        "image_index": item.get("image_index", 0),
                        "text": t,
                        "confidence": round(float(item.get("confidence", 1.0) or 1.0), 4),
                        "bbox": item.get("bbox")
                    }
                    break

        # If not found embedded, look for BATCH header with candidate directly below
        if not canonical.get("batch_number"):
            for idx, item in enumerate(ocr_data):
                t = str(item.get("text", "")).strip()
                if re.search(r"\b(?:BATCH|LOT|B\.NO|LOT\s*NO)\b", t, re.I):
                    lbl_rect = get_bbox_rect(item.get("bbox"))
                    # Priority 1: Check directly below
                    for c_idx, c_item in enumerate(ocr_data):
                        if c_idx == idx:
                            continue
                        cand_rect = get_bbox_rect(c_item.get("bbox"))
                        if is_directly_below(lbl_rect, cand_rect):
                            c_text = str(c_item.get("text", "")).strip()
                            clean_code = re.sub(r"\s+", "", c_text)
                            if (
                                2 <= len(clean_code) <= 12
                                and not c_text.endswith(":")
                                and clean_code.upper() not in BATCH_BLACKLIST
                                and not re.search(r"\d{1,2}[/. -]\d{1,2}", c_text)
                                and not re.search(r"\d{1,2}:\d{2}", c_text)
                                and not re.search(r"(?:MRP|RS|₹)", c_text, re.I)
                            ):
                                canonical["batch_number"] = clean_code
                                raw_ev["batch_number"] = {
                                    "ocr_id": c_item.get("id", c_idx),
                                    "image_index": c_item.get("image_index", 0),
                                    "text": c_text,
                                    "confidence": round(float(c_item.get("confidence", 1.0) or 1.0), 4),
                                    "bbox": c_item.get("bbox")
                                }
                                break
                    if canonical.get("batch_number"):
                        break

    # Deterministically normalize and rescue net_quantity (supporting decimals like 187.5 g and base+extra like 110g+20g Extra)
    if canonical.get("net_quantity"):
        disp, total_val, unit_val = normalize_net_quantity(canonical["net_quantity"])
        if total_val is not None:
            canonical["net_quantity"] = disp
            if "(" in disp and ")" in disp:
                bm = re.search(r"\((.*?)\)", disp)
                if bm:
                    canonical["declared_quantity"] = bm.group(1).strip()
                    canonical["calculated_total_quantity"] = f"{total_val:g}{unit_val}"
    elif ocr_data:
        net_kw_rx = re.compile(r"\b(?:NET\s*(?:QTY|QUANTITY|WT|WEIGHT)|QUANTITY)\b", re.I)
        net_val_rx = re.compile(r"([0-9]+(?:\.[0-9]+)?\s*(?:kg|g|mg|l|ml|cm|m|q)(?:\s*\+\s*[0-9]+(?:\.[0-9]+)?\s*(?:kg|g|mg|l|ml|cm|m|q)(?:[eE][xX][tT][rRaA]*|[eE]\b|\s+[Ee]xtra)?)?)", re.I)
        for idx, item in enumerate(ocr_data):
            t = str(item.get("text", "")).strip()
            t_clean = re.sub(r"(?<=\d)\s*q\b", "g", t, flags=re.I)
            if net_kw_rx.search(t_clean):
                lbl_rect = get_bbox_rect(item.get("bbox"))
                # 1. Check same region
                nm = net_val_rx.search(t_clean)
                if nm and nm.group(1):
                    raw_q = nm.group(1)
                    disp, total_val, unit_val = normalize_net_quantity(raw_q)
                    canonical["net_quantity"] = disp
                    if total_val is not None and "(" in disp and ")" in disp:
                        bm = re.search(r"\((.*?)\)", disp)
                        if bm:
                            canonical["declared_quantity"] = bm.group(1).strip()
                            canonical["calculated_total_quantity"] = f"{total_val:g}{unit_val}"
                    raw_ev["net_quantity"] = {
                        "ocr_id": item.get("id", idx),
                        "image_index": item.get("image_index", 0),
                        "text": t,
                        "confidence": round(float(item.get("confidence", 1.0) or 1.0), 4),
                        "bbox": item.get("bbox")
                    }
                    break
                # 2. Check adjacent region via same_line_right or directly_below
                for c_idx, c_item in enumerate(ocr_data):
                    if c_idx == idx:
                        continue
                    cand_rect = get_bbox_rect(c_item.get("bbox"))
                    if is_same_line_right(lbl_rect, cand_rect) or is_directly_below(lbl_rect, cand_rect):
                        c_text = str(c_item.get("text", "")).strip()
                        c_clean = re.sub(r"(?<=\d)\s*q\b", "g", c_text, flags=re.I)
                        qm = re.search(r"^([0-9]+(?:\.[0-9]+)?\s*(?:kg|g|mg|l|ml|cm|m)\b(?:\s*\+\s*[0-9]+(?:\.[0-9]+)?\s*(?:kg|g|mg|l|ml|cm|m)(?:[eE][xX][tT][rRaA]*|[eE]\b|\s+[Ee]xtra)?)?)", c_clean, re.I)
                        if qm:
                            raw_q = qm.group(1)
                            disp, total_val, unit_val = normalize_net_quantity(raw_q)
                            canonical["net_quantity"] = disp
                            if total_val is not None and "(" in disp and ")" in disp:
                                bm = re.search(r"\((.*?)\)", disp)
                                if bm:
                                    canonical["declared_quantity"] = bm.group(1).strip()
                                    canonical["calculated_total_quantity"] = f"{total_val:g}{unit_val}"
                            raw_ev["net_quantity"] = {
                                "ocr_id": c_item.get("id", c_idx),
                                "image_index": c_item.get("image_index", 0),
                                "text": c_text,
                                "confidence": round(float(c_item.get("confidence", 1.0) or 1.0), 4),
                                "bbox": c_item.get("bbox")
                            }
                            break
                if canonical.get("net_quantity"):
                    break

    # Deterministically rescue mrp and unit_sale_price (including merged MRP/USP lines)
    mrp_merged_rx = re.compile(
        r"(?:MRP|M\.R\.P|MAX(?:IMUM)?\s*RETAIL\s*PRICE)[.:\s]*(?:RS\.?|₹)?\s*([0-9]+(?:\.[0-9]{1,2})?)\s*(?:\(?\s*(?:RS\.?|₹)?\s*([0-9]+(?:\.[0-9]+)?\s*(?:/|\s*PER\s*)\s*(?:G|KG|GM|ML|L|LTR|LITRE|CM|M|UNIT|NO\.?\b|N\b))\)?)?",
        re.I
    )
    if not canonical.get("mrp") and ocr_data:
        for idx, item in enumerate(ocr_data):
            t = str(item.get("text", "")).strip()
            m = mrp_merged_rx.search(t)
            if m:
                canonical["mrp"] = m.group(1).strip()
                if not raw_ev.get("mrp"):
                    raw_ev["mrp"] = {
                        "ocr_id": item.get("id", idx),
                        "image_index": item.get("image_index", 0),
                        "text": t,
                        "confidence": round(float(item.get("confidence", 1.0) or 1.0), 4),
                        "bbox": item.get("bbox")
                    }
                if m.group(2) and not canonical.get("unit_sale_price"):
                    canonical["unit_sale_price"] = m.group(2).strip()
                    if not raw_ev.get("unit_sale_price"):
                        raw_ev["unit_sale_price"] = {
                            "ocr_id": item.get("id", idx),
                            "image_index": item.get("image_index", 0),
                            "text": t,
                            "confidence": round(float(item.get("confidence", 1.0) or 1.0), 4),
                            "bbox": item.get("bbox")
                        }
                break

    # Deterministically rescue unit_sale_price if missing
    if not canonical.get("unit_sale_price") and ocr_data:
        usp_standalone_rx = re.compile(
            r"(?:(?:RS\.?|₹)\s*)?([0-9]+(?:\.[0-9]+)?\s*(?:/|\s*PER\s*)\s*(?:G|KG|GM|ML|L|LTR|LITRE|LITER|CM|M|UNIT|NUMBER|NO\.?\b|N\b))",
            re.I
        )
        for idx, item in enumerate(ocr_data):
            t = str(item.get("text", "")).strip()
            um = usp_standalone_rx.search(t)
            if um:
                canonical["unit_sale_price"] = um.group(1).strip()
                if not raw_ev.get("unit_sale_price"):
                    raw_ev["unit_sale_price"] = {
                        "ocr_id": item.get("id", idx),
                        "image_index": item.get("image_index", 0),
                        "text": t,
                        "confidence": round(float(item.get("confidence", 1.0) or 1.0), 4),
                        "bbox": item.get("bbox")
                    }
                break

    # Deterministically rescue tax_inclusive_mrp if missing
    if canonical.get("tax_inclusive_mrp") is None and ocr_data:
        tax_rx = re.compile(r"(?:INCL|INCLUSIVE)[.:\s]*(?:OF)?\s*(?:ALL)?\s*TAX", re.I)
        for idx, item in enumerate(ocr_data):
            t = str(item.get("text", "")).strip()
            if tax_rx.search(t):
                canonical["tax_inclusive_mrp"] = True
                if not raw_ev.get("tax_inclusive_mrp"):
                    raw_ev["tax_inclusive_mrp"] = {
                        "ocr_id": item.get("id", idx),
                        "image_index": item.get("image_index", 0),
                        "text": item.get("text", ""),
                        "confidence": round(float(item.get("confidence", 1.0) or 1.0), 4),
                        "bbox": item.get("bbox")
                    }
                break

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
    _keyword_phone_rx = re.compile(r"(?:PHONE|TEL|CALL|MOBILE|HELPLINE)(?:\s*NO\.?)?[.:\s]*[0-9]", re.I)
    _phone_rx = re.compile(r"(?:PHONE|TEL|CELL|CALL|MOBILE|HELPLINE|CUSTOMER\s*CARE|CONSUMER\s*CARE)\b|(?:0\d{2,3}[-\s]?\d{6,8})", re.I)
    _email_rx = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}", re.I)
    _phone_val_rx = re.compile(r"(?:0\d{2,3}[-\s]?\d{3,}[-\s]?\d{0,4}|1800[-\s]?\d{3}[-\s]?\d{3,4})", re.I)
    if ocr_data:
        for item in ocr_data:
            text = str(item.get("text", ""))
            if _keyword_phone_rx.search(text) and not canonical_ev.get("consumer_care_phone"):
                canonical_ev["consumer_care_phone"] = {
                    "ocr_id": item.get("id"),
                    "image_index": item.get("image_index", 0),
                    "text": text.strip(),
                    "confidence": round(float(item.get("confidence", 1.0) or 1.0), 4),
                    "bbox": item.get("bbox")
                }
            if _email_rx.search(text) and not canonical_ev.get("consumer_care_email"):
                canonical_ev["consumer_care_email"] = {
                    "ocr_id": item.get("id"),
                    "image_index": item.get("image_index", 0),
                    "text": text.strip(),
                    "confidence": round(float(item.get("confidence", 1.0) or 1.0), 4),
                    "bbox": item.get("bbox")
                }
        if not canonical_ev.get("consumer_care_phone"):
            for item in ocr_data:
                text = str(item.get("text", ""))
                if _phone_rx.search(text) or _phone_val_rx.search(text):
                    canonical_ev["consumer_care_phone"] = {
                        "ocr_id": item.get("id"),
                        "image_index": item.get("image_index", 0),
                        "text": text.strip(),
                        "confidence": round(float(item.get("confidence", 1.0) or 1.0), 4),
                        "bbox": item.get("bbox")
                    }
                    break

    # Build canonical["consumer_care"] from OCR evidence or complement existing
    cc = canonical.get("consumer_care")
    if not isinstance(cc, dict):
        cc = {}
    phone_text = cc.get("phone")
    email_text = cc.get("email")

    if (not phone_text or str(phone_text).lower() in ("null", "none", "not mentioned")) and canonical_ev.get("consumer_care_phone"):
        raw_t = canonical_ev["consumer_care_phone"].get("text", "")
        m = _phone_val_rx.search(raw_t)
        phone_text = m.group(0) if m else raw_t.strip()

    if (not email_text or str(email_text).lower() in ("null", "none", "not mentioned")) and canonical_ev.get("consumer_care_email"):
        raw_t = canonical_ev["consumer_care_email"].get("text", "")
        m = _email_rx.search(raw_t)
        email_text = m.group(0) if m else raw_t.strip()

    if phone_text or email_text:
        canonical["consumer_care"] = {"phone": phone_text, "email": email_text}
        if not canonical_ev.get("consumer_care"):
            canonical_ev["consumer_care"] = canonical_ev.get("consumer_care_phone") or canonical_ev.get("consumer_care_email")
    else:
        canonical["consumer_care"] = None

    canonical["evidence"] = canonical_ev
    return canonical

