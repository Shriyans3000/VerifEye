import os
from pathlib import Path
from dotenv import load_dotenv  # pyrefly: ignore [missing-import] # type: ignore

# Load .env file from project root or parent with override=True
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()

_cors_env = os.getenv("CORS_ORIGINS", "http://localhost:5174,http://localhost:5173,http://localhost:3000,http://127.0.0.1:5174,http://127.0.0.1:5173")
CORS_ORIGINS = [origin.strip() for origin in _cors_env.split(",") if origin.strip()]

MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))
TEMP_DIR = os.getenv("TEMP_DIR", None)

MONGODB_URI = os.getenv("MONGODB_URI", "").strip().strip('"').strip("'")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "verifeye").strip().strip('"').strip("'")
