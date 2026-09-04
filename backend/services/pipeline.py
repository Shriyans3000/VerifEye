from datetime import datetime
from pathlib import Path

from pipeline.ocr_engine import run_ocr
from pipeline.normalize_ocr import normalize_ocr_data
from pipeline.groq_extract import extract_structured_product
from pipeline.compliance_engine import evaluate_compliance
from backend.config import GROQ_API_KEY


def analyze_image(image_path: str | Path) -> dict:
    image_path = Path(image_path).resolve()
    if not image_path.exists():
        raise FileNotFoundError(f"Image file not found: {image_path}")

    # 1. OCR Engine
    ocr_result = run_ocr(image_path)

    # 2. OCR Normalization
    normalized_data = normalize_ocr_data(ocr_result)

    # 3. Groq Extraction
    structured_product = extract_structured_product(
        ocr_data=ocr_result,
        normalized_data=normalized_data,
        api_key=GROQ_API_KEY
    )

    # 4. Compliance Engine
    compliance_result = evaluate_compliance(structured_product)

    # 5. Format JSON Response
    return {
        "success": True,
        "status": compliance_result.get("overall_status", "REVIEW_REQUIRED"),
        "compliance_score": compliance_result.get("compliance_score", 0.0),
        "summary": {
            "total_checks": compliance_result.get("total_checks", 0),
            "passed": compliance_result.get("passed", 0),
            "failed": compliance_result.get("failed", 0),
            "review_required": compliance_result.get("review_required", 0)
        },
        "product": structured_product,
        "checks": compliance_result.get("checks", []),
        "validation_checks": compliance_result.get("validation_checks", []),
        "meta": {
            "regions_detected": len(ocr_result),
            "timestamp": datetime.utcnow().isoformat()
        }
    }
