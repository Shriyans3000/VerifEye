import logging
from fastapi import APIRouter, HTTPException, Query, status, Request
from backend.config import MONGODB_URI
from backend.database import (
    list_inspections,
    get_inspection_by_id,
    list_brand_repositories,
    get_brand_repository,
    create_brand_repository,
)

logger = logging.getLogger("verifeye.api.inspections")
router = APIRouter()


@router.get("/repositories")
async def get_all_repositories(
    q: str | None = Query(None, description="Search by brand name, company, or category")
):
    """
    Retrieve all registered Brand Repositories with aggregated compliance statistics.
    """
    try:
        return list_brand_repositories(q=q)
    except Exception as e:
        logger.error(f"Failed to fetch repositories: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error fetching brand repositories: {str(e)}"
        )


@router.post("/repositories")
async def create_new_repository(request: Request):
    """
    Allows enforcement officers to register a new brand repository with custom surveillance metadata.
    """
    try:
        data = await request.json()
        if not data.get("brand_name"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="brand_name is required to create a brand repository."
            )
        new_repo = create_brand_repository(data)
        return new_repo
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create brand repository: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error registering brand repository: {str(e)}"
        )


@router.get("/repositories/{repository_id}")
async def get_single_repository(repository_id: str):
    """
    Retrieve details for a specific Brand Repository along with all its past inspection reports.
    """
    try:
        repo = get_brand_repository(repository_id)
        if not repo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Brand repository '{repository_id}' not found."
            )
        return repo
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch repository '{repository_id}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving brand repository: {str(e)}"
        )


@router.get("/repositories/{repository_id}/inspections")
async def get_repository_inspections(repository_id: str):
    """
    Retrieve only the past inspection reports for a specific Brand Repository.
    """
    try:
        repo = get_brand_repository(repository_id)
        if not repo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Brand repository '{repository_id}' not found."
            )
        return repo.get("inspections", [])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch repository inspections: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving inspections for repository: {str(e)}"
        )


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
