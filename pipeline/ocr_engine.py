import json
import os
from pathlib import Path
from paddleocr import PaddleOCR

_OCR_INSTANCE = None


def get_ocr_engine():
    global _OCR_INSTANCE
    if _OCR_INSTANCE is None:
        print("Loading PaddleOCR mobile instance (lazy singleton)...")
        _OCR_INSTANCE = PaddleOCR(
            lang="en",
            ocr_version="PP-OCRv4",
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=False,
            enable_mkldnn=False
        )
    return _OCR_INSTANCE


def run_ocr(image_path: str | Path, output_file: str | Path | None = None) -> list[dict]:
    image_path = Path(image_path).resolve()
    if not image_path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    ocr = get_ocr_engine()
    print(f"Running OCR on: {image_path}")
    results = ocr.predict(str(image_path))

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
