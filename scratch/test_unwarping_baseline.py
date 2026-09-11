import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))

from paddleocr import PaddleOCR
from pipeline.compliance_engine import evaluate_compliance
from pipeline.normalize_ocr import normalize_ocr_data
from pipeline.groq_extract import extract_structured_product

# Initialize with use_doc_unwarping=False
ocr = PaddleOCR(lang="en", use_doc_unwarping=False, use_doc_orientation_classify=False)
results = ocr.predict(str(root / "test_images" / "test_image2.png"))

output = []
for result in results:
    data = result.json
    if isinstance(data, str):
        import json; data = json.loads(data)
    if "res" in data:
        data = data["res"]
    for text, score, box in zip(data.get("rec_texts", []), data.get("rec_scores", []), data.get("rec_boxes", [])):
        output.append({
            "image_index": 0,
            "text": str(text),
            "confidence": float(score),
            "bbox": box.tolist() if hasattr(box, "tolist") else box
        })

print(f"Detected {len(output)} text regions without UVDoc.")
norm = normalize_ocr_data(output)
prod = extract_structured_product(output, norm)
comp = evaluate_compliance(prod, ocr_data=output)
print(f"Compliance status: {comp.get('overall_status')}, Score: {comp.get('compliance_score')}%, Passed: {comp.get('passed')}, Failed: {comp.get('failed')}, Review: {comp.get('review_required')}")
