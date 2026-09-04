import unittest
from pathlib import Path
from fastapi.testclient import TestClient
from backend.main import app


class TestMultiImageAPI(unittest.TestCase):
    """
    Test suite for single-image and multi-image API behavior,
    provenance tracking (image_index), and 3-image rejection (HTTP 400).
    """

    def setUp(self):
        self.client = TestClient(app)
        self.img1_path = Path("test_images/test_image2.png").resolve()
        self.img2_path = Path("test_images/test_label.jpeg").resolve()
        self.assertTrue(self.img1_path.exists(), f"Missing img1: {self.img1_path}")
        self.assertTrue(self.img2_path.exists(), f"Missing img2: {self.img2_path}")

    def test_single_image_backward_compatibility(self):
        with open(self.img1_path, "rb") as f:
            resp = self.client.post("/api/analyze", files={"file": ("test_image2.png", f, "image/png")})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["success"])
        self.assertIn("compliance_score", data)
        self.assertIn("checks", data)

    def test_two_images_multi_upload(self):
        with open(self.img1_path, "rb") as f1, open(self.img2_path, "rb") as f2:
            resp = self.client.post(
                "/api/analyze",
                files=[
                    ("files", ("front.png", f1, "image/png")),
                    ("files", ("back.jpeg", f2, "image/jpeg"))
                ]
            )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["success"])
        self.assertEqual(data.get("meta", {}).get("images_processed"), 2)

        # Check evidence image_index retention
        checks = data.get("checks", [])
        has_ev = False
        for c in checks:
            for ev in c.get("evidence", []):
                has_ev = True
                self.assertIn("image_index", ev, f"Evidence item {ev} must retain image_index")
                self.assertIn(ev["image_index"], [0, 1])
        self.assertTrue(has_ev, "Combined inspection should produce evidence with image_index tags")

    def test_three_images_rejection(self):
        with open(self.img1_path, "rb") as f1, open(self.img2_path, "rb") as f2, open(self.img1_path, "rb") as f3:
            resp = self.client.post(
                "/api/analyze",
                files=[
                    ("files", ("f1.png", f1, "image/png")),
                    ("files", ("f2.jpeg", f2, "image/jpeg")),
                    ("files", ("f3.png", f3, "image/png"))
                ]
            )
        self.assertEqual(resp.status_code, 400)
        detail = resp.json().get("detail", "")
        self.assertIn("Maximum 2 images", detail)

    def test_ambiguous_request_rejection(self):
        with open(self.img1_path, "rb") as f1, open(self.img2_path, "rb") as f2:
            resp = self.client.post(
                "/api/analyze",
                files=[
                    ("file", ("single.png", f1, "image/png")),
                    ("files", ("multi.jpeg", f2, "image/jpeg"))
                ]
            )
        self.assertEqual(resp.status_code, 400)
        detail = resp.json().get("detail", "")
        self.assertIn("Ambiguous request", detail)


if __name__ == "__main__":
    unittest.main()
