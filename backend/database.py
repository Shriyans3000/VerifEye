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
_in_memory_db: dict[str, dict] = {}


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


def list_inspections(limit: int = 20, skip: int = 0) -> list[dict]:
    """
    Retrieves recent inspection records (newest first).
    """
    try:
        collection = get_inspections_collection()
        if collection is not None:
            cursor = collection.find({}, {"_id": 0, "created_at": 0}).sort("timestamp", -1).skip(skip).limit(limit)
            results = list(cursor)
            if results:
                return results

        # Fallback to in-memory store
        sorted_records = sorted(_in_memory_db.values(), key=lambda x: x.get("timestamp", ""), reverse=True)
        return sorted_records[skip : skip + limit]
    except Exception as e:
        logger.error(f"Error fetching inspections from MongoDB: {e}")
        sorted_records = sorted(_in_memory_db.values(), key=lambda x: x.get("timestamp", ""), reverse=True)
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
