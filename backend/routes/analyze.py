import logging
import os
import tempfile
from pathlib import Path
from fastapi import APIRouter, File, UploadFile, HTTPException, status

from backend.config import MAX_UPLOAD_SIZE_MB, TEMP_DIR
from backend.services.pipeline import analyze_images, analyze_image

logger = logging.getLogger("verifeye.api")
router = APIRouter()

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg", "application/octet-stream"}


@router.post("/api/analyze")
async def analyze_label(
    file: UploadFile | None = File(None),
    files: list[UploadFile] | None = File(None)
):
    # Reject ambiguous requests where BOTH file and files are supplied
    if file is not None and files is not None and len(files) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ambiguous request: specify either single 'file' or multiple 'files', not both."
        )

    upload_list: list[UploadFile] = []
    if files:
        upload_list = files
    elif file:
        upload_list = [file]

    if not upload_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No image files uploaded."
        )

    if len(upload_list) > 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 2 images allowed per inspection."
        )

    temp_files_to_cleanup: list[Path] = []
    temp_file_paths: list[Path] = []
    filenames: list[str] = []

    try:
        max_bytes = MAX_UPLOAD_SIZE_MB * 1024 * 1024
        temp_dir = TEMP_DIR if TEMP_DIR and os.path.isdir(TEMP_DIR) else None

        for upload in upload_list:
            if not upload or not upload.filename:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Uploaded file is missing a filename."
                )

            filename = upload.filename
            filenames.append(filename)
            ext = Path(filename).suffix.lower()

            if ext not in ALLOWED_EXTENSIONS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unsupported file extension '{ext}'. Allowed extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
                )

            if upload.content_type and upload.content_type.lower() not in ALLOWED_CONTENT_TYPES:
                logger.warning(f"Unexpected content-type '{upload.content_type}' for filename '{filename}'")

            contents = await upload.read()
            if not contents:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Uploaded file '{filename}' is empty."
                )

            if len(contents) > max_bytes:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File '{filename}' size exceeds maximum limit of {MAX_UPLOAD_SIZE_MB}MB."
                )

            tf = tempfile.NamedTemporaryFile(delete=False, suffix=ext, dir=temp_dir)
            tf_path = Path(tf.name).resolve()
            tf.write(contents)
            tf.close()

            temp_files_to_cleanup.append(tf_path)
            temp_file_paths.append(tf_path)

        logger.info(f"Processing {len(temp_file_paths)} uploaded image(s): {', '.join(filenames)}")

        # Run multi-image pipeline
        result = analyze_images(temp_file_paths)

        import uuid
        inspection_id = f"insp_{uuid.uuid4().hex[:12]}"
        result["inspection_id"] = inspection_id
        result["filename"] = filenames[0] if len(filenames) == 1 else f"{filenames[0]} + {filenames[1]}"
        result["filenames"] = filenames

        from backend.config import MONGODB_URI
        if MONGODB_URI:
            from backend.database import save_inspection
            try:
                saved_doc = save_inspection(result, filename=result["filename"])
                result["inspection_id"] = saved_doc.get("inspection_id", inspection_id)
            except Exception as db_err:
                logger.error(f"MongoDB persistence failed for {filenames}: {db_err}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Inspection persistence error: Could not save inspection record to database."
                )

        return result

    except HTTPException:
        raise
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
        logger.exception(f"Unexpected error during analysis of {filenames}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while analyzing the image."
        )
    finally:
        for tf_path in temp_files_to_cleanup:
            if tf_path.exists():
                try:
                    os.remove(tf_path)
                    logger.info(f"Cleaned up temporary file: {tf_path}")
                except Exception as cleanup_err:
                    logger.warning(f"Failed to delete temp file {tf_path}: {cleanup_err}")
