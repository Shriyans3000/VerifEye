import gc
import json
import logging
import os
import threading
from pathlib import Path

# Configure single-threaded CPU execution and low-memory allocator BEFORE Paddle initialization
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["FLAGS_allocator_strategy"] = "naive_best_fit"

from paddleocr import PaddleOCR

logger = logging.getLogger("verifeye.ocr")

_OCR_LOCK = threading.Lock()
_OCR_INSTANCE = None


def get_ocr_engine():
    global _OCR_INSTANCE
    if _OCR_INSTANCE is None:
        with _OCR_LOCK:
            if _OCR_INSTANCE is None:
                logger.info("[OCR INIT START] Loading lightweight PaddleOCR mobile instance (single-threaded CPU)...")
                _OCR_INSTANCE = PaddleOCR(
                    lang="en",
                    ocr_version="PP-OCRv4",
                    use_doc_orientation_classify=False,
                    use_doc_unwarping=False,
                    use_textline_orientation=False,
                    enable_mkldnn=False,
                    cpu_threads=1
                )
                logger.info("[OCR INIT END] PaddleOCR mobile instance initialized successfully.")
    return _OCR_INSTANCE


def run_ocr(image_path: str | Path, output_file: str | Path | None = None) -> list[dict]:
    image_path = Path(image_path).resolve()
    if not image_path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    logger.info(f"[OCR PREDICT START] Initiating PaddleOCR prediction on: {image_path}")
    ocr = get_ocr_engine()
    results = ocr.predict(str(image_path))
    logger.info(f"[OCR PREDICT END] Raw OCR prediction finished for: {image_path}")

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
            output.append({
                "text": text,
                "confidence": float(score),
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
