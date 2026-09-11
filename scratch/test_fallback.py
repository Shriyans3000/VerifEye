import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))

from pipeline.groq_extract import extract_structured_product
from pipeline.normalize_ocr import normalize_ocr_data

# Test with invalid Groq API key to force fallback
ocr_sample = [
    {"id": 0, "image_index": 0, "text": "MRP Rs. 50.00 (INCL. OF ALL TAXES)", "confidence": 0.98, "bbox": [[10, 10], [100, 10], [100, 30], [10, 30]]},
    {"id": 1, "image_index": 0, "text": "NET WEIGHT: 200g", "confidence": 0.95, "bbox": [[10, 40], [100, 40], [100, 60], [10, 60]]},
    {"id": 2, "image_index": 0, "text": "MFG DATE: 15/08/2026", "confidence": 0.96, "bbox": [[10, 70], [100, 70], [100, 90], [10, 90]]},
    {"id": 3, "image_index": 0, "text": "EXPIRY DATE: 15/02/2027", "confidence": 0.96, "bbox": [[10, 100], [100, 100], [100, 120], [10, 120]]},
    {"id": 4, "image_index": 0, "text": "BATCH NO: B1234", "confidence": 0.97, "bbox": [[10, 130], [100, 130], [100, 150], [10, 150]]},
]

norm = normalize_ocr_data(ocr_sample)
print("Normalized data:", norm)

try:
    res = extract_structured_product(ocr_sample, norm, api_key="invalid_key_to_force_fallback")
    print("Fallback extraction SUCCESS:")
    print("MRP:", res.get("mrp"))
    print("Net Qty:", res.get("net_quantity"))
    print("Tax incl:", res.get("tax_inclusive_mrp"))
    print("Packed/Mfg:", res.get("manufacturing_date"))
except Exception as e:
    print("Fallback extraction FAILED:", type(e).__name__, e)
    import traceback
    traceback.print_exc()
