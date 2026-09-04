import os
import sys
import unittest
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure workspace directory is in python path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.main import app


class TestVerifEyeAPI(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.test_images_dir = BASE_DIR / "test_images"
        cls.test_image2 = cls.test_images_dir / "test_image2.png"
        cls.test_label = cls.test_images_dir / "test_label.jpeg"

    def test_01_health_endpoint(self):
        """Verify GET /health returns 200 and expected status payload."""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "ok")
        self.assertEqual(data.get("service"), "verifeye-api")

    def test_02_invalid_file_upload(self):
        """Verify uploading non-image file returns 400 Bad Request."""
        files = {"file": ("test.txt", b"Hello World", "text/plain")}
        response = self.client.post("/api/analyze", files=files)
        self.assertEqual(response.status_code, 400)
        self.assertIn("Unsupported file extension", response.json().get("detail", ""))

    def test_03_empty_upload(self):
        """Verify empty upload request returns 4xx status code."""
        response = self.client.post("/api/analyze")
        self.assertIn(response.status_code, (400, 422))

    def test_04_analyze_test_image2(self):
        """Verify POST /api/analyze with real test_image2.png runs full pipeline."""
        if not self.test_image2.exists():
            self.skipTest(f"Test image not found: {self.test_image2}")

        with open(self.test_image2, "rb") as img_file:
            files = {"file": ("test_image2.png", img_file, "image/png")}
            response = self.client.post("/api/analyze", files=files)

        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertTrue(data.get("success"))
        self.assertIn("status", data)
        self.assertIn("compliance_score", data)
        self.assertIn("summary", data)
        self.assertIn("product", data)
        self.assertIn("checks", data)
        self.assertIn("validation_checks", data)

        summary = data["summary"]
        self.assertIn("total_checks", summary)
        self.assertIn("passed", summary)
        self.assertIn("failed", summary)
        self.assertIn("review_required", summary)

    def test_05_analyze_test_label(self):
        """Verify POST /api/analyze with real test_label.jpeg runs full pipeline."""
        if not self.test_label.exists():
            self.skipTest(f"Test image not found: {self.test_label}")

        with open(self.test_label, "rb") as img_file:
            files = {"file": ("test_label.jpeg", img_file, "image/jpeg")}
            response = self.client.post("/api/analyze", files=files)

        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertTrue(data.get("success"))
        self.assertIn("status", data)
        self.assertIn("compliance_score", data)
        self.assertIn("summary", data)
        self.assertIn("product", data)
        self.assertIn("checks", data)
        self.assertIn("validation_checks", data)


if __name__ == "__main__":
    unittest.main()
