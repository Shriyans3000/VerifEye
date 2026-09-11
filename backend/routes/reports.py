import io
import json
import logging
from fastapi import APIRouter, HTTPException, status, Form, UploadFile, File, Query  # ADD Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel  # pyrefly: ignore [missing-import] # type: ignore
from backend.database import (
    list_directories,
    save_report_to_directory,
    save_report_with_file_to_directory,
    get_pdf_from_gridfs,
    list_reports_from_directory,  # ADD
    get_image_from_gridfs,  # ADD
)

logger = logging.getLogger("verifeye.api.reports")
router = APIRouter()


class SaveReportRequest(BaseModel):
    directory: str
    report: dict


@router.get("/directories")
async def get_directories():
    """
    Lists existing MongoDB 'directories' (collections) a report can be saved into.
    """
    try:
        return {"directories": list_directories()}
    except Exception as e:
        logger.error(f"Failed to list directories: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error listing directories: {str(e)}"
        )


@router.post("/reports/save")
async def save_report(payload: SaveReportRequest):
    """
    Saves a report document into an existing or newly created directory (MongoDB collection).
    """
    directory = payload.directory.strip()
    if not directory:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Directory name must not be empty."
        )
    try:
        saved_doc = save_report_to_directory(directory, payload.report)
        return {"saved": True, "directory": directory, "report": saved_doc}
    except Exception as e:
        logger.error(f"Failed to save report to directory '{directory}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error saving report: {str(e)}"
        )


# ADD — start
@router.post("/reports/save-with-file")
async def save_report_with_file(
    directory: str = Form(...),
    report: str = Form(...),
    file: UploadFile = File(...),
):
    """
    Saves a report document plus its client-generated PDF into an existing or
    newly created directory (MongoDB collection); the PDF is stored via GridFS.
    """
    directory = directory.strip()
    if not directory:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Directory name must not be empty."
        )

    try:
        report_doc = json.loads(report)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid report JSON payload."
        )

    pdf_bytes = await file.read()
    if not pdf_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded PDF file is empty."
        )

    try:
        saved_doc = save_report_with_file_to_directory(
            directory, report_doc, pdf_bytes, file.filename or "report.pdf"
        )
        return {"saved": True, "directory": directory, "report": saved_doc}
    except Exception as e:
        logger.error(f"Failed to save report with file to directory '{directory}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error saving report: {str(e)}"
        )
# ADD — end


# ADD — start
@router.get("/reports/pdf/{file_id}")
async def download_report_pdf(file_id: str):
    """
    Streams a previously saved report PDF back out of GridFS by its file id
    (the 'pdf_file_id' field on a saved report document).
    """
    result = get_pdf_from_gridfs(file_id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PDF '{file_id}' not found."
        )
    pdf_bytes, filename = result
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'}
    )
# ADD — end


# ADD — start
@router.get("/reports/{directory}")
async def list_reports_in_directory(directory: str, limit: int = Query(50, ge=1, le=200)):
    """
    Lists report summaries saved in the given directory (collection), newest first.
    """
    try:
        return {"directory": directory, "reports": list_reports_from_directory(directory, limit=limit)}
    except Exception as e:
        logger.error(f"Failed to list reports in directory '{directory}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error listing reports: {str(e)}"
        )
# ADD — end


# ADD — start
@router.get("/images/{file_id}")
async def get_image(file_id: str):
    """
    Streams an uploaded package image out of GridFS (or in-memory fallback) by its file_id.
    """
    result = get_image_from_gridfs(file_id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image '{file_id}' not found."
        )
    img_bytes, filename, content_type = result
    return StreamingResponse(
        io.BytesIO(img_bytes),
        media_type=content_type or "image/jpeg",
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            "Cache-Control": "public, max-age=86400"
        }
    )
# ADD — end