import sys
import time
from pathlib import Path

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))

img_path = Path(r"C:\Users\shour\Downloads\ChatGPT Image Sep 11, 2026, 01_03_26 PM.png")
sys.stdout.write(f"Testing image: {img_path}\n")
sys.stdout.flush()

from pipeline.ocr_engine import get_ocr_engine

t0 = time.time()
sys.stdout.write("Getting OCR engine...\n")
sys.stdout.flush()
ocr = get_ocr_engine()
t1 = time.time()
sys.stdout.write(f"OCR engine ready in {t1 - t0:.2f}s\n")
sys.stdout.flush()

sys.stdout.write("Calling ocr.predict...\n")
sys.stdout.flush()
t2 = time.time()
results = ocr.predict(str(img_path))
t3 = time.time()
sys.stdout.write(f"ocr.predict finished in {t3 - t2:.2f}s!\n")
sys.stdout.flush()

from pipeline.ocr_engine import run_ocr
res = run_ocr(img_path)
sys.stdout.write(f"run_ocr returned {len(res)} text regions!\n")
for r in res[:10]:
    sys.stdout.write(f"  - [{r['confidence']:.2f}] {r['text']}\n")
sys.stdout.flush()
