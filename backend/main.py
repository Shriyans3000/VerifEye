from fastapi import FastAPI  # pyrefly: ignore [missing-import] # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # pyrefly: ignore [missing-import] # type: ignore

from backend.config import CORS_ORIGINS  # pyrefly: ignore [missing-import] # type: ignore
from backend.routes.health import router as health_router  # pyrefly: ignore [missing-import] # type: ignore
from backend.routes.analyze import router as analyze_router  # pyrefly: ignore [missing-import] # type: ignore
from backend.routes.inspections import router as inspections_router  # pyrefly: ignore [missing-import] # type: ignore
from backend.routes.reports import router as reports_router  # ADD

app = FastAPI(
    title="VerifEye Legal Metrology Compliance API",
    description="Backend API for AI-assisted packaged commodity inspection",
    version="1.0.0"
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def warmup_services():
    import threading
    def _warmup():
        try:
            from pipeline.ocr_engine import get_ocr_engine  # pyrefly: ignore [missing-import] # type: ignore
            get_ocr_engine()
        except Exception:
            pass
    threading.Thread(target=_warmup, daemon=True).start()

# Include route handlers — Vite dev proxy strips /api prefix before forwarding,
# so the backend only needs to serve the bare paths (e.g. /health, /analyze, /inspections).
# The /api prefix variants are kept for direct backend access (e.g. curl, Postman, production).
app.include_router(health_router)
app.include_router(health_router, prefix="/api")
app.include_router(analyze_router)
app.include_router(analyze_router, prefix="/api")
app.include_router(inspections_router)
app.include_router(inspections_router, prefix="/api")
app.include_router(reports_router)  # ADD
app.include_router(reports_router, prefix="/api")  # ADD


if __name__ == "__main__":
    import uvicorn  # pyrefly: ignore [missing-import] # type: ignore
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)