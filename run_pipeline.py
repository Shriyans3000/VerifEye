import sys
import json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

from pipeline.ocr_engine import run_ocr

from pipeline.normalize_ocr import normalize_ocr_data
from pipeline.groq_extract import extract_structured_product
from pipeline.compliance_engine import evaluate_compliance
from pipeline.report_generator import generate_pdf_report


def main():
    base_dir = Path(__file__).resolve().parent

    if len(sys.argv) > 1:
        image_path = Path(sys.argv[1])
    else:
        image_path = base_dir / "test_images" / "test_label.jpeg"

    if not image_path.is_absolute():
        image_path = (base_dir / image_path).resolve()

    if not image_path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    print("=" * 70)
    print("VERIFEYE END-TO-END PIPELINE")
    print("=" * 70)
    print(f"Image: {image_path}\n")

    # STEP 1/5 — PaddleOCR
    print("=" * 70)
    print("STEP 1/5 — PaddleOCR")
    print("=" * 70)
    ocr_result = run_ocr(image_path, output_file="ocr_result.json")
    print(f"Detected {len(ocr_result)} text regions.")

    # STEP 2/5 — OCR normalization
    print("\n" + "=" * 70)
    print("STEP 2/5 — OCR normalization")
    print("=" * 70)
    normalized_ocr = normalize_ocr_data(ocr_result)
    with open("normalized_ocr.json", "w", encoding="utf-8") as f:
        json.dump(normalized_ocr, f, indent=2, ensure_ascii=False)
    print("OCR normalization complete.")

    # STEP 3/5 — Groq structured extraction
    print("\n" + "=" * 70)
    print("STEP 3/5 — Groq structured extraction")
    print("=" * 70)
    structured_product = extract_structured_product(ocr_result, normalized_ocr)
    with open("structured_product.json", "w", encoding="utf-8") as f:
        json.dump(structured_product, f, indent=2, ensure_ascii=False)
    print("Groq extraction complete.")

    # STEP 4/5 — Compliance engine
    print("\n" + "=" * 70)
    print("STEP 4/5 — Compliance engine")
    print("=" * 70)
    compliance_result = evaluate_compliance(structured_product)
    with open("compliance_result.json", "w", encoding="utf-8") as f:
        json.dump(compliance_result, f, indent=2, ensure_ascii=False)
    print(f"Overall Status: {compliance_result['overall_status']}")
    print(f"Compliance Score: {compliance_result['compliance_score']}")

    # STEP 5/5 — PDF inspection report
    print("\n" + "=" * 70)
    print("STEP 5/5 — PDF inspection report")
    print("=" * 70)
    pdf_path = generate_pdf_report(
        structured_product,
        compliance_result,
        ocr_result,
        image_path,
        "verifeye_inspection_report.pdf"
    )
    print(f"PDF Report generated: {pdf_path}")

    print("\n" + "=" * 70)
    print("PIPELINE COMPLETE")
    print("=" * 70)
    print("Generated:")
    print("  ocr_result.json")
    print("  normalized_ocr.json")
    print("  structured_product.json")
    print("  compliance_result.json")
    print("  verifeye_inspection_report.pdf")


if __name__ == "__main__":
    main()
