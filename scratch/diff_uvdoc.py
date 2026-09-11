import sys
from pathlib import Path
root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))

from pipeline.ocr_engine import get_ocr_engine
ocr = get_ocr_engine()
res_default = ocr.predict(str(root / "test_images" / "test_image2.png"))

texts_default = []
for r in res_default:
    data = r.json
    if isinstance(data, str):
        import json; data = json.loads(data)
    if "res" in data:
        data = data["res"]
    texts_default.extend(data.get("rec_texts", []))

print(f"Default (with UVDoc): {len(texts_default)} text regions")

from paddleocr import PaddleOCR
ocr_no_uv = PaddleOCR(lang="en", use_doc_unwarping=False, use_doc_orientation_classify=False)
res_no_uv = ocr_no_uv.predict(str(root / "test_images" / "test_image2.png"))

texts_no_uv = []
for r in res_no_uv:
    data = r.json
    if isinstance(data, str):
        import json; data = json.loads(data)
    if "res" in data:
        data = data["res"]
    texts_no_uv.extend(data.get("rec_texts", []))

print(f"Without UVDoc: {len(texts_no_uv)} text regions")

diff1 = set(texts_default) - set(texts_no_uv)
diff2 = set(texts_no_uv) - set(texts_default)
print("In default but not in no_uv:", diff1)
print("In no_uv but not in default:", diff2)
