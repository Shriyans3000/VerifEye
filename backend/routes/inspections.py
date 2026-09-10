import logging
from fastapi import APIRouter, HTTPException, Query, status
from backend.config import MONGODB_URI
from backend.database import list_inspections, get_inspection_by_id

logger = logging.getLogger("verifeye.api.inspections")
router = APIRouter()


@router.get("/inspections")
async def get_all_inspections(
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    q: str | None = Query(None, description="Search keyword across brand, product, manufacturer, or inspection ID")
):
    """
    Retrieve recent completed inspection records from MongoDB Atlas (newest first).
    """
    try:
        records = list_inspections(limit=limit, skip=skip, q=q)
        return records
    except Exception as e:
        logger.error(f"Failed to fetch inspection history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error fetching inspection records: {str(e)}"
        )


@router.get("/inspections/{inspection_id}")
async def get_single_inspection(inspection_id: str):
    """
    Retrieve details for a single completed inspection record by inspection_id.
    """
    try:
        record = get_inspection_by_id(inspection_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inspection record '{inspection_id}' not found."
            )
        return record
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch inspection '{inspection_id}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error retrieving inspection: {str(e)}"
        )
