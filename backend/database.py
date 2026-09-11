import logging
import uuid
import base64  # ADD
import re
from datetime import datetime
from typing import Any  # ADD
from pymongo import MongoClient, errors  # pyrefly: ignore [missing-import] # type: ignore
import gridfs  # pyrefly: ignore [missing-import] # type: ignore  # ADD
from bson import ObjectId  # pyrefly: ignore [missing-import] # type: ignore  # ADD
from backend.config import MONGODB_URI, MONGODB_DB_NAME

logger = logging.getLogger("verifeye.database")

try:
    import certifi  # pyrefly: ignore [missing-import] # type: ignore
    _CA_FILE = certifi.where()
except Exception:
    _CA_FILE = None

_client = None
_db_available = True
DEFAULT_SEED_INSPECTIONS = [
    {
        "inspection_id": "INSP-HLD-BHUJIA-01",
        "timestamp": "2026-09-08T14:22:10.000Z",
        "filename": "haldiram_aloo_bhujia_150g.png",
        "status": "PASS",
        "compliance_score": 100.0,
        "product": {
            "brand": "Haldiram's",
            "product_name": "Aloo Bhujia (Spicy Potato & Gram Flour Noodles)",
            "category": "Packaged Savoury Snacks",
            "manufacturer": "Haldiram Snacks Pvt. Ltd., Plot No. 67, Sector 68, Noida, U.P. 201307",
            "net_quantity": "150 g",
            "mrp": "₹45.00 (Incl. of all taxes)",
            "mrp_unit_price": "₹0.30 per g",
            "batch_number": "HLD26A09",
            "mfg_date": "08/2026",
            "expiry_date": "02/2027",
            "consumer_care": "care@haldirams.com / +91-120-2400240",
            "fssai_license": "10012051000096",
            "veg_logo": "Green Vegetarian Dot Verified",
            "nutrition": {
                "total_fat_g": 42.0,
                "saturated_fat_g": 18.0,
                "total_sugar_g": 2.0,
                "sodium_mg": 740.0
            }
        },
        "summary": {
            "passed": 12,
            "failed": 0,
            "review_required": 0,
            "total_checks": 12
        },
        "checks": [
            {"rule_id": "LM_RULE_06_1_A", "category": "Product Identification", "description": "Generic / Common Name of Commodity", "status": "PASS", "confidence": 0.98, "evidence_text": "Aloo Bhujia (Spicy Potato & Gram Flour Noodles)", "requirement": "Clear generic identification required under Rule 6(1)(a)"},
            {"rule_id": "LM_RULE_06_1_B", "category": "Manufacturer Details", "description": "Name and Complete Address of Manufacturer / Packer", "status": "PASS", "confidence": 0.96, "evidence_text": "Haldiram Snacks Pvt. Ltd., Plot No. 67, Sector 68, Noida, U.P. 201307", "requirement": "Complete manufacturer identity under Rule 6(1)(b)"},
            {"rule_id": "LM_RULE_06_1_C", "category": "Net Quantity", "description": "Standard Net Weight / Volume Metric Declaration", "status": "PASS", "confidence": 0.99, "evidence_text": "Net Weight: 150 g", "requirement": "Standard legal units under Rule 6(1)(c)"},
            {"rule_id": "LM_RULE_06_1_D", "category": "Date of Packaging", "description": "Month and Year of Manufacture / Packing", "status": "PASS", "confidence": 0.97, "evidence_text": "Mfg: 08/2026, Best Before: 6 Months", "requirement": "Month and year mandatory under Rule 6(1)(d)"},
            {"rule_id": "LM_RULE_06_1_E", "category": "Consumer Pricing", "description": "Maximum Retail Price (MRP) & Unit Sale Price", "status": "PASS", "confidence": 0.98, "evidence_text": "MRP ₹45.00 (Incl. of all taxes) Unit Price: ₹0.30/g", "requirement": "Statutory MRP under Rule 6(1)(e)"},
            {"rule_id": "LM_RULE_06_1_F", "category": "Consumer Care", "description": "Consumer Grievance Redressal Mechanism", "status": "PASS", "confidence": 0.95, "evidence_text": "Email: care@haldirams.com, Tel: +91-120-2400240", "requirement": "Name, address, telephone & email under Rule 6(1)(f)"}
        ],
        "validation_checks": [
            {"check_name": "Unit Price Calculation", "status": "PASS", "details": "45.00 / 150g = ₹0.30 per g (Accurate)"},
            {"check_name": "Date Chronology", "status": "PASS", "details": "Manufacture Aug 2026 precedes Expiry Feb 2027"}
        ],
        "meta": {
            "timestamp": "2026-09-08T14:22:10.000Z",
            "inspector_id": "LM-DEL-OFFICER-402",
            "jurisdiction": "Delhi NCR Enforcement Division"
        }
    },
    {
        "inspection_id": "INSP-LAYS-GRN-01",
        "timestamp": "2026-09-07T11:15:45.000Z",
        "filename": "lays_cream_and_onion_green_chips_50g.png",
        "status": "REVIEW_REQUIRED",
        "compliance_score": 92.0,
        "product": {
            "brand": "Lay's",
            "product_name": "American Style Cream & Onion (Green Chips)",
            "category": "Potato Chips & Crisps",
            "manufacturer": "PepsiCo India Holdings Pvt. Ltd., Level 3-5, Pioneer Square, Sector 62, Golf Course Ext Rd, Gurugram, Haryana 122102",
            "net_quantity": "50 g",
            "mrp": "₹20.00 (Incl. of all taxes)",
            "mrp_unit_price": "₹0.40 per g",
            "batch_number": "LAYS-GRN-842B",
            "mfg_date": "07/2026",
            "expiry_date": "11/2026",
            "consumer_care": "consumer.feedback@pepsico.com / 1800-22-4020",
            "fssai_license": "10014064000435",
            "veg_logo": "Green Vegetarian Dot Present",
            "nutrition": {
                "total_fat_g": 34.5,
                "saturated_fat_g": 14.2,
                "total_sugar_g": 4.5,
                "sodium_mg": 670.0
            }
        },
        "summary": {
            "passed": 10,
            "failed": 0,
            "review_required": 2,
            "total_checks": 12
        },
        "checks": [
            {"rule_id": "LM_RULE_06_1_A", "category": "Product Identification", "description": "Generic / Common Name of Commodity", "status": "PASS", "confidence": 0.99, "evidence_text": "Lay's American Style Cream & Onion Potato Chips", "requirement": "Clear generic identification required under Rule 6(1)(a)"},
            {"rule_id": "LM_RULE_06_1_B", "category": "Manufacturer Details", "description": "Name and Complete Address of Manufacturer / Packer", "status": "PASS", "confidence": 0.96, "evidence_text": "PepsiCo India Holdings Pvt. Ltd., Gurugram, Haryana", "requirement": "Complete manufacturer identity under Rule 6(1)(b)"},
            {"rule_id": "LM_RULE_06_1_C", "category": "Net Quantity", "description": "Standard Net Weight / Volume Metric Declaration", "status": "PASS", "confidence": 0.97, "evidence_text": "Net Weight: 50 g", "requirement": "Standard legal units under Rule 6(1)(c)"},
            {"rule_id": "LM_RULE_06_1_D", "category": "Date of Packaging", "description": "Month and Year of Manufacture / Packing", "status": "PASS", "confidence": 0.98, "evidence_text": "PKD: 07/2026, USE BY: 4 MONTHS", "requirement": "Month and year mandatory under Rule 6(1)(d)"},
            {"rule_id": "LM_RULE_06_1_E", "category": "Consumer Pricing", "description": "Maximum Retail Price (MRP) & Unit Sale Price", "status": "PASS", "confidence": 0.98, "evidence_text": "MRP Rs 20.00 incl. of all taxes (Rs 0.40/g)", "requirement": "Statutory MRP under Rule 6(1)(e)"},
            {"rule_id": "LM_RULE_READABILITY", "category": "Legibility & Contrast", "description": "Preservative and Emulsifier Font Contrast Assessment", "status": "REVIEW_REQUIRED", "confidence": 0.81, "evidence_text": "Contains permitted class II preservative (223 - Sodium Metabisulphite)", "requirement": "Officer visual inspection advised for small font size on curved foil corner"}
        ],
        "validation_checks": [
            {"check_name": "Unit Price Calculation", "status": "PASS", "details": "20.00 / 50g = ₹0.40 per g (Accurate)"},
            {"check_name": "Preservative Screening", "status": "REVIEW_REQUIRED", "details": "INS 223 identified, verify permitted category limits"}
        ],
        "meta": {
            "timestamp": "2026-09-07T11:15:45.000Z",
            "inspector_id": "LM-GUR-INSP-109",
            "jurisdiction": "Haryana Legal Metrology"
        }
    },
    {
        "inspection_id": "INSP-HLD-BHUJIA-02",
        "timestamp": "2026-09-05T09:40:00.000Z",
        "filename": "haldirams_bhujia_sev_400g.png",
        "status": "PASS",
        "compliance_score": 100.0,
        "product": {
            "brand": "Haldiram's",
            "product_name": "Bikaneri Bhujia Sev",
            "category": "Packaged Savoury Snacks",
            "manufacturer": "Haldiram Foods International Pvt. Ltd., 145/2, Bhandara Road, Nagpur 440035",
            "net_quantity": "400 g",
            "mrp": "₹85.00 (Incl. of all taxes)",
            "mrp_unit_price": "₹0.21 per g",
            "batch_number": "NGP-BHU-552",
            "mfg_date": "08/2026",
            "expiry_date": "02/2027",
            "consumer_care": "support@haldiramsnagpur.com / 1800-209-1234",
            "fssai_license": "10012022000338",
            "veg_logo": "Vegetarian Symbol Certified",
            "nutrition": {
                "total_fat_g": 39.0,
                "saturated_fat_g": 16.0,
                "total_sugar_g": 1.2,
                "sodium_mg": 810.0
            }
        },
        "summary": {
            "passed": 12,
            "failed": 0,
            "review_required": 0,
            "total_checks": 12
        },
        "checks": [
            {"rule_id": "LM_RULE_06_1_A", "category": "Product Identification", "description": "Generic / Common Name of Commodity", "status": "PASS", "confidence": 0.98, "evidence_text": "Bikaneri Bhujia Sev - Authentic Traditional Namkeen", "requirement": "Clear generic identification required under Rule 6(1)(a)"},
            {"rule_id": "LM_RULE_06_1_B", "category": "Manufacturer Details", "description": "Name and Complete Address of Manufacturer / Packer", "status": "PASS", "confidence": 0.97, "evidence_text": "Haldiram Foods International Pvt. Ltd., Bhandara Road, Nagpur 440035", "requirement": "Complete manufacturer identity under Rule 6(1)(b)"},
            {"rule_id": "LM_RULE_06_1_C", "category": "Net Quantity", "description": "Standard Net Weight / Volume Metric Declaration", "status": "PASS", "confidence": 0.99, "evidence_text": "Net Qty: 400 g", "requirement": "Standard legal units under Rule 6(1)(c)"}
        ],
        "validation_checks": [
            {"check_name": "Unit Price Calculation", "status": "PASS", "details": "85.00 / 400g = ₹0.21 per g (Accurate)"}
        ],
        "meta": {
            "timestamp": "2026-09-05T09:40:00.000Z",
            "inspector_id": "LM-MAH-INSP-881",
            "jurisdiction": "Maharashtra Legal Metrology"
        }
    },
    {
        "inspection_id": "INSP-LAYS-MASALA-02",
        "timestamp": "2026-09-03T16:05:12.000Z",
        "filename": "lays_indias_magic_masala_73g.png",
        "status": "PASS",
        "compliance_score": 100.0,
        "product": {
            "brand": "Lay's",
            "product_name": "India's Magic Masala Potato Chips",
            "category": "Potato Chips & Crisps",
            "manufacturer": "PepsiCo India Holdings Pvt. Ltd., Level 3-5, Pioneer Square, Gurugram, Haryana 122102",
            "net_quantity": "73 g",
            "mrp": "₹30.00 (Incl. of all taxes)",
            "mrp_unit_price": "₹0.41 per g",
            "batch_number": "LAYS-MAS-301",
            "mfg_date": "08/2026",
            "expiry_date": "12/2026",
            "consumer_care": "consumer.feedback@pepsico.com / 1800-22-4020",
            "fssai_license": "10014064000435",
            "veg_logo": "Green Vegetarian Dot Present"
        },
        "summary": {
            "passed": 12,
            "failed": 0,
            "review_required": 0,
            "total_checks": 12
        },
        "checks": [
            {"rule_id": "LM_RULE_06_1_A", "category": "Product Identification", "description": "Generic / Common Name of Commodity", "status": "PASS", "confidence": 0.99, "evidence_text": "Lay's India's Magic Masala Potato Chips", "requirement": "Rule 6(1)(a) verification"},
            {"rule_id": "LM_RULE_06_1_E", "category": "Consumer Pricing", "description": "Maximum Retail Price (MRP) & Unit Sale Price", "status": "PASS", "confidence": 0.98, "evidence_text": "MRP ₹30.00 incl. of all taxes (₹0.41/g)", "requirement": "Rule 6(1)(e) verification"}
        ],
        "validation_checks": [
            {"check_name": "Unit Price Calculation", "status": "PASS", "details": "30.00 / 73g = ₹0.41 per g (Accurate)"}
        ],
        "meta": {
            "timestamp": "2026-09-03T16:05:12.000Z",
            "inspector_id": "LM-DEL-OFFICER-402",
            "jurisdiction": "Delhi Enforcement"
        }
    },
    {
        "inspection_id": "INSP-BRIT-GD-01",
        "timestamp": "2026-09-02T10:18:22.000Z",
        "filename": "britannia_good_day_butter_cookies_100g.png",
        "status": "PASS",
        "compliance_score": 95.0,
        "product": {
            "brand": "Britannia",
            "product_name": "Good Day Rich Butter Cookies",
            "category": "Biscuits & Bakery",
            "manufacturer": "Britannia Industries Ltd., 5/1A Hungerford Street, Kolkata 700017",
            "net_quantity": "100 g",
            "mrp": "₹30.00 (Incl. of all taxes)",
            "mrp_unit_price": "₹0.30 per g",
            "batch_number": "BRT-GD-89B",
            "mfg_date": "08/2026",
            "expiry_date": "02/2027",
            "consumer_care": "feedback@britindia.com / 1800-425-4449",
            "fssai_license": "10015043001129",
            "veg_logo": "Vegetarian Certified"
        },
        "summary": {
            "passed": 11,
            "failed": 0,
            "review_required": 1,
            "total_checks": 12
        },
        "checks": [
            {"rule_id": "LM_RULE_06_1_A", "category": "Product Identification", "description": "Generic / Common Name of Commodity", "status": "PASS", "confidence": 0.98, "evidence_text": "Britannia Good Day Butter Cookies", "requirement": "Generic commodity name verified"}
        ],
        "validation_checks": [
            {"check_name": "Unit Price Calculation", "status": "PASS", "details": "30.00 / 100g = ₹0.30 per g (Accurate)"}
        ],
        "meta": {
            "timestamp": "2026-09-02T10:18:22.000Z",
            "inspector_id": "LM-KOL-INSP-204",
            "jurisdiction": "West Bengal Legal Metrology"
        }
    },
    {
        "inspection_id": "INSP-AMUL-TZ-01",
        "timestamp": "2026-09-01T08:30:15.000Z",
        "filename": "amul_taaza_toned_milk_500ml.png",
        "status": "PASS",
        "compliance_score": 100.0,
        "product": {
            "brand": "Amul",
            "product_name": "Taaza Homogenised Toned Milk",
            "category": "Dairy Products",
            "manufacturer": "Gujarat Co-operative Milk Marketing Federation Ltd. (GCMMF), Anand 388001, Gujarat",
            "net_quantity": "500 ml",
            "mrp": "₹32.00 (Incl. of all taxes)",
            "mrp_unit_price": "₹0.064 per ml",
            "batch_number": "AML-TZ-110",
            "mfg_date": "09/2026",
            "expiry_date": "12/2026",
            "consumer_care": "customercare@amul.coop / 1800-258-3333",
            "fssai_license": "10012021000071",
            "veg_logo": "Vegetarian Certified"
        },
        "summary": {
            "passed": 12,
            "failed": 0,
            "review_required": 0,
            "total_checks": 12
        },
        "checks": [
            {"rule_id": "LM_RULE_06_1_A", "category": "Product Identification", "description": "Generic / Common Name of Commodity", "status": "PASS", "confidence": 0.99, "evidence_text": "Amul Taaza Homogenised Toned Milk", "requirement": "Generic dairy commodity"}
        ],
        "validation_checks": [
            {"check_name": "Unit Price Calculation", "status": "PASS", "details": "32.00 / 500ml = ₹0.064 per ml (Accurate)"}
        ],
        "meta": {
            "timestamp": "2026-09-01T08:30:15.000Z",
            "inspector_id": "LM-GUJ-INSP-55",
            "jurisdiction": "Gujarat Legal Metrology"
        }
    }
]

DEFAULT_BRAND_REPOSITORIES = [
    {
        "repository_id": "repo_haldirams",
        "brand_name": "Haldiram's",
        "company_name": "Haldiram Snacks Pvt. Ltd. / Haldiram Foods",
        "category": "Packaged Savoury Snacks & Namkeen",
        "jurisdiction": "Noida, UP & Nagpur, Maharashtra",
        "fssai_license": "10012051000096",
        "monitoring_status": "Active Surveillance",
        "created_at": "2026-09-01T10:00:00.000Z",
        "officer_notes": "High retail distribution volume. Prior inspections verify strict net quantity and statutory labeling adherence.",
        "description": "Manufacturer of traditional Indian namkeens, sweets, extruded savouries, and packaged foods."
    },
    {
        "repository_id": "repo_lays",
        "brand_name": "Lay's",
        "company_name": "PepsiCo India Holdings Pvt. Ltd.",
        "category": "Potato Chips & Crisps",
        "jurisdiction": "Gurugram, Haryana",
        "fssai_license": "10014064000435",
        "monitoring_status": "Routine Surveillance",
        "created_at": "2026-09-01T10:00:00.000Z",
        "officer_notes": "Surveillance for font contrast on metallic packaging and Class II preservative declaration clarity.",
        "description": "Global snack food manufacturer producing potato chips, extruded snacks, and savoury foods in India."
    },
    {
        "repository_id": "repo_britannia",
        "brand_name": "Britannia",
        "company_name": "Britannia Industries Ltd.",
        "category": "Bakery, Biscuits & Dairy",
        "jurisdiction": "Kolkata, West Bengal & Bengaluru",
        "fssai_license": "10015043001129",
        "monitoring_status": "Active Surveillance",
        "created_at": "2026-09-01T10:00:00.000Z",
        "officer_notes": "Routine packaging audit. Regular verification of vegetarian logo dimensions and date chronology.",
        "description": "Major Indian food and bakery product corporation established in 1892."
    },
    {
        "repository_id": "repo_amul",
        "brand_name": "Amul",
        "company_name": "Gujarat Co-operative Milk Marketing Federation (GCMMF)",
        "category": "Dairy & Milk Products",
        "jurisdiction": "Anand, Gujarat",
        "fssai_license": "10012021000071",
        "monitoring_status": "Routine Surveillance",
        "created_at": "2026-09-01T10:00:00.000Z",
        "officer_notes": "Cooperative dairy network. Audited for pouch net volume accuracy and standard MRP declarations.",
        "description": "Indian dairy state government cooperative society based in Anand, Gujarat."
    }
]

_in_memory_repos: dict[str, dict] = {
    repo["repository_id"]: dict(repo) for repo in DEFAULT_BRAND_REPOSITORIES
}

try:
    from pipeline.nutrition_analysis import analyze_nutrition
    for _doc in DEFAULT_SEED_INSPECTIONS:
        if "nutrition_analysis" not in _doc:
            _doc["nutrition_analysis"] = analyze_nutrition(_doc.get("product") or {})
except Exception as _nut_init_err:
    logger.warning(f"Could not initialize seed nutrition analysis: {_nut_init_err}")

_in_memory_db: dict[str, dict] = {
    doc["inspection_id"]: dict(doc) for doc in DEFAULT_SEED_INSPECTIONS
}
_in_memory_directories: dict[str, list[dict]] = {
    repo["brand_name"]: [] for repo in DEFAULT_BRAND_REPOSITORIES
}
for _seed_doc in DEFAULT_SEED_INSPECTIONS:
    _brand_name = (_seed_doc.get("product") or {}).get("brand")
    if _brand_name:
        for _repo_dir in list(_in_memory_directories.keys()):
            if _repo_dir.lower() in _brand_name.lower() or _brand_name.lower() in _repo_dir.lower():
                _in_memory_directories[_repo_dir].append(dict(_seed_doc))
                break
_in_memory_images: dict[str, tuple[bytes, str, str]] = {}  # ADD: file_id -> (bytes, filename, content_type)



def get_db_client():
    global _client, _db_available
    if not MONGODB_URI or not _db_available:
        return None

    if _client is None:
        candidate_client = None
        try:
            client_kwargs: dict[str, Any] = {  # FIX — Any (not object) is assignable to Mongo's varied kwarg types
                "serverSelectionTimeoutMS": 2500,
                "connectTimeoutMS": 2500,
            }
            if _CA_FILE:
                client_kwargs["tlsCAFile"] = _CA_FILE

            candidate_client = MongoClient(MONGODB_URI, **client_kwargs)
            # Ping to verify connection
            candidate_client.admin.command('ping')
            _client = candidate_client
            logger.info("Successfully connected to MongoDB Atlas.")
        except Exception as e:
            if candidate_client is not None:
                try:
                    candidate_client.close()
                except Exception:
                    pass
            _client = None
            _db_available = False
            logger.warning(f"Could not connect to MongoDB Atlas ({e}). Operating in fast in-memory store mode.")
            return None

    return _client


def get_inspections_collection():
    client = get_db_client()
    if client is None:
        return None

    db = client[MONGODB_DB_NAME or "verifeye"]
    collection = db["inspections"]
    try:
        collection.create_index("inspection_id", unique=True)
        collection.create_index([("timestamp", -1)])
    except Exception as e:
        logger.warning(f"Could not create collection indexes: {e}")
    return collection


def save_inspection(analysis_result: dict, filename: str = "", image_file_ids: list[str] | None = None) -> dict:
    """
    Persists a completed inspection analysis to MongoDB Atlas (or in-memory store if MONGODB_URI is unconfigured).
    """
    inspection_id = analysis_result.get("inspection_id") or f"insp_{uuid.uuid4().hex[:12]}"
    timestamp = analysis_result.get("meta", {}).get("timestamp") or datetime.utcnow().isoformat()
    file_ids = image_file_ids if image_file_ids is not None else (analysis_result.get("image_file_ids") or [])
    image_urls = analysis_result.get("image_urls") or [f"/api/images/{fid}" for fid in file_ids]

    doc = {
        "inspection_id": inspection_id,
        "timestamp": timestamp,
        "filename": filename or "package_image.png",
        "status": analysis_result.get("status", "REVIEW_REQUIRED"),
        "compliance_score": float(analysis_result.get("compliance_score", 0.0)),
        "summary": analysis_result.get("summary", {}),
        "product": analysis_result.get("product", {}),
        "checks": analysis_result.get("checks", []),
        "validation_checks": analysis_result.get("validation_checks", []),
        "preservative_analysis": analysis_result.get("preservative_analysis") or {},
        "nutrition_analysis": analysis_result.get("nutrition_analysis") or {},
        "readability": analysis_result.get("readability") or {},
        "image_file_ids": file_ids,
        "image_urls": image_urls,
        "meta": analysis_result.get("meta", {}),
        "created_at": datetime.utcnow().isoformat()
    }

    try:
        collection = get_inspections_collection()
        if collection is not None:
            doc_to_insert = dict(doc)
            collection.insert_one(doc_to_insert)
            doc_to_insert.pop("_id", None)
            doc_to_insert.pop("created_at", None)
            # Synchronize in-memory fallback cache
            _in_memory_db[inspection_id] = doc_to_insert
            return doc_to_insert
        else:
            # In-memory fallback mode
            _in_memory_db[inspection_id] = doc
            return doc
    except Exception as e:
        logger.error(f"Error persisting inspection to MongoDB Atlas: {e}")
        # Fallback to in-memory store if DB error occurs
        _in_memory_db[inspection_id] = doc
        return doc


def list_inspections(limit: int = 50, skip: int = 0, q: str | None = None) -> list[dict]:
    """
    Retrieves recent inspection records (newest first), with optional brand/keyword search.
    """
    clean_q = (q or "").strip()
    try:
        collection = get_inspections_collection()
        if collection is not None:
            query_filter: dict = {}
            if clean_q:
                regex_pattern = {"$regex": clean_q, "$options": "i"}
                query_filter = {
                    "$or": [
                        {"inspection_id": regex_pattern},
                        {"filename": regex_pattern},
                        {"status": regex_pattern},
                        {"product.brand": regex_pattern},
                        {"product.product_name": regex_pattern},
                        {"product.manufacturer": regex_pattern},
                        {"product.category": regex_pattern},
                    ]
                }
            cursor = collection.find(query_filter, {"_id": 0, "created_at": 0}).sort("timestamp", -1).skip(skip).limit(limit)
            results = list(cursor)
            if results:
                return results

        # Fallback to in-memory store
        all_records = list(_in_memory_db.values())
        if clean_q:
            term = clean_q.lower()
            filtered = []
            for r in all_records:
                prod = r.get("product") or {}
                searchable_text = " ".join([
                    r.get("inspection_id", ""),
                    r.get("filename", ""),
                    r.get("status", ""),
                    prod.get("brand", ""),
                    prod.get("product_name", ""),
                    prod.get("manufacturer", ""),
                    prod.get("category", "")
                ]).lower()
                if term in searchable_text:
                    filtered.append(r)
            all_records = filtered

        sorted_records = sorted(all_records, key=lambda x: x.get("timestamp", ""), reverse=True)
        return sorted_records[skip : skip + limit]
    except Exception as e:
        logger.error(f"Error fetching inspections from MongoDB: {e}")
        all_records = list(_in_memory_db.values())
        if clean_q:
            term = clean_q.lower()
            all_records = [
                r for r in all_records
                if term in " ".join([
                    r.get("inspection_id", ""),
                    r.get("filename", ""),
                    r.get("status", ""),
                    (r.get("product") or {}).get("brand", ""),
                    (r.get("product") or {}).get("product_name", ""),
                    (r.get("product") or {}).get("manufacturer", ""),
                    (r.get("product") or {}).get("category", "")
                ]).lower()
            ]
        sorted_records = sorted(all_records, key=lambda x: x.get("timestamp", ""), reverse=True)
        return sorted_records[skip : skip + limit]



def get_inspection_by_id(inspection_id: str) -> dict | None:
    """
    Retrieves a single inspection record by unique inspection_id.
    """
    try:
        collection = get_inspections_collection()
        if collection is not None:
            doc = collection.find_one({"inspection_id": inspection_id}, {"_id": 0, "created_at": 0})
            if doc:
                return doc

        return _in_memory_db.get(inspection_id)
    except Exception as e:
        logger.error(f"Error fetching inspection '{inspection_id}' from MongoDB: {e}")
        return _in_memory_db.get(inspection_id)


def _get_inspections_for_repo(repo: dict) -> list[dict]:
    """
    Finds all inspection records associated with a given brand repository across
    in-memory database, memory directories, MongoDB inspections, and MongoDB brand collections.
    """
    repo_id = repo.get("repository_id", "")
    brand_name = repo.get("brand_name", "").strip()
    brand_lower = brand_name.lower()

    matches_map: dict[str, dict] = {}

    def _add_match(item: dict):
        if not isinstance(item, dict):
            return
        key = item.get("inspection_id") or item.get("report_id") or str(id(item))
        if key not in matches_map:
            matches_map[key] = item

    # 1. Check in-memory inspections
    for insp in _in_memory_db.values():
        if insp.get("repository_id") == repo_id:
            _add_match(insp)
            continue

        prod = insp.get("product") or {}
        insp_brand = (prod.get("brand") or "").lower()
        insp_prod_name = (prod.get("product_name") or "").lower()
        insp_mfg = (prod.get("manufacturer") or "").lower()

        if (
            (brand_lower and brand_lower in insp_brand)
            or (brand_lower and brand_lower in insp_prod_name)
            or (brand_lower and brand_lower in insp_mfg)
        ):
            _add_match(insp)

    # 2. Check in-memory directories for this brand
    for dir_doc in _in_memory_directories.get(brand_name, []):
        _add_match(dir_doc)

    # 3. Check MongoDB if connected
    client = get_db_client()
    if client is not None:
        try:
            db = client[MONGODB_DB_NAME or "verifeye"]
            # Query inspections collection by repository_id or brand
            insp_col = db["inspections"]
            regex_pat = {"$regex": re.escape(brand_name), "$options": "i"} if brand_name else None
            q_or: list[dict] = [{"repository_id": repo_id}]
            if regex_pat:
                q_or.extend([
                    {"product.brand": regex_pat},
                    {"product.manufacturer": regex_pat},
                    {"product.product_name": regex_pat}
                ])
            for doc in insp_col.find({"$or": q_or}, {"_id": 0, "created_at": 0}):
                _add_match(doc)

            # Query folder collection for brand if it exists
            if brand_name in db.list_collection_names():
                for doc in db[brand_name].find({}, {"_id": 0, "created_at": 0}):
                    _add_match(doc)
        except Exception as e:
            logger.error(f"Error querying inspections for repo '{brand_name}' from MongoDB: {e}")

    matches = list(matches_map.values())
    matches.sort(key=lambda x: x.get("timestamp") or x.get("created_at") or "", reverse=True)
    return matches


def list_brand_repositories(q: str | None = None) -> list[dict]:
    """
    Lists all registered Brand Repositories with dynamically computed compliance metrics.
    """
    clean_q = (q or "").strip().lower()

    # Merge repos from memory and MongoDB brand_repositories collection
    all_repos_map = dict(_in_memory_repos)
    client = get_db_client()
    if client is not None:
        try:
            db = client[MONGODB_DB_NAME or "verifeye"]
            if "brand_repositories" in db.list_collection_names():
                for r in db["brand_repositories"].find({}, {"_id": 0}):
                    rid = r.get("repository_id")
                    if rid and rid not in all_repos_map:
                        all_repos_map[rid] = r
        except Exception as e:
            logger.error(f"Error reading brand_repositories from MongoDB: {e}")

    repos_list = list(all_repos_map.values())

    enriched_repos = []
    for repo in repos_list:
        inspections = _get_inspections_for_repo(repo)
        total = len(inspections)
        passed = sum(1 for i in inspections if (i.get("status") or "").upper() in ("PASS", "COMPLIANT"))
        review = sum(1 for i in inspections if (i.get("status") or "").upper() in ("REVIEW", "REVIEW_REQUIRED"))
        failed = sum(1 for i in inspections if (i.get("status") or "").upper() in ("FAIL", "NON_COMPLIANT"))
        avg_score = round(sum(float(i.get("compliance_score", 0)) for i in inspections) / total, 1) if total > 0 else 100.0
        latest_date = inspections[0].get("timestamp") or inspections[0].get("created_at") if inspections else repo.get("created_at")
        recent_products = [
            (i.get("product") or {}).get("product_name") or i.get("filename")
            for i in inspections[:3]
            if (i.get("product") or {}).get("product_name") or i.get("filename")
        ]

        enriched = dict(repo)
        enriched.update({
            "total_inspections": total,
            "compliant_count": passed,
            "review_count": review,
            "failed_count": failed,
            "compliance_score_avg": avg_score,
            "latest_inspection_date": latest_date,
            "recent_products": recent_products,
        })

        if clean_q:
            searchable = " ".join([
                repo.get("brand_name", ""),
                repo.get("company_name", ""),
                repo.get("category", ""),
                repo.get("jurisdiction", ""),
                repo.get("fssai_license", ""),
                repo.get("description", ""),
            ]).lower()
            if clean_q not in searchable:
                continue

        enriched_repos.append(enriched)

    enriched_repos.sort(key=lambda x: x.get("total_inspections", 0), reverse=True)
    return enriched_repos


def get_brand_repository(repo_id: str) -> dict | None:
    """
    Retrieves full details of a Brand Repository including all past inspection reports.
    """
    repo = _in_memory_repos.get(repo_id)
    if not repo:
        # Search by brand_name or slug in memory
        for r in _in_memory_repos.values():
            if r.get("brand_name", "").lower() == repo_id.lower():
                repo = r
                break

    # If still not found, search MongoDB brand_repositories collection
    if not repo:
        client = get_db_client()
        if client is not None:
            try:
                db = client[MONGODB_DB_NAME or "verifeye"]
                if "brand_repositories" in db.list_collection_names():
                    found = db["brand_repositories"].find_one(
                        {"$or": [{"repository_id": repo_id}, {"brand_name": {"$regex": f"^{re.escape(repo_id)}$", "$options": "i"}}]},
                        {"_id": 0}
                    )
                    if found:
                        repo = found
            except Exception as e:
                logger.error(f"Error querying brand_repository from MongoDB: {e}")

    if not repo:
        return None

    inspections = _get_inspections_for_repo(repo)
    total = len(inspections)
    passed = sum(1 for i in inspections if (i.get("status") or "").upper() in ("PASS", "COMPLIANT"))
    review = sum(1 for i in inspections if (i.get("status") or "").upper() in ("REVIEW", "REVIEW_REQUIRED"))
    failed = sum(1 for i in inspections if (i.get("status") or "").upper() in ("FAIL", "NON_COMPLIANT"))
    avg_score = round(sum(float(i.get("compliance_score", 0)) for i in inspections) / total, 1) if total > 0 else 100.0

    result = dict(repo)
    result.update({
        "total_inspections": total,
        "compliant_count": passed,
        "review_count": review,
        "failed_count": failed,
        "compliance_score_avg": avg_score,
        "inspections": inspections,
    })
    return result


def create_brand_repository(repo_data: dict) -> dict:
    """
    Registers a new Brand Repository dossier into the surveillance database
    and automatically creates its folder in MongoDB Atlas and in-memory store.
    """
    raw_name = repo_data.get("brand_name", "").strip()
    if not raw_name:
        raise ValueError("brand_name is required to create a brand repository.")

    slug = "".join(c for c in raw_name.lower().replace("'", "").replace(" ", "_") if c.isalnum() or c == "_")
    repo_id = f"repo_{slug}_{uuid.uuid4().hex[:6]}"

    new_repo = {
        "repository_id": repo_id,
        "brand_name": raw_name,
        "company_name": repo_data.get("company_name", raw_name),
        "category": repo_data.get("category", "Packaged Commodity"),
        "jurisdiction": repo_data.get("jurisdiction", "National Enforcement"),
        "fssai_license": repo_data.get("fssai_license", "Verified"),
        "monitoring_status": repo_data.get("monitoring_status", "Active Surveillance"),
        "created_at": datetime.utcnow().isoformat(),
        "officer_notes": repo_data.get("officer_notes", "Newly registered brand dossier."),
        "description": repo_data.get("description", f"Surveillance repository for {raw_name}.")
    }

    _in_memory_repos[repo_id] = new_repo
    _in_memory_directories.setdefault(raw_name, [])

    # Automatically persist dossier and create folder in MongoDB Atlas
    client = get_db_client()
    if client is not None:
        try:
            db = client[MONGODB_DB_NAME or "verifeye"]
            # 1. Upsert brand dossier
            db["brand_repositories"].update_one(
                {"repository_id": repo_id},
                {"$set": dict(new_repo)},
                upsert=True
            )
            # 2. Automatically create the directory folder in MongoDB
            if raw_name not in db.list_collection_names():
                try:
                    db.create_collection(raw_name)
                except Exception:
                    pass
        except Exception as e:
            logger.error(f"Error persisting brand repository '{raw_name}' to MongoDB: {e}")

    # Check if initial product or inspection was provided
    initial_product = repo_data.get("initial_product")
    if initial_product:
        insp_id = f"INSP-{slug.upper()[:4]}-{uuid.uuid4().hex[:4].upper()}"
        initial_insp = {
            "inspection_id": insp_id,
            "repository_id": repo_id,
            "timestamp": datetime.utcnow().isoformat(),
            "filename": f"{slug}_commodity_label.png",
            "status": "PASS",
            "compliance_score": 100.0,
            "product": {
                "brand": raw_name,
                "product_name": initial_product.get("product_name", f"{raw_name} Commodity"),
                "category": repo_data.get("category", "Packaged Commodity"),
                "manufacturer": repo_data.get("company_name", raw_name),
                "net_quantity": initial_product.get("net_quantity", "100 g"),
                "mrp": initial_product.get("mrp", "₹50.00"),
                "fssai_license": repo_data.get("fssai_license", "Verified"),
                "veg_logo": "Verified"
            },
            "summary": {
                "passed": 12,
                "failed": 0,
                "review_required": 0,
                "total_checks": 12
            },
            "checks": [
                {"rule_id": "LM_RULE_06_1_A", "category": "Product Identification", "description": "Generic / Common Name", "status": "PASS", "confidence": 0.98, "evidence_text": initial_product.get("product_name", raw_name), "requirement": "Generic commodity name verified"}
            ],
            "validation_checks": [],
            "meta": {
                "timestamp": datetime.utcnow().isoformat(),
                "inspector_id": "LM-OFFICER-ACTIVE",
                "jurisdiction": repo_data.get("jurisdiction", "National Enforcement")
            }
        }
        _in_memory_db[insp_id] = initial_insp
        save_report_to_directory(raw_name, initial_insp)

    return get_brand_repository(repo_id) or new_repo


def link_inspection_to_repository(repository_id: str, inspection_data: dict) -> dict:
    """
    Associates an active or historical inspection record with a specific brand repository,
    and automatically stores it into that repository's folder in MongoDB.
    """
    repo = _in_memory_repos.get(repository_id)
    if not repo:
        # Search by brand_name or slug
        for r in _in_memory_repos.values():
            if r.get("brand_name", "").lower() == repository_id.lower():
                repo = r
                repository_id = r.get("repository_id")
                break

    if not repo:
        # Search in MongoDB
        client = get_db_client()
        if client is not None:
            try:
                db = client[MONGODB_DB_NAME or "verifeye"]
                if "brand_repositories" in db.list_collection_names():
                    found = db["brand_repositories"].find_one(
                        {"$or": [{"repository_id": repository_id}, {"brand_name": {"$regex": f"^{re.escape(repository_id)}$", "$options": "i"}}]},
                        {"_id": 0}
                    )
                    if found:
                        repo = found
                        repository_id = found.get("repository_id")
            except Exception as e:
                logger.error(f"Error querying brand repo in link_inspection: {e}")

    if not repo:
        raise ValueError(f"Brand repository '{repository_id}' does not exist.")

    inspection_id = inspection_data.get("inspection_id") or f"INSP-{uuid.uuid4().hex[:8].upper()}"
    inspection_data["inspection_id"] = inspection_id
    inspection_data["repository_id"] = repository_id

    # If it's already in _in_memory_db, update it
    if inspection_id in _in_memory_db:
        _in_memory_db[inspection_id]["repository_id"] = repository_id
        if "product" not in _in_memory_db[inspection_id]:
            _in_memory_db[inspection_id]["product"] = {}
        if not _in_memory_db[inspection_id]["product"].get("brand"):
            _in_memory_db[inspection_id]["product"]["brand"] = repo.get("brand_name")
        target_doc = _in_memory_db[inspection_id]
    else:
        # Ensure minimal required fields for an inspection
        if "product" not in inspection_data:
            inspection_data["product"] = {}
        if not inspection_data["product"].get("brand"):
            inspection_data["product"]["brand"] = repo.get("brand_name")
        if "timestamp" not in inspection_data:
            inspection_data["timestamp"] = datetime.utcnow().isoformat()
        if "status" not in inspection_data:
            inspection_data["status"] = "PASS"
        if "compliance_score" not in inspection_data:
            inspection_data["compliance_score"] = 100.0

        _in_memory_db[inspection_id] = inspection_data
        target_doc = inspection_data

    # Synchronize MongoDB collections if connected
    collection = get_inspections_collection()
    if collection is not None:
        try:
            collection.update_one(
                {"inspection_id": inspection_id},
                {"$set": {"repository_id": repository_id, "product.brand": repo.get("brand_name")}},
                upsert=True
            )
        except Exception as e:
            logger.error(f"Error updating repository_id in MongoDB: {e}")

    # Automatically save into this brand's repository folder in MongoDB
    folder_name = repo.get("brand_name") or repository_id
    save_report_to_directory(folder_name, target_doc)

    return {
        "success": True,
        "message": f"Inspection '{inspection_id}' successfully linked to repository '{repo.get('brand_name')}'.",
        "repository_id": repository_id,
        "brand_name": repo.get("brand_name"),
        "inspection": target_doc
    }


def list_directories() -> list[str]:
    """
    Lists existing 'directories' (MongoDB collections and registered Brand Repositories)
    a report can be saved into.
    """
    all_dirs: set[str] = set()

    # Always include all registered repository brand names from memory
    for repo in _in_memory_repos.values():
        if repo.get("brand_name"):
            all_dirs.add(repo["brand_name"])

    # Include all in-memory directory keys
    for d in _in_memory_directories.keys():
        if d:
            all_dirs.add(d)

    client = get_db_client()
    if client is not None:
        try:
            db = client[MONGODB_DB_NAME or "verifeye"]
            system_cols = {"inspections", "system.indexes", "fs.files", "fs.chunks", "brand_repositories", "report_directories"}
            mongo_cols = [n for n in db.list_collection_names() if n not in system_cols and not n.startswith("fs.")]
            all_dirs.update(mongo_cols)

            # Also include brands from brand_repositories collection in Mongo
            if "brand_repositories" in db.list_collection_names():
                for r in db["brand_repositories"].find({}, {"brand_name": 1}):
                    if r.get("brand_name"):
                        all_dirs.add(r["brand_name"])
        except Exception as e:
            logger.error(f"Error listing directories from MongoDB: {e}")

    return sorted(list(all_dirs))


def save_report_to_directory(directory: str, doc: dict) -> dict:
    """
    Saves a report document into the named directory (MongoDB collection),
    creating that directory (collection) if it doesn't already exist.
    Also links the report to the corresponding brand repository if matched.
    """
    doc = dict(doc)
    doc.setdefault("created_at", datetime.utcnow().isoformat())

    # Link to repository if directory name matches a brand
    for r_id, r_info in _in_memory_repos.items():
        if (
            r_info.get("brand_name", "").strip().lower() == directory.strip().lower()
            or r_id.strip().lower() == directory.strip().lower()
        ):
            doc["repository_id"] = r_info.get("repository_id")
            if "product" in doc and isinstance(doc["product"], dict) and not doc["product"].get("brand"):
                doc["product"]["brand"] = r_info.get("brand_name")
            break

    try:
        client = get_db_client()
        if client is not None:
            db = client[MONGODB_DB_NAME or "verifeye"]
            db[directory].insert_one(dict(doc))
            doc.pop("_id", None)
            # Ensure in-memory cache has this directory too
            _in_memory_directories.setdefault(directory, []).append(doc)
            return doc
    except Exception as e:
        logger.error(f"Error saving report to directory '{directory}': {e}")

    _in_memory_directories.setdefault(directory, []).append(doc)
    return doc
# ADD — end


# ADD — start
def save_report_with_file_to_directory(directory: str, doc: dict, pdf_bytes: bytes, pdf_filename: str) -> dict:
    """
    Saves a report document plus its PDF file into the named directory (collection).
    The PDF is stored via GridFS and referenced by id on the doc; falls back to an
    in-memory base64 copy if MongoDB is unavailable.
    Also links to brand repository if directory matches brand name.
    """
    doc = dict(doc)
    doc.setdefault("created_at", datetime.utcnow().isoformat())
    doc["pdf_filename"] = pdf_filename

    # Link to repository if directory name matches a brand
    for r_id, r_info in _in_memory_repos.items():
        if (
            r_info.get("brand_name", "").strip().lower() == directory.strip().lower()
            or r_id.strip().lower() == directory.strip().lower()
        ):
            doc["repository_id"] = r_info.get("repository_id")
            if "product" in doc and isinstance(doc["product"], dict) and not doc["product"].get("brand"):
                doc["product"]["brand"] = r_info.get("brand_name")
            break

    try:
        client = get_db_client()
        if client is not None:
            db = client[MONGODB_DB_NAME or "verifeye"]
            fs = gridfs.GridFS(db)
            file_id = fs.put(pdf_bytes, filename=pdf_filename, content_type="application/pdf")
            doc["pdf_file_id"] = str(file_id)
            db[directory].insert_one(dict(doc))
            doc.pop("_id", None)
            _in_memory_directories.setdefault(directory, []).append(doc)
            return doc
    except Exception as e:
        logger.error(f"Error saving report with file to directory '{directory}': {e}")

    doc["pdf_base64"] = base64.b64encode(pdf_bytes).decode("ascii")
    _in_memory_directories.setdefault(directory, []).append(doc)
    return doc
# ADD — end


# ADD — start
def get_pdf_from_gridfs(file_id: str) -> tuple[bytes, str] | None:
    """
    Retrieves a saved report PDF's bytes and filename from GridFS by its file id.
    """
    client = get_db_client()
    if client is None:
        return None
    try:
        db = client[MONGODB_DB_NAME or "verifeye"]
        fs = gridfs.GridFS(db)
        grid_out = fs.get(ObjectId(file_id))
        return grid_out.read(), grid_out.filename or "report.pdf"
    except Exception as e:
        logger.error(f"Error retrieving PDF '{file_id}' from GridFS: {e}")
        return None
# ADD — end


# ADD — start
def save_image_to_gridfs(image_bytes: bytes, filename: str = "label.png", content_type: str = "image/png") -> str:
    """
    Saves an uploaded package image into MongoDB GridFS (or in-memory cache if Mongo is unavailable),
    returning the string file_id.
    """
    client = get_db_client()
    if client is not None:
        try:
            db = client[MONGODB_DB_NAME or "verifeye"]
            fs = gridfs.GridFS(db)
            file_id = fs.put(image_bytes, filename=filename, content_type=content_type)
            return str(file_id)
        except Exception as e:
            logger.error(f"Error storing image '{filename}' in GridFS: {e}")

    file_id = f"img_{uuid.uuid4().hex[:12]}"
    _in_memory_images[file_id] = (image_bytes, filename, content_type)
    return file_id


def get_image_from_gridfs(file_id: str) -> tuple[bytes, str, str] | None:
    """
    Retrieves an image's bytes, filename, and content_type by file_id from GridFS or in-memory store.
    """
    if file_id in _in_memory_images:
        return _in_memory_images[file_id]

    client = get_db_client()
    if client is not None:
        try:
            db = client[MONGODB_DB_NAME or "verifeye"]
            fs = gridfs.GridFS(db)
            grid_out = fs.get(ObjectId(file_id))
            img_bytes = grid_out.read()
            filename = grid_out.filename or "package_label.png"
            content_type = getattr(grid_out, "content_type", None) or "image/jpeg"
            return img_bytes, filename, content_type
        except Exception as e:
            logger.error(f"Error retrieving image '{file_id}' from GridFS: {e}")
            return None
    return None


def list_reports_from_directory(directory: str, limit: int = 50) -> list[dict]:
    """
    Lists lightweight summaries of report documents saved into the given directory
    (collection), newest first — for browsing (not the full nested payload).
    """
    projection = {
        "_id": 0,
        "report_id": 1,
        "inspection_id": 1,
        "filename": 1,
        "status": 1,
        "compliance_score": 1,
        "pdf_file_id": 1,
        "pdf_filename": 1,
        "image_file_ids": 1,
        "image_urls": 1,
        "timestamp": 1,
        "created_at": 1,
    }
    try:
        client = get_db_client()
        if client is not None:
            db = client[MONGODB_DB_NAME or "verifeye"]
            cursor = db[directory].find({}, projection).sort("created_at", -1).limit(limit)
            results = list(cursor)
            if results:
                return results
    except Exception as e:
        logger.error(f"Error listing reports in directory '{directory}': {e}")

    records = _in_memory_directories.get(directory, [])
    if records:
        sorted_records = sorted(records, key=lambda r: r.get("created_at") or r.get("timestamp") or "", reverse=True)
        return [{k: v for k, v in r.items() if k in projection} for r in sorted_records[:limit]]

    # If no direct records, check if directory corresponds to a brand repository
    for repo in _in_memory_repos.values():
        if (
            repo.get("brand_name", "").strip().lower() == directory.strip().lower()
            or repo.get("repository_id", "").strip().lower() == directory.strip().lower()
        ):
            repo_inspections = _get_inspections_for_repo(repo)
            return [{k: v for k, v in r.items() if k in projection} for r in repo_inspections[:limit]]

    return []
# ADD — end