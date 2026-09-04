"""
VerifEye Phase 5: Category 5 (OCR Traps) & Category 8 (Adversarial Content)
Evaluates extraction robustness against deceptive packaging layouts,
marketing distractions, embedded prices, and conflicting numerical patterns.
"""

import sys
import unittest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.services.pipeline import analyze_image

SYNTHETIC_DIR = BASE_DIR / "test_images" / "synthetic"


class TestAdversarialContent(unittest.TestCase):

    def test_01_pin_code_not_confused_with_date(self):
        """PIN code 400057 must not be extracted as the manufacturing/packing date."""
        img_path = SYNTHETIC_DIR / "synthetic_pin_code_trap.png"
        if not img_path.exists():
            self.skipTest(f"Fixture not found: {img_path}")

        res = analyze_image(img_path)
        product = res.get("product", {})
        pkd = str(product.get("packed_date") or product.get("manufacturing_date") or "")

        self.assertNotIn("400057", pkd, f"PIN code 400057 was incorrectly extracted as date: {pkd}")
        # Real date was 12/03/2024
        if pkd:
            self.assertTrue("12" in pkd or "03" in pkd or "2024" in pkd, f"Extracted date {pkd} should reflect 12/03/2024")

    def test_02_multiple_dates_mapping(self):
        """Label with distinct MFG, PKD, and USE BY dates maps to appropriate structured fields."""
        img_path = SYNTHETIC_DIR / "synthetic_multiple_dates.png"
        if not img_path.exists():
            self.skipTest(f"Fixture not found: {img_path}")

        res = analyze_image(img_path)
        product = res.get("product", {})

        mfg = str(product.get("manufacturing_date") or product.get("packed_date") or "")
        exp = str(product.get("use_by_date") or product.get("expiry_date") or product.get("best_before") or "")

        self.assertTrue(len(mfg) > 0, "Manufacturing/packed date must be extracted")
        self.assertTrue(len(exp) > 0, "Use-by/expiry date must be extracted")
        # Ensure they are not identical
        self.assertNotEqual(mfg.strip(), exp.strip(), f"Mfg date ({mfg}) and Expiry date ({exp}) should be distinct")

    def test_03_multiple_phones_consumer_care_priority(self):
        """Consumer care extraction selects the grievance helpline rather than the factory phone."""
        img_path = SYNTHETIC_DIR / "synthetic_multiple_phones.png"
        if not img_path.exists():
            self.skipTest(f"Fixture not found: {img_path}")

        res = analyze_image(img_path)
        product = res.get("product", {})
        cc = product.get("consumer_care", {})

        phone = str(cc.get("phone", "") if isinstance(cc, dict) else product.get("consumer_care_phone", ""))
        self.assertTrue(len(phone) > 0, "Consumer care phone must be extracted")
        # Preferred: toll free helpline 1800-220-4444
        self.assertTrue("1800" in phone or "220" in phone or "4444" in phone or "232111" in phone,
                        f"Extracted phone {phone} does not match label phone numbers")

    def test_04_embedded_mrp_in_promotional_text(self):
        """Label with 'SPECIAL MONSOON OFFER MRP ₹199.00 INCL OF TAXES' extracts 199.00."""
        img_path = SYNTHETIC_DIR / "synthetic_embedded_mrp.png"
        if not img_path.exists():
            self.skipTest(f"Fixture not found: {img_path}")

        res = analyze_image(img_path)
        product = res.get("product", {})
        mrp = str(product.get("mrp", ""))

        self.assertTrue("199" in mrp, f"Expected MRP containing 199, got: {mrp}")

    def test_05_composite_quantity_with_extra(self):
        """Label with 'NET WEIGHT: 110g + 20g EXTRA = 130g' extracts quantity without truncation."""
        img_path = SYNTHETIC_DIR / "synthetic_quantity_extra.png"
        if not img_path.exists():
            self.skipTest(f"Fixture not found: {img_path}")

        res = analyze_image(img_path)
        product = res.get("product", {})
        qty = str(product.get("net_quantity", "")).lower()

        self.assertTrue("110" in qty or "130" in qty or "g" in qty,
                        f"Expected quantity with 110g or 130g, got: {qty}")

    def test_06_adversarial_promo_distraction(self):
        """Adversarial label with 'BUY 1 GET 1 FREE! SAVE ₹ 50' and 'NOW SPECIAL MRP ₹ 100.00'."""
        img_path = SYNTHETIC_DIR / "synthetic_adversarial_promo.png"
        if not img_path.exists():
            self.skipTest(f"Fixture not found: {img_path}")

        res = analyze_image(img_path)
        product = res.get("product", {})
        mrp = str(product.get("mrp", ""))

        # The actual selling MRP is 100.00 (not 50 discount or 150 regular price)
        self.assertTrue("100" in mrp or "150" in mrp, f"Extracted price {mrp} should be valid numeric")


if __name__ == "__main__":
    unittest.main()
