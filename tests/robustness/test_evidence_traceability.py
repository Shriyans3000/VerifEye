"""
VerifEye Phase 5: Category 7 — Evidence Traceability & Verification
Audits the complete evidence lineage:
OCR text -> OCR ID -> Bounding Box -> Image Pixel Region -> Structured Field -> Compliance Check.
Verifies that no bounding boxes are fabricated and empty evidence cleanly yields [].
"""

import sys
import unittest
from pathlib import Path
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.services.pipeline import analyze_image
from pipeline.compliance_engine import evaluate_compliance


class TestEvidenceTraceability(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.test_image2 = BASE_DIR / "test_images" / "test_image2.png"
        if not cls.test_image2.exists():
            raise FileNotFoundError(f"Baseline image missing: {cls.test_image2}")

        with Image.open(cls.test_image2) as img:
            cls.img_w, cls.img_h = img.size

        # Run pipeline once on baseline image
        cls.analysis = analyze_image(cls.test_image2)
        cls.product = cls.analysis.get("product", {})
        cls.checks = cls.analysis.get("checks", [])

    def test_01_mrp_evidence_traceability(self):
        """Verify MRP evidence links to valid OCR region with matching numeric price."""
        mrp_check = next((c for c in self.checks if c["rule_name"] == "MRP"), None)
        self.assertIsNotNone(mrp_check)
        self.assertEqual(mrp_check["status"], "PASS")

        ev_list = mrp_check.get("evidence", [])
        self.assertGreater(len(ev_list), 0, "MRP check must contain linked evidence")

        for ev in ev_list:
            self.assertIn("ocr_id", ev)
            self.assertIn("text", ev)
            self.assertIn("bbox", ev)
            self.assertIn("confidence", ev)

            # Text must contain the price digits
            self.assertIn("10", ev["text"].replace(" ", ""))

            # Coordinates must be valid within image dimensions
            bbox = ev["bbox"]
            self.assertEqual(len(bbox), 4)
            xmin, ymin, xmax, ymax = bbox
            self.assertGreaterEqual(xmin, 0)
            self.assertGreaterEqual(ymin, 0)
            self.assertLessEqual(xmax, self.img_w)
            self.assertLessEqual(ymax, self.img_h)
            self.assertLess(xmin, xmax)
            self.assertLess(ymin, ymax)

    def test_02_net_quantity_evidence_traceability(self):
        """Verify Net Quantity evidence links to valid OCR region with weight declaration."""
        qty_check = next((c for c in self.checks if c["rule_name"] == "Net Quantity"), None)
        self.assertIsNotNone(qty_check)
        self.assertEqual(qty_check["status"], "PASS")

        ev_list = qty_check.get("evidence", [])
        self.assertGreater(len(ev_list), 0, "Net Quantity must contain linked evidence")
        ev = ev_list[0]
        self.assertIn("110", ev["text"])
        self.assertIn("g", ev["text"].lower())

    def test_03_manufacturer_evidence_traceability(self):
        """Verify Manufacturer evidence links to name declared on package."""
        mfg_check = next((c for c in self.checks if c["rule_name"] == "Manufacturer / Packer / Importer"), None)
        self.assertIsNotNone(mfg_check)
        self.assertEqual(mfg_check["status"], "PASS")

        ev_list = mfg_check.get("evidence", [])
        self.assertGreater(len(ev_list), 0)
        self.assertIn("PARLE", ev_list[0]["text"].upper())

    def test_04_consumer_care_evidence_traceability(self):
        """Verify Consumer Care evidence links to phone or email regions."""
        cc_check = next((c for c in self.checks if c["rule_name"] == "Consumer Care Details"), None)
        self.assertIsNotNone(cc_check)
        self.assertEqual(cc_check["status"], "PASS")

        ev_list = cc_check.get("evidence", [])
        self.assertGreater(len(ev_list), 0)
        # Check that evidence includes contact details
        all_text = " ".join(e["text"] for e in ev_list)
        self.assertTrue("6691" in all_text or "parle" in all_text.lower())

    def test_05_no_fabricated_evidence_for_undeclared_fields(self):
        """Undeclared fields (like Best Before on test_image2) must return empty evidence list."""
        bb_check = next((c for c in self.checks if c["rule_name"] == "Best Before / Use By"), None)
        self.assertIsNotNone(bb_check)
        self.assertEqual(bb_check["status"], "REVIEW")
        self.assertEqual(bb_check.get("evidence", []), [], "Must not fabricate bounding boxes for missing field")

    def test_06_clean_synthetic_missing_produces_empty_evidence(self):
        """Direct test of compliance engine with empty evidence dict."""
        product = {
            "product_name": "Test Item",
            "mrp": None,
            "evidence": {}
        }
        res = evaluate_compliance(product)
        mrp_check = next(c for c in res["checks"] if c["rule_name"] == "MRP")
        self.assertEqual(mrp_check["status"], "MISSING")
        self.assertEqual(mrp_check["evidence"], [])


if __name__ == "__main__":
    unittest.main()
