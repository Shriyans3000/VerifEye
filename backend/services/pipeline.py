from __future__ import annotations

import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Sequence

# Ensure the top-level project root directory is at the front of sys.path
_PROJECT_ROOT = str(Path(__file__).resolve().parent.parent.parent)
if _PROJECT_ROOT in sys.path:
    sys.path.remove(_PROJECT_ROOT)
sys.path.insert(0, _PROJECT_ROOT)

# If 'pipeline' was shadowed as a module name for this script rather than the top-level package, reset it
if "pipeline" in sys.modules and not hasattr(sys.modules["pipeline"], "__path__"):
    del sys.modules["pipeline"]

from pipeline.ocr_engine import run_ocr  # pyrefly: ignore [missing-import] # type: ignore
from pipeline.normalize_ocr import normalize_ocr_data  # pyrefly: ignore [missing-import] # type: ignore
from pipeline.readability_engine import analyze_readability  # pyrefly: ignore [missing-import] # type: ignore
from pipeline.groq_extract import extract_structured_product  # pyrefly: ignore [missing-import] # type: ignore
from pipeline.compliance_engine import evaluate_compliance  # pyrefly: ignore [missing-import] # type: ignore
from backend.config import GROQ_API_KEY  # pyrefly: ignore [missing-import] # type: ignore

logger = logging.getLogger("verifeye.pipeline")


def analyze_images(image_paths: list[str | Path]) -> Dict[str, Any]:
    """Execute end-to-end Legal Metrology and FSSAI inspection pipeline on one or two images."""
    if not image_paths:
        raise ValueError("At least one image path must be provided.")

    resolved_paths: list[Path] = []
    for p in image_paths:
        path_obj = Path(p).resolve()
        if not path_obj.exists():
            raise FileNotFoundError(f"Image file not found: {path_obj}")
        resolved_paths.append(path_obj)

    combined_ocr_result: list[dict[str, Any]] = []
    region_counter = 0
    processing_notes: list[str] = []
    successful_image_count = 0

    # 1. Run OCR on each image and unify evidence tagged with image_index
    for idx, path_obj in enumerate(resolved_paths):
        try:
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
            successful_image_count += 1
        except Exception as ocr_err:
            logger.warning(f"OCR failed on image index {idx} ({path_obj.name}): {ocr_err}")
            processing_notes.append(f"Image {idx + 1} ({path_obj.name}) could not be read: {ocr_err}")

    # If ALL images failed to load/read, then and only then report an actual failure
    if successful_image_count == 0:
        err_msg = "; ".join(processing_notes) if processing_notes else "None of the uploaded images could be decoded or processed by OCR."
        raise ValueError(f"Image analysis unprocessable: {err_msg}")

    # 2. OCR Normalization
    normalized_data = normalize_ocr_data(combined_ocr_result)

    # 3. Groq Extraction & Canonical Normalization
    structured_product = extract_structured_product(
        ocr_data=combined_ocr_result,
        normalized_data=normalized_data,
        api_key=GROQ_API_KEY
    )

    # 4. Deterministic Compliance Evaluation
    compliance_result = evaluate_compliance(structured_product, ocr_data=combined_ocr_result)

    # 5. Readability & Font Metric Analysis (with safe fallback)
    try:
        readability_result = analyze_readability(
            ocr_results=combined_ocr_result,
            image_paths=resolved_paths  # pyrefly: ignore # type: ignore
        )
    except Exception as read_err:
        logger.warning(f"Readability analysis skipped or failed: {read_err}")
        readability_result = {
            "summary": {
                "overall_status": "REVIEW",
                "total_regions": len(combined_ocr_result),
                "readable_count": 0,
                "review_count": len(combined_ocr_result),
                "small_text_count": 0,
                "low_contrast_count": 0,
                "blurry_count": 0,
                "low_confidence_count": 0,
                "physical_font_size": {
                    "status": "NOT CALIBRATED",
                    "reason": "Image does not contain a physical scale reference."
                }
            },
            "regions": []
        }

    # 6. Preservative Analysis Fallback
    preservative_analysis = compliance_result.get("preservative_analysis")
    if not preservative_analysis:
        try:
            from pipeline.preservative_analysis import analyze_preservatives  # pyrefly: ignore [missing-import] # type: ignore
            preservative_analysis = analyze_preservatives(structured_product)
        except Exception:
            preservative_analysis = {}

    # 7. FSSAI Front-of-Pack Nutrition Warning Analysis (HFSS)
    nutrition_analysis = compliance_result.get("nutrition_analysis")
    if not nutrition_analysis:
        try:
            from pipeline.nutrition_analysis import analyze_nutrition  # pyrefly: ignore [missing-import] # type: ignore
            nutrition_analysis = analyze_nutrition(structured_product, ocr_data=combined_ocr_result)
        except Exception as nut_err:
            logger.warning(f"Nutrition analysis fallback failed: {nut_err}")
            nutrition_analysis = {}

    # 8. Format Complete Response
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
        "preservative_analysis": preservative_analysis,
        "nutrition_analysis": nutrition_analysis,
        "readability": readability_result,
        "meta": {
            "images_processed": successful_image_count,
            "images_requested": len(resolved_paths),
            "regions_detected": len(combined_ocr_result),
            "timestamp": datetime.utcnow().isoformat(),
            "processing_notes": processing_notes
        }
    }


def analyze_image(image_path: str | Path) -> Dict[str, Any]:
    """Convenience wrapper for single image inspection."""
    return analyze_images([image_path])


if __name__ == "__main__":
    test_img = Path(__file__).resolve().parent.parent.parent / "test_images" / "test_label.jpeg"
    if test_img.exists():
        print(f"Testing pipeline on {test_img}")
        res = analyze_image(test_img)
        print("Inspection Status:", res.get("status"))
        print("Score:", res.get("compliance_score"))
        print("Passed checks:", res.get("summary", {}).get("passed"))
