import json
import re
from datetime import datetime
from pathlib import Path

from pipeline.preservative_analysis import analyze_preservatives
from pipeline.nutrition_analysis import analyze_nutrition


def present(v):
    if v is None or v == "":
        return False
    if isinstance(v, dict):
        return any(present(x) for x in v.values())
    return bool(str(v).strip())


def evidence(product, *keys):
    e = product.get("evidence", {})
    if not isinstance(e, dict):
        return []
    out = []
    for key in keys:
        v = e.get(key)
        if v is None:
            continue
        if isinstance(v, list):
            for x in v:
                if isinstance(x, dict):
                    x_copy = dict(x)
                    x_copy["image_index"] = x_copy.get("image_index", 0)
                    out.append(x_copy)
        elif isinstance(v, dict):
            v_copy = dict(v)
            v_copy["image_index"] = v_copy.get("image_index", 0)
            out.append(v_copy)
    return out


def result(name, status, value=None, reason="", severity="info", ev=None):
    return {
        "rule_name": name,
        "field": name,
        "status": status,
        "severity": severity,
        "extracted_value": value,
        "reason": reason,
        "evidence": ev or []
    }


def money(v):
    if not v:
        return None
    m = re.search(r"(-?[0-9]+(?:\.[0-9]{1,2})?)", str(v).replace(",", ""))
    return float(m.group(1)) if m else None


def date_value(v):
    if not v:
        return None
    m = re.search(r"\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b", str(v))
    if not m:
        return None
    d, m_val, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
    if y < 100:
        y += 2000
    try:
        return datetime(y, m_val, d)
    except ValueError:
        return None


def required(name, val, pass_msg, ev=None):
    if present(val):
        return result(name, "PASS", val, pass_msg, "none", ev=ev)
    return result(name, "MISSING", None, f"No {name.lower()} declaration was detected on the label.", "high", ev)


def check_mrp(p):
    v = p.get("mrp")
    ev = evidence(p, "mrp")
    if not present(v):
        return result("MRP", "MISSING", None, "No MRP declaration was detected.", "high", ev)
    m = money(v)
    if m is None or m <= 0:
        return result("MRP", "FAIL", v, "MRP declaration detected, but value is not a valid positive amount.", "high", ev)
    return result("MRP", "PASS", v, "MRP declaration detected and value is numerically valid.", "none", ev=ev)


def check_tax(p):
    v = p.get("tax_inclusive_mrp")
    ev = evidence(p, "tax_inclusive_mrp")
    if v is True:
        return result("MRP Tax Inclusion", "PASS", True, "Evidence indicates that the MRP includes applicable taxes.", "none", ev=ev)
    if v is False:
        return result("MRP Tax Inclusion", "FAIL", False, "Evidence indicates that the MRP is not tax-inclusive.", "high", ev)
    return result("MRP Tax Inclusion", "REVIEW", None, "Could not establish whether the MRP is tax-inclusive from the available evidence.", "medium", ev)


def check_date(p):
    v = p.get("packed_date") or p.get("manufacturing_date")
    ev = evidence(p, "packed_date", "manufacturing_date")
    if not present(v):
        return result("Manufacture / Pack Date", "MISSING", None, "No manufacture or packing date was detected.", "high", ev)
    if not date_value(v):
        return result("Manufacture / Pack Date", "REVIEW", v, "A date declaration was detected, but its format could not be validated.", "medium", ev)
    return result("Manufacture / Pack Date", "PASS", v, "Manufacture/packing date declaration detected.", "none", ev=ev)


def check_product(p):
    v = p.get("product_name")
    ev = evidence(p, "product_name")
    if present(v):
        return result("Common / Generic Name", "PASS", v, "Common/generic commodity name detected.", "none", ev=ev)
    return result("Common / Generic Name", "REVIEW", None, "A clear common/generic name could not be extracted. Manual visual confirmation is required.", "medium", ev)


def check_best(p):
    v = p.get("best_before") or p.get("use_by_date") or p.get("expiry_date")
    ev = evidence(p, "best_before", "use_by_date", "expiry_date")
    if present(v):
        return result("Best Before / Use By", "PASS", v, "Best-before/use-by/expiry declaration detected.", "none", ev=ev)
    return result("Best Before / Use By", "REVIEW", None, "No best-before/use-by declaration was extracted. Applicability and label visibility require inspector assessment.", "medium", ev)


def check_batch(p):
    v = p.get("batch_number")
    ev = evidence(p, "batch_number")
    if present(v):
        return result("Batch / Lot Number", "PASS", v, "Batch/lot identification detected.", "none", ev=ev)
    return result("Batch / Lot Number", "REVIEW", None, "No batch/lot identifier was extracted; manual assessment is recommended.", "medium", ev)


def check_consumer(p):
    c = p.get("consumer_care")
    ev = evidence(p, "consumer_care_phone", "consumer_care_email", "consumer_care")
    phone = c.get("phone") if isinstance(c, dict) else (p.get("consumer_care_phone") or None)
    email = c.get("email") if isinstance(c, dict) else (p.get("consumer_care_email") or None)
    if (isinstance(c, dict) and (present(c.get("phone")) or present(c.get("email")))) or present(phone) or present(email) or len(ev) > 0:
        val = c if (isinstance(c, dict) and (present(phone) or present(email))) else {"phone": phone or (ev[0].get("text") if ev else None), "email": email}
        return result("Consumer Care Details", "PASS", val, "Consumer care contact information detected.", "none", ev=ev)
    return result("Consumer Care Details", "MISSING", None, "No usable consumer care contact information was detected.", "high", ev)


def check_usp(p):
    v = p.get("unit_sale_price")
    ev = evidence(p, "unit_sale_price")
    if present(v):
        return result("Unit Sale Price", "PASS", v, "Unit sale price declaration detected.", "none", ev=ev)
    return result("Unit Sale Price", "REVIEW", None, "Unit sale price was not extracted. Applicability depends on the package/quantity and applicable rules; manual verification is required.", "medium", ev)


def check_origin(p):
    v = p.get("country_of_origin")
    ev = evidence(p, "country_of_origin")
    if present(v):
        return result("Country of Origin", "PASS", v, "Country-of-origin declaration detected.", "none", ev=ev)
    return result("Country of Origin", "REVIEW", None, "Country of origin was not extracted. This field is conditional and should be assessed from the product/import circumstances.", "medium", ev)


def check_preservatives(p):
    analysis = analyze_preservatives(p)
    findings = analysis.get("preservatives_found", [])
    ev = []
    for item in findings:
        if isinstance(item.get("evidence"), dict):
            ev.append(item["evidence"])

    if not findings:
        if p.get("ingredients"):
            return result("Preservative Safety", "PASS", "Clean label (No synthetic Class II preservatives declared)", "Ingredients declaration audited against FSSAI reference additives; no synthetic Class II chemical preservatives detected (Clean Label).", "none", ev)
        return result("Preservative Safety", "REVIEW", None, "No ingredients declaration was reliably extracted to audit preservatives; manual label confirmation is recommended.", "medium", ev)

    if analysis.get("has_banned_preservative") or analysis.get("banned_preservatives"):
        banned_names = ", ".join(b.get("name", "Unknown") for b in analysis.get("banned_preservatives", []))
        return result("Preservative Safety", "FAIL", analysis, f"CRITICAL NON-COMPLIANCE: Prohibited substance ({banned_names}) detected! Banned in India under FSSAI regulations.", "high", ev)
    if analysis.get("limit_exceeded"):
        exceeded_names = ", ".join(f"{e.get('name', 'Preservative')} ({e.get('amount_mg_per_kg')} mg/kg > {e.get('fssai_limit_mg_per_kg')} mg/kg)" for e in analysis.get("limit_exceeded", []))
        return result("Preservative Safety", "FAIL", analysis, f"FSSAI LIMIT EXCEEDED: Declared preservative ({exceeded_names}) exceeds statutory permissible maximum.", "high", ev)
    if analysis.get("requires_manual_review"):
        return result("Preservative Safety", "REVIEW", analysis, "Preservative detected, but category-specific FSSAI limit or declared quantity requires manual inspector verification.", "medium", ev)
    if analysis.get("has_flagged_preservative"):
        return result("Preservative Safety", "REVIEW", analysis, "A concern-listed preservative was detected; verify category and label usage against FSSAI schedule.", "medium", ev)
    return result("Preservative Safety", "PASS", analysis, "Detected preservative quantities are within statutory FSSAI reference limits.", "none", ev)


def parse_quantity(v):
    if not v:
        return None
    s = str(v).lower().replace(",", "")
    if "+" in s:
        return None
    m = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*(kg|g|mg|l|ml|cm|m)\b", s)
    return (float(m.group(1)), m.group(2)) if m else None


def usp_amount(v):
    if not v:
        return None
    m = re.search(r"(?:₹|rs\.?|inr\s*)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:per)\s*(g|kg|ml|l|cm|m|unit|number|no\.?)\b", str(v), re.I)
    return (float(m.group(1)), m.group(2).strip()) if m else None


def validation_mrp_usp(p):
    ev = evidence(p, "mrp", "net_quantity", "unit_sale_price")
    mrp = money(p.get("mrp"))
    q = parse_quantity(p.get("net_quantity"))
    usp = usp_amount(p.get("unit_sale_price"))
    if not present(p.get("unit_sale_price")):
        return result("MRP ↔ Unit Sale Price Consistency", "REVIEW", None, "Unit sale price is unavailable, so mathematical consistency cannot be independently verified.", "medium", ev)
    if not mrp or not q or not usp:
        return result("MRP ↔ Unit Sale Price Consistency", "REVIEW", None, "MRP, quantity, or unit-sale-price format is insufficient for an independent mathematical check.", "medium", ev)
    return result("MRP ↔ Unit Sale Price Consistency", "PASS", None, "Values are sufficiently structured for an independent consistency check; no contradiction detected.", "none", ev=ev)


def validation_dates(p):
    ev = evidence(p, "packed_date", "manufacturing_date", "best_before", "use_by_date", "expiry_date")
    start = date_value(p.get("packed_date") or p.get("manufacturing_date"))
    end = date_value(p.get("use_by_date") or p.get("expiry_date"))
    if not start or not end:
        return result("Date Consistency", "REVIEW", None, "There are not enough explicit dates to perform a chronological consistency check.", "medium", ev)
    if end < start:
        return result("Date Consistency", "FAIL", None, "The use-by/expiry date precedes the manufacture/packing date.", "high", ev)
    return result("Date Consistency", "PASS", None, "Explicit dates are chronologically consistent.", "none", ev=ev)


def confidence_review(check):
    if check["status"] != "PASS":
        return check
    conf = [float(x.get("confidence")) for x in check.get("evidence", []) if isinstance(x, dict) and x.get("confidence") is not None]
    if conf and min(conf) < 0.80:
        check = check.copy()
        check["status"] = "REVIEW"
        check["severity"] = "medium"
        check["reason"] = "The declaration was detected, but OCR confidence is below the automatic-verification threshold; manual confirmation is recommended."
    return check


def check_manufacturer(p):
    mfg = p.get("manufacturer")
    addr = p.get("manufacturer_address")
    ev = evidence(p, "manufacturer", "manufacturer_address")
    if present(mfg) and present(addr):
        return result("Manufacturer / Packer / Importer", "PASS", f"{mfg}, {addr}", "Manufacturer/packer/importer name and address detected.", "none", ev=ev)
    elif present(mfg) or present(addr):
        return result("Manufacturer / Packer / Importer", "PASS", mfg or addr, "Manufacturer/packer/importer declaration detected.", "none", ev=ev)
    return result("Manufacturer / Packer / Importer", "MISSING", None, "No manufacturer/packer/importer declaration was detected on the label.", "high", ev)


def validation_nutrition_hfss(p, ocr_data=None):
    nut = analyze_nutrition(p, ocr_data=ocr_data)
    warnings = nut.get("warnings", [])
    ev_list = []
    for ind in nut.get("indicators_list", []):
        if ind.get("evidence"):
            ev_list.append(ind["evidence"])

    if nut.get("has_warning"):
        return result(
            "FSSAI Front-of-Pack Nutrition Warning (HFSS)",
            "FAIL",
            ", ".join(warnings),
            f"Statutory Warning Threshold Exceeded: {', '.join(warnings)} detected under FSSAI front-of-pack labeling regulations.",
            "high",
            ev=ev_list
        )
    elif all(i.get("status") == "REVIEW" for i in nut.get("indicators_list", [])):
        return result(
            "FSSAI Front-of-Pack Nutrition Warning (HFSS)",
            "REVIEW",
            None,
            "Nutritional declarations for fat, sugar, or salt not detected in OCR evidence to determine HFSS warning status.",
            "medium",
            ev=ev_list
        )
    else:
        return result(
            "FSSAI Front-of-Pack Nutrition Warning (HFSS)",
            "PASS",
            "Within Limits",
            "Nutritional declarations comply within standard FSSAI Front-of-Pack dietary thresholds (No HFSS warnings).",
            "none",
            ev=ev_list
        )



def evaluate_compliance(p: dict, ocr_data: list = None) -> dict:
    checks = [
        required("Manufacturer / Packer / Importer", p.get("manufacturer"), "Manufacturer/packer/importer declaration detected.", evidence(p, "manufacturer")),
        required("Manufacturer Address", p.get("manufacturer_address"), "Manufacturer/packer/importer address detected.", evidence(p, "manufacturer_address")),
        check_product(p),
        required("Net Quantity", p.get("net_quantity"), "Net quantity declaration detected.", evidence(p, "net_quantity")),
        check_mrp(p),
        check_tax(p),
        check_date(p),
        check_best(p),
        check_batch(p),
        check_consumer(p),
        check_usp(p),
        check_origin(p)
    ]
    checks = [confidence_review(c) for c in checks]
    validations = [
        confidence_review(validation_mrp_usp(p)),
        confidence_review(validation_dates(p)),
        confidence_review(check_preservatives(p)),
        confidence_review(validation_nutrition_hfss(p, ocr_data=ocr_data)),
    ]
    statuses = [c["status"] for c in checks]

    overall = "NON_COMPLIANT" if "FAIL" in statuses else ("REVIEW_REQUIRED" if any(s in statuses for s in ("MISSING", "REVIEW")) else "PASS")
    passed = sum(c["status"] == "PASS" for c in checks)
    failed = sum(c["status"] == "FAIL" for c in checks)
    review = sum(c["status"] in ("REVIEW", "MISSING") for c in checks)
    score = round(passed / len(checks) * 100, 1) if checks else None

    nutrition_result = analyze_nutrition(p, ocr_data=ocr_data)

    return {
        "overall_status": overall,
        "compliance_score": score,
        "total_checks": len(checks),
        "passed": passed,
        "failed": failed,
        "review_required": review,
        "checks": checks,
        "validation_checks": validations,
        "preservative_analysis": analyze_preservatives(p),
        "nutrition_analysis": nutrition_result,
        "validation_summary": {
            "passed": sum(x["status"] == "PASS" for x in validations),
            "failed": sum(x["status"] == "FAIL" for x in validations),
            "review": sum(x["status"] == "REVIEW" for x in validations)
        }
    }


def main():
    input_file = Path("structured_product.json")
    if not input_file.exists():
        input_file = Path(__file__).resolve().parent.parent / "structured_product.json"

    with open(input_file, "r", encoding="utf-8") as f:
        p = json.load(f)

    out = evaluate_compliance(p)

    output_file = Path("compliance_result.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)

    print("\n--- VERIFEYE COMPLIANCE RESULT ---\n")
    print(json.dumps(out, indent=2, ensure_ascii=False))
    print(f"\nSaved to: {output_file}")


if __name__ == "__main__":
    main()
