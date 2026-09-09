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
os.environ["FLAGS_use_mkldnn"] = "0"
os.environ["FLAGS_allocator_strategy"] = "naive_best_fit"
os.environ["FLAGS_eager_delete_tensor_gb"] = "0.0"
os.environ["FLAGS_fraction_of_gpu_memory_to_use"] = "0.15"


# Compatibility patch for NumPy 2.x where np.sctypes was removed but accessed by imgaug/paddleocr
import numpy as np
if not hasattr(np, "sctypes"):
    np.sctypes = {
        "int": [np.int8, np.int16, np.int32, np.int64],
        "uint": [np.uint8, np.uint16, np.uint32, np.uint64],
        "float": [np.float16, np.float32, np.float64],
        "complex": [np.complex64, np.complex128],
        "others": [bool, object, bytes, str, np.void],
    }

from paddleocr import PaddleOCR

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
                    _OCR_INSTANCE = PaddleOCR(lang="en", ocr_version=ocr_version, enable_mkldnn=False)
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

    output = []
    if hasattr(ocr, "predict"):
        results = ocr.predict(str(image_path))
        logger.info(f"[OCR PREDICT END] Raw OCR prediction finished for image_index={image_index}: {image_path}")
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
                    "image_index": image_index,
                    "text": text,
                    "confidence": float(score),
                    "bbox": box.tolist() if hasattr(box, "tolist") else box
                })
    else:
        try:
            results = ocr.ocr(str(image_path), cls=False)
        except Exception as e:
            if "primitive" in str(e).lower():
                logger.warning(f"OneDNN primitive error in PaddleOCR: {e}. Reinitializing fresh instance...")
                with _OCR_LOCK:
                    _OCR_INSTANCE = None
                    gc.collect()
                    ocr = PaddleOCR(lang="en", enable_mkldnn=False)
                    _OCR_INSTANCE = ocr
                results = ocr.ocr(str(image_path), cls=False)
            else:
                raise
        logger.info(f"[OCR PREDICT END] Raw OCR prediction finished for image_index={image_index}: {image_path}")
        if results and results[0]:
            for line in results[0]:
                if not line or len(line) < 2:
                    continue
                box = line[0]
                text_score = line[1]
                text = text_score[0] if len(text_score) > 0 else ""
                score = float(text_score[1]) if len(text_score) > 1 else 0.0

                output.append({
                    "image_index": image_index,
                    "text": text,
                    "confidence": score,
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
