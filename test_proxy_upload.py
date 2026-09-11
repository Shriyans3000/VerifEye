import httpx

if __name__ == "__main__":
    img_path = r"C:\Users\shour\Downloads\ChatGPT Image Sep 11, 2026, 01_03_26 PM.png"
    with open(img_path, "rb") as f:
        files = {"file": ("ChatGPT Image Sep 11, 2026, 01_03_26 PM.png", f, "image/png")}
        r = httpx.post("http://localhost:5174/api/analyze", files=files, timeout=600.0)

    print("HTTP Status Code:", r.status_code)
    data = r.json()
    print("Success:", data.get("success"))
    print("Overall Status:", data.get("overall_status"))
    print("Compliance Score:", data.get("compliance_score"))
    print("Checks count:", len(data.get("checks", [])))
    print("Product Name:", data.get("product", {}).get("product_name"))
    print("Processing Notes:", data.get("meta", {}).get("processing_notes"))
