import unittest
import numpy as np
from PIL import Image
import tempfile
from pathlib import Path

from pipeline.readability_engine import analyze_readability, _get_bbox_extents


class TestReadabilityEngine(unittest.TestCase):
    def setUp(self):
        # Create a temporary synthetic image (400x300) with known patterns
        self.temp_dir = tempfile.TemporaryDirectory()
        self.img_path = Path(self.temp_dir.name) / "test_package.png"

        # Create a 400x300 image with white background and black text-like rectangles
        arr = np.ones((300, 400, 3), dtype=np.uint8) * 255
        # Add high contrast block (xmin=50, ymin=50, xmax=150, ymax=90)
        arr[50:90, 50:150] = 0
        # Add low contrast block (xmin=200, ymin=50, xmax=300, ymax=90)
        arr[50:90, 200:300] = 230

        img = Image.fromarray(arr)
        img.save(self.img_path)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_bbox_extents_formats(self):
        # Test 4-point polygon format
        poly = [[10, 20], [50, 20], [50, 40], [10, 40]]
        xmin, ymin, xmax, ymax = _get_bbox_extents(poly, 400, 300)
        self.assertEqual((xmin, ymin, xmax, ymax), (10, 20, 50, 40))

        # Test 4-element list format [x1, y1, x2, y2]
        box = [15, 25, 60, 45]
        xmin, ymin, xmax, ymax = _get_bbox_extents(box, 400, 300)
        self.assertEqual((xmin, ymin, xmax, ymax), (15, 25, 60, 45))

        # Test boundary clamping
        overflow = [[-10, -5], [450, -5], [450, 350], [-10, 350]]
        xmin, ymin, xmax, ymax = _get_bbox_extents(overflow, 400, 300)
        self.assertEqual(xmin, 0)
        self.assertEqual(ymin, 0)
        self.assertEqual(xmax, 400)
        self.assertEqual(ymax, 300)

    def test_readability_analysis_metrics(self):
        ocr_data = [
            {
                "id": 0,
                "image_index": 0,
                "text": "HIGH CONTRAST SAMPLE",
                "confidence": 0.95,
                "bbox": [[50, 50], [150, 50], [150, 90], [50, 90]]
            },
            {
                "id": 1,
                "image_index": 0,
                "text": "LOW CONTRAST SAMPLE",
                "confidence": 0.88,
                "bbox": [[200, 50], [300, 50], [300, 90], [200, 90]]
            },
            {
                "id": 2,
                "image_index": 0,
                "text": "TINY LOW CONF",
                "confidence": 0.50,
                "bbox": [[10, 10], [50, 10], [50, 18], [10, 18]]
            }
        ]

        result = analyze_readability(ocr_data, [self.img_path])

        self.assertIn("summary", result)
        self.assertIn("regions", result)
        self.assertEqual(len(result["regions"]), 3)

        summary = result["summary"]
        self.assertEqual(summary["total_regions"], 3)
        self.assertIn("physical_font_size", summary)
        self.assertEqual(summary["physical_font_size"]["status"], "NOT CALIBRATED")
        self.assertIn("millimetres cannot be determined", summary["physical_font_size"]["reason"])

        # Check region 0 (high contrast)
        r0 = result["regions"][0]
        self.assertEqual(r0["height_px"], 40)
        self.assertEqual(r0["width_px"], 100)
        # Image height is 300, so 40 / 300 * 100 = 13.33%
        self.assertEqual(r0["normalized_height_pct"], 13.33)
        self.assertGreater(r0["contrast"], 30.0)

        # Check region 2 (low confidence)
        r2 = result["regions"][2]
        self.assertEqual(r2["readability_status"], "LOW OCR CONFIDENCE")

    def test_missing_image_graceful_fallback(self):
        ocr_data = [{
            "id": 0,
            "image_index": 0,
            "text": "NO IMAGE",
            "confidence": 0.90,
            "bbox": [0, 0, 10, 10]
        }]
        result = analyze_readability(ocr_data, ["non_existent_file.png"])
        self.assertEqual(len(result["regions"]), 1)
        self.assertEqual(result["regions"][0]["readability_status"], "REVIEW")


if __name__ == "__main__":
    unittest.main()
