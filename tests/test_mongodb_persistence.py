import unittest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import save_inspection, list_inspections, get_inspection_by_id


class TestMongoDBPersistence(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.sample_analysis = {
            "success": True,
            "status": "REVIEW_REQUIRED",
            "compliance_score": 66.7,
            "summary": {
                "total_checks": 12,
                "passed": 8,
                "failed": 0,
                "review_required": 4
            },
            "product": {
                "product_name": "Test Biscuits",
                "manufacturer": "Test Foods Ltd",
                "mrp": "10.00",
                "net_quantity": "100g"
            },
            "checks": [
                {
                    "rule_name": "MRP",
                    "status": "PASS",
                    "severity": "none",
                    "extracted_value": "10.00",
                    "reason": "MRP declaration detected",
                    "evidence": [{"ocr_id": 1, "text": "MRP 10.00", "confidence": 0.99, "bbox": [10, 10, 50, 100]}]
                }
            ],
            "validation_checks": [],
            "meta": {
                "regions_detected": 15,
                "timestamp": "2026-09-04T12:00:00Z"
            }
        }

    def test_01_save_and_retrieve_db_record(self):
        """Verify save_inspection and retrieval by inspection_id."""
        saved = save_inspection(self.sample_analysis, filename="test_pkg.png")
        self.assertIn("inspection_id", saved)
        insp_id = saved["inspection_id"]

        fetched = get_inspection_by_id(insp_id)
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched["inspection_id"], insp_id)
        self.assertEqual(fetched["product"]["product_name"], "Test Biscuits")

    def test_02_get_inspections_endpoint(self):
        """Verify GET /api/inspections endpoint returns list of records."""
        save_inspection(self.sample_analysis, filename="test_endpoint.png")
        response = self.client.get("/api/inspections?limit=10")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        if data:
            self.assertIn("inspection_id", data[0])
            self.assertIn("compliance_score", data[0])

    def test_03_get_single_inspection_endpoint(self):
        """Verify GET /api/inspections/{id} endpoint."""
        saved = save_inspection(self.sample_analysis, filename="test_single.png")
        insp_id = saved["inspection_id"]

        response = self.client.get(f"/api/inspections/{insp_id}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["inspection_id"], insp_id)

    def test_04_get_nonexistent_inspection(self):
        """Verify GET /api/inspections/{id} returns 404 for missing record."""
        response = self.client.get("/api/inspections/insp_nonexistent_999999")
        self.assertEqual(response.status_code, 404)

    def test_05_save_and_stream_image(self):
        """Verify saving image to GridFS and streaming via /api/images/{file_id}."""
        from backend.database import save_image_to_gridfs, get_image_from_gridfs
        dummy_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
        file_id = save_image_to_gridfs(dummy_png, filename="dummy.png", content_type="image/png")
        self.assertTrue(file_id)

        # Verify direct db retrieval
        retrieved = get_image_from_gridfs(file_id)
        self.assertIsNotNone(retrieved)
        img_bytes, filename, content_type = retrieved
        self.assertEqual(img_bytes, dummy_png)
        self.assertEqual(filename, "dummy.png")

        # Verify API streaming endpoint
        res = self.client.get(f"/api/images/{file_id}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.content, dummy_png)
        self.assertIn("image/png", res.headers.get("content-type", ""))

        # Verify inspection saved with image references
        saved = save_inspection(self.sample_analysis, filename="pkg_with_img.png", image_file_ids=[file_id])
        self.assertIn("image_file_ids", saved)
        self.assertIn(file_id, saved["image_file_ids"])
        self.assertIn("image_urls", saved)
        self.assertEqual(saved["image_urls"], [f"/api/images/{file_id}"])


if __name__ == "__main__":
    unittest.main()
