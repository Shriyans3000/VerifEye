"""
VerifEye Phase 5: Category 3 — Deliberate Compliance Violations & Consistency Rules
Directly stress-tests the deterministic Legal Metrology compliance engine
against illegal, contradictory, or non-compliant product declarations.
"""

import sys
import unittest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from pipeline.compliance_engine import evaluate_compliance


class TestConsistencyRules(unittest.TestCase):

    def test_01_zero_mrp_triggers_fail(self):
        """MRP of 0.00 must produce status 'FAIL' and overall 'NON_COMPLIANT'."""
        product = {
            "manufacturer": "BAKEWELL FOODS PVT LTD",
            "manufacturer_address": "Andheri East, Mumbai, MH-400093",
            "product_name": "Biscuits",
            "net_quantity": "200 g",
            "mrp": "0.00",
            "tax_inclusive_mrp": True,
            "packed_date": "15/06/2024",
            "consumer_care": {"phone": "022-28391234"},
        }
        res = evaluate_compliance(product)
        mrp_check = next((c for c in res["checks"] if c["rule_name"] == "MRP"), None)
        self.assertIsNotNone(mrp_check)
        self.assertEqual(mrp_check["status"], "FAIL", f"Expected FAIL for MRP=0.00, got {mrp_check['status']}")
        self.assertEqual(res["overall_status"], "NON_COMPLIANT")
        self.assertGreaterEqual(res["failed"], 1)

    def test_02_negative_mrp_triggers_fail(self):
        """Negative MRP must produce status 'FAIL'."""
        product = {
            "manufacturer": "BAKEWELL FOODS PVT LTD",
            "manufacturer_address": "Mumbai",
            "net_quantity": "100 g",
            "mrp": "-15.00",
            "tax_inclusive_mrp": True,
        }
        res = evaluate_compliance(product)
        mrp_check = next((c for c in res["checks"] if c["rule_name"] == "MRP"), None)
        self.assertIsNotNone(mrp_check)
        self.assertEqual(mrp_check["status"], "FAIL")
        self.assertEqual(res["overall_status"], "NON_COMPLIANT")

    def test_03_date_inconsistency_expiry_before_mfg_triggers_fail(self):
        """Expiry/use-by date preceding manufacturing date must trigger FAIL on Date Consistency validation."""
        product = {
            "manufacturer": "VITA DAIRY FOODS PVT LTD",
            "manufacturer_address": "Anand, Gujarat",
            "mrp": "35.00",
            "tax_inclusive_mrp": True,
            "manufacturing_date": "15/08/2024",
            "use_by_date": "10/05/2023",  # 2023 precedes 2024!
        }
        res = evaluate_compliance(product)
        date_validation = next((v for v in res["validation_checks"] if v["rule_name"] == "Date Consistency"), None)
        self.assertIsNotNone(date_validation)
        self.assertEqual(date_validation["status"], "FAIL", f"Expected date validation FAIL, got {date_validation['status']}")
        self.assertIn("precedes", date_validation["reason"].lower())

    def test_04_date_consistency_valid_chronology_passes(self):
        """Valid timeline (mfg <= expiry) must PASS Date Consistency validation."""
        product = {
            "manufacturing_date": "01/01/2024",
            "expiry_date": "31/12/2024",
        }
        res = evaluate_compliance(product)
        date_validation = next((v for v in res["validation_checks"] if v["rule_name"] == "Date Consistency"), None)
        self.assertIsNotNone(date_validation)
        self.assertEqual(date_validation["status"], "PASS")

    def test_05_explicit_tax_exclusion_triggers_fail(self):
        """tax_inclusive_mrp explicitly False must produce status 'FAIL'."""
        product = {
            "mrp": "100.00",
            "tax_inclusive_mrp": False,  # Explicit statutory violation
        }
        res = evaluate_compliance(product)
        tax_check = next((c for c in res["checks"] if c["rule_name"] == "MRP Tax Inclusion"), None)
        self.assertIsNotNone(tax_check)
        self.assertEqual(tax_check["status"], "FAIL")
        self.assertEqual(res["overall_status"], "NON_COMPLIANT")

    def test_06_missing_critical_declarations_semantics(self):
        """Verifies that missing manufacturer and net_quantity produce 'MISSING' status per existing engine."""
        product = {
            "product_name": "Generic Cookies",
            "mrp": "50.00",
            "tax_inclusive_mrp": True,
        }
        res = evaluate_compliance(product)
        mfg_check = next((c for c in res["checks"] if c["rule_name"] == "Manufacturer / Packer / Importer"), None)
        qty_check = next((c for c in res["checks"] if c["rule_name"] == "Net Quantity"), None)
        self.assertIsNotNone(mfg_check)
        self.assertIsNotNone(qty_check)
        self.assertEqual(mfg_check["status"], "MISSING")
        self.assertEqual(qty_check["status"], "MISSING")
        self.assertEqual(res["overall_status"], "REVIEW_REQUIRED")


if __name__ == "__main__":
    unittest.main()
