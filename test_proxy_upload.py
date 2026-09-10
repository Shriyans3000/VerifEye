import httpx

if __name__ == "__main__":
    with open("test_images/test_image2.png", "rb") as f:
        files = {"file": ("test_image2.png", f, "image/png")}
        r = httpx.post("http://localhost:5174/api/analyze", files=files, timeout=60.0)

    print("HTTP Status Code:", r.status_code)
    data = r.json()
    print("Success:", data.get("success"))
    print("Overall Status:", data.get("overall_status"))
    print("Compliance Score:", data.get("compliance_score"))
    print("Checks count:", len(data.get("checks", [])))
