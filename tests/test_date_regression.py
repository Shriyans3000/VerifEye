import unittest
from pathlib import Path
from pipeline.ocr_engine import run_ocr
from pipeline.normalize_ocr import normalize_ocr_data
from pipeline.groq_extract import extract_structured_product
from pipeline.compliance_engine import evaluate_compliance
from backend.config import GROQ_API_KEY


class TestDateRegression(unittest.TestCase):
    """
    Regression test suite for Parle-G PKD / Packed Date extraction
    and date variant parsing.
    """

    def setUp(self):
        self.image_path = Path("test_images/test_image2.png").resolve()
        self.assertTrue(self.image_path.exists(), f"Test image not found: {self.image_path}")

    def test_parle_g_pkd_extraction(self):
        ocr_res = run_ocr(self.image_path)
        norm_res = normalize_ocr_data(ocr_res)
        structured = extract_structured_product(ocr_res, norm_res, GROQ_API_KEY)
        comp = evaluate_compliance(structured)

        # 1. Verify packed_date is extracted
        packed_date = structured.get("packed_date")
        self.assertIsNotNone(packed_date, "packed_date must be extracted for Parle-G image")
        self.assertIn("29", str(packed_date), f"packed_date '{packed_date}' must contain day '29'")
        self.assertIn("20", str(packed_date), f"packed_date '{packed_date}' must contain year '20'")

        # 2. Verify evidence exists and contains image_index
        ev = structured.get("evidence", {}).get("packed_date")
        self.assertIsNotNone(ev, "packed_date evidence must not be null")
        self.assertIn("image_index", ev, "evidence item must preserve image_index")

        # 3. Verify compliance check for Manufacture / Pack Date passes
        check_date = next((c for c in comp.get("checks", []) if c.get("rule_name") == "Manufacture / Pack Date"), None)
        self.assertIsNotNone(check_date, "Manufacture / Pack Date check must be present")
        self.assertEqual(check_date.get("status"), "PASS", f"Manufacture / Pack Date status should be PASS, got: {check_date}")


if __name__ == "__main__":
    unittest.main()
