import unittest

from pipeline.canonical_normalize import canonical_normalize_product
from pipeline.preservative_analysis import analyze_preservatives


class TestPreservativeAnalysis(unittest.TestCase):
    def test_limit_exceeded_is_flagged(self):
        result = analyze_preservatives({
            "food_category": "general packaged food",
            "preservatives": [{"name": "sodium benzoate", "amount_mg_per_kg": 700}],
        })
        item = result["preservatives_found"][0]
        self.assertEqual(item["status"], "LIMIT_EXCEEDED")
        self.assertTrue(result["has_flagged_preservative"])
        self.assertEqual(item["fssai_limit_mg_per_kg"], 600)

    def test_missing_quantity_requires_review(self):
        result = analyze_preservatives({
            "food_category": "general packaged food",
            "preservatives": [{"name": "potassium sorbate"}],
        })
        self.assertEqual(result["preservatives_found"][0]["status"], "REVIEW_REQUIRED")
        self.assertTrue(result["requires_manual_review"])

    def test_unknown_category_does_not_claim_safety(self):
        result = analyze_preservatives({
            "preservatives": [{"name": "sodium benzoate", "amount_mg_per_kg": 10}],
        })
        self.assertEqual(result["preservatives_found"][0]["status"], "REVIEW_REQUIRED")

    def test_canonical_normalization_preserves_evidence(self):
        product = canonical_normalize_product(
            {
                "ingredients": "Water, sodium benzoate",
                "preservatives": [{
                    "name": "sodium benzoate",
                    "ins_number": "211",
                    "evidence": {"ocr_id": 0},
                }],
            },
            [{
                "id": 0,
                "image_index": 1,
                "text": "Ingredients: Water, sodium benzoate",
                "confidence": 0.94,
                "bbox": [1, 2, 3, 4],
            }],
        )
        evidence = product["preservatives"][0]["evidence"]
        self.assertEqual(evidence["image_index"], 1)
        self.assertEqual(evidence["text"], "Ingredients: Water, sodium benzoate")
        self.assertEqual(evidence["bbox"], [1, 2, 3, 4])


    def test_banned_preservative_in_india(self):
        result = analyze_preservatives({
            "ingredients": "Wheat flour, potassium bromate (INS 924a), water",
            "preservatives": [{"name": "potassium bromate", "ins_number": "924a"}],
        })
        item = result["preservatives_found"][0]
        self.assertEqual(item["status"], "BANNED_SUBSTANCE")
        self.assertTrue(item["is_banned_in_india"])
        self.assertTrue(result["has_banned_preservative"])
        self.assertIn("India", item["banned_countries"][0])
        self.assertIn("European Union", item["banned_countries"][1])
        self.assertIsNotNone(result["critical_alert"])
        self.assertIn("BANNED", result["critical_alert"])

    def test_global_bans_and_explanation(self):
        result = analyze_preservatives({
            "preservatives": [{"name": "tbhq", "ins_number": "319", "amount_mg_per_kg": 250}],
        })
        item = result["preservatives_found"][0]
        self.assertEqual(item["status"], "LIMIT_EXCEEDED")
        self.assertEqual(item["fssai_limit_mg_per_kg"], 200)
        self.assertIn("Japan", item["banned_countries"][0])
        self.assertIn("antioxidant", item["description"].lower())
        self.assertIsNotNone(item["health_concerns"])


if __name__ == "__main__":
    unittest.main()
