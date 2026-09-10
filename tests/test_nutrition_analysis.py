import unittest
from pipeline.nutrition_analysis import analyze_nutrition


class TestNutritionAnalysis(unittest.TestCase):
    def test_high_fat_and_high_salt_warning(self):
        product = {
            "product_name": "Potato Chips",
            "category": "Packaged Savoury Snacks",
            "nutrition": {
                "total_fat_g": 34.5,
                "saturated_fat_g": 14.0,
                "total_sugar_g": 3.0,
                "sodium_mg": 680.0
            }
        }
        result = analyze_nutrition(product)
        self.assertTrue(result["has_warning"])
        self.assertEqual(result["warnings_count"], 2)
        self.assertIn("HIGH FAT", result["warnings"])
        self.assertIn("HIGH SALT", result["warnings"])
        self.assertNotIn("HIGH SUGAR", result["warnings"])

        fat = result["indicators"]["fat"]
        self.assertEqual(fat["status"], "HIGH")
        self.assertTrue(fat["warning_triggered"])

        sugar = result["indicators"]["sugar"]
        self.assertEqual(sugar["status"], "MODERATE")
        self.assertFalse(sugar["warning_triggered"])

        salt = result["indicators"]["salt"]
        self.assertEqual(salt["status"], "HIGH")
        self.assertTrue(salt["warning_triggered"])

    def test_high_sugar_warning(self):
        product = {
            "product_name": "Chocolate Cookies",
            "category": "Biscuits & Bakery Products",
            "nutrition": {
                "total_fat_g": 12.0,
                "saturated_fat_g": 3.5,
                "total_sugar_g": 38.0,
                "sodium_mg": 180.0
            }
        }
        result = analyze_nutrition(product)
        self.assertTrue(result["has_warning"])
        self.assertEqual(result["warnings_count"], 1)
        self.assertIn("HIGH SUGAR", result["warnings"])
        self.assertEqual(result["indicators"]["sugar"]["status"], "HIGH")
        self.assertEqual(result["indicators"]["fat"]["status"], "MODERATE")
        self.assertEqual(result["indicators"]["salt"]["status"], "MODERATE")

    def test_clean_moderate_product(self):
        product = {
            "product_name": "Roasted Millet Crisps",
            "category": "Healthy Snacks",
            "nutrition": {
                "total_fat_g": 8.0,
                "saturated_fat_g": 1.5,
                "total_sugar_g": 4.0,
                "sodium_mg": 220.0
            }
        }
        result = analyze_nutrition(product)
        self.assertFalse(result["has_warning"])
        self.assertEqual(result["warnings_count"], 0)
        self.assertEqual(result["indicators"]["fat"]["status"], "MODERATE")
        self.assertEqual(result["indicators"]["sugar"]["status"], "MODERATE")
        self.assertEqual(result["indicators"]["salt"]["status"], "MODERATE")

    def test_missing_nutrition_returns_review_not_guessing(self):
        product = {
            "product_name": "Commodity Label with No Nutrition Table",
            "ingredients": "Wheat flour, water, yeast"
        }
        result = analyze_nutrition(product, ocr_data=[])
        self.assertFalse(result["has_warning"])
        self.assertEqual(result["indicators"]["fat"]["status"], "REVIEW")
        self.assertEqual(result["indicators"]["sugar"]["status"], "REVIEW")
        self.assertEqual(result["indicators"]["salt"]["status"], "REVIEW")
        self.assertIn("insufficient", result["overall_summary"].lower())

    def test_ocr_extraction_of_nutrition(self):
        ocr_regions = [
            {"id": 1, "text": "Nutritional Information per 100g", "confidence": 0.98},
            {"id": 2, "text": "Energy 540 kcal", "confidence": 0.99},
            {"id": 3, "text": "Total Fat: 35.0g", "confidence": 0.97},
            {"id": 4, "text": "Saturated Fat 15.2g", "confidence": 0.96},
            {"id": 5, "text": "Total Sugars: 18.5g", "confidence": 0.98},
            {"id": 6, "text": "Sodium: 520 mg", "confidence": 0.99},
        ]
        result = analyze_nutrition({}, ocr_data=ocr_regions)
        self.assertTrue(result["has_warning"])
        self.assertEqual(result["warnings_count"], 3)
        self.assertIn("HIGH FAT", result["warnings"])
        self.assertIn("HIGH SUGAR", result["warnings"])
        self.assertIn("HIGH SALT", result["warnings"])
        self.assertIsNotNone(result["indicators"]["fat"]["evidence"])
        self.assertIsNotNone(result["indicators"]["sugar"]["evidence"])
        self.assertIsNotNone(result["indicators"]["salt"]["evidence"])


if __name__ == "__main__":
    unittest.main()
