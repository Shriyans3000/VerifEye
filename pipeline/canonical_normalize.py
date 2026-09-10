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
        "food_category",
        "ingredients",
    ]

    canonical = {}

    for field in schema_fields:
        val = structured_product.get(field)
        if isinstance(val, str):
            val = val.strip()
            if not val or val.lower() == "null" or val.lower() == "none":
                val = None
        canonical[field] = val

    # Preserve and normalize consumer_care object
    raw_cc = structured_product.get("consumer_care")
    if isinstance(raw_cc, dict):
        phone_val = raw_cc.get("phone")
        email_val = raw_cc.get("email")
        if isinstance(phone_val, str) and (phone_val.strip().lower() in ["null", "none", ""]):
            phone_val = None
        if isinstance(email_val, str) and (email_val.strip().lower() in ["null", "none", ""]):
            email_val = None
        canonical["consumer_care"] = {
            "phone": phone_val,
            "email": email_val,
        }
    else:
        canonical["consumer_care"] = {
            "phone": structured_product.get("consumer_care_phone"),
            "email": structured_product.get("consumer_care_email"),
        }

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
        , "food_category", "ingredients"
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

    canonical_preservatives = []
    raw_preservatives = structured_product.get("preservatives")
    if isinstance(raw_preservatives, list):
        for item in raw_preservatives:
            if not isinstance(item, dict):
                continue
            evidence_item = item.get("evidence")
            if isinstance(evidence_item, dict):
                ocr_id = evidence_item.get("ocr_id")
                if ocr_id is not None and not isinstance(ocr_id, int):
                    try:
                        ocr_id = int(ocr_id)
                    except (ValueError, TypeError):
                        ocr_id = None
                source = ocr_lookup.get(ocr_id, {})
                canonical_evidence = {
                    "ocr_id": ocr_id,
                    "image_index": evidence_item.get("image_index", source.get("image_index", 0)),
                    "text": evidence_item.get("text") or source.get("text"),
                    "confidence": evidence_item.get("confidence", source.get("confidence")),
                    "bbox": evidence_item.get("bbox") or source.get("bbox")
                }
            else:
                canonical_evidence = None
            canonical_preservatives.append({
                "name": item.get("name"),
                "ins_number": item.get("ins_number"),
                "amount_mg_per_kg": item.get("amount_mg_per_kg"),
                "evidence": canonical_evidence
            })

    canonical["preservatives"] = canonical_preservatives

    # Auto-detect known FSSAI preservatives and banned substances declared in ingredients text or OCR
    known_preservatives = [
        # Banned / Prohibited substances
        ("potassium bromate", "924a", r"(?:\b(?:potassium\s+bromate|e\s*924a?|ins\s*924a?|kbro3)\b|(?:flour\s+treatment|improver|bleaching\s+agent)\s*\(?\s*924a?\)?|\(\s*924a?\s*\))"),
        ("potassium iodate", "917", r"(?:\b(?:potassium\s+iodate|e\s*917|ins\s*917|kio3)\b|\(\s*917\s*\))"),
        ("formaldehyde", None, r"\b(?:formaldehyde|formalin|formol)\b"),
        ("boric acid", "284", r"(?:\b(?:boric\s+acid|borax|e\s*284|e\s*285|ins\s*284|ins\s*285)\b|\(\s*28[45]\s*\))"),
        ("brominated vegetable oil", "443", r"(?:\b(?:brominated\s+vegetable\s+oil|bvo|ins\s*443|e\s*443)\b|\(\s*443\s*\))"),
        ("propylparaben", "216", r"(?:\b(?:propylparaben|propyl\s+paraben|propyl\s+4-hydroxybenzoate|e\s*216|ins\s*216|sodium\s+propylparaben|ins\s*217|e\s*217)\b|(?:preservative|additive)\s*\(?\s*21[67]\)?|\(\s*21[67]\s*\))"),
        ("methylparaben", "218", r"(?:\b(?:methylparaben|methyl\s+paraben|methyl\s+4-hydroxybenzoate|e\s*218|ins\s*218|sodium\s+methylparaben|ins\s*219|e\s*219)\b|(?:preservative|additive)\s*\(?\s*21[89]\)?|\(\s*21[89]\s*\))"),
        # Class II chemical preservatives
        ("sodium benzoate", "211", r"(?:\b(?:sodium\s+benzoate|benzoate\s+of\s+soda|e\s*211|ins\s*211)\b|(?:preservative|antimicrobial|class\s+ii|additive)\s*\(?\s*211\)?|\(\s*211\s*\))"),
        ("benzoic acid", "210", r"(?:\b(?:benzoic\s+acid|e\s*210|ins\s*210)\b|\(\s*210\s*\))"),
        ("potassium sorbate", "202", r"(?:\b(?:potassium\s+sorbate|sorbate\s+of\s+potassium|e\s*202|ins\s*202)\b|(?:preservative|antimicrobial|class\s+ii|additive)\s*\(?\s*202\)?|\(\s*202\s*\))"),
        ("sorbic acid", "200", r"(?:\b(?:sorbic\s+acid|e\s*200|ins\s*200)\b|\(\s*200\s*\))"),
        ("sulphur dioxide", "220", r"(?:\b(?:sulphur\s+dioxide|sulfur\s+dioxide|e\s*220|ins\s*220)\b|\(\s*220\s*\))"),
        ("sodium metabisulphite", "223", r"(?:\b(?:sodium\s+metabisulphite|sodium\s+metabisulfite|e\s*223|ins\s*223)\b|(?:preservative|bleaching\s+agent|additive)\s*\(?\s*223\)?|\(\s*223\s*\))"),
        ("potassium metabisulphite", "224", r"(?:\b(?:potassium\s+metabisulphite|potassium\s+metabisulfite|e\s*224|ins\s*224)\b|(?:preservative|additive)\s*\(?\s*224\)?|\(\s*224\s*\))"),
        # Synthetic chemical antioxidants
        ("tbhq", "319", r"(?:\b(?:tbhq|tertiary\s+butylhydroquinone|tert-butylhydroquinone|e\s*319|ins\s*319)\b|(?:antioxidant|preservative|additive)\s*\(?\s*319\)?|\(\s*319\s*\))"),
        ("bha", "320", r"(?:\b(?:bha|butylated\s+hydroxyanisole|e\s*320|ins\s*320)\b|(?:antioxidant|preservative|additive)\s*\(?\s*320\)?|\(\s*320\s*\))"),
        ("bht", "321", r"(?:\b(?:bht|butylated\s+hydroxytoluene|e\s*321|ins\s*321)\b|(?:antioxidant|preservative|additive)\s*\(?\s*321\)?|\(\s*321\s*\))"),
        # Curing salts & bakery preservatives
        ("sodium nitrite", "250", r"(?:\b(?:sodium\s+nitrite|e\s*250|ins\s*250)\b|(?:preservative|curing\s+agent|additive)\s*\(?\s*250\)?|\(\s*250\s*\))"),
        ("sodium nitrate", "251", r"(?:\b(?:sodium\s+nitrate|e\s*251|ins\s*251)\b|(?:preservative|curing\s+agent|additive)\s*\(?\s*251\)?|\(\s*251\s*\))"),
        ("calcium propionate", "282", r"(?:\b(?:calcium\s+propionate|e\s*282|ins\s*282)\b|(?:preservative|antimicrobial|rope\s+inhibitor|additive)\s*\(?\s*282\)?|\(\s*282\s*\))"),
        ("nisin", "234", r"(?:\b(?:nisin|e\s*234|ins\s*234)\b|\(\s*234\s*\))"),
        # Functional additives & acidity regulators
        ("citric acid", "330", r"(?:\b(?:citric\s+acid|acidity\s+regulator|e\s*330|ins\s*330)\b|\(\s*330\s*\))"),
        ("calcium carbonate", "170(i)", r"(?:\b(?:calcium\s+carbonate|anti-?caking\s+agent|e\s*170|ins\s*170(?:\s*\(i\))?)\b|\(\s*170(?:\s*\(i\))?\s*\))"),
        ("disodium guanylate", "627", r"(?:\b(?:disodium\s+guanylate|flavour\s+enhancers?|e\s*627|ins\s*627)\b|\(\s*627\s*\))"),
        ("disodium inosinate", "631", r"(?:\b(?:disodium\s+inosinate|e\s*631|ins\s*631)\b|\(\s*631\s*\))"),
        ("paprika oleoresin", "160c", r"(?:\b(?:paprika\s+oleoresin|paprika\s+extract|capsanthin|e\s*160c|ins\s*160c)\b|\(\s*160c\s*\))"),
        ("monosodium glutamate", "621", r"(?:\b(?:monosodium\s+glutamate|msg|e\s*621|ins\s*621)\b|\(\s*621\s*\))"),
        ("lecithin", "322", r"(?:\b(?:lecithin|soya\s+lecithin|e\s*322|ins\s*322(?:\s*\(i\))?)\b|\(\s*322(?:\s*\(i\))?\s*\))"),
        ("sodium bicarbonate", "500(ii)", r"(?:\b(?:sodium\s+(?:bi)?carbonate|baking\s+soda|raising\s+agent|e\s*500(?:\s*\(ii\))?|ins\s*500(?:\s*\(ii\))?)\b|\(\s*500(?:\s*\(ii\))?\s*\))"),
        ("ammonium bicarbonate", "503(ii)", r"(?:\b(?:ammonium\s+(?:bi)?carbonate|e\s*503(?:\s*\(ii\))?|ins\s*503(?:\s*\(ii\))?)\b|\(\s*503(?:\s*\(ii\))?\s*\))"),
    ]
    existing_ins = {re.sub(r"\s+", "", str(p.get("ins_number") or "").lower()) for p in canonical_preservatives if p.get("ins_number")}
    existing_names = {str(p.get("name", "")).lower() for p in canonical_preservatives if p.get("name")}

    text_to_search = str(canonical.get("ingredients") or "")
    full_ocr_text = " ".join(str(item.get("text", "")) for item in ocr_data) if ocr_data else ""
    combined_search_corpus = f"{text_to_search} {full_ocr_text}"

    for p_name, p_ins, p_pattern in known_preservatives:
        cleaned_ins = re.sub(r"\s+", "", str(p_ins or "").lower())
        if cleaned_ins not in existing_ins and p_name not in existing_names:
            matched = False
            ev_found = None
            if re.search(p_pattern, combined_search_corpus, re.I):
                matched = True
                if ocr_data:
                    for item in ocr_data:
                        t = str(item.get("text", ""))
                        if re.search(p_pattern, t, re.I) or (p_ins and p_ins in t):
                            ev_found = {
                                "ocr_id": item.get("id"),
                                "image_index": item.get("image_index", 0),
                                "text": t.strip(),
                                "confidence": round(float(item.get("confidence", 1.0)), 4) if item.get("confidence") is not None else 1.0,
                                "bbox": item.get("bbox")
                            }
                            break
            if matched:
                canonical_preservatives.append({
                    "name": p_name,
                    "ins_number": p_ins,
                    "amount_mg_per_kg": None,
                    "evidence": ev_found
                })
                existing_ins.add(cleaned_ins)
                existing_names.add(p_name)

    # Universal scanner for ANY declared INS or E number on packaging
    # e.g., "acidity regulator (INS 330)", "anti-caking agent (INS 170 (i))", "flavour enhancers (INS 627, INS 631)", "paprika oleoresin (INS 160c)"
    for m in re.finditer(r"(?:INS|E)\s*([0-9]{3,4}\s*[a-z]?(?:\s*\([a-z0-9ivx]+\))?)", combined_search_corpus, re.I):
        ins_code = m.group(1).strip()
        cleaned_ins = re.sub(r"\s+", "", ins_code.lower())
        if cleaned_ins and cleaned_ins not in existing_ins:
            ev_found = None
            if ocr_data:
                for item in ocr_data:
                    t = str(item.get("text", ""))
                    if ins_code in t:
                        ev_found = {
                            "ocr_id": item.get("id"),
                            "image_index": item.get("image_index", 0),
                            "text": t.strip(),
                            "confidence": round(float(item.get("confidence", 1.0)), 4) if item.get("confidence") is not None else 1.0,
                            "bbox": item.get("bbox")
                        }
                        break

            canonical_preservatives.append({
                "name": f"Food Additive (INS {ins_code})",
                "ins_number": ins_code,
                "amount_mg_per_kg": None,
                "evidence": ev_found
            })
            existing_ins.add(cleaned_ins)

    canonical["preservatives"] = canonical_preservatives

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

    # Deterministically bind date evidence if extracted date has missing evidence
    date_fields = ["packed_date", "manufacturing_date", "expiry_date", "use_by_date", "best_before"]
    if ocr_data:
        for df in date_fields:
            if canonical.get(df) and not canonical_ev.get(df):
                d_val = str(canonical[df]).strip()
                for item in ocr_data:
                    t = str(item.get("text", ""))
                    if d_val in t or (df == "packed_date" and "PKD" in t.upper()) or (df == "manufacturing_date" and "MFG" in t.upper()):
                        canonical_ev[df] = {
                            "ocr_id": item.get("id"),
                            "image_index": item.get("image_index", 0),
                            "text": t.strip(),
                            "confidence": round(float(item.get("confidence", 1.0)), 4) if item.get("confidence") is not None else 1.0,
                            "bbox": item.get("bbox")
                        }
                        break
        for fld in ["mrp", "net_quantity", "batch_number"]:
            if canonical.get(fld) and not canonical_ev.get(fld):
                val = str(canonical[fld]).strip()
                for item in ocr_data:
                    t = str(item.get("text", ""))
                    if val in t:
                        canonical_ev[fld] = {
                            "ocr_id": item.get("id"),
                            "image_index": item.get("image_index", 0),
                            "text": t.strip(),
                            "confidence": round(float(item.get("confidence", 1.0)), 4) if item.get("confidence") is not None else 1.0,
                            "bbox": item.get("bbox")
                        }
                        break

    if not isinstance(canonical.get("consumer_care"), dict):
        canonical["consumer_care"] = {}
    if not canonical["consumer_care"].get("phone") and canonical_ev.get("consumer_care_phone"):
        canonical["consumer_care"]["phone"] = canonical_ev["consumer_care_phone"]["text"]
    if not canonical["consumer_care"].get("email") and canonical_ev.get("consumer_care_email"):
        canonical["consumer_care"]["email"] = canonical_ev["consumer_care_email"]["text"]

    canonical["evidence"] = canonical_ev
    return canonical
