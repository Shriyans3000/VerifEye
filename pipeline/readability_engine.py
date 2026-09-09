import logging
from pathlib import Path
from typing import Any
import numpy as np
from PIL import Image
import cv2

logger = logging.getLogger("verifeye.readability")


def _get_bbox_extents(bbox: Any, img_w: int, img_h: int) -> tuple[int, int, int, int]:
    """
    Safely extract [xmin, ymin, xmax, ymax] clamped to image boundaries.
    Supports both 4-point polygon [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
    and 4-element box [x1, y1, x2, y2].
    """
    if not bbox:
        return 0, 0, 0, 0

    try:
        # Case 1: [x1, y1, x2, y2]
        if isinstance(bbox, (list, tuple)) and len(bbox) == 4 and all(isinstance(x, (int, float)) for x in bbox):
            x1, y1, x2, y2 = bbox
            xmin = int(min(x1, x2))
            xmax = int(max(x1, x2))
            ymin = int(min(y1, y2))
            ymax = int(max(y1, y2))
        # Case 2: 4-point polygon [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
        elif isinstance(bbox, (list, tuple)) and len(bbox) >= 2 and all(isinstance(pt, (list, tuple)) and len(pt) >= 2 for pt in bbox):
            xs = [pt[0] for pt in bbox]
            ys = [pt[1] for pt in bbox]
            xmin = int(min(xs))
            xmax = int(max(xs))
            ymin = int(min(ys))
            ymax = int(max(ys))
        else:
            return 0, 0, 0, 0

        # Clamp to image boundaries
        xmin = max(0, min(img_w - 1, xmin))
        xmax = max(0, min(img_w, xmax))
        ymin = max(0, min(img_h - 1, ymin))
        ymax = max(0, min(img_h, ymax))

        return xmin, ymin, xmax, ymax
    except Exception as e:
        logger.warning(f"Error parsing bounding box {bbox}: {e}")
        return 0, 0, 0, 0


def analyze_readability(
    ocr_results: list[dict],
    image_paths: list[str | Path]
) -> dict:
    """
    Calculate readability, font height metrics, contrast, and sharpness for every
    detected PaddleOCR text region.

    IMPORTANT STATUTORY ACCURACY CONSTRAINT:
    Never invent or extrapolate physical millimetre font size without physical scale
    calibration. Photographic pixel coordinates alone do not establish statutory
    millimetres. Physical compliance is explicitly declared as NOT CALIBRATED.
    """
    # Preload images and store dimensions and grayscale arrays
    images_info = []
    for idx, img_path in enumerate(image_paths):
        try:
            resolved = Path(img_path).resolve()
            with Image.open(resolved) as pil_img:
                w, h = pil_img.size
                # Convert to RGB numpy array for OpenCV operations
                rgb_arr = np.array(pil_img.convert("RGB"))
                gray_arr = cv2.cvtColor(rgb_arr, cv2.COLOR_RGB2GRAY)
                images_info.append({
                    "width": w,
                    "height": h,
                    "gray": gray_arr
                })
        except Exception as e:
            logger.error(f"Failed to load image index {idx} ({img_path}) for readability analysis: {e}")
            images_info.append(None)

    regions_analysis = []

    for item in ocr_results:
        ocr_id = item.get("id", 0)
        img_idx = item.get("image_index", 0)
        text = item.get("text", "").strip()
        confidence = float(item.get("confidence") or 0.0)
        bbox = item.get("bbox")

        img_data = images_info[img_idx] if img_idx < len(images_info) else None
        if not img_data:
            # Fallback when image cannot be loaded
            regions_analysis.append({
                "ocr_id": ocr_id,
                "image_index": img_idx,
                "text": text,
                "confidence": round(confidence, 3),
                "bbox": bbox,
                "height_px": 0,
                "width_px": 0,
                "normalized_height_pct": 0.0,
                "area_px": 0,
                "contrast": 0.0,
                "contrast_rating": "Unknown",
                "sharpness": 0.0,
                "sharpness_rating": "Unknown",
                "readability_status": "REVIEW",
                "reason": "Image not accessible for analysis."
            })
            continue

        img_w = img_data["width"]
        img_h = img_data["height"]
        gray_img = img_data["gray"]

        xmin, ymin, xmax, ymax = _get_bbox_extents(bbox, img_w, img_h)
        width_px = max(0, xmax - xmin)
        height_px = max(0, ymax - ymin)
        area_px = width_px * height_px
        normalized_height_pct = round((height_px / img_h * 100.0), 2) if img_h > 0 else 0.0

        # Calculate contrast and sharpness on cropped patch
        contrast = 0.0
        contrast_rating = "Moderate"
        sharpness = 0.0
        sharpness_rating = "Moderate"

        if width_px >= 3 and height_px >= 3:
            # Extract cropped patch with 2px padding if available
            p_ymin = max(0, ymin - 2)
            p_ymax = min(img_h, ymax + 2)
            p_xmin = max(0, xmin - 2)
            p_xmax = min(img_w, xmax + 2)
            patch = gray_img[p_ymin:p_ymax, p_xmin:p_xmax]

            if patch.size > 0:
                # RMS Contrast / Intensity Standard Deviation
                std_dev = float(np.std(patch))
                contrast = round(std_dev, 1)
                if contrast >= 32.0:
                    contrast_rating = "Good"
                elif contrast >= 18.0:
                    contrast_rating = "Moderate"
                else:
                    contrast_rating = "Low"

                # Laplacian variance for blur / sharpness
                try:
                    lap_var = float(cv2.Laplacian(patch, cv2.CV_64F).var())
                    sharpness = round(lap_var, 1)
                    if sharpness >= 50.0:
                        sharpness_rating = "Good"
                    elif sharpness >= 20.0:
                        sharpness_rating = "Moderate"
                    else:
                        sharpness_rating = "Blurry"
                except Exception:
                    sharpness = 30.0
                    sharpness_rating = "Moderate"

        # Determine Readability Classification
        # Criteria hierarchy:
        if confidence < 0.65:
            status = "LOW OCR CONFIDENCE"
            reason = f"OCR confidence is low ({round(confidence * 100, 1)}%), text recognition may be uncertain."
        elif sharpness_rating == "Blurry":
            status = "BLURRY"
            reason = f"Region exhibits blur (Laplacian variance {sharpness}), reducing character edge clarity."
        elif contrast_rating == "Low":
            status = "LOW CONTRAST"
            reason = f"Low foreground/background intensity contrast (RMS {contrast}), potential legibility issue."
        elif height_px < 12 or normalized_height_pct < 0.55:
            status = "SMALL TEXT"
            reason = f"Text height is small ({height_px}px, {normalized_height_pct}% of image height), close to legibility limits."
        elif confidence < 0.82 or contrast_rating == "Moderate":
            status = "REVIEW"
            reason = f"Moderate contrast or confidence ({round(confidence * 100, 1)}%), visual officer review advised."
        else:
            status = "READABLE"
            reason = "Clear text region with good contrast, sharpness, and high OCR confidence."

        regions_analysis.append({
            "ocr_id": ocr_id,
            "image_index": img_idx,
            "text": text,
            "confidence": round(confidence, 3),
            "bbox": bbox,
            "height_px": height_px,
            "width_px": width_px,
            "normalized_height_pct": normalized_height_pct,
            "area_px": area_px,
            "contrast": contrast,
            "contrast_rating": contrast_rating,
            "sharpness": sharpness,
            "sharpness_rating": sharpness_rating,
            "readability_status": status,
            "reason": reason
        })

    # Summary calculations
    total_regions = len(regions_analysis)
    if total_regions > 0:
        valid_heights = [r["height_px"] for r in regions_analysis if r["height_px"] > 0]
        avg_height = round(sum(valid_heights) / len(valid_heights), 1) if valid_heights else 0
        min_height = min(valid_heights) if valid_heights else 0
        avg_conf = round(sum(r["confidence"] for r in regions_analysis) / total_regions, 3)

        readable_count = sum(1 for r in regions_analysis if r["readability_status"] == "READABLE")
        small_count = sum(1 for r in regions_analysis if r["readability_status"] == "SMALL TEXT")
        contrast_count = sum(1 for r in regions_analysis if r["readability_status"] == "LOW CONTRAST")
        blurry_count = sum(1 for r in regions_analysis if r["readability_status"] == "BLURRY")
        low_conf_count = sum(1 for r in regions_analysis if r["readability_status"] == "LOW OCR CONFIDENCE")
        review_count = sum(1 for r in regions_analysis if r["readability_status"] in ("REVIEW", "SMALL TEXT", "LOW CONTRAST", "BLURRY", "LOW OCR CONFIDENCE"))

        # Overall rating
        review_ratio = review_count / total_regions
        if review_ratio <= 0.20:
            overall_status = "PASS"
        elif review_ratio <= 0.50:
            overall_status = "REVIEW"
        else:
            overall_status = "POOR"
    else:
        avg_height = 0
        min_height = 0
        avg_conf = 0.0
        readable_count = 0
        small_count = 0
        contrast_count = 0
        blurry_count = 0
        low_conf_count = 0
        review_count = 0
        overall_status = "REVIEW"

    return {
        "summary": {
            "overall_status": overall_status,
            "total_regions": total_regions,
            "readable_count": readable_count,
            "review_count": review_count,
            "small_text_count": small_count,
            "low_contrast_count": contrast_count,
            "blurry_count": blurry_count,
            "low_confidence_count": low_conf_count,
            "average_text_height_px": avg_height,
            "smallest_detected_text_px": min_height,
            "average_confidence": avg_conf,
            "physical_font_size": {
                "status": "NOT CALIBRATED",
                "reason": "Image does not contain a physical scale reference. Statutory physical font size in millimetres cannot be determined without physical calibration."
            }
        },
        "regions": regions_analysis
    }
