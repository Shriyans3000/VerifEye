from datetime import datetime
from pathlib import Path

from pipeline.ocr_engine import run_ocr
from pipeline.normalize_ocr import normalize_ocr_data
from pipeline.readability_engine import analyze_readability
from pipeline.groq_extract import extract_structured_product
from pipeline.compliance_engine import evaluate_compliance
from backend.config import GROQ_API_KEY


def analyze_images(image_paths: list[str | Path]) -> dict:
    if not image_paths:
        raise ValueError("At least one image path must be provided.")

    resolved_paths = []
    for p in image_paths:
        path_obj = Path(p).resolve()
        if not path_obj.exists():
            raise FileNotFoundError(f"Image file not found: {path_obj}")
        resolved_paths.append(path_obj)

    combined_ocr_result = []
    region_counter = 0

    # 1. Run OCR on each image and unify evidence tagged with image_index
    for idx, path_obj in enumerate(resolved_paths):
        raw_ocr = run_ocr(path_obj, image_index=idx)
        for item in raw_ocr:
            combined_ocr_result.append({
                "id": region_counter,
                "image_index": idx,
                "text": item.get("text", ""),
                "confidence": item.get("confidence"),
                "bbox": item.get("bbox")
            })
            region_counter += 1

    # 2. OCR Normalization
    normalized_data = normalize_ocr_data(combined_ocr_result)

    # 3. Groq Extraction & Canonical Normalization
    structured_product = extract_structured_product(
        ocr_data=combined_ocr_result,
        normalized_data=normalized_data,
        api_key=GROQ_API_KEY
    )

    # 4. Deterministic Compliance Evaluation
    compliance_result = evaluate_compliance(structured_product)

    # 5. Readability & Font Metric Analysis
    readability_result = analyze_readability(
        ocr_results=combined_ocr_result,
        image_paths=resolved_paths
    )

    # 6. Format Response
    overall_status = compliance_result.get("overall_status", "REVIEW_REQUIRED")
    return {
        "success": True,
        "status": overall_status,
        "overall_status": overall_status,
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
        "preservative_analysis": compliance_result.get("preservative_analysis", {}),
        "readability": readability_result,
        "meta": {
            "images_processed": len(resolved_paths),
            "regions_detected": len(combined_ocr_result),
            "timestamp": datetime.utcnow().isoformat()
        }
    }


def analyze_image(image_path: str | Path) -> dict:
    return analyze_images([image_path])
