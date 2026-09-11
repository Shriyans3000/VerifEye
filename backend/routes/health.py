from fastapi import APIRouter
from backend.database import get_mongodb_status

router = APIRouter()


@router.get("/health")
def get_health():
    mongo_status = get_mongodb_status()
    return {
        "status": "ok",
        "service": "verifeye-api",
        "mongodb": mongo_status
    }
