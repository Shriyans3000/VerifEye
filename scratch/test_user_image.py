import sys
import time
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))

img_path = Path(r"C:\Users\shour\Downloads\ChatGPT Image Sep 11, 2026, 01_03_26 PM.png")
print(f"Testing image: {img_path}")
print(f"Exists: {img_path.exists()}, Size: {img_path.stat().st_size} bytes")

with Image.open(img_path) as im:
    print(f"Format: {im.format}, Mode: {im.mode}, Dimensions: {im.size}")

from pipeline.ocr_engine import run_ocr
t0 = time.time()
print("\nStarting run_ocr...")
ocr_res = run_ocr(img_path)
t1 = time.time()
print(f"OCR finished in {t1 - t0:.2f}s! Found {len(ocr_res)} text regions.")
for r in ocr_res[:10]:
    print(f"  - [{r['confidence']:.2f}] {r['text']}")

from backend.services.pipeline import analyze_image
t2 = time.time()
print("\nStarting full analyze_image...")
res = analyze_image(img_path)
t3 = time.time()
print(f"Full analysis finished in {t3 - t2:.2f}s!")
print(f"Status: {res.get('status')}, Score: {res.get('compliance_score')}%")
print(f"Product: {res.get('product')}")
