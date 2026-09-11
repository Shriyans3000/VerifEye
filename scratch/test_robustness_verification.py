import sys
import unittest
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))

from backend.services.pipeline import analyze_image, analyze_images
from backend.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

print("=" * 60)
print("RUNNING ROBUSTNESS AND FAULT-TOLERANCE VERIFICATION SUITE")
print("=" * 60)

# 1. Test Existing Known-Good Images
print("\n[TEST 1] Known-Good Image: test_image2.png")
res_img2 = analyze_image(root / "test_images" / "test_image2.png")
score2 = res_img2.get("compliance_score")
passed2 = res_img2.get("summary", {}).get("passed")
print(f"-> Score: {score2}%, Passed: {passed2}/12, Status: {res_img2.get('status')}")
assert passed2 == 8, f"Expected 8 passed for test_image2, got {passed2}"
assert score2 == 66.7, f"Expected 66.7% for test_image2, got {score2}"

print("\n[TEST 2] Known-Good Image: parle_g_gold_back.jpeg")
res_parle = analyze_image(root / "test_images" / "parle_g_gold_back.jpeg")
score_p = res_parle.get("compliance_score")
passed_p = res_parle.get("summary", {}).get("passed")
print(f"-> Score: {score_p}%, Passed: {passed_p}/12, Status: {res_parle.get('status')}")
assert passed_p == 11, f"Expected 11 passed for Parle-G, got {passed_p}"
assert score_p == 91.7, f"Expected 91.7% for Parle-G, got {score_p}"

# 2. Test Zero-Text / Blank Image (Degrades gracefully without crashing)
print("\n[TEST 3] Zero-Text Blank Image")
blank_path = root / "scratch" / "blank_test.png"
Image.new("RGB", (300, 300), (255, 255, 255)).save(blank_path)
res_blank = analyze_image(blank_path)
print(f"-> Success: {res_blank.get('success')}, Status: {res_blank.get('status')}, Score: {res_blank.get('compliance_score')}%")
print(f"-> Checks count: {len(res_blank.get('checks', []))}, Passed: {res_blank.get('summary', {}).get('passed')}")
assert res_blank.get("success") is True
assert res_blank.get("compliance_score") == 0.0
assert len(res_blank.get("checks", [])) == 12

# 3. Test Multi-Image Fault Tolerance: 1 Valid + 1 Corrupted
print("\n[TEST 4] Multi-Image Fault Tolerance: 1 Valid (test_image2) + 1 Corrupted File")
corrupt_path = root / "scratch" / "corrupt_fake.png"
with open(corrupt_path, "wb") as f:
    f.write(b"NOT_A_VALID_IMAGE_DATA_CORRUPT")

res_multi = analyze_images([root / "test_images" / "test_image2.png", corrupt_path])
print(f"-> Success: {res_multi.get('success')}, Score: {res_multi.get('compliance_score')}%, Passed: {res_multi.get('summary', {}).get('passed')}")
print(f"-> Images processed: {res_multi.get('meta', {}).get('images_processed')}/{res_multi.get('meta', {}).get('images_requested')}")
print(f"-> Processing notes: {res_multi.get('meta', {}).get('processing_notes')}")
assert res_multi.get("success") is True
assert res_multi.get("meta", {}).get("images_processed") == 1
assert res_multi.get("summary", {}).get("passed") == 8
assert len(res_multi.get("meta", {}).get("processing_notes", [])) > 0

# 4. Test Single Completely Unreadable Image via API -> HTTP 422 with clear message
print("\n[TEST 5] Single Unreadable File via API -> HTTP 422")
with open(corrupt_path, "rb") as f:
    resp = client.post("/api/analyze", files={"file": ("corrupt.png", f, "image/png")})
print(f"-> Status Code: {resp.status_code}")
print(f"-> Detail: {resp.json().get('detail')}")
assert resp.status_code == 422
assert "Image analysis unprocessable" in resp.json().get("detail", "")

# 5. Test Groq Offline Fallback
print("\n[TEST 6] Deterministic Fallback on Real Label Image without Groq")
from pipeline.groq_extract import extract_structured_product
from pipeline.normalize_ocr import normalize_ocr_data
from pipeline.ocr_engine import run_ocr

ocr_data = run_ocr(root / "test_images" / "test_image2.png")
norm_data = normalize_ocr_data(ocr_data)
fallback_res = extract_structured_product(ocr_data, norm_data, api_key="forced_invalid_key_for_test")
print(f"-> Fallback Extraction Mode: {fallback_res.get('meta_extraction_mode')}")
print(f"-> Extracted MRP: {fallback_res.get('mrp')}")
print(f"-> Extracted Net Qty: {fallback_res.get('net_quantity')}")
print(f"-> Extracted Tax incl: {fallback_res.get('tax_inclusive_mrp')}")
assert fallback_res.get("mrp") is not None or fallback_res.get("net_quantity") is not None

print("\n" + "=" * 60)
print("ALL ROBUSTNESS AND FAULT-TOLERANCE VERIFICATIONS PASSED!")
print("=" * 60)
