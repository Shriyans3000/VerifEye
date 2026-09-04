import json
import sys
from pathlib import Path
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


def safe(value):
    if value is None or value == "":
        return "Not detected"
    if isinstance(value, dict):
        parts = []
        for k, v in value.items():
            if v:
                parts.append(f"{k.capitalize()}: {v}")
        return ", ".join(parts) if parts else "Not detected"
    return str(value)


def escape_html(text):
    if text is None:
        return ""
    text = str(text)
    text = text.replace("&", "&amp;")
    text = text.replace("<", "&lt;")
    text = text.replace(">", "&gt;")
    return text


def get_status_style(status, default_style):
    text_color = colors.HexColor("#000000")
    if status == "PASS":
        text_color = colors.HexColor("#0f5132")
    elif status == "FAIL":
        text_color = colors.HexColor("#842029")
    elif status in ("REVIEW", "MISSING"):
        text_color = colors.HexColor("#664d03")

    return ParagraphStyle(
        name=f"Status_{status}",
        parent=default_style,
        textColor=text_color,
        fontName="Helvetica-Bold",
    )


def format_evidence_display(check):
    evidence = check.get("evidence") or []
    if not isinstance(evidence, list) or not evidence:
        return "No direct evidence mapped"

    lines = []
    for item in evidence:
        if not isinstance(item, dict):
            continue
        text = safe(item.get("text"))
        conf = item.get("confidence")
        conf_str = f"{float(conf):.1%}" if conf is not None else "N/A"
        lines.append(f'"{text}" ({conf_str})')

    return "<br/>".join(lines) if lines else "No direct evidence mapped"


def get_evidence(check):
    ev = check.get("evidence") or []
    if isinstance(ev, list):
        return [x for x in ev if isinstance(x, dict)]
    return []


def format_confidence_summary(check):
    ev = get_evidence(check)
    if not ev:
        return "N/A"
    confs = [float(x.get("confidence")) for x in ev if x.get("confidence") is not None]
    if not confs:
        return "N/A"
    return f"Min {min(confs):.1%} / Avg {sum(confs)/len(confs):.1%}"


def build_report(data, output_file):
    product = data.get("product", {})
    compliance = data.get("compliance", {})
    ocr = data.get("ocr", {})

    output_path = Path(output_file).resolve()

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )

    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#1A365D"),
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=13,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#4A5568"),
    )

    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#1A365D"),
        spaceBefore=10,
        spaceAfter=5,
    )

    normal_style = ParagraphStyle(
        "DocNormal",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#2D3748"),
    )

    bold_normal_style = ParagraphStyle(
        "DocNormalBold",
        parent=normal_style,
        fontName="Helvetica-Bold",
    )

    small_style = ParagraphStyle(
        "DocSmall",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#718096"),
    )

    evidence_style = ParagraphStyle(
        "EvidenceStyle",
        parent=normal_style,
        fontSize=8.5,
        leading=11,
    )

    # HEADER
    story.append(Paragraph("VERIFEYE INSPECTION REPORT", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("AI-Assisted Legal Metrology Compliance Audit", subtitle_style))
    story.append(Spacer(1, 10))

    # EXECUTIVE SUMMARY
    story.append(Paragraph("EXECUTIVE SUMMARY", heading_style))

    overall_status = compliance.get("overall_status", "UNKNOWN")

    status_color_map = {
        "PASS": colors.HexColor("#D1E7DD"),
        "FAIL": colors.HexColor("#F8D7DA"),
        "REVIEW_REQUIRED": colors.HexColor("#FFF3CD"),
    }
    status_bg = status_color_map.get(overall_status, colors.lightgrey)

    status_text = Paragraph(
        f"<b>Overall Status:</b> {overall_status}",
        get_status_style(overall_status, normal_style)
    )

    summary_data = [
        [
            status_text,
            Paragraph(f"<b>Compliance Score:</b> {compliance.get('compliance_score', 'N/A')}%", normal_style),
        ],
        [
            Paragraph(f"<b>Total Checks:</b> {compliance.get('total_checks', 0)}", normal_style),
            Paragraph(f"<b>Passed:</b> {compliance.get('passed', 0)} | <b>Failed:</b> {compliance.get('failed', 0)} | <b>Review:</b> {compliance.get('review_required', 0)}", normal_style),
        ],
        [
            Paragraph(f"<b>Inspection Date:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", normal_style),
            Paragraph(f"<b>Product Name:</b> {escape_html(safe(product.get('product_name')))}", normal_style),
        ],
    ]

    summary_table = Table(summary_data, colWidths=[87 * mm, 87 * mm])
    summary_table.setStyle(
        TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("BACKGROUND", (0, 0), (0, 0), status_bg),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ])
    )
    story.append(summary_table)

    # DECLARATIONS TABLE
    story.append(Spacer(1, 12))
    story.append(Paragraph("DECLARATION AUDIT DETAILS", heading_style))

    checks = compliance.get("checks", [])
    validations = compliance.get("validation_checks", [])
    all_checks = checks + validations

    table_data = [
        [
            Paragraph("<b>Rule / Check</b>", bold_normal_style),
            Paragraph("<b>Status</b>", bold_normal_style),
            Paragraph("<b>Extracted Value / Details</b>", bold_normal_style),
            Paragraph("<b>Evidence / Reason</b>", bold_normal_style),
        ]
    ]

    for check in all_checks:
        rule_name = check.get("rule_name") or check.get("field") or "Check"
        status = check.get("status", "N/A")
        val = safe(check.get("extracted_value"))
        reason = check.get("reason", "")
        ev_str = format_evidence_display(check)

        details_cell = Paragraph(f"Value: {escape_html(val)}", normal_style)
        reason_cell = Paragraph(f"{escape_html(reason)}<br/><br/><b>Evidence:</b> {ev_str}", evidence_style)

        table_data.append([
            Paragraph(escape_html(rule_name), bold_normal_style),
            Paragraph(status, get_status_style(status, normal_style)),
            details_cell,
            reason_cell,
        ])

    check_table = Table(table_data, colWidths=[40 * mm, 25 * mm, 54 * mm, 55 * mm], repeatRows=1)
    check_table.setStyle(
        TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.4, colors.grey),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EDF2F7")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ])
    )
    story.append(check_table)

    # TECHNICAL INFORMATION
    story.append(Spacer(1, 12))
    story.append(Paragraph("TECHNICAL ANALYSIS DETAILS", heading_style))

    technical_rows = [
        ["Input Image", safe(data.get("verifeye", {}).get("image"))],
        ["OCR Regions Detected", str(ocr.get("regions_detected", 0))],
        ["Pipeline Version", safe(data.get("verifeye", {}).get("version", "prototype-1.0"))],
    ]

    technical_table = Table(technical_rows, colWidths=[65 * mm, 109 * mm])
    technical_table.setStyle(
        TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.4, colors.grey),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ])
    )
    story.append(technical_table)

    # DISCLAIMER
    story.append(Spacer(1, 14))
    story.append(Paragraph(
        "<b>Notice:</b> This inspection report is automatically generated by VerifEye. "
        "Review results indicate that label evidence was ambiguous or incomplete and must be verified by a Legal Metrology officer.",
        small_style
    ))

    doc.build(story)
    return str(output_path)


def generate_pdf_report(
    product_data: dict,
    compliance_data: dict,
    ocr_data: list[dict] | dict,
    image_path: str | Path,
    output_pdf_path: str | Path
) -> str:
    if isinstance(ocr_data, list):
        regions_detected = len(ocr_data)
    elif isinstance(ocr_data, dict):
        regions = ocr_data.get("regions")
        if isinstance(regions, list):
            regions_detected = len(regions)
        else:
            regions_detected = int(ocr_data.get("regions_detected", 0) or 0)
    else:
        regions_detected = 0

    data = {
        "product": product_data,
        "compliance": compliance_data,
        "ocr": {
            "regions_detected": regions_detected,
        },
        "verifeye": {
            "image": str(image_path) if image_path else "Not specified",
            "version": "prototype-1.1",
        },
    }

    return build_report(data, output_pdf_path)


def main():
    def load_json(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    product_file = Path("structured_product.json")
    compliance_file = Path("compliance_result.json")
    ocr_file = Path("ocr_result.json")

    product = load_json(product_file)
    compliance = load_json(compliance_file)
    ocr_raw = load_json(ocr_file)

    image_path = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path("test_label.jpeg")
    output_pdf = Path("verifeye_inspection_report.pdf")

    res_path = generate_pdf_report(product, compliance, ocr_raw, image_path, output_pdf)

    print("\n" + "=" * 60)
    print("VERIFEYE REPORT GENERATED")
    print("=" * 60)
    print(f"\nReport saved to: {res_path}")


if __name__ == "__main__":
    main()
