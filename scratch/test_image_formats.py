import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))

from PIL import Image
import numpy as np
from pipeline.ocr_engine import run_ocr

scratch = root / "scratch"

# Test 1: RGBA PNG
rgba_img = Image.new("RGBA", (400, 200), (255, 255, 255, 128))
rgba_path = scratch / "test_rgba.png"
rgba_img.save(rgba_path)

# Test 2: CMYK JPEG
cmyk_img = Image.new("CMYK", (400, 200), (0, 100, 100, 0))
cmyk_path = scratch / "test_cmyk.jpg"
cmyk_img.save(cmyk_path)

# Test 3: Grayscale
gray_img = Image.new("L", (400, 200), 200)
gray_path = scratch / "test_gray.png"
gray_img.save(gray_path)

# Test 4: Palette
p_img = Image.new("P", (400, 200))
p_path = scratch / "test_p.png"
p_img.save(p_path)

print("Testing format compatibility with run_ocr...")
for p in [rgba_path, cmyk_path, gray_path, p_path]:
    try:
        res = run_ocr(p)
        print(f"{p.name}: OK, found {len(res)} text items")
    except Exception as e:
        print(f"{p.name}: FAILED -> {type(e).__name__}: {e}")
