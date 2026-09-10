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
