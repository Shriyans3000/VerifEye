import unittest
import json
from pathlib import Path
from pipeline.ocr_engine import run_ocr
from pipeline.normalize_ocr import normalize_ocr_data
from pipeline.groq_extract import extract_structured_product
from pipeline.compliance_engine import evaluate_compliance
from backend.config import GROQ_API_KEY


class TestDeterminism(unittest.TestCase):
    """
    Automated regression test enforcing 100% deterministic output
    across 10 executions of the extraction + compliance pipeline.
    """

    def setUp(self):
        self.image_path = Path("test_images/test_image2.png").resolve()
        self.assertTrue(self.image_path.exists(), f"Test image missing: {self.image_path}")

    def test_ten_iterations_determinism(self):
        iterations = 10
        history = []

        # Run OCR once to produce standard input evidence
        ocr_res = run_ocr(self.image_path)
        norm_res = normalize_ocr_data(ocr_res)

        for i in range(iterations):
            prod = extract_structured_product(ocr_res, norm_res, GROQ_API_KEY)
            comp = evaluate_compliance(prod)

            record = {
                "iteration": i + 1,
                "product": prod,
                "overall_status": comp["overall_status"],
                "compliance_score": comp["compliance_score"],
                "checks": [(c["rule_name"], c["status"], c.get("extracted_value")) for c in comp["checks"]]
            }
            history.append(record)

        first = history[0]
        for idx, rec in enumerate(history[1:], start=2):
            self.assertEqual(
                rec["overall_status"], first["overall_status"],
                f"Iteration {idx} overall_status mismatch: {rec['overall_status']} vs {first['overall_status']}"
            )
            self.assertEqual(
                rec["compliance_score"], first["compliance_score"],
                f"Iteration {idx} compliance_score mismatch: {rec['compliance_score']} vs {first['compliance_score']}"
            )
            self.assertEqual(
                rec["checks"], first["checks"],
                f"Iteration {idx} 12 check statuses mismatch:\n{rec['checks']}\nvs\n{first['checks']}"
            )
            self.assertEqual(
                json.dumps(rec["product"], sort_keys=True),
                json.dumps(first["product"], sort_keys=True),
                f"Iteration {idx} canonical product declarations mismatched."
            )


if __name__ == "__main__":
    unittest.main()
