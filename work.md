# VerifEye: AI-Powered Legal Metrology Compliance System

## Executive Overview
**VerifEye** is an automated compliance verification engine for packaged commodity labels in India. It inspects product packaging images against the statutory requirements of the **Legal Metrology (Packaged Commodities) Rules, 2011** and **FSSAI Food Safety Regulations**.

The system combines high-precision computer vision (PaddleOCR), large language models (Groq LPU inference), and deterministic rule evaluation to extract declarations, validate numerical consistency, audit preservative safety, and generate legal compliance scorecards and PDF audit reports.

---

## 1. System Architecture

```
[ Package Image(s) (1 or 2 files) ]
                 │
                 ▼
     ┌───────────────────────┐
     │ 1. PaddleOCR Engine   │  Multi-model text detection & recognition
     └───────────┬───────────┘
                 ▼
     ┌───────────────────────┐
     │ 2. OCR Normalization  │  Spatial bounding-box & key-value grouping
     └───────────┬───────────┘
                 ▼
     ┌───────────────────────┐
     │ 3. LLM Extraction     │  Groq-accelerated structured extraction
     └───────────┬───────────┘  (openai/gpt-oss-120b, gpt-oss-20b, qwen3.8-27b)
                 ▼
     ┌───────────────────────┐
     │ 4. Canonical Norm.    │  Unit conversion, MRP sanitization, dates
     └───────────┬───────────┘
                 ▼
     ┌───────────────────────┐
     │ 5. Compliance Engine  │  Deterministic legal rule verification
     └───────────┬───────────┘  (Rules 6, 7, 8, 9, 10, FSSAI additives)
                 ▼
     ┌───────────────────────┐
     │ 6. Storage & Delivery │  MongoDB Atlas / In-memory store + FastAPI
     └───────────────────────┘
```

---

## 2. Root Cause Analysis & Resolutions (Stage 5 Hang Fix)

### Issue Reported
During label inspection, the frontend progress modal advanced through Stages 1–4, became permanently frozen on **"Stage 5: Preparing inspection result - PROCESSING..."**, and ultimately surfaced:
> `Inspection Processing Failed: Unable to connect to the VerifEye inspection server. Please check that the backend service is available.`

### Diagnosed Causes & Engineering Fixes

| # | Root Cause | Diagnosis | Fix Implemented |
|---|------------|-----------|-----------------|
| 1 | **Backend Not Running** | Only the frontend dev server (`localhost:5174`) was running. Port `8000` had no listening process. Vite proxy attempts to `/api/analyze` failed with connection refused. | Documented and established simultaneous execution via `npm run dev` (`concurrently` running backend and frontend). Backend service started on `127.0.0.1:8000`. |
| 2 | **Stage 5 UI Freeze Illusion** | `ProcessingState.tsx` had a fake timer incrementing stages every 4s up to Stage 5, where it waited indefinitely for HTTP completion. Any network failure or timeout was perceived as being stuck at Stage 5. | Adjusted stage timer pacing from 4000ms to 7500ms and added informative guidance: *"High-precision PaddleOCR & AI extraction typically takes 20–40 seconds."* |
| 3 | **Decommissioned Groq Models** | `pipeline/groq_extract.py` configured legacy models (`llama3-8b-8192`, `llama3-70b-8192`, `llama-3.1-70b-versatile`, `llama-3.3-70b-versatile`), which are decommissioned on Groq and returned `400 model_decommissioned` / `404 model_not_found`. | Updated model cascade to active, high-throughput models: `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b`, and `qwen/qwen3.6-27b`. |
| 4 | **Single-Core CPU OCR Throttling** | `pipeline/ocr_engine.py` hardcoded `OMP_NUM_THREADS = "1"`, limiting PaddleOCR inference to 1 single thread on a 24-core CPU and causing 45–60s request stalls. | Replaced static "1" thread limitation with dynamic core utilization: `min(os.cpu_count() or 4, 8)` with configurable `VERIFEYE_OCR_THREADS`. |
| 5 | **OCR Cold-Start Lag** | Initial inspection requests endured 30+ seconds just loading 5 PaddleOCR neural network models from disk into memory. | Added an asynchronous background warmup hook to FastAPI startup in `backend/main.py` so models are preloaded before requests arrive. |
| 6 | **MongoDB Atlas Handshake Stalls** | `backend/database.py` threw unhandled TLS handshake errors when MongoDB Atlas was unreachable or blocked by IP whitelist, waiting 5s per request. | Added `certifi` CA handling and instant, graceful fallback to `_in_memory_db`, preventing request hangs. |

---

## 3. End-to-End Inspection Pipeline

### Step 1: Optical Character Recognition (`pipeline/ocr_engine.py`)
- Executes **PaddleOCR v6** (detection, direction classification, UVDoc distortion unwarping, and text recognition).
- Supports single-image and multi-image uploads (front and back of package).
- Generates bounding boxes `[ymin, xmin, ymax, xmax]`, confidence scores, and raw textual spans.

### Step 2: OCR Normalization (`pipeline/normalize_ocr.py`)
- Groups nearby textual tokens based on spatial proximity.
- Identifies candidate key-value pairs (e.g., matching `MRP` labels to adjacent currency numbers).

### Step 3: LLM Information Extraction (`pipeline/groq_extract.py`)
- Dispatches prompt to Groq API with system schema enforcement (`response_format={"type": "json_object"}`).
- Extracts statutory entities:
  - Product Common/Generic Name
  - Manufacturer / Packer / Importer Name & Address
  - Country of Origin
  - Maximum Retail Price (MRP) & Tax Inclusive status
  - Net Quantity & Unit Sale Price (USP)
  - Dates: Packed Date, Manufacturing Date, Expiry Date, Best Before, Use By
  - Batch / Lot / Code Number
  - Consumer Care (Phone & Email)
  - FSSAI License Number & Food Category
  - Ingredients & Preservatives (INS numbers, quantity)
  - Evidence link containing exact OCR text, confidence, and bounding box coordinates.

### Step 4: Canonical Normalization (`pipeline/canonical_normalize.py`)
- Sanitizes prices into float values (INR).
- Converts net quantity declarations to standard metric units (`g`, `kg`, `ml`, `l`).
- Parses and standardizes date formats without altering chronological integrity.

### Step 5: Compliance Rule Engine (`pipeline/compliance_engine.py`)
Deterministic verification executing without LLM hallucination:
1. **Rule 6(1)(a)**: Common or generic name of commodity.
2. **Rule 6(1)(b)**: Complete manufacturer/packer/importer name and full address.
3. **Rule 6(1)(c)**: Net quantity in standard metric units.
4. **Rule 6(1)(d)**: Month and year of manufacture or packing.
5. **Rule 6(1)(da)**: Maximum Retail Price (MRP) inclusive of all taxes.
6. **Rule 6(1)(e)**: Unit Sale Price (USP) for packages containing more than 1 unit/kg/litre.
7. **Rule 6(1)(f)**: Batch/lot/code number.
8. **Rule 6(1)(g)**: Consumer care phone and email contact details.
9. **Rule 6(1)(h)**: Country of origin (mandatory for imported/domestic goods).
10. **Mathematical USP Consistency Check**: Compares `MRP / Quantity` against printed USP within allowable margin.
11. **Date Chronology Check**: Ensures packing/manufacturing date precedes expiry date.
12. **FSSAI Preservative Safety Audit (`pipeline/preservative_analysis.py`)**: Checks preservatives against category-wise permissible limits.

---

## 4. API Specification

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` or `/api/health` | `GET` | Service status check (`{"status": "ok", "service": "verifeye-api"}`) |
| `/analyze` or `/api/analyze` | `POST` | Multipart file upload (`file` or `files` up to 2 images). Returns compliance scorecard. |
| `/inspections` or `/api/inspections` | `GET` | Paginated list of recent inspection records (`limit`, `skip`). |
| `/inspections/{id}` or `/api/inspections/{id}` | `GET` | Retrieve a single inspection report by ID. |

---

## 5. Development & Deployment

### Prerequisites
- Python 3.10+ in `.venv`
- Node.js 18+ and npm
- Valid `GROQ_API_KEY` in `.env`

### Environment Variables (`.env`)
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
CORS_ORIGINS=http://localhost:5174,http://localhost:5173,http://localhost:3000,http://127.0.0.1:5174,http://127.0.0.1:5173
MAX_UPLOAD_SIZE_MB=10
TEMP_DIR=
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/verifeye
MONGODB_DB_NAME=verifeye
VERIFEYE_OCR_THREADS=4
```

### Running the Application

#### Start Both Backend & Frontend Concurrently (Recommended):
```bash
npm run dev
```

#### Start Services Separately:
**Backend:**
```bash
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
**Frontend:**
```bash
npm run dev --prefix frontend
```
The frontend will be available at `http://localhost:5174`.

#### Run Headless Pipeline on a Test Image:
```bash
.\.venv\Scripts\python.exe run_pipeline.py test_images/test_label.jpeg
```

#### Run Automated Test Suite:
```bash
.\.venv\Scripts\python.exe -m pytest tests/
```
