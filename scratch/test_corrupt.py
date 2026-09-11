import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))

from backend.services.pipeline import analyze_image

scratch = root / "scratch"

# Test 1: Corrupted JPEG (half header, junk bytes)
corrupt_jpg = scratch / "corrupt.jpg"
with open(corrupt_jpg, "wb") as f:
    f.write(b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00" + b"\x00" * 50)

try:
    res = analyze_image(corrupt_jpg)
    print("Corrupt jpg result:", res)
except Exception as e:
    print("Corrupt jpg FAILED with exception:", type(e).__name__, e)
