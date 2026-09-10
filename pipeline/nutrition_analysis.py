import re
from typing import Any, Dict, List, Optional, Tuple


FSSAI_NUTRITION_REFERENCE = (
    "FSSAI Food Safety and Standards (Labelling and Display) Regulations, 2020 "
    "& Draft Front-of-Pack Nutritional Labelling (FOPNL) Guidelines (HFSS Limits)"
)

# Standard FSSAI Front-of-Pack Thresholds (Solid Foods per 100g)
SOLID_FOOD_THRESHOLDS = {
    "total_fat_g": 15.0,        # > 15g per 100g
    "saturated_fat_g": 4.0,     # > 4g per 100g
    "total_sugar_g": 10.0,      # > 10g per 100g
    "added_sugar_g": 6.0,       # > 6g per 100g
    "sodium_mg": 400.0,         # > 400mg per 100g
    "salt_g": 1.0,              # > 1.0g NaCl per 100g
}

# Standard FSSAI Front-of-Pack Thresholds (Liquid Foods per 100ml)
LIQUID_FOOD_THRESHOLDS = {
    "total_fat_g": 5.0,         # > 5g per 100ml
    "saturated_fat_g": 1.5,     # > 1.5g per 100ml
    "total_sugar_g": 5.0,       # > 5g per 100ml
    "added_sugar_g": 3.0,       # > 3g per 100ml
    "sodium_mg": 150.0,         # > 150mg per 100ml
    "salt_g": 0.375,            # > 0.375g per 100ml
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


def extract_nutrition_from_ocr(ocr_data: List[Dict[str, Any]]) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Extracts numerical nutrition metrics from raw OCR evidence list.
    Returns: (parsed_values_dict, supporting_evidence_dict)
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
    }
    evidence: Dict[str, Any] = {}

    if not ocr_data or not isinstance(ocr_data, list):
        return parsed, evidence

    # Combine text items to handle multi-line table layouts
    for item in ocr_data:
        text = str(item.get("text", "")).strip()
        if not text:
            continue

        ocr_ref = {
            "ocr_id": item.get("id", item.get("ocr_id")),
            "image_index": item.get("image_index", 0),
            "text": text,
            "confidence": item.get("confidence", 0.95),
            "bbox": item.get("bbox", [0, 0, 0, 0])
        }

        # --- ENERGY ---
        if parsed["energy_kcal"] is None and re.search(r"\b(?:energy|calories|caloric\s+value)\b", text, re.I):
            val = _extract_number(r"\b(?:energy|calories|caloric\s+value)\b[^\d]*([0-9]+(?:\.[0-9]+)?)", text)
            if val is not None:
                parsed["energy_kcal"] = val
                evidence["energy"] = ocr_ref

        # --- SATURATED FAT ---
        if parsed["saturated_fat_g"] is None and re.search(r"\b(?:saturated\s*(?:fat|fatty\s*acids?)|sat\.?\s*fat)\b", text, re.I):
            val = _extract_number(r"\b(?:saturated\s*(?:fat|fatty\s*acids?)|sat\.?\s*fat)\b[^\d]*([0-9]+(?:\.[0-9]+)?)\s*g?", text)
            if val is not None:
                parsed["saturated_fat_g"] = val
                evidence["saturated_fat"] = ocr_ref

        # --- TOTAL FAT ---
        elif parsed["total_fat_g"] is None and re.search(r"\b(?:total\s+fat|fat)\b", text, re.I) and not re.search(r"\b(?:saturated|trans)\b", text, re.I):
            val = _extract_number(r"\b(?:total\s+fat|fat)\b[^\d]*([0-9]+(?:\.[0-9]+)?)\s*g?", text)
            if val is not None:
                parsed["total_fat_g"] = val
                evidence["total_fat"] = ocr_ref

        # --- ADDED SUGAR ---
        if parsed["added_sugar_g"] is None and re.search(r"\b(?:added\s+sugars?)\b", text, re.I):
            val = _extract_number(r"\b(?:added\s+sugars?)\b[^\d]*([0-9]+(?:\.[0-9]+)?)\s*g?", text)
            if val is not None:
                parsed["added_sugar_g"] = val
                evidence["added_sugar"] = ocr_ref

        # --- TOTAL SUGAR ---
        elif parsed["total_sugar_g"] is None and re.search(r"\b(?:total\s+sugars?|sugars?)\b", text, re.I) and not re.search(r"\b(?:added)\b", text, re.I):
            val = _extract_number(r"\b(?:total\s+sugars?|sugars?)\b[^\d]*([0-9]+(?:\.[0-9]+)?)\s*g?", text)
            if val is not None:
                parsed["total_sugar_g"] = val
                evidence["total_sugar"] = ocr_ref

        # --- SODIUM / SALT ---
        if parsed["sodium_mg"] is None and re.search(r"\b(?:sodium|na)\b", text, re.I):
            val = _extract_number(r"\b(?:sodium|na)\b[^\d]*([0-9]+(?:\.[0-9]+)?)\s*(mg|g)?", text)
            if val is not None:
                # If explicitly declared in grams, convert to mg
                if re.search(r"\b(?:sodium|na)\b[^\d]*[0-9]+(?:\.[0-9]+)?\s*g\b", text, re.I):
                    parsed["sodium_mg"] = round(val * 1000, 1)
                else:
                    parsed["sodium_mg"] = val
                parsed["salt_g"] = round((parsed["sodium_mg"] * 2.5) / 1000, 2)
                evidence["sodium"] = ocr_ref

        elif parsed["salt_g"] is None and re.search(r"\b(?:salt|iodised\s+salt|table\s+salt)\b", text, re.I):
            val = _extract_number(r"\b(?:salt|iodised\s+salt|table\s+salt)\b[^\d]*([0-9]+(?:\.[0-9]+)?)\s*(mg|g)?", text)
            if val is not None:
                if re.search(r"\b(?:salt)\b[^\d]*[0-9]+(?:\.[0-9]+)?\s*mg\b", text, re.I):
                    parsed["salt_g"] = round(val / 1000, 3)
                    parsed["sodium_mg"] = round((val / 2.5), 1)
                else:
                    parsed["salt_g"] = val
                    parsed["sodium_mg"] = round((val * 1000) / 2.5, 1)
                evidence["salt"] = ocr_ref

    return parsed, evidence


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
        "total_sugar_g": raw.get("total_sugar_g") or raw.get("sugar") or raw.get("total_sugars"),
        "added_sugar_g": raw.get("added_sugar_g") or raw.get("added_sugar") or raw.get("added_sugars"),
        "sodium_mg": raw.get("sodium_mg") or raw.get("sodium"),
        "salt_g": raw.get("salt_g") or raw.get("salt"),
    }


def analyze_nutrition(
    product: Dict[str, Any],
    ocr_data: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Executes FSSAI Front-of-Pack Nutrition Warning Analysis (HFSS: High Fat, Sugar, Salt).
    Evaluates whether the product triggers HIGH FAT, HIGH SUGAR, or HIGH SALT warning labels.
    If information is missing, sets status to 'REVIEW' rather than guessing.
    """
    if not isinstance(product, dict):
        product = {}

    food_category = product.get("food_category") or product.get("category") or "Solid Packaged Food"
    is_liquid = is_liquid_category(food_category)
    thresholds = LIQUID_FOOD_THRESHOLDS if is_liquid else SOLID_FOOD_THRESHOLDS
    basis_unit = "100ml" if is_liquid else "100g"

    # 1. Extract nutrition data from product dictionary or OCR regions
    direct_nut = extract_nutrition_from_product(product)
    ocr_nut, ocr_ev = extract_nutrition_from_ocr(ocr_data or [])

    # Merge: product dictionary values take precedence if explicitly present, else OCR
    def pick_val(key: str) -> Optional[float]:
        v = direct_nut.get(key)
        if v is not None:
            try:
                return float(v)
            except (ValueError, TypeError):
                pass
        v2 = ocr_nut.get(key)
        if v2 is not None:
            try:
                return float(v2)
            except (ValueError, TypeError):
                pass
        return None

    total_fat = pick_val("total_fat_g")
    sat_fat = pick_val("saturated_fat_g")
    total_sugar = pick_val("total_sugar_g")
    added_sugar = pick_val("added_sugar_g")
    sodium = pick_val("sodium_mg")
    salt = pick_val("salt_g")

    # If salt is present but not sodium, estimate sodium (Sodium = Salt / 2.5)
    if sodium is None and salt is not None:
        sodium = round((salt * 1000) / 2.5, 1)
    # If sodium is present but not salt, estimate salt (Salt = Sodium * 2.5 / 1000)
    if salt is None and sodium is not None:
        salt = round((sodium * 2.5) / 1000, 2)

    declared_nutrition = {
        "energy_kcal": pick_val("energy_kcal"),
        "total_fat_g": total_fat,
        "saturated_fat_g": sat_fat,
        "total_sugar_g": total_sugar,
        "added_sugar_g": added_sugar,
        "sodium_mg": sodium,
        "salt_g": salt,
        "basis": basis_unit
    }

    warnings: List[str] = []

    # -------------------------------------------------------------
    # 1. HIGH FAT EVALUATION
    # -------------------------------------------------------------
    fat_thresh_total = thresholds["total_fat_g"]
    fat_thresh_sat = thresholds["saturated_fat_g"]

    if sat_fat is not None or total_fat is not None:
        is_high_sat = sat_fat is not None and sat_fat > fat_thresh_sat
        is_high_total = total_fat is not None and total_fat > fat_thresh_total
        is_high_fat = is_high_sat or is_high_total

        fat_status = "HIGH" if is_high_fat else "MODERATE"
        fat_warning = bool(is_high_fat)
        if fat_warning:
            warnings.append("HIGH FAT")

        # Formulate detailed evidence text
        parts = []
        if total_fat is not None:
            parts.append(f"Total Fat: {total_fat}g/{basis_unit}")
        if sat_fat is not None:
            parts.append(f"Saturated Fat: {sat_fat}g/{basis_unit}")
        fat_declared_str = ", ".join(parts)

        if is_high_fat:
            fat_reason = (
                f"Declared fat content ({fat_declared_str}) exceeds the statutory FSSAI front-of-pack "
                f"threshold (Limit: >{fat_thresh_total}g total fat or >{fat_thresh_sat}g saturated fat per {basis_unit}). "
                f"Front-of-pack HIGH FAT warning label is mandated under FSSAI FOPNL."
            )
        else:
            fat_reason = (
                f"Declared fat content ({fat_declared_str}) is within statutory FSSAI dietary limits "
                f"(Threshold: ≤{fat_thresh_total}g total fat, ≤{fat_thresh_sat}g saturated fat per {basis_unit})."
            )
        fat_ev = ocr_ev.get("saturated_fat") or ocr_ev.get("total_fat")
    else:
        fat_status = "REVIEW"
        fat_warning = False
        fat_declared_str = "Not declared / Not detected in OCR"
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
        "threshold": f"Total Fat > {fat_thresh_total}g or Sat Fat > {fat_thresh_sat}g per {basis_unit}",
        "reason": fat_reason,
        "evidence": fat_ev
    }

    # -------------------------------------------------------------
    # 2. HIGH SUGAR EVALUATION
    # -------------------------------------------------------------
    sugar_thresh_total = thresholds["total_sugar_g"]
    sugar_thresh_added = thresholds["added_sugar_g"]

    if total_sugar is not None or added_sugar is not None:
        is_high_total_sugar = total_sugar is not None and total_sugar > sugar_thresh_total
        is_high_added_sugar = added_sugar is not None and added_sugar > sugar_thresh_added
        is_high_sugar = is_high_total_sugar or is_high_added_sugar

        sugar_status = "HIGH" if is_high_sugar else "MODERATE"
        sugar_warning = bool(is_high_sugar)
        if sugar_warning:
            warnings.append("HIGH SUGAR")

        parts = []
        if total_sugar is not None:
            parts.append(f"Total Sugars: {total_sugar}g/{basis_unit}")
        if added_sugar is not None:
            parts.append(f"Added Sugars: {added_sugar}g/{basis_unit}")
        sugar_declared_str = ", ".join(parts)

        if is_high_sugar:
            sugar_reason = (
                f"Declared sugar content ({sugar_declared_str}) exceeds the statutory FSSAI front-of-pack "
                f"threshold (Limit: >{sugar_thresh_total}g total sugars or >{sugar_thresh_added}g added sugars per {basis_unit}). "
                f"Front-of-pack HIGH SUGAR warning label is mandated under FSSAI FOPNL."
            )
        else:
            sugar_reason = (
                f"Declared sugar content ({sugar_declared_str}) is within statutory FSSAI dietary limits "
                f"(Threshold: ≤{sugar_thresh_total}g total sugars per {basis_unit})."
            )
        sugar_ev = ocr_ev.get("total_sugar") or ocr_ev.get("added_sugar")
    else:
        sugar_status = "REVIEW"
        sugar_warning = False
        sugar_declared_str = "Not declared / Not detected in OCR"
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
        "threshold": f"Total Sugars > {sugar_thresh_total}g (or Added Sugars > {sugar_thresh_added}g) per {basis_unit}",
        "reason": sugar_reason,
        "evidence": sugar_ev
    }

    # -------------------------------------------------------------
    # 3. HIGH SALT EVALUATION
    # -------------------------------------------------------------
    sodium_thresh = thresholds["sodium_mg"]
    salt_thresh = thresholds["salt_g"]

    if sodium is not None or salt is not None:
        is_high_sodium = sodium is not None and sodium > sodium_thresh
        is_high_salt = salt is not None and salt > salt_thresh
        is_high_salt_warning = is_high_sodium or is_high_salt

        salt_status = "HIGH" if is_high_salt_warning else "MODERATE"
        salt_warning = bool(is_high_salt_warning)
        if salt_warning:
            warnings.append("HIGH SALT")

        parts = []
        if sodium is not None:
            parts.append(f"Sodium: {sodium}mg/{basis_unit}")
        if salt is not None:
            parts.append(f"Salt (NaCl): {salt}g/{basis_unit}")
        salt_declared_str = ", ".join(parts)

        if is_high_salt_warning:
            salt_reason = (
                f"Declared sodium/salt content ({salt_declared_str}) exceeds the statutory FSSAI front-of-pack "
                f"threshold (Limit: >{sodium_thresh}mg sodium or >{salt_thresh}g salt per {basis_unit}). "
                f"Front-of-pack HIGH SALT warning label is mandated under FSSAI FOPNL."
            )
        else:
            salt_reason = (
                f"Declared sodium/salt content ({salt_declared_str}) is within statutory FSSAI dietary limits "
                f"(Threshold: ≤{sodium_thresh}mg sodium per {basis_unit})."
            )
        salt_ev = ocr_ev.get("sodium") or ocr_ev.get("salt")
    else:
        salt_status = "REVIEW"
        salt_warning = False
        salt_declared_str = "Not declared / Not detected in OCR"
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
        "threshold": f"Sodium > {sodium_thresh}mg (or Salt > {salt_thresh}g) per {basis_unit}",
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
        "basis_unit": basis_unit,
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
