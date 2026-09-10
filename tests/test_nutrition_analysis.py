import unittest
import json
import os
from pipeline.nutrition_analysis import analyze_nutrition, SOLID_FOOD_THRESHOLDS


class TestNutritionAnalysis(unittest.TestCase):
    def test_solid_food_thresholds(self):
        """Verify user's statutory/recommended thresholds."""
        self.assertEqual(SOLID_FOOD_THRESHOLDS["added_fat_g"], 4.2)
        self.assertEqual(SOLID_FOOD_THRESHOLDS["saturated_fat_g"], 4.2)
        self.assertEqual(SOLID_FOOD_THRESHOLDS["added_sugar_g"], 3.0)
        self.assertEqual(SOLID_FOOD_THRESHOLDS["salt_mg"], 635.0)
        self.assertEqual(SOLID_FOOD_THRESHOLDS["salt_g"], 0.635)
        self.assertEqual(SOLID_FOOD_THRESHOLDS["sodium_mg"], 254.0)

    def test_high_fat_and_high_salt_warning(self):
        product = {
            "product_name": "Potato Chips",
            "category": "Packaged Savoury Snacks",
            "nutrition": {
                "total_fat_g": 34.5,
                "saturated_fat_g": 14.0,
                "added_sugar_g": 1.0,
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
                "total_fat_g": 10.0,
                "saturated_fat_g": 3.5,
                "added_sugar_g": 12.0,
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
                "added_sugar_g": 1.2,
                "total_sugar_g": 2.0,
                "sodium_mg": 200.0
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

    def test_tabular_ocr_extraction_user_ragi_chips_label(self):
        """
        Tests tabular extraction where nutrient labels and values are in separate
        adjacent OCR boxes, with 'Per 57g' basis normalized to 100g.
        Values declared:
          Total Fat: 11.89g per 57g -> 20.86g/100g (HIGH FAT > 4.2g / 15g)
          Saturated Fat: 3.40g per 57g -> 5.96g/100g (HIGH FAT > 4.2g)
          Added Sugar: 0.57g per 57g -> 1.00g/100g (MODERATE <= 3.0g)
          Sodium: 438.17mg per 57g -> 768.72mg/100g -> Salt 1.92g = 1921.8mg (HIGH SALT > 635mg)
        """
        ocr_regions = [
            {"id": 1, "text": "Nutritional Info", "bbox": [231, 257, 310, 275]},
            {"id": 3, "text": "Serving size 30g", "bbox": [231, 268, 288, 281]},
            {"id": 7, "text": "Per 57g", "bbox": [358, 283, 394, 297]},
            {"id": 8, "text": "(Approx)", "bbox": [360, 293, 393, 304]},
            {"id": 12, "text": "Energy Value", "bbox": [231, 301, 311, 322]},
            {"id": 14, "text": "273.66kcal", "bbox": [348, 307, 402, 318]},
            {"id": 26, "text": "Total Sugar", "bbox": [238, 367, 309, 387]},
            {"id": 27, "text": "1.85g", "bbox": [357, 367, 394, 388]},
            {"id": 30, "text": "Added Sugar", "bbox": [238, 390, 318, 411]},
            {"id": 31, "text": "0.57g", "bbox": [359, 393, 393, 410]},
            {"id": 39, "text": "Total Fat", "bbox": [232, 435, 289, 452]},
            {"id": 40, "text": "11.89g", "bbox": [356, 435, 396, 453]},
            {"id": 42, "text": "Saturated Fat", "bbox": [238, 456, 321, 475]},
            {"id": 43, "text": "3.40g", "bbox": [359, 458, 393, 475]},
            {"id": 46, "text": "Trans Fat", "bbox": [239, 502, 298, 516]},
            {"id": 47, "text": "0.05g", "bbox": [359, 502, 393, 519]},
            {"id": 53, "text": "Sodium", "bbox": [232, 545, 278, 560]},
            {"id": 54, "text": "438.17mg", "bbox": [349, 544, 403, 561]},
        ]
        result = analyze_nutrition({}, ocr_data=ocr_regions)
        self.assertTrue(result["has_warning"])
        self.assertEqual(result["warnings_count"], 2)
        self.assertIn("HIGH FAT", result["warnings"])
        self.assertIn("HIGH SALT", result["warnings"])
        self.assertNotIn("HIGH SUGAR", result["warnings"])

        fat = result["indicators"]["fat"]
        self.assertEqual(fat["status"], "HIGH")
        self.assertTrue(fat["warning_triggered"])
        self.assertIn("Per 57g", fat["declared_value"])
        self.assertIn("5.96g", fat["declared_value"])

        sugar = result["indicators"]["sugar"]
        self.assertEqual(sugar["status"], "MODERATE")
        self.assertFalse(sugar["warning_triggered"])
        self.assertIn("Per 57g", sugar["declared_value"])
        self.assertIn("1.0g", sugar["declared_value"])

        salt = result["indicators"]["salt"]
        self.assertEqual(salt["status"], "HIGH")
        self.assertTrue(salt["warning_triggered"])
        self.assertIn("Per 57g", salt["declared_value"])
        self.assertIn("1920.0mg", salt["declared_value"])

    def test_full_ocr_file_if_available(self):
        """Runs against scratch_user_img_ocr.json if present."""
        if os.path.exists("scratch_user_img_ocr.json"):
            with open("scratch_user_img_ocr.json", "r", encoding="utf-8") as f:
                ocr_data = json.load(f)
            result = analyze_nutrition({}, ocr_data=ocr_data)
            self.assertTrue(result["has_warning"])
            self.assertIn("HIGH FAT", result["warnings"])
            self.assertIn("HIGH SALT", result["warnings"])
            self.assertEqual(result["indicators"]["sugar"]["status"], "MODERATE")


if __name__ == "__main__":
    unittest.main()
