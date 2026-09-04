"""
VerifEye Phase 5: Categories 1, 2, 4, and 6
Tests complete compliant labels, missing declarations, OCR-difficult transformations,
and rotated/distorted packaging.
"""

import sys
import unittest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.services.pipeline import analyze_image

TEST_IMAGES_DIR = BASE_DIR / "test_images"
SYNTHETIC_DIR = TEST_IMAGES_DIR / "synthetic"


class TestRobustnessPipeline(unittest.TestCase):

    # =========================================================================
    # CATEGORY 1: Baseline Compliant Labels
    # =========================================================================

    def test_01_baseline_test_image2(self):
        """Verify baseline test_image2.png executes cleanly and yields expected checks."""
        img = TEST_IMAGES_DIR / "test_image2.png"
        res = analyze_image(img)

        self.assertTrue(res.get("success"))
        self.assertEqual(res.get("overall_status"), "REVIEW_REQUIRED")
        self.assertEqual(res.get("compliance_score"), 66.7)
        self.assertEqual(len(res.get("checks", [])), 12)
        self.assertEqual(res["summary"]["passed"], 8)
        self.assertEqual(res["summary"]["review_required"], 4)

    def test_02_baseline_test_label(self):
        """Verify baseline test_label.jpeg executes cleanly."""
        img = TEST_IMAGES_DIR / "test_label.jpeg"
        res = analyze_image(img)

        self.assertTrue(res.get("success"))
        self.assertIn(res.get("overall_status"), ("PASS", "REVIEW_REQUIRED", "NON_COMPLIANT"))
        self.assertGreater(len(res.get("checks", [])), 0)

    # =========================================================================
    # CATEGORY 2: Missing Declarations
    # =========================================================================

    def test_03_missing_mrp_label(self):
        """Label with omitted MRP produces MISSING status for MRP check."""
        img = SYNTHETIC_DIR / "synthetic_missing_mrp.png"
        if not img.exists():
            self.skipTest(f"Missing fixture: {img}")

        res = analyze_image(img)
        mrp_check = next((c for c in res["checks"] if c["rule_name"] == "MRP"), None)
        self.assertIsNotNone(mrp_check)
        self.assertEqual(mrp_check["status"], "MISSING", f"Expected MISSING for absent MRP, got {mrp_check['status']}")

    def test_04_missing_net_quantity_label(self):
        """Label with omitted Net Quantity produces MISSING status for Net Quantity."""
        img = SYNTHETIC_DIR / "synthetic_missing_quantity.png"
        if not img.exists():
            self.skipTest(f"Missing fixture: {img}")

        res = analyze_image(img)
        qty_check = next((c for c in res["checks"] if c["rule_name"] == "Net Quantity"), None)
        self.assertIsNotNone(qty_check)
        self.assertEqual(qty_check["status"], "MISSING", f"Expected MISSING for absent Net Quantity, got {qty_check['status']}")

    def test_05_missing_manufacturer_label(self):
        """Label with omitted Manufacturer produces MISSING status for Manufacturer."""
        img = SYNTHETIC_DIR / "synthetic_missing_manufacturer.png"
        if not img.exists():
            self.skipTest(f"Missing fixture: {img}")

        res = analyze_image(img)
        mfg_check = next((c for c in res["checks"] if c["rule_name"] == "Manufacturer / Packer / Importer"), None)
        self.assertIsNotNone(mfg_check)
        self.assertEqual(mfg_check["status"], "MISSING", f"Expected MISSING for absent Manufacturer, got {mfg_check['status']}")

    # =========================================================================
    # CATEGORY 4: OCR-Difficult Images
    # =========================================================================

    def test_06_gaussian_blur_mild(self):
        """Mild Gaussian blur (sigma=1.5) still permits core text recovery."""
        img = SYNTHETIC_DIR / "test_image2_blur_sigma1_5.png"
        if not img.exists():
            self.skipTest(f"Missing fixture: {img}")

        res = analyze_image(img)
        self.assertTrue(res.get("success"))
        # Core MRP or weight should still be extracted under mild blur
        product = res.get("product", {})
        self.assertTrue(product.get("mrp") is not None or product.get("manufacturer") is not None,
                        "Expected partial field extraction under mild blur")

    def test_07_low_contrast(self):
        """Low contrast image (alpha=0.45) undergoes OCR and pipeline execution."""
        img = SYNTHETIC_DIR / "test_image2_low_contrast.png"
        if not img.exists():
            self.skipTest(f"Missing fixture: {img}")

        res = analyze_image(img)
        self.assertTrue(res.get("success"))
        self.assertIn("checks", res)

    def test_08_synthetic_shadow(self):
        """Image with uneven lighting shadow overlay undergoes OCR and returns checks."""
        img = SYNTHETIC_DIR / "test_image2_shadow.png"
        if not img.exists():
            self.skipTest(f"Missing fixture: {img}")

        res = analyze_image(img)
        self.assertTrue(res.get("success"))
        self.assertIn("checks", res)

    def test_09_jpeg_compression_q20(self):
        """High JPEG compression artifacts (Q=20) evaluates without crash."""
        img = SYNTHETIC_DIR / "test_image2_jpeg_q20.jpg"
        if not img.exists():
            self.skipTest(f"Missing fixture: {img}")

        res = analyze_image(img)
        self.assertTrue(res.get("success"))
        self.assertIn("checks", res)

    def test_10_perspective_distortion(self):
        """Perspective skewed image evaluates without pipeline breakdown."""
        img = SYNTHETIC_DIR / "test_image2_perspective.png"
        if not img.exists():
            self.skipTest(f"Missing fixture: {img}")

        res = analyze_image(img)
        self.assertTrue(res.get("success"))
        self.assertIn("checks", res)

    # =========================================================================
    # CATEGORY 6: Rotated / Distorted Labels
    # =========================================================================

    def test_11_slight_rotation_5_degrees(self):
        """Slight rotation (+5°) should be handled gracefully by PaddleOCR angle detection."""
        img = SYNTHETIC_DIR / "test_image2_rot_5.png"
        if not img.exists():
            self.skipTest(f"Missing fixture: {img}")

        res = analyze_image(img)
        self.assertTrue(res.get("success"))
        product = res.get("product", {})
        self.assertIsNotNone(product.get("mrp") or product.get("manufacturer"),
                             "Core declarations should remain readable at 5 degrees")

    def test_12_moderate_rotation_10_degrees(self):
        """Rotation (+10°) is processed through OCR and compliance engine."""
        img = SYNTHETIC_DIR / "test_image2_rot_10.png"
        if not img.exists():
            self.skipTest(f"Missing fixture: {img}")

        res = analyze_image(img)
        self.assertTrue(res.get("success"))
        self.assertIn("checks", res)

    def test_13_negative_rotation_neg10_degrees(self):
        """Negative rotation (-10°) is processed through OCR and compliance engine."""
        img = SYNTHETIC_DIR / "test_image2_rot_neg10.png"
        if not img.exists():
            self.skipTest(f"Missing fixture: {img}")

        res = analyze_image(img)
        self.assertTrue(res.get("success"))
        self.assertIn("checks", res)


if __name__ == "__main__":
    unittest.main()
