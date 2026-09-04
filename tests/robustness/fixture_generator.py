"""
VerifEye Phase 5: Synthetic Fixture & Transformation Generator
Generates controlled, reproducible synthetic test fixtures and image transformations
for robustness, adversarial, and compliance validation.
All fixtures are stored under test_images/synthetic/ and cataloged in fixtures_manifest.json.
"""

import json
import os
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = Path(__file__).resolve().parent.parent.parent
TEST_IMAGES_DIR = BASE_DIR / "test_images"
SYNTHETIC_DIR = TEST_IMAGES_DIR / "synthetic"
MANIFEST_PATH = SYNTHETIC_DIR / "fixtures_manifest.json"


def ensure_dir(path: Path):
    path.mkdir(parents=True, exist_ok=True)


def get_font(size=20):
    try:
        return ImageFont.truetype("arial.ttf", size)
    except Exception:
        return ImageFont.load_default()


def generate_transformations(source_image_path: Path) -> dict:
    """Generate controlled image degradation and orientation transformations."""
    if not source_image_path.exists():
        raise FileNotFoundError(f"Source image not found: {source_image_path}")

    img_bgr = cv2.imread(str(source_image_path))
    h, w = img_bgr.shape[:2]
    fixtures = {}

    # 1. Gaussian Blur (sigma=1.5 and sigma=2.5)
    blur_1_5 = cv2.GaussianBlur(img_bgr, (7, 7), 1.5)
    p = SYNTHETIC_DIR / "test_image2_blur_sigma1_5.png"
    cv2.imwrite(str(p), blur_1_5)
    fixtures["test_image2_blur_sigma1_5.png"] = {
        "category": "Category 4: OCR-Difficult Images",
        "type": "gaussian_blur",
        "parameters": {"sigma": 1.5, "ksize": 7},
        "description": "Mild Gaussian blur simulating slight camera defocus",
        "ground_truth_reference": "test_image2.png"
    }

    blur_2_5 = cv2.GaussianBlur(img_bgr, (11, 11), 2.5)
    p = SYNTHETIC_DIR / "test_image2_blur_sigma2_5.png"
    cv2.imwrite(str(p), blur_2_5)
    fixtures["test_image2_blur_sigma2_5.png"] = {
        "category": "Category 4: OCR-Difficult Images",
        "type": "gaussian_blur",
        "parameters": {"sigma": 2.5, "ksize": 11},
        "description": "Heavy Gaussian blur simulating out-of-focus camera",
        "ground_truth_reference": "test_image2.png"
    }

    # 2. Low Contrast
    low_contrast = cv2.convertScaleAbs(img_bgr, alpha=0.45, beta=60)
    p = SYNTHETIC_DIR / "test_image2_low_contrast.png"
    cv2.imwrite(str(p), low_contrast)
    fixtures["test_image2_low_contrast.png"] = {
        "category": "Category 4: OCR-Difficult Images",
        "type": "low_contrast",
        "parameters": {"alpha": 0.45, "beta": 60},
        "description": "Severely reduced dynamic range simulating poor lighting",
        "ground_truth_reference": "test_image2.png"
    }

    # 3. Gamma Variation (Low Gamma = washed out, High Gamma = darkened)
    inv_gamma_0_6 = 1.0 / 0.6
    table_0_6 = np.array([((i / 255.0) ** inv_gamma_0_6) * 255 for i in np.arange(0, 256)]).astype("uint8")
    gamma_0_6 = cv2.LUT(img_bgr, table_0_6)
    p = SYNTHETIC_DIR / "test_image2_gamma_0_6.png"
    cv2.imwrite(str(p), gamma_0_6)
    fixtures["test_image2_gamma_0_6.png"] = {
        "category": "Category 4: OCR-Difficult Images",
        "type": "gamma_variation",
        "parameters": {"gamma": 0.6},
        "description": "Darkened exposure curve (gamma 0.6)",
        "ground_truth_reference": "test_image2.png"
    }

    inv_gamma_1_5 = 1.0 / 1.5
    table_1_5 = np.array([((i / 255.0) ** inv_gamma_1_5) * 255 for i in np.arange(0, 256)]).astype("uint8")
    gamma_1_5 = cv2.LUT(img_bgr, table_1_5)
    p = SYNTHETIC_DIR / "test_image2_gamma_1_5.png"
    cv2.imwrite(str(p), gamma_1_5)
    fixtures["test_image2_gamma_1_5.png"] = {
        "category": "Category 4: OCR-Difficult Images",
        "type": "gamma_variation",
        "parameters": {"gamma": 1.5},
        "description": "Overexposed washed out lighting (gamma 1.5)",
        "ground_truth_reference": "test_image2.png"
    }

    # 4. Synthetic Uneven Lighting / Shadow
    gradient = np.linspace(0.3, 1.0, w, dtype=np.float32)
    gradient_2d = np.tile(gradient, (h, 1))
    shadow_bgr = (img_bgr.astype(np.float32) * gradient_2d[:, :, np.newaxis]).clip(0, 255).astype(np.uint8)
    p = SYNTHETIC_DIR / "test_image2_shadow.png"
    cv2.imwrite(str(p), shadow_bgr)
    fixtures["test_image2_shadow.png"] = {
        "category": "Category 4: OCR-Difficult Images",
        "type": "synthetic_shadow",
        "parameters": {"gradient": "horizontal 30% to 100%"},
        "description": "Uneven diagonal shadow cast across the package label",
        "ground_truth_reference": "test_image2.png"
    }

    # 5. JPEG High Compression Artifacts (Quality 20)
    p = SYNTHETIC_DIR / "test_image2_jpeg_q20.jpg"
    cv2.imwrite(str(p), img_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 20])
    fixtures["test_image2_jpeg_q20.jpg"] = {
        "category": "Category 4: OCR-Difficult Images",
        "type": "jpeg_compression",
        "parameters": {"quality": 20},
        "description": "Severe 8x8 block compression artifacts",
        "ground_truth_reference": "test_image2.png"
    }

    # 6. Perspective Distortion
    pts1 = np.float32([[0, 0], [w, 0], [0, h], [w, h]])
    pts2 = np.float32([[w * 0.05, h * 0.05], [w * 0.95, h * 0.02], [0, h * 0.95], [w, h]])
    matrix = cv2.getPerspectiveTransform(pts1, pts2)
    perspective = cv2.warpPerspective(img_bgr, matrix, (w, h), borderMode=cv2.BORDER_REPLICATE)
    p = SYNTHETIC_DIR / "test_image2_perspective.png"
    cv2.imwrite(str(p), perspective)
    fixtures["test_image2_perspective.png"] = {
        "category": "Category 4: OCR-Difficult Images",
        "type": "perspective_warp",
        "parameters": {"skew_pct": 5},
        "description": "Non-planar camera angle perspective skew",
        "ground_truth_reference": "test_image2.png"
    }

    # 7. Rotation Angles (0°, +5°, +10°, +15°, -10°, -15°)
    angles = [5, 10, 15, -10, -15]
    for angle in angles:
        center = (w // 2, h // 2)
        rot_mat = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(img_bgr, rot_mat, (w, h), borderMode=cv2.BORDER_REPLICATE)
        name = f"test_image2_rot_{'neg' + str(abs(angle)) if angle < 0 else str(angle)}.png"
        p = SYNTHETIC_DIR / name
        cv2.imwrite(str(p), rotated)
        fixtures[name] = {
            "category": "Category 6: Rotated / Distorted Labels",
            "type": "rotation",
            "parameters": {"angle_degrees": angle},
            "description": f"Package label rotated by {angle} degrees",
            "ground_truth_reference": "test_image2.png"
        }

    return fixtures


def create_label_image(lines: list[str], filename: str, metadata: dict) -> Path:
    """Helper to render synthetic commodity labels with clear typography."""
    width, height = 750, 750
    img = Image.new("RGB", (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Outer package border
    draw.rectangle([(20, 20), (width - 20, height - 20)], outline=(30, 30, 30), width=3)
    draw.rectangle([(28, 28), (width - 28, height - 28)], outline=(200, 200, 200), width=1)

    # Header banner
    draw.rectangle([(30, 30), (width - 30, 80)], fill=(245, 245, 245))
    header_font = get_font(22)
    draw.text((45, 45), "STATUTORY DECLARATIONS / CONSUMER PACK", fill=(20, 20, 20), font=header_font)

    # Render lines
    y_pos = 100
    font = get_font(18)
    small_font = get_font(14)

    for line in lines:
        if line.startswith("---"):
            draw.line([(40, y_pos), (width - 40, y_pos)], fill=(200, 200, 200), width=1)
            y_pos += 15
        elif line.startswith("[SMALL]"):
            draw.text((45, y_pos), line.replace("[SMALL]", "").strip(), fill=(80, 80, 80), font=small_font)
            y_pos += 26
        elif line.startswith("[BOLD]"):
            draw.text((45, y_pos), line.replace("[BOLD]", "").strip(), fill=(0, 0, 0), font=header_font)
            y_pos += 34
        else:
            draw.text((45, y_pos), line, fill=(30, 30, 30), font=font)
            y_pos += 30

    # Synthetic label footer watermark
    footer_text = "SYNTHETIC TEST FIXTURE • VERIFEYE TESTBED • LEGAL METROLOGY"
    draw.text((45, height - 45), footer_text, fill=(160, 160, 160), font=small_font)

    output_path = SYNTHETIC_DIR / filename
    img.save(str(output_path), format="PNG")
    return output_path


def generate_synthetic_labels() -> dict:
    """Generate synthetic labels covering Categories 2, 3, 5, and 8."""
    fixtures = {}

    # Category 2: Missing MRP
    lines_no_mrp = [
        "[BOLD] FRESH VALUE COOKIES",
        "[SMALL] Common / Generic Name: Biscuits",
        "---",
        "Manufactured & Packed By: BAKEWELL FOODS PVT LTD",
        "Plot 42, Industrial Area, Andheri East, Mumbai, MH-400093",
        "Country of Origin: India",
        "Net Quantity: 200 g",
        "---",
        "PKD: 15/06/2024",
        "BEST BEFORE: 6 MONTHS FROM PACKAGING",
        "Batch No: BK-994",
        "---",
        "Consumer Care Officer: Tel: 022-28391234",
        "Email: care@bakewellfoods.in",
    ]
    create_label_image(lines_no_mrp, "synthetic_missing_mrp.png", {})
    fixtures["synthetic_missing_mrp.png"] = {
        "category": "Category 2: Missing Declarations",
        "type": "missing_mrp",
        "expected_result": {"mrp_status": "MISSING", "overall_status": "REVIEW_REQUIRED"},
        "description": "Label with all required declarations except MRP"
    }

    # Category 2: Missing Net Quantity
    lines_no_qty = [
        "[BOLD] ROYAL ASSAM CTC TEA",
        "[SMALL] Common / Generic Name: Black Tea",
        "---",
        "Manufacturer: APEX BEVERAGES LTD",
        "Tea Estate 12, Dibrugarh, Assam - 786001",
        "Country of Origin: India",
        "MRP ₹ 250.00 (INCL. OF ALL TAXES)",
        "---",
        "PKD: 10/04/2024",
        "Batch No: AT-2024-B",
        "---",
        "Customer Care Cell: 1800-22-9988",
        "Email: contact@apexbeverages.com"
    ]
    create_label_image(lines_no_qty, "synthetic_missing_quantity.png", {})
    fixtures["synthetic_missing_quantity.png"] = {
        "category": "Category 2: Missing Declarations",
        "type": "missing_quantity",
        "expected_result": {"net_quantity_status": "MISSING", "overall_status": "REVIEW_REQUIRED"},
        "description": "Label with all required declarations except Net Quantity"
    }

    # Category 2: Missing Manufacturer Name & Address
    lines_no_mfg = [
        "[BOLD] CRUNCHY CORN FLAKES",
        "[SMALL] Common / Generic Name: Breakfast Cereal",
        "---",
        "Net Quantity: 500 g",
        "MRP ₹ 180.00 (Inclusive of all taxes)",
        "Unit Sale Price: ₹0.36 per g",
        "Country of Origin: India",
        "---",
        "Packed: 01/05/2024",
        "Batch No: CF-501",
        "Consumer Care: Phone: 011-45678900 | Email: feedback@cereal.in"
    ]
    create_label_image(lines_no_mfg, "synthetic_missing_manufacturer.png", {})
    fixtures["synthetic_missing_manufacturer.png"] = {
        "category": "Category 2: Missing Declarations",
        "type": "missing_manufacturer",
        "expected_result": {"manufacturer_status": "MISSING", "overall_status": "REVIEW_REQUIRED"},
        "description": "Label omitting manufacturer name and address"
    }

    # Category 3: Deliberate Violation - Negative or Zero MRP
    lines_zero_mrp = [
        "[BOLD] DELUXE INSTANT NOODLES",
        "[SMALL] Common / Generic Name: Instant Noodles",
        "---",
        "Manufactured By: TASTY MEALS LTD",
        "Survey 88, Whitefield, Bangalore, KA - 560066",
        "Country of Origin: India",
        "Net Quantity: 70 g",
        "MRP ₹ 0.00 (INCL. OF ALL TAXES)",
        "---",
        "PKD: 20/07/2024",
        "Batch No: ND-77",
        "Consumer Care: Phone: 080-28451122 | Email: noodles@tastymeals.com"
    ]
    create_label_image(lines_zero_mrp, "synthetic_deliberate_zero_mrp.png", {})
    fixtures["synthetic_deliberate_zero_mrp.png"] = {
        "category": "Category 3: Deliberate Compliance Violations",
        "type": "invalid_mrp_zero",
        "expected_result": {"mrp_status": "FAIL", "overall_status": "NON_COMPLIANT"},
        "description": "Deliberate violation: declared MRP is ₹0.00 (non-positive numeric)"
    }

    # Category 3: Deliberate Violation - Date Inconsistency (Expiry before Mfg)
    lines_date_inconsistency = [
        "[BOLD] PRO-BIOTIC HEALTH DRINK",
        "[SMALL] Common / Generic Name: Fermented Dairy Beverage",
        "---",
        "Manufactured By: VITA DAIRY FOODS PVT LTD",
        "GIDC Estate, Anand, Gujarat - 388001",
        "Country of Origin: India",
        "Net Quantity: 200 ml",
        "MRP ₹ 35.00 (Incl. of all taxes)",
        "---",
        "MFG DATE: 15/08/2024",
        "USE BY DATE: 10/05/2023",
        "Batch: VT-908",
        "Consumer Care: Phone: 02692-234567 | Email: care@vitadairy.in"
    ]
    create_label_image(lines_date_inconsistency, "synthetic_deliberate_date_inconsistency.png", {})
    fixtures["synthetic_deliberate_date_inconsistency.png"] = {
        "category": "Category 3: Deliberate Compliance Violations",
        "type": "date_chronology_violation",
        "expected_result": {"date_validation_status": "FAIL", "overall_status": "NON_COMPLIANT"},
        "description": "Deliberate violation: Use-by date (10/05/2023) precedes Mfg date (15/08/2024)"
    }

    # Category 5: OCR Trap - PIN Code Resembling Date
    lines_pin_trap = [
        "[BOLD] ORGANIC WHEAT ATTA",
        "[SMALL] Common / Generic Name: Whole Wheat Flour",
        "---",
        "Manufactured & Packed By: NATURE GRAINS LTD",
        "Plot 9, Village Khed, Pune PIN 400057 Maharashtra",
        "Country of Origin: India",
        "Net Quantity: 5 kg",
        "MRP ₹ 240.00 (INCL OF ALL TAXES)",
        "Unit Sale Price: ₹48.00 per kg",
        "---",
        "PKD: 12/03/2024",
        "Batch Number: NG-400057-X",
        "---",
        "Consumer Cell: 020-27654321 | Email: support@naturegrains.in"
    ]
    create_label_image(lines_pin_trap, "synthetic_pin_code_trap.png", {})
    fixtures["synthetic_pin_code_trap.png"] = {
        "category": "Category 5: OCR Traps",
        "type": "pincode_vs_date",
        "expected_result": {"packed_date": "12/03/2024", "pin_not_date": True},
        "description": "Contains PIN 400057 and Batch NG-400057-X, must correctly map PKD 12/03/2024"
    }

    # Category 5: OCR Trap - Multiple Dates
    lines_multi_dates = [
        "[BOLD] PURE GOW GHEE",
        "[SMALL] Common / Generic Name: Clarified Butter",
        "---",
        "Packer: KRISHNA DAIRY PRODUCTS",
        "Dairy Road, Karnal, Haryana - 132001",
        "Country of Origin: India",
        "Net Quantity: 1 L",
        "MRP ₹ 650.00 (INCL. OF ALL TAXES)",
        "---",
        "MFG DATE: 01/01/2024",
        "PKD DATE: 05/01/2024",
        "USE BY DATE: 31/12/2024",
        "Batch: KG-101",
        "Consumer Care: Phone: 0184-225588 | Email: care@krishnadairy.com"
    ]
    create_label_image(lines_multi_dates, "synthetic_multiple_dates.png", {})
    fixtures["synthetic_multiple_dates.png"] = {
        "category": "Category 5: OCR Traps",
        "type": "multiple_dates",
        "expected_result": {"mfg_or_pkd": "05/01/2024 or 01/01/2024", "use_by": "31/12/2024"},
        "description": "Contains distinct MFG, PKD, and USE BY dates"
    }

    # Category 5: OCR Trap - Multiple Phones
    lines_multi_phones = [
        "[BOLD] SPARKLING MINERAL WATER",
        "[SMALL] Common / Generic Name: Packaged Drinking Water",
        "---",
        "Bottled By: AQUA SPRINGS BEVERAGES",
        "Plant 4, MIDC, Mahad, Raigad, MH-402301",
        "Factory Tel: 02145-232111 (For Business Enquiries)",
        "Country of Origin: India",
        "Net Quantity: 1 L",
        "MRP ₹ 20.00 (INCL OF ALL TAXES)",
        "---",
        "PKD: 18/06/2024 | Batch: AQ-44",
        "FOR CONSUMER COMPLAINTS / GRIEVANCE:",
        "Call Toll Free Helpline: 1800-220-4444",
        "Email: care@aquasprings.in"
    ]
    create_label_image(lines_multi_phones, "synthetic_multiple_phones.png", {})
    fixtures["synthetic_multiple_phones.png"] = {
        "category": "Category 5: OCR Traps",
        "type": "multiple_phones",
        "expected_result": {"consumer_care_phone": "1800-220-4444"},
        "description": "Contains factory phone and consumer grievance helpline"
    }

    # Category 5: OCR Trap - Embedded MRP in Surrounding Text
    lines_embedded_mrp = [
        "[BOLD] CRUNCHY PEANUT BUTTER",
        "[SMALL] Common / Generic Name: Peanut Butter Spread",
        "---",
        "Manufacturer: NUTRIFOODS INDIA PVT LTD",
        "Sector 58, Mohali, Punjab - 160059",
        "Country of Origin: India",
        "Net Quantity: 350 g",
        "---",
        "[BOLD] SPECIAL MONSOON OFFER MRP ₹199.00 INCL OF TAXES",
        "Unit Sale Price: ₹0.57 per g",
        "PKD: 02/07/2024 | Batch: PB-778",
        "Consumer Care: Tel: 0172-2244888 | Email: customercare@nutrifoods.in"
    ]
    create_label_image(lines_embedded_mrp, "synthetic_embedded_mrp.png", {})
    fixtures["synthetic_embedded_mrp.png"] = {
        "category": "Category 5: OCR Traps",
        "type": "embedded_mrp",
        "expected_result": {"mrp": "199.00 or 199", "tax_inclusive": True},
        "description": "MRP embedded in promotional header phrase"
    }

    # Category 5: OCR Trap - Quantity Variants (Extra / Multiline)
    lines_quantity_extra = [
        "[BOLD] PARLE-G GOLD GLUCOSE BISCUITS",
        "[SMALL] Common / Generic Name: Biscuits",
        "---",
        "Manufactured by: PARLE PRODUCTS PVT LTD",
        "Vile Parle East, Mumbai, MH - 400057",
        "Country of Origin: India",
        "---",
        "[BOLD] NET WEIGHT: 110g + 20g EXTRA = 130g",
        "MRP ₹ 10.00 (INCLUSIVE OF ALL TAXES)",
        "PKD: 29/07/2024 | BATCH: KA 29C",
        "Customer Service: 022-66916929 | cs@parle.biz"
    ]
    create_label_image(lines_quantity_extra, "synthetic_quantity_extra.png", {})
    fixtures["synthetic_quantity_extra.png"] = {
        "category": "Category 5: OCR Traps",
        "type": "quantity_extra_variant",
        "expected_result": {"net_quantity_contains": "110g"},
        "description": "Composite quantity formulation with promotional extra grammage"
    }

    # Category 8: Adversarial Promotional Content
    lines_adversarial = [
        "[BOLD] MEGA VALUE DETERGENT POWDER",
        "[BOLD] BUY 1 GET 1 FREE! SAVE ₹ 50 TODAY!",
        "[SMALL] Common / Generic Name: Laundry Detergent",
        "---",
        "100% PURE AND NATURAL ACTIVE STAIN REMOVAL FORMULA",
        "Manufactured By: CLEANPRO CHEMICALS INDIA",
        "Plot 7, GIDC Estate, Vapi, Gujarat - 396195",
        "Marketed By: GLOBAL RETAIL VENTURES LTD, Mumbai",
        "Country of Origin: India",
        "---",
        "Regular Price Was: ₹ 150.00",
        "NOW SPECIAL MRP ₹ 100.00 INCLUSIVE OF ALL TAXES",
        "Total Quantity: 1 kg (Net Wt: 2 x 500 g packs)",
        "PKD: 22/08/2024 | Batch: CP-991",
        "For Feedback Call Customer Desk: 0260-2431100 | care@cleanpro.in"
    ]
    create_label_image(lines_adversarial, "synthetic_adversarial_promo.png", {})
    fixtures["synthetic_adversarial_promo.png"] = {
        "category": "Category 8: Adversarial Label Content",
        "type": "adversarial_promo_distraction",
        "expected_result": {"mrp": "100.00", "product_name_not": "100% PURE"},
        "description": "Adversarial promotional copy with competing prices and claims"
    }

    return fixtures


def main():
    ensure_dir(SYNTHETIC_DIR)
    source_img = TEST_IMAGES_DIR / "test_image2.png"

    all_manifest = {}
    print(f"Generating physical transformations from {source_img}...")
    trans_manifest = generate_transformations(source_img)
    all_manifest.update(trans_manifest)

    print("Generating controlled synthetic test labels...")
    synth_manifest = generate_synthetic_labels()
    all_manifest.update(synth_manifest)

    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(all_manifest, f, indent=2)

    print(f"Success! Generated {len(all_manifest)} test fixtures in {SYNTHETIC_DIR}")
    print(f"Manifest written to {MANIFEST_PATH}")


if __name__ == "__main__":
    main()
