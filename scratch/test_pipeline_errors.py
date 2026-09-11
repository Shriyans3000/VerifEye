import sys
from pathlib import Path
import traceback

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))

from backend.services.pipeline import analyze_image, analyze_images

images_to_test = [
    root / "test_images" / "test_image2.png",
    root / "test_images" / "test_label.jpeg",
    root / "test_images" / "parle_g_gold_back.jpeg",
    root / "test_images" / "synthetic" / "test_image2_blur_sigma2_5.png",
    root / "test_images" / "synthetic" / "test_image2_low_contrast.png",
    root / "test_images" / "synthetic" / "synthetic_deliberate_zero_mrp.png",
    root / "test_images" / "synthetic" / "synthetic_adversarial_promo.png",
]

# Also create an empty/blank image, a non-text image, an unusual aspect ratio image
from PIL import Image
blank_path = root / "scratch" / "blank.png"
blank_img = Image.new("RGB", (300, 300), color=(255, 255, 255))
blank_img.save(blank_path)
images_to_test.append(blank_path)

noisy_path = root / "scratch" / "noise.png"
import numpy as np
noise_arr = np.random.randint(0, 256, (400, 400, 3), dtype=np.uint8)
Image.fromarray(noise_arr).save(noisy_path)
images_to_test.append(noisy_path)

print("Starting pipeline test on multiple images...")
for img in images_to_test:
    print(f"\n--- Testing: {img.name} ---")
    try:
        res = analyze_image(img)
        status = res.get("status")
        score = res.get("compliance_score")
        checks_count = len(res.get("checks", []))
        passed = res.get("summary", {}).get("passed")
        print(f"SUCCESS: status={status}, score={score}, checks={checks_count}, passed={passed}")
    except Exception as e:
        print(f"FAILED: {type(e).__name__}: {e}")
        traceback.print_exc()
