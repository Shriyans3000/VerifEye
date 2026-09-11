import sys
from pathlib import Path
root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))

from PIL import Image
import numpy as np
from pipeline.ocr_engine import get_ocr_engine

ocr = get_ocr_engine()
img_path = root / "test_images" / "test_image2.png"
pil_img = Image.open(img_path).convert("RGB")
np_img = np.array(pil_img) # RGB
np_bgr = np_img[:, :, ::-1] # BGR

print("Testing ocr.predict with numpy array...")
try:
    res = ocr.predict(np_bgr)
    print(f"NumPy BGR array prediction SUCCESS! Found {len(res)} results.")
except Exception as e:
    print("NumPy array prediction failed:", type(e).__name__, e)
