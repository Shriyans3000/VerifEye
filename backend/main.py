from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import CORS_ORIGINS
from backend.routes.health import router as health_router
from backend.routes.analyze import router as analyze_router
from backend.routes.inspections import router as inspections_router

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

# Include route handlers
app.include_router(health_router)
app.include_router(analyze_router)
app.include_router(inspections_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
