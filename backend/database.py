import logging
import uuid
from datetime import datetime
from pymongo import MongoClient, errors  # pyrefly: ignore [missing-import] # type: ignore
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
            "veg_logo": "Green Vegetarian Dot Verified"
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
            "veg_logo": "Green Vegetarian Dot Present"
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
            "veg_logo": "Vegetarian Symbol Certified"
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

_in_memory_db: dict[str, dict] = {
    doc["inspection_id"]: dict(doc) for doc in DEFAULT_SEED_INSPECTIONS
}


def get_db_client():
    global _client, _db_available
    if not MONGODB_URI or not _db_available:
        return None

    if _client is None:
        candidate_client = None
        try:
            client_kwargs = {
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
    global _db_available
    if not _db_available:
        return None
    try:
        client = get_db_client()
        if client is None:
            _db_available = False
            return None

        db = client[MONGODB_DB_NAME or "verifeye"]
        collection = db["inspections"]
        return collection
    except Exception as e:
        _db_available = False
        logger.warning(f"Could not initialize MongoDB collection ({e}). Falling back to fast in-memory store.")
        return None


def save_inspection(analysis_result: dict, filename: str = "") -> dict:
    """
    Persists a completed inspection analysis to MongoDB Atlas (or in-memory store if MONGODB_URI is unconfigured).
    """
    inspection_id = analysis_result.get("inspection_id") or f"insp_{uuid.uuid4().hex[:12]}"
    timestamp = analysis_result.get("meta", {}).get("timestamp") or datetime.utcnow().isoformat()

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
    Finds all inspection records associated with a given brand repository.
    """
    all_inspections = list(_in_memory_db.values())
    repo_id = repo.get("repository_id", "")
    brand_lower = repo.get("brand_name", "").lower().strip()

    matches = []
    for insp in all_inspections:
        # Check direct repository_id link
        if insp.get("repository_id") == repo_id:
            matches.append(insp)
            continue

        prod = insp.get("product") or {}
        insp_brand = (prod.get("brand") or "").lower()
        insp_prod_name = (prod.get("product_name") or "").lower()
        insp_mfg = (prod.get("manufacturer") or "").lower()

        # Check brand match or keyword presence
        if (
            (brand_lower and brand_lower in insp_brand)
            or (brand_lower and brand_lower in insp_prod_name)
            or (brand_lower and brand_lower in insp_mfg)
        ):
            matches.append(insp)

    matches.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return matches


def list_brand_repositories(q: str | None = None) -> list[dict]:
    """
    Lists all registered Brand Repositories with dynamically computed compliance metrics.
    """
    clean_q = (q or "").strip().lower()
    repos_list = list(_in_memory_repos.values())

    enriched_repos = []
    for repo in repos_list:
        inspections = _get_inspections_for_repo(repo)
        total = len(inspections)
        passed = sum(1 for i in inspections if (i.get("status") or "").upper() in ("PASS", "COMPLIANT"))
        review = sum(1 for i in inspections if (i.get("status") or "").upper() in ("REVIEW", "REVIEW_REQUIRED"))
        failed = sum(1 for i in inspections if (i.get("status") or "").upper() in ("FAIL", "NON_COMPLIANT"))
        avg_score = round(sum(float(i.get("compliance_score", 0)) for i in inspections) / total, 1) if total > 0 else 100.0
        latest_date = inspections[0].get("timestamp") if inspections else repo.get("created_at")
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
        # Search by brand_name or slug
        for r in _in_memory_repos.values():
            if r.get("brand_name", "").lower() == repo_id.lower():
                repo = r
                break
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
    Registers a new Brand Repository dossier into the surveillance database.
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

    return get_brand_repository(repo_id) or new_repo


def link_inspection_to_repository(repository_id: str, inspection_data: dict) -> dict:
    """
    Associates an active or historical inspection record with a specific brand repository.
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

    # Synchronize MongoDB if connected
    collection = get_inspections_collection()
    if collection is not None:
        try:
            collection.update_one(
                {"inspection_id": inspection_id},
                {"$set": {"repository_id": repository_id}},
                upsert=True
            )
        except Exception as e:
            logger.error(f"Error updating repository_id in MongoDB: {e}")

    return {
        "success": True,
        "message": f"Inspection '{inspection_id}' successfully linked to repository '{repo.get('brand_name')}'.",
        "repository_id": repository_id,
        "brand_name": repo.get("brand_name"),
        "inspection": target_doc
    }


