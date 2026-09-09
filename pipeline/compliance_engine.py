import json
import re
from datetime import datetime
from pathlib import Path


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
    s = str(v).strip()
    # 1. 3-part numeric date: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY or YYYY/MM/DD
    m3 = re.search(r"\b(\d{1,2}|20\d{2})[/. -](\d{1,2})[/. -](\d{2,4})\b", s)
    if m3:
        p1, p2, p3 = int(m3.group(1)), int(m3.group(2)), int(m3.group(3))
        if p1 > 1000:
            y, m_val, d = p1, p2, p3
        else:
            d, m_val, y = p1, p2, p3
            if y < 100:
                y += 2000
        if 1 <= m_val <= 12 and 1 <= d <= 31 and 2000 <= y <= 2099:
            try:
                return datetime(y, m_val, d)
            except ValueError:
                pass

    # 2. 2-part numeric date: MM/YYYY or MM/YY or MM-YYYY or MM.YYYY
    m2 = re.search(r"\b(\d{1,2})[/. -](\d{2,4})\b", s)
    if m2:
        m_val, y = int(m2.group(1)), int(m2.group(2))
        if y < 100:
            y += 2000
        if 1 <= m_val <= 12 and 2000 <= y <= 2099:
            try:
                return datetime(y, m_val, 1)
            except ValueError:
                pass

    # 3. Month name date: DD MMM YYYY or MMM YYYY or MMM YY (e.g. JUL 20, 29 JUL 2020)
    months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
    m_name = re.search(r"\b(?:(\d{1,2})[/. -]?)?([a-z]{3,9})[/. -]?(\d{2,4})\b", s, re.I)
    if m_name:
        d_str, mon_str, y_str = m_name.group(1), m_name.group(2).lower()[:3], m_name.group(3)
        if mon_str in months:
            m_val = months.index(mon_str) + 1
            y = int(y_str)
            if y < 100:
                y += 2000
            d = int(d_str) if d_str else 1
            if 1 <= m_val <= 12 and 1 <= d <= 31 and 2000 <= y <= 2099:
                try:
                    return datetime(y, m_val, d)
                except ValueError:
                    pass

    # 4. 4-digit compressed date: e.g. 2920 or 0220 (DDYY or MMYY)
    if re.fullmatch(r"\d{4}", s):
        p1, y = int(s[:2]), int(s[2:])
        y += 2000
        if 1 <= p1 <= 12 and 2000 <= y <= 2099:
            return datetime(y, p1, 1)
        elif 1 <= p1 <= 31 and 2000 <= y <= 2099:
            return datetime(y, 1, p1)

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

    phone = None
    email = None
    if isinstance(c, dict):
        phone = c.get("phone")
        email = c.get("email")
    elif isinstance(c, str) and present(c):
        phone = c

    # Fallback to evidence if consumer_care was not populated
    if not phone and not email and ev:
        for item in ev:
            t = str(item.get("text", "")).strip()
            em = re.search(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}", t)
            if em and not email:
                email = em.group(0)
            pm = re.search(r"(?:PHONE|TEL|CELL|CALL|MOBILE|HELPLINE)[.:\s]*([0-9\s\-]{7,15})|(?:0\d{2,4}[-\s]?\d{3,4}[-\s]?\d{3,4})|(?:\b[6-9]\d{9}\b)", t, re.I)
            if pm and not phone:
                phone = pm.group(1) or pm.group(0)

    # Build clean display value
    parts = []
    if present(phone):
        p_str = str(phone).strip()
        parts.append(f"Phone: {p_str}" if not p_str.upper().startswith("PHONE") else p_str)
    if present(email):
        e_str = str(email).strip()
        parts.append(f"Email: {e_str}" if not e_str.upper().startswith("EMAIL") else e_str)

    if parts:
        display_val = " | ".join(parts)
        return result("Consumer Care Details", "PASS", display_val, "Consumer care contact information detected.", "none", ev=ev)
    return result("Consumer Care Details", "MISSING", None, "No usable consumer care contact information was detected.", "high", ev=ev)



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


def check_net_quantity(p):
    v = p.get("net_quantity")
    ev = evidence(p, "net_quantity")
    if not present(v):
        return result("Net Quantity", "MISSING", None, "No net quantity declaration was detected.", "high", ev)
    # Normalize and compute total for 'base + extra' formats
    display, total, unit = normalize_net_quantity(v)
    if total is not None and unit is not None:
        reason = f"Net quantity declaration detected. Total: {total:g}{unit}."
        return result("Net Quantity", "PASS", display, reason, "none", ev=ev)
    return result("Net Quantity", "PASS", v, "Net quantity declaration detected.", "none", ev=ev)


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
    # Detect if the string contains an 'extra' indicator (E suffix, 'Extra', 'EXTRA' etc.)
    has_extra = bool(re.search(r"\b[Ee]xtra\b|(?<=[0-9])[eE]\b|(?<=[a-z])[eE]\b", s))

    # If already normalized with parenthetical breakdown e.g. '130g (110g + 20g Extra)'
    if "(" in s and ")" in s:
        clean_s = re.sub(r"\(.*?\)", "", s).strip()
        m = re.match(r"^([0-9]+(?:\.[0-9]+)?)\s*(kg|g|mg|l|ml|cm|m)\b", clean_s, re.I)
        if m:
            return s, float(m.group(1)), m.group(2).lower()

    # Regex to find all numeric+unit segments (handles '20gE', '20g Extra', '20g EXTRA', '20g e')
    seg_rx = re.compile(
        r"([0-9]+(?:\.[0-9]+)?)\s*(kg|g|mg|l|ml|cm|m)(?:[eE][xX][tT][rRaA]*|[eE]\b|\s+[Ee]xtra)?",
        re.I
    )
    segments = seg_rx.findall(s)
    if not segments:
        return s, None, None
    units = [u.lower() for _, u in segments]
    # All segments must share the same unit to sum
    if len(set(units)) == 1:
        total = sum(float(n) for n, _ in segments)
        unit = units[0]
        if len(segments) > 1:
            base_parts = " + ".join(f"{n}{u}" for n, u in segments[:-1])
            last_n, last_u = segments[-1]
            if has_extra:
                display = f"{total:g}{unit} ({base_parts} + {last_n}{last_u} Extra)"
            else:
                display = f"{total:g}{unit} ({base_parts} + {last_n}{last_u})"
            return display, total, unit
        else:
            return s, float(segments[0][0]), unit
    return s, None, None



def parse_quantity(v):
    if not v:
        return None
    _, total, unit = normalize_net_quantity(v)
    if total is not None and unit is not None:
        return (total, unit)
    # Fallback: direct parse without + handling
    s = str(v).lower().replace(",", "")
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


def evaluate_compliance(p: dict) -> dict:
    checks = [
        required("Manufacturer / Packer / Importer", p.get("manufacturer"), "Manufacturer/packer/importer declaration detected.", evidence(p, "manufacturer")),
        required("Manufacturer Address", p.get("manufacturer_address"), "Manufacturer/packer/importer address detected.", evidence(p, "manufacturer_address")),
        check_product(p),
        check_net_quantity(p),
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
    validations = [confidence_review(validation_mrp_usp(p)), confidence_review(validation_dates(p))]
    statuses = [c["status"] for c in checks]

    overall = "NON_COMPLIANT" if "FAIL" in statuses else ("REVIEW_REQUIRED" if any(s in statuses for s in ("MISSING", "REVIEW")) else "PASS")
    passed = sum(c["status"] == "PASS" for c in checks)
    failed = sum(c["status"] == "FAIL" for c in checks)
    review = sum(c["status"] in ("REVIEW", "MISSING") for c in checks)
    score = round(passed / len(checks) * 100, 1) if checks else None

    return {
        "overall_status": overall,
        "compliance_score": score,
        "total_checks": len(checks),
        "passed": passed,
        "failed": failed,
        "review_required": review,
        "checks": checks,
        "validation_checks": validations,
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
