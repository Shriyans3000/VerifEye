import sys
import time
from pathlib import Path

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))

img_path = Path(r"C:\Users\shour\Downloads\ChatGPT Image Sep 11, 2026, 01_03_26 PM.png")

from backend.services.pipeline import analyze_image
print("Running analyze_image on ChatGPT image...")
t0 = time.time()
res = analyze_image(img_path)
t1 = time.time()
print(f"Finished in {t1 - t0:.2f}s!")
print(f"Status: {res.get('status')}")
print(f"Score: {res.get('compliance_score')}%")
print(f"Passed: {res.get('summary', {}).get('passed')}/12")
print(f"Product: {res.get('product', {}).get('product_name')}")
print(f"MRP: {res.get('product', {}).get('mrp')}")
print(f"Net Qty: {res.get('product', {}).get('net_quantity')}")
