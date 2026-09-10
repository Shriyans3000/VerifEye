# AGENT GUIDELINES & RUNBOOK: VerifEye

This guide outlines rules, architectural constraints, directory layout, and operational procedures for AI coding agents modifying or maintaining the VerifEye codebase.

---

## 1. Project Overview & Responsibilities
VerifEye is a hybrid AI and rule-based system for evaluating Indian packaged commodity labels against **Legal Metrology (Packaged Commodities) Rules, 2011** and **FSSAI Food Additives Regulations**.

- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS (runs on port `5174` with proxy to `http://127.0.0.1:8000`).
- **Backend**: FastAPI + Python 3.10 (runs on port `8000`).
- **OCR Engine**: PaddleOCR v6 (CPU/GPU-accelerated text detection, unwarping, and recognition).
- **Extraction Engine**: Groq API using JSON-mode LLMs.
- **Rules & Validation**: 100% deterministic Python rule evaluators (zero LLM hallucination in compliance verdicts).
- **Database**: MongoDB Atlas with zero-dependency in-memory fallback.

---

## 2. Directory Structure

```
VerifEye-main/
├── backend/
│   ├── config.py             # Loads .env, CORS origins, upload limits
│   ├── database.py           # MongoDB Atlas persistence + in-memory store fallback
│   ├── main.py               # FastAPI entrypoint, CORS setup, warmup hooks
│   ├── routes/
│   │   ├── analyze.py        # POST /analyze (single/multi-image upload handler)
│   │   ├── health.py         # GET /health (liveness check)
│   │   └── inspections.py    # GET /inspections, GET /inspections/{id}
│   └── services/
│       └── pipeline.py       # Orchestrates analyze_image & analyze_images
├── frontend/
│   ├── src/
│   │   ├── components/       # UI components (ProcessingState, Header, Results, etc.)
│   │   ├── services/
│   │   │   └── api.ts        # Axios API client (base URL /api)
│   │   ├── types/            # TypeScript interfaces for API requests/responses
│   │   └── App.tsx           # Primary application view
│   ├── vite.config.ts        # Vite config: port 5174, proxy /api -> 127.0.0.1:8000
│   └── package.json
├── pipeline/
│   ├── ocr_engine.py         # PaddleOCR instantiation and run_ocr()
│   ├── normalize_ocr.py      # Spatial line grouping and proximity association
│   ├── groq_extract.py       # Groq API schema prompt & extraction
│   ├── canonical_normalize.py# Price sanitization, unit conversion, date parsing
│   ├── compliance_engine.py  # Legal Metrology statutory rules checker
│   ├── preservative_analysis.py # FSSAI category-based additive limits checker
│   └── report_generator.py   # PDF compliance report generator (ReportLab)
├── test_images/              # Sample images for testing (test_label.jpeg, etc.)
├── tests/                    # Pytest test suite
├── .env                      # Environment configurations (DO NOT commit secrets)
├── package.json              # Concurrently script ("npm run dev")
├── requirements.txt          # Python dependencies
├── work.md                   # Work history, diagnosis, and architecture
└── agent.md                  # This file
```

---

## 3. Strict Operating Invariants for AI Agents

### 1. Model Selection on Groq
- Groq models are subject to decommissioning. **NEVER** use decommissioned models (`llama3-8b-8192`, `llama3-70b-8192`, `llama-3.1-70b-versatile`).
- Supported models as of 2026:
  1. `openai/gpt-oss-120b` (Primary extraction model, highest quality)
  2. `openai/gpt-oss-20b` (Fast secondary fallback)
  3. `qwen/qwen3.8-27b` (High-accuracy fallback)
  4. `qwen/qwen3.6-27b` (Fast fallback)
- Always maintain `response_format={"type": "json_object"}` in Groq completion requests.

### 2. OCR Threading & Concurrency
- Never hardcode `OMP_NUM_THREADS = "1"` or `MKL_NUM_THREADS = "1"`. This causes severe inference stalls on multi-core workstations.
- Always use dynamic CPU core detection:
  ```python
  threads = os.getenv("VERIFEYE_OCR_THREADS", str(min(os.cpu_count() or 4, 8)))
  os.environ.setdefault("OMP_NUM_THREADS", threads)
  ```
- PaddleOCR is thread-safe only with `_OCR_LOCK` or when using the singleton `get_ocr_engine()`.

### 3. Determinism in Compliance Decisions
- **Legal compliance verdicts must NEVER be decided by the LLM.**
- The LLM's only job is **entity extraction** with verbatim OCR bounding-box citations.
- All compliance pass/fail/missing/review decisions are strictly evaluated in `pipeline/compliance_engine.py` using deterministic logic.
- Every rule check must carry exact evidence (OCR text span, bounding box, confidence).

### 4. Resilient Database Persistence
- `backend/database.py` must never crash or block API responses if MongoDB Atlas fails to connect.
- Any MongoDB failure must seamlessly fall back to `_in_memory_db`.
- The ping test timeout must not exceed 2500ms to avoid degrading API latency.

### 5. Frontend-Backend Port Alignment
- Frontend Vite runs on port `5174` (with fallback to `5173`).
- Backend runs on port `8000`.
- Vite proxies `/api/*` to `http://127.0.0.1:8000/*` with `rewrite: (path) => path.replace(/^\/api/, '')`.
- Both `/api/...` and non-prefixed paths are registered in FastAPI (`app.include_router(router)` and `app.include_router(router, prefix="/api")`).
- `CORS_ORIGINS` in `.env` and `config.py` must include both `http://localhost:5174` and `http://localhost:5173`.

---

## 4. Useful Terminal Commands

### Run Services
```powershell
# Run backend + frontend concurrently (from workspace root):
npm run dev

# Run backend individually:
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

# Run frontend individually:
npm run dev --prefix frontend
```

### Run Tests & Validation
```powershell
# Run all automated tests:
.\.venv\Scripts\python.exe -m pytest tests/

# Test the pipeline on a single image:
.\.venv\Scripts\python.exe run_pipeline.py test_images/test_label.jpeg

# Check backend health:
Invoke-RestMethod -Uri "http://127.0.0.1:8000/health"

# Test /analyze endpoint using curl:
curl.exe -F "file=@test_images/test_label.jpeg" http://localhost:5174/api/analyze
```

---

## 5. Debugging Quick Reference

| Symptom | Probable Cause | Action |
|---------|----------------|--------|
| UI stuck on Stage 5 | Backend is offline, or request timed out | Verify backend is running on `127.0.0.1:8000`. Check Vite proxy logs and `ProcessingState.tsx`. |
| `Unable to connect to inspection server` | Network connection to port 8000 refused | Start the backend using `npm run dev` or `python -m uvicorn backend.main:app`. |
| `groq.BadRequestError: model_decommissioned` | Legacy Llama model called | Update `models_to_try` in `pipeline/groq_extract.py` to `openai/gpt-oss-120b` or `qwen/qwen3.8-27b`. |
| OCR prediction takes > 60s | Thread restriction or CPU overload | Verify `pipeline/ocr_engine.py` thread setting; ensure `VERIFEYE_OCR_THREADS >= 4`. |
| MongoDB `SSL handshake failed` | Atlas IP whitelist block or TLS issue | Check `backend/database.py` fallback. In-memory store should activate without raising exceptions. |
