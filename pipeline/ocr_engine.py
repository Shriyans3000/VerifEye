import gc
import json
import logging
import os
import threading
from pathlib import Path

# Configure CPU thread count and allocator BEFORE Paddle initialization
_DEFAULT_THREADS = str(min(os.cpu_count() or 4, 8))
_OCR_THREADS = os.getenv("VERIFEYE_OCR_THREADS", _DEFAULT_THREADS)
os.environ.setdefault("OMP_NUM_THREADS", _OCR_THREADS)
os.environ.setdefault("MKL_NUM_THREADS", _OCR_THREADS)
os.environ.setdefault("OPENBLAS_NUM_THREADS", _OCR_THREADS)
os.environ.setdefault("FLAGS_allocator_strategy", "naive_best_fit")

from paddleocr import PaddleOCR  # pyrefly: ignore [missing-import] # type: ignore

logger = logging.getLogger("verifeye.ocr")

_OCR_LOCK = threading.Lock()
_OCR_INSTANCE = None


def get_ocr_engine():
    global _OCR_INSTANCE
    if _OCR_INSTANCE is None:
        with _OCR_LOCK:
            if _OCR_INSTANCE is None:
                logger.info("[OCR INIT START] Loading high-accuracy PaddleOCR instance (lang='en')...")
                ocr_version = os.getenv("VERIFEYE_OCR_VERSION")
                if ocr_version:
                    _OCR_INSTANCE = PaddleOCR(
                        lang="en",
                        ocr_version=ocr_version,
                        enable_mkldnn=False,
                    )
                else:
                    _OCR_INSTANCE = PaddleOCR(lang="en", enable_mkldnn=False)
                logger.info("[OCR INIT END] PaddleOCR instance initialized successfully.")
    return _OCR_INSTANCE


def run_ocr(
    image_path: str | Path,
    output_file: str | Path | None = None,
    image_index: int = 0
) -> list[dict]:
    image_path = Path(image_path).resolve()
    if not image_path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    logger.info(f"[OCR PREDICT START] Initiating PaddleOCR prediction on image_index={image_index}: {image_path}")
    ocr = get_ocr_engine()
    results = None
    try:
        results = ocr.predict(str(image_path))
    except Exception as primary_err:
        logger.warning(
            f"Direct OCR prediction on {image_path} failed ({primary_err}). "
            "Attempting robust PIL preprocessed input..."
        )
        try:
            from PIL import Image, ImageOps, ImageFile
            import numpy as np

            ImageFile.LOAD_TRUNCATED_IMAGES = True

            with Image.open(image_path) as pil_img:
                try:
                    pil_img = ImageOps.exif_transpose(pil_img) or pil_img
                except Exception:
                    pass

                if pil_img.mode != "RGB":
                    pil_img = pil_img.convert("RGB")

                max_dim = max(pil_img.size)
                if max_dim > 3840:
                    scale = 3840.0 / max_dim
                    new_size = (int(pil_img.width * scale), int(pil_img.height * scale))
                    pil_img = pil_img.resize(new_size, Image.Resampling.LANCZOS)

                np_rgb = np.array(pil_img)
                np_bgr = np_rgb[:, :, ::-1]  # BGR for PaddleOCR
                results = ocr.predict(np_bgr)
        except Exception as fallback_err:
            logger.error(f"Robust PIL preprocessed OCR also failed on {image_path}: {fallback_err}")
            raise ValueError(f"Image '{image_path.name}' could not be decoded or processed by OCR: {fallback_err}") from fallback_err

    logger.info(f"[OCR PREDICT END] Raw OCR prediction finished for image_index={image_index}: {image_path}")

    output = []
    for result in results:
        data = result.json
        if isinstance(data, str):
            data = json.loads(data)
        if "res" in data:
            data = data["res"]

        texts = data.get("rec_texts", [])
        scores = data.get("rec_scores", [])
        boxes = data.get("rec_boxes", [])

        for text, score, box in zip(texts, scores, boxes):
            try:
                conf = float(score) if score is not None else 0.85
            except (ValueError, TypeError):
                conf = 0.85
            output.append({
                "image_index": image_index,
                "text": str(text),
                "confidence": conf,
                "bbox": box.tolist() if hasattr(box, "tolist") else box
            })

    if output_file:
        output_path = Path(output_file).resolve()
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2, ensure_ascii=False)

    gc.collect()
    return output


if __name__ == "__main__":
    IMAGE_PATH = os.getenv(
        "VERIFEYE_IMAGE_PATH",
        r"C:\Users\SHRIYANS\Downloads\test_image2.png"
    )
    print(f"Executing OCR CLI for image: {IMAGE_PATH}")
    results = run_ocr(IMAGE_PATH, output_file="ocr_result.json")
    print(f"\nDetected {len(results)} text regions.\n")
    for item in results:
        print(f'{item["confidence"]:.3f} | {item["text"]} | {item["bbox"]}')
    print("\nSaved results to: ocr_result.json")
