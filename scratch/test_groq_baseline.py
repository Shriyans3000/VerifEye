import sys
from pathlib import Path
from dotenv import load_dotenv

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))
load_dotenv(root / ".env")

from pipeline.ocr_engine import get_ocr_engine
from pipeline.compliance_engine import evaluate_compliance
from pipeline.normalize_ocr import normalize_ocr_data
from pipeline.groq_extract import extract_structured_product

# 1. Test with default OCR engine
ocr = get_ocr_engine()
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

norm = normalize_ocr_data(output)
prod = extract_structured_product(output, norm)
comp = evaluate_compliance(prod, ocr_data=output)
print(f"With Groq enabled -> Status: {comp.get('overall_status')}, Score: {comp.get('compliance_score')}%, Passed: {comp.get('passed')}, Failed: {comp.get('failed')}, Review: {comp.get('review_required')}")
assert comp.get('passed') == 8, f"Expected 8 passed, got {comp.get('passed')}"
assert comp.get('compliance_score') == 66.7, f"Expected 66.7%, got {comp.get('compliance_score')}"
print("PASSED EXACT 8 / 0 / 4 = 66.7% BASELINE!")
