import unittest
from pathlib import Path
from pipeline.ocr_engine import run_ocr
from pipeline.normalize_ocr import normalize_ocr_data
from pipeline.groq_extract import extract_structured_product
from pipeline.compliance_engine import evaluate_compliance
from backend.config import GROQ_API_KEY


class TestDenseLabelRegression(unittest.TestCase):
    """
    Regression test suite for dense packaged-product labels (e.g. Parle-G Gold back).
    Verifies generic extraction via OCR context and spatial relationships without hardcoding.
    """

    def setUp(self):
        self.image_path = (Path(__file__).resolve().parent.parent / "test_images" / "parle_g_gold_back.jpeg").resolve()
        self.assertTrue(self.image_path.exists(), f"Test image missing: {self.image_path}")

    def test_dense_label_extraction(self):
        ocr_res = run_ocr(self.image_path)
        norm_res = normalize_ocr_data(ocr_res)
        prod = extract_structured_product(ocr_res, norm_res, GROQ_API_KEY)
        comp = evaluate_compliance(prod)

        # 1. Net Quantity == "187.5 g"
        self.assertEqual(prod.get("net_quantity"), "187.5 g", f"Net quantity was {prod.get('net_quantity')}")

        # 2. Use By corresponds to 19/2/27
        use_by = str(prod.get("use_by_date", ""))
        self.assertTrue(
            "19" in use_by and "2" in use_by and "27" in use_by,
            f"use_by_date '{use_by}' does not correspond to 19/2/27"
        )

        # 3. Batch Number == "K9C" and != "PKD"
        self.assertEqual(prod.get("batch_number"), "K9C", f"Batch number was {prod.get('batch_number')}")
        self.assertNotEqual(prod.get("batch_number"), "PKD")

        # 4. Unit Sale Price contains "0.16"
        usp = str(prod.get("unit_sale_price", ""))
        self.assertIn("0.16", usp, f"unit_sale_price '{usp}' does not contain '0.16'")

        # 5. MRP == "30.00"
        self.assertEqual(prod.get("mrp"), "30.00", f"MRP was {prod.get('mrp')}")

        # 6. Tax Inclusive MRP is True
        self.assertTrue(prod.get("tax_inclusive_mrp"), "tax_inclusive_mrp should be True")

        # 7. Manufacturer == "PARLE BISCUITS PVT LTD"
        self.assertEqual(prod.get("manufacturer"), "PARLE BISCUITS PVT LTD", f"Manufacturer was {prod.get('manufacturer')}")

        # 8. Manufacturer Address contains VILE PARLE and MUMBAI, without unrelated contract plants
        mfg_addr = str(prod.get("manufacturer_address", ""))
        self.assertIn("VILE PARLE", mfg_addr, f"Address '{mfg_addr}' missing 'VILE PARLE'")
        self.assertIn("MUMBAI", mfg_addr, f"Address '{mfg_addr}' missing 'MUMBAI'")
        self.assertNotIn("VT-SHREE TIRUPATI", mfg_addr)
        self.assertNotIn("KUSHAL FOODS", mfg_addr)

        # 9. Verify evidence exists for rescued fields
        evidence = prod.get("evidence", {})
        for field in ["net_quantity", "batch_number", "mrp", "unit_sale_price", "manufacturer", "manufacturer_address"]:
            self.assertIn(field, evidence, f"Evidence missing for {field}")
            ev = evidence[field]
            self.assertIsNotNone(ev.get("bbox") or ev.get("bounding_box"), f"Bounding box missing in evidence for {field}")
            self.assertIn("confidence", ev, f"Confidence missing in evidence for {field}")


if __name__ == "__main__":
    unittest.main()
