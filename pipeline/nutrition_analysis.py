import re
from typing import Any, Dict, List, Optional, Tuple


FSSAI_NUTRITION_REFERENCE = (
    "FSSAI Food Safety and Standards (Labelling and Display) Regulations, 2020 "
    "& Front-of-Pack Nutritional Labelling (FOPNL) Guidelines (HFSS Limits)"
)

# Statutory / Recommended FSSAI Front-of-Pack Thresholds (Solid Foods per 100g)
# Added fat: > 4.2g | Added sugar: > 3g | Salt: > 635mg (Sodium > 254mg)
SOLID_FOOD_THRESHOLDS = {
    "added_fat_g": 4.2,         # > 4.2g per 100g
    "saturated_fat_g": 4.2,     # > 4.2g per 100g
    "total_fat_g": 15.0,        # > 15g per 100g
    "added_sugar_g": 3.0,       # > 3g per 100g
    "total_sugar_g": 10.0,      # > 10g per 100g
    "salt_mg": 635.0,           # > 635mg per 100g
    "salt_g": 0.635,            # > 0.635g per 100g
    "sodium_mg": 254.0,         # > 254mg sodium per 100g (equivalent to 635mg salt)
}

# Standard FSSAI Front-of-Pack Thresholds (Liquid Foods per 100ml)
LIQUID_FOOD_THRESHOLDS = {
    "added_fat_g": 1.5,         # > 1.5g per 100ml
    "saturated_fat_g": 1.5,     # > 1.5g per 100ml
    "total_fat_g": 5.0,         # > 5g per 100ml
    "added_sugar_g": 3.0,       # > 3g per 100ml
    "total_sugar_g": 5.0,       # > 5g per 100ml
    "salt_mg": 250.0,           # > 250mg per 100ml
    "salt_g": 0.25,             # > 0.25g per 100ml
    "sodium_mg": 100.0,         # > 100mg per 100ml
}


def is_liquid_category(food_category: Optional[str]) -> bool:
    if not food_category:
        return False
    cat = food_category.lower()
    return any(k in cat for k in ["beverage", "drink", "juice", "liquid", "syrup", "soda", "water", "tea", "coffee"])


def _extract_number(pattern: str, text: str) -> Optional[float]:
    match = re.search(pattern, text, re.IGNORECASE)
    if match:
        try:
            return float(match.group(1))
        except (ValueError, TypeError):
            return None
    return None


def detect_basis_from_ocr(ocr_data: List[Dict[str, Any]]) -> Tuple[float, str]:
    """
    Detects declared serving basis (e.g. Per 57g, Per 100g, Serving size 30g).
    Returns (basis_in_grams_or_ml, basis_description_str)
    """
    # 1. Explicit column header basis like "Per 57g" or "Per 57 g"
    for it in ocr_data:
        t = it.get("text", "")
        m = re.search(r"\bper\s*([0-9]+(?:\.[0-9]+)?)\s*(?:g|gm|ml)\b", t, re.I)
        if m:
            val = float(m.group(1))
            return val, f"Per {val:g}g"

    # 2. Check for explicit "Per 100g" or "Per 100ml"
    for it in ocr_data:
        t = it.get("text", "")
        if re.search(r"\bper\s*100\s*(?:g|gm|ml)\b", t, re.I):
            return 100.0, "Per 100g"

    # 3. Check for "Serving size 30g"
    for it in ocr_data:
        t = it.get("text", "")
        m = re.search(r"\bserving\s*size\s*([0-9]+(?:\.[0-9]+)?)\s*(?:g|gm|ml)\b", t, re.I)
        if m:
            val = float(m.group(1))
            return val, f"Per serve ({val:g}g)"

    return 100.0, "Per 100g"


def extract_nutrition_from_ocr(ocr_data: List[Dict[str, Any]]) -> Tuple[Dict[str, Any], Dict[str, Any], Dict[str, Any]]:
    """
    Extracts numerical nutrition metrics from raw OCR evidence list using both sequential
    item analysis and row clustering. Handles tabular layouts where label and numeric value
    reside in distinct bounding boxes.
    
    Returns: (declared_values_dict, per_100g_normalized_dict, supporting_evidence_dict)
    """
    parsed: Dict[str, Any] = {
        "energy_kcal": None,
        "total_fat_g": None,
        "saturated_fat_g": None,
        "trans_fat_g": None,
        "carbohydrates_g": None,
        "total_sugar_g": None,
        "added_sugar_g": None,
        "sodium_mg": None,
        "salt_g": None,
        "basis_value": 100.0,
        "basis_text": "Per 100g",
    }
    evidence: Dict[str, Any] = {}

    if not ocr_data or not isinstance(ocr_data, list):
        return parsed, {}, evidence

    basis_val, basis_text = detect_basis_from_ocr(ocr_data)
    parsed["basis_value"] = basis_val
    parsed["basis_text"] = basis_text

    nutrient_defs = [
        ("added_sugar_g", r"\badded\s+sugars?\b", "added_sugar"),
        ("total_sugar_g", r"\btotal\s+sugars?\b", "total_sugar"),
        ("saturated_fat_g", r"\b(?:saturated\s*(?:fat|fatty\s*acids?)|sat\.?\s*fat)\b", "saturated_fat"),
        ("trans_fat_g", r"\btrans\s*(?:fat|fatty\s*acids?)\b", "trans_fat"),
        ("total_fat_g", r"\btotal\s+fat\b", "total_fat"),
        ("sodium_mg", r"\b(?:sodium|na)\b", "sodium"),
        ("energy_kcal", r"\b(?:energy|calories|caloric\s+value)\b", "energy"),
    ]

    # PASS 1: Sequential Adjacent Items (label box followed immediately by value box in OCR list)
    for i, it in enumerate(ocr_data):
        text = str(it.get("text", "")).strip()
        if not text or re.search(r"\bingredients?\s*:", text, re.I):
            continue

        for key, pattern, ev_key in nutrient_defs:
            if parsed[key] is not None:
                continue

            if re.search(pattern, text, re.I):
                if key == "total_sugar_g" and re.search(r"\badded\b", text, re.I):
                    continue
                if key == "total_fat_g" and re.search(r"\b(?:saturated|trans)\b", text, re.I):
                    continue

                # Check if number is inside the same box
                same_box_num = _extract_number(pattern + r"[^\d]*?([0-9]+(?:\.[0-9]+)?)\s*(?:g|gm|mg|kcal)?\b", text)
                if same_box_num is not None:
                    parsed[key] = same_box_num
                    evidence[ev_key] = {
                        "ocr_id": it.get("id", it.get("ocr_id")),
                        "image_index": it.get("image_index", 0),
                        "text": text,
                        "confidence": it.get("confidence", 0.95),
                        "bbox": it.get("bbox", [0, 0, 0, 0]),
                    }
                    continue

                # Check next 1-3 boxes in sequential OCR list
                for offset in range(1, 4):
                    if i + offset < len(ocr_data):
                        next_item = ocr_data[i + offset]
                        next_text = str(next_item.get("text", "")).strip()
                        m = re.match(r"^([0-9]+(?:\.[0-9]+)?)\s*(?:g|gm|mg|kcal)?$", next_text, re.I)
                        if m:
                            parsed[key] = float(m.group(1))
                            evidence[ev_key] = {
                                "ocr_id": it.get("id", it.get("ocr_id")),
                                "image_index": it.get("image_index", 0),
                                "text": f"{text}: {next_text}",
                                "confidence": it.get("confidence", 0.95),
                                "bbox": it.get("bbox", [0, 0, 0, 0]),
                            }
                            break
                        # Stop scanning if we encounter another nutrient label
                        if any(re.search(p, next_text, re.I) for _, p, _ in nutrient_defs):
                            break

    # PASS 2: Spatial Row Clustering (group horizontally aligned bounding boxes)
    table_items = [
        it for it in ocr_data
        if str(it.get("text", "")).strip()
        and not re.search(r"\bingredients?\s*:", str(it.get("text", "")), re.I)
        and len(str(it.get("text", "")).strip()) < 60
    ]
    sorted_items = sorted(
        table_items,
        key=lambda it: (it.get("bbox", [0, 0, 0, 0])[1], it.get("bbox", [0, 0, 0, 0])[0])
    )
    rows: List[Dict[str, Any]] = []
    for it in sorted_items:
        bbox = it.get("bbox", [0, 0, 0, 0])
        y_mid = (bbox[1] + bbox[3]) / 2.0
        matched = False
        for row in rows:
            if abs(row["y_mid"] - y_mid) <= 12:
                row["items"].append(it)
                row["y_mid"] = sum((x["bbox"][1] + x["bbox"][3]) / 2.0 for x in row["items"]) / len(row["items"])
                matched = True
                break
        if not matched:
            rows.append({"y_mid": y_mid, "items": [it]})

    for row in rows:
        row["items"] = sorted(row["items"], key=lambda it: it.get("bbox", [0, 0, 0, 0])[0])
        row_text = " ".join(str(it.get("text", "")).strip() for it in row["items"])
        for key, pattern, ev_key in nutrient_defs:
            if parsed[key] is not None:
                continue
            if re.search(pattern, row_text, re.I):
                if key == "total_sugar_g" and re.search(r"\badded\s+sugar", row_text, re.I):
                    continue
                if key == "total_fat_g" and re.search(r"\b(?:saturated|trans)", row_text, re.I):
                    continue
                m = re.search(pattern + r"[^\d]*?([0-9]+(?:\.[0-9]+)?)\s*(?:g|gm|mg|kcal)?\b", row_text, re.I)
                if m:
                    parsed[key] = float(m.group(1))
                    evidence[ev_key] = {
                        "ocr_id": row["items"][0].get("id", row["items"][0].get("ocr_id")),
                        "image_index": row["items"][0].get("image_index", 0),
                        "text": row_text,
                        "confidence": row["items"][0].get("confidence", 0.95),
                        "bbox": row["items"][0].get("bbox", [0, 0, 0, 0]),
                    }

    # Sodium to Salt calculation: Salt (NaCl) = Sodium * 2.5
    if parsed["sodium_mg"] is not None:
        parsed["salt_g"] = round((parsed["sodium_mg"] * 2.5) / 1000.0, 3)
        if "salt" not in evidence and "sodium" in evidence:
            evidence["salt"] = evidence["sodium"]
    elif parsed["salt_g"] is not None:
        parsed["sodium_mg"] = round((parsed["salt_g"] * 1000.0) / 2.5, 1)

    # Scale to per 100g if basis is not 100g
    scale_factor = (100.0 / basis_val) if basis_val and basis_val > 0 else 1.0
    parsed["scale_factor"] = round(scale_factor, 4)

    # Normalized per 100g dictionary
    norm: Dict[str, Any] = {}
    for k in ["energy_kcal", "total_fat_g", "saturated_fat_g", "trans_fat_g", "carbohydrates_g", "total_sugar_g", "added_sugar_g", "sodium_mg", "salt_g"]:
        v = parsed.get(k)
        if v is not None:
            norm[k] = round(v * scale_factor, 2)
        else:
            norm[k] = None

    return parsed, norm, evidence


def extract_nutrition_from_product(product: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extracts nutrition dictionary if directly provided in structured product.
    """
    raw = product.get("nutrition") or product.get("nutrition_information") or product.get("nutritional_information") or {}
    if not isinstance(raw, dict):
        return {}
    return {
        "energy_kcal": raw.get("energy_kcal") or raw.get("energy"),
        "total_fat_g": raw.get("total_fat_g") or raw.get("fat") or raw.get("total_fat"),
        "saturated_fat_g": raw.get("saturated_fat_g") or raw.get("saturated_fat"),
        "added_fat_g": raw.get("added_fat_g") or raw.get("added_fat"),
        "total_sugar_g": raw.get("total_sugar_g") or raw.get("sugar") or raw.get("total_sugars"),
        "added_sugar_g": raw.get("added_sugar_g") or raw.get("added_sugar") or raw.get("added_sugars"),
        "sodium_mg": raw.get("sodium_mg") or raw.get("sodium"),
        "salt_g": raw.get("salt_g") or raw.get("salt"),
        "basis_g": raw.get("basis_g") or raw.get("serving_size_g"),
    }


def analyze_nutrition(
    product: Dict[str, Any],
    ocr_data: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Executes statutory FSSAI Front-of-Pack Nutrition Warning Analysis (HFSS: High Fat, Sugar, Salt).
    Evaluates whether the product triggers HIGH FAT, HIGH SUGAR, or HIGH SALT warning labels.
    If information is missing, sets status to 'REVIEW' rather than guessing.
    """
    if not isinstance(product, dict):
        product = {}

    food_category = product.get("food_category") or product.get("category") or "Solid Packaged Food"
    is_liquid = is_liquid_category(food_category)
    thresholds = LIQUID_FOOD_THRESHOLDS if is_liquid else SOLID_FOOD_THRESHOLDS
    unit_label = "100ml" if is_liquid else "100g"

    # 1. Extract nutrition data from product dictionary or OCR regions
    direct_nut = extract_nutrition_from_product(product)
    ocr_raw, ocr_norm, ocr_ev = extract_nutrition_from_ocr(ocr_data or [])

    # Scale factor from direct product if basis declared
    direct_basis = direct_nut.get("basis_g")
    direct_scale = (100.0 / float(direct_basis)) if direct_basis and float(direct_basis) > 0 else 1.0

    def get_norm_val(key: str) -> Optional[float]:
        # Check direct product first
        if direct_nut.get(key) is not None:
            try:
                raw_v = float(direct_nut[key])
                return round(raw_v * direct_scale, 2)
            except (ValueError, TypeError):
                pass
        # Fallback to normalized OCR value
        if ocr_norm.get(key) is not None:
            return ocr_norm[key]
        return None

    def get_raw_val(key: str) -> Optional[float]:
        if direct_nut.get(key) is not None:
            try:
                return float(direct_nut[key])
            except (ValueError, TypeError):
                pass
        if ocr_raw.get(key) is not None:
            return ocr_raw[key]
        return None

    # Normalized values per 100g
    norm_added_fat = get_norm_val("added_fat_g")
    norm_sat_fat = get_norm_val("saturated_fat_g")
    norm_total_fat = get_norm_val("total_fat_g")
    norm_added_sugar = get_norm_val("added_sugar_g")
    norm_total_sugar = get_norm_val("total_sugar_g")
    norm_sodium = get_norm_val("sodium_mg")
    norm_salt = get_norm_val("salt_g")

    # Raw declared values
    raw_sat_fat = get_raw_val("saturated_fat_g")
    raw_total_fat = get_raw_val("total_fat_g")
    raw_added_sugar = get_raw_val("added_sugar_g")
    raw_total_sugar = get_raw_val("total_sugar_g")
    raw_sodium = get_raw_val("sodium_mg")
    raw_salt = get_raw_val("salt_g")

    # Calculate salt if sodium present and vice versa
    if norm_sodium is not None and norm_salt is None:
        norm_salt = round((norm_sodium * 2.5) / 1000.0, 3)
    elif norm_salt is not None and norm_sodium is None:
        norm_sodium = round((norm_salt * 1000.0) / 2.5, 1)

    basis_text = ocr_raw.get("basis_text", "Per 100g")
    scale_factor = ocr_raw.get("scale_factor", 1.0)
    has_scale = scale_factor != 1.0

    declared_nutrition = {
        "basis_declared": basis_text,
        "scale_factor_to_100g": scale_factor,
        "per_100g": {
            "energy_kcal": get_norm_val("energy_kcal"),
            "total_fat_g": norm_total_fat,
            "saturated_fat_g": norm_sat_fat,
            "added_sugar_g": norm_added_sugar,
            "total_sugar_g": norm_total_sugar,
            "sodium_mg": norm_sodium,
            "salt_g": norm_salt,
            "salt_mg": round(norm_salt * 1000.0, 1) if norm_salt is not None else None,
        },
        "raw_declared": {
            "energy_kcal": get_raw_val("energy_kcal"),
            "total_fat_g": raw_total_fat,
            "saturated_fat_g": raw_sat_fat,
            "added_sugar_g": raw_added_sugar,
            "total_sugar_g": raw_total_sugar,
            "sodium_mg": raw_sodium,
            "salt_g": raw_salt,
        }
    }

    warnings: List[str] = []

    # -------------------------------------------------------------
    # 1. HIGH FAT EVALUATION
    # -------------------------------------------------------------
    # Thresholds: Added/Saturated Fat > 4.2g/100g, Total Fat > 15.0g/100g
    fat_thresh_sat = thresholds.get("saturated_fat_g", 4.2)
    fat_thresh_total = thresholds.get("total_fat_g", 15.0)

    if norm_sat_fat is not None or norm_added_fat is not None or norm_total_fat is not None:
        # Check added/sat fat > 4.2g
        is_high_sat = (norm_sat_fat is not None and norm_sat_fat > fat_thresh_sat)
        is_high_added = (norm_added_fat is not None and norm_added_fat > fat_thresh_sat)
        is_high_total = (norm_total_fat is not None and norm_total_fat > fat_thresh_total)

        is_high_fat = is_high_sat or is_high_added or is_high_total
        fat_status = "HIGH" if is_high_fat else "MODERATE"
        fat_warning = bool(is_high_fat)
        if fat_warning:
            warnings.append("HIGH FAT")

        fat_parts = []
        if norm_sat_fat is not None:
            fat_parts.append(f"Saturated Fat: {norm_sat_fat}g/{unit_label}")
            if has_scale and raw_sat_fat is not None:
                fat_parts[-1] += f" (Declared: {raw_sat_fat}g {basis_text})"
        if norm_total_fat is not None:
            fat_parts.append(f"Total Fat: {norm_total_fat}g/{unit_label}")
            if has_scale and raw_total_fat is not None:
                fat_parts[-1] += f" (Declared: {raw_total_fat}g {basis_text})"
        fat_declared_str = ", ".join(fat_parts)

        if is_high_fat:
            fat_reason = (
                f"Declared fat content ({fat_declared_str}) exceeds the statutory FSSAI threshold "
                f"(Limit: >{fat_thresh_sat}g saturated/added fat or >{fat_thresh_total}g total fat per {unit_label}). "
                f"Front-of-pack HIGH FAT warning label is mandated under FSSAI FOPNL."
            )
        else:
            fat_reason = (
                f"Declared fat content ({fat_declared_str}) is within statutory dietary limits "
                f"(Threshold: ≤{fat_thresh_sat}g saturated fat per {unit_label})."
            )
        fat_ev = ocr_ev.get("saturated_fat") or ocr_ev.get("total_fat")
    else:
        fat_status = "REVIEW"
        fat_warning = False
        fat_declared_str = "Not detected in OCR"
        fat_reason = (
            "Nutritional declaration for fat is not detected or partially obscured on the package. "
            "Verification of back-of-pack nutritional information panel recommended."
        )
        fat_ev = None

    fat_indicator = {
        "id": "indicator_fat",
        "name": "Fat Content",
        "warning_title": "HIGH FAT",
        "status": fat_status,
        "warning_triggered": fat_warning,
        "declared_value": fat_declared_str,
        "threshold": f"Added / Saturated Fat > {fat_thresh_sat}g (or Total Fat > {fat_thresh_total}g) per {unit_label}",
        "reason": fat_reason,
        "evidence": fat_ev
    }

    # -------------------------------------------------------------
    # 2. HIGH SUGAR EVALUATION
    # -------------------------------------------------------------
    # Thresholds: Added Sugar > 3.0g/100g, Total Sugar > 10.0g/100g
    sugar_thresh_added = thresholds.get("added_sugar_g", 3.0)
    sugar_thresh_total = thresholds.get("total_sugar_g", 10.0)

    if norm_added_sugar is not None or norm_total_sugar is not None:
        is_high_added = (norm_added_sugar is not None and norm_added_sugar > sugar_thresh_added)
        is_high_total = (norm_total_sugar is not None and norm_total_sugar > sugar_thresh_total)

        # Added sugar takes priority if declared
        if norm_added_sugar is not None:
            is_high_sugar = is_high_added
        else:
            is_high_sugar = is_high_total

        sugar_status = "HIGH" if is_high_sugar else "MODERATE"
        sugar_warning = bool(is_high_sugar)
        if sugar_warning:
            warnings.append("HIGH SUGAR")

        sugar_parts = []
        if norm_added_sugar is not None:
            sugar_parts.append(f"Added Sugars: {norm_added_sugar}g/{unit_label}")
            if has_scale and raw_added_sugar is not None:
                sugar_parts[-1] += f" (Declared: {raw_added_sugar}g {basis_text})"
        if norm_total_sugar is not None:
            sugar_parts.append(f"Total Sugars: {norm_total_sugar}g/{unit_label}")
            if has_scale and raw_total_sugar is not None:
                sugar_parts[-1] += f" (Declared: {raw_total_sugar}g {basis_text})"
        sugar_declared_str = ", ".join(sugar_parts)

        if is_high_sugar:
            sugar_reason = (
                f"Declared sugar content ({sugar_declared_str}) exceeds the statutory FSSAI threshold "
                f"(Limit: >{sugar_thresh_added}g added sugars per {unit_label}). "
                f"Front-of-pack HIGH SUGAR warning label is mandated under FSSAI FOPNL."
            )
        else:
            sugar_reason = (
                f"Declared sugar content ({sugar_declared_str}) complies within statutory dietary limits "
                f"(Threshold: ≤{sugar_thresh_added}g added sugars per {unit_label})."
            )
        sugar_ev = ocr_ev.get("added_sugar") or ocr_ev.get("total_sugar")
    else:
        sugar_status = "REVIEW"
        sugar_warning = False
        sugar_declared_str = "Not detected in OCR"
        sugar_reason = (
            "Nutritional declaration for sugar is not detected or partially obscured on the package. "
            "Verification of back-of-pack nutritional information panel recommended."
        )
        sugar_ev = None

    sugar_indicator = {
        "id": "indicator_sugar",
        "name": "Sugar Content",
        "warning_title": "HIGH SUGAR",
        "status": sugar_status,
        "warning_triggered": sugar_warning,
        "declared_value": sugar_declared_str,
        "threshold": f"Added Sugar > {sugar_thresh_added}g (or Total Sugars > {sugar_thresh_total}g) per {unit_label}",
        "reason": sugar_reason,
        "evidence": sugar_ev
    }

    # -------------------------------------------------------------
    # 3. HIGH SALT EVALUATION
    # -------------------------------------------------------------
    # Thresholds: Salt > 635mg (0.635g), Sodium > 254mg per 100g
    salt_thresh_mg = thresholds.get("salt_mg", 635.0)
    salt_thresh_g = thresholds.get("salt_g", 0.635)
    sodium_thresh_mg = thresholds.get("sodium_mg", 254.0)

    if norm_sodium is not None or norm_salt is not None:
        salt_mg_val = (norm_salt * 1000.0) if norm_salt is not None else None
        is_high_salt = (salt_mg_val is not None and salt_mg_val > salt_thresh_mg)
        is_high_sodium = (norm_sodium is not None and norm_sodium > sodium_thresh_mg)
        is_high_salt_warning = is_high_salt or is_high_sodium

        salt_status = "HIGH" if is_high_salt_warning else "MODERATE"
        salt_warning = bool(is_high_salt_warning)
        if salt_warning:
            warnings.append("HIGH SALT")

        salt_parts = []
        if salt_mg_val is not None:
            salt_parts.append(f"Salt: {round(salt_mg_val, 1)}mg/{unit_label} ({norm_salt}g)")
        if norm_sodium is not None:
            salt_parts.append(f"Sodium: {norm_sodium}mg/{unit_label}")
            if has_scale and raw_sodium is not None:
                salt_parts[-1] += f" (Declared: {raw_sodium}mg {basis_text})"
        salt_declared_str = ", ".join(salt_parts)

        if is_high_salt_warning:
            salt_reason = (
                f"Declared sodium/salt content ({salt_declared_str}) exceeds the statutory FSSAI threshold "
                f"(Limit: >{salt_thresh_mg}mg salt or >{sodium_thresh_mg}mg sodium per {unit_label}). "
                f"Front-of-pack HIGH SALT warning label is mandated under FSSAI FOPNL."
            )
        else:
            salt_reason = (
                f"Declared sodium/salt content ({salt_declared_str}) complies within statutory dietary limits "
                f"(Threshold: ≤{salt_thresh_mg}mg salt or ≤{sodium_thresh_mg}mg sodium per {unit_label})."
            )
        salt_ev = ocr_ev.get("salt") or ocr_ev.get("sodium")
    else:
        salt_status = "REVIEW"
        salt_warning = False
        salt_declared_str = "Not detected in OCR"
        salt_reason = (
            "Nutritional declaration for sodium/salt is not detected or partially obscured on the package. "
            "Verification of back-of-pack nutritional information panel recommended."
        )
        salt_ev = None

    salt_indicator = {
        "id": "indicator_salt",
        "name": "Salt / Sodium Content",
        "warning_title": "HIGH SALT",
        "status": salt_status,
        "warning_triggered": salt_warning,
        "declared_value": salt_declared_str,
        "threshold": f"Salt > {salt_thresh_mg}mg (Sodium > {sodium_thresh_mg}mg) per {unit_label}",
        "reason": salt_reason,
        "evidence": salt_ev
    }

    # Summary determinations
    has_any_warning = len(warnings) > 0
    all_reviewed = (fat_status == "REVIEW" and sugar_status == "REVIEW" and salt_status == "REVIEW")

    if has_any_warning:
        overall_summary = f"Statutory Front-of-Pack Warning Required: {', '.join(warnings)} detected exceeding FSSAI limits."
    elif all_reviewed:
        overall_summary = "Nutrition information insufficient to determine HFSS status; physical verification recommended."
    else:
        overall_summary = "All evaluated nutritional indicators comply within FSSAI front-of-pack dietary thresholds."

    return {
        "reference_standard": FSSAI_NUTRITION_REFERENCE,
        "food_category": food_category,
        "basis_unit": unit_label,
        "has_warning": has_any_warning,
        "warnings": warnings,
        "warnings_count": len(warnings),
        "overall_summary": overall_summary,
        "indicators": {
            "fat": fat_indicator,
            "sugar": sugar_indicator,
            "salt": salt_indicator,
        },
        "indicators_list": [
            fat_indicator,
            sugar_indicator,
            salt_indicator,
        ],
        "declared_nutrition": declared_nutrition,
    }
