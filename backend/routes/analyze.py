import logging
import os
import tempfile
from pathlib import Path
from fastapi import APIRouter, File, UploadFile, HTTPException, status

from backend.config import MAX_UPLOAD_SIZE_MB, TEMP_DIR
from backend.services.pipeline import analyze_image

logger = logging.getLogger("verifeye.api")
router = APIRouter()

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg", "application/octet-stream"}


@router.post("/api/analyze")
async def analyze_label(file: UploadFile = File(...)):
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file uploaded or filename missing."
        )

    filename = file.filename
    ext = Path(filename).suffix.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Allowed extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    if file.content_type and file.content_type.lower() not in ALLOWED_CONTENT_TYPES:
        logger.warning(f"Unexpected content-type '{file.content_type}' for filename '{filename}'")

    # Read content to validate size and empty upload
    contents = await file.read()
    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    max_bytes = MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum limit of {MAX_UPLOAD_SIZE_MB}MB."
        )

    # Save to temporary file safely
    temp_dir = TEMP_DIR if TEMP_DIR and os.path.isdir(TEMP_DIR) else None
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=ext, dir=temp_dir)
    temp_file_path = Path(temp_file.name).resolve()

    try:
        temp_file.write(contents)
        temp_file.close()

        logger.info(f"Processing uploaded image: {filename} saved as temporary file {temp_file_path}")

        # Run pipeline
        result = analyze_image(temp_file_path)

        import uuid
        inspection_id = f"insp_{uuid.uuid4().hex[:12]}"
        result["inspection_id"] = inspection_id
        result["filename"] = filename

        from backend.config import MONGODB_URI
        if MONGODB_URI:
            from backend.database import save_inspection
            try:
                saved_doc = save_inspection(result, filename=filename)
                result["inspection_id"] = saved_doc.get("inspection_id", inspection_id)
            except Exception as db_err:
                logger.error(f"MongoDB persistence failed for {filename}: {db_err}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Inspection persistence error: Could not save inspection record to database."
                )

        return result

    except FileNotFoundError as e:
        logger.error(f"File processing error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not access uploaded image file."
        )
    except RuntimeError as e:
        logger.error(f"Pipeline execution error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal pipeline processing error."
        )
    except Exception as e:
        logger.exception(f"Unexpected error during analysis of {filename}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while analyzing the image."
        )
    finally:
        # Guarantee cleanup of temporary file
        if temp_file_path.exists():
            try:
                os.remove(temp_file_path)
                logger.info(f"Cleaned up temporary file: {temp_file_path}")
            except Exception as cleanup_err:
                logger.warning(f"Failed to delete temp file {temp_file_path}: {cleanup_err}")
