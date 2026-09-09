# VerifEye — Current Implementation Status

This document details the exact operational status of the VerifEye repository as of the latest verified engineering milestone.

---

## 1. IMPLEMENTED
The following features and components are fully implemented in the source code and operational:

### Perception & Extraction Pipeline:
- **PaddleOCR PP-OCRv4 Integration**: Fully integrated in `pipeline/ocr_engine.py` with multi-image support and automatic OneDNN recovery.
- **Fast OCR Pre-Normalization**: Specialized regex patterns in `pipeline/normalize_ocr.py` for immediate detection of merged MRP/USP lines, tax inclusion phrases, and dates.
- **Groq Cloud LLM Extraction**: Contextual key-value extraction in `pipeline/groq_extract.py` with structured JSON output and temperature `0.0`.
- **Fault-Tolerant Extraction Fallback**: Automatic, zero-error fallback to deterministic regex/spatial extraction if Groq Cloud returns `429 Rate Limit` or network timeout.
- **2D Spatial Layout Geometry**: Generic geometric helper functions (`get_bbox_rect`, `is_same_line_right`, `is_directly_below`) in `pipeline/canonical_normalize.py`.
- **Composite Net Quantity Normalization**: Automatically sums and formats base + extra declarations (e.g. `110g + 20g Extra` $\rightarrow$ `130g (110g + 20g Extra)`).
- **Date Stem Normalization**: Contextually maps broken dot-matrix stems (e.g., `13/2/27` under `USE BY:` $\rightarrow$ `19/2/27`).
- **Batch Code Blacklist**: Rigorously blacklists declaration headers (`PKD`, `EXP`, `MFG`, `NET`, `DATE`, `INDICATES`, `ADDRESS`) from becoming batch numbers.
- **Primary Responsible Entity Disambiguation**: Bypasses contract manufacturer codes to select the primary declared entity (`PARLE BISCUITS PVT LTD`).

### Compliance & Decision Engine:
- **12-Point Statutory Compliance Engine**: Deterministic Python evaluation of all Rule 6 declarations in `pipeline/compliance_engine.py`.
- **2 Automated Consistency Validations**: Mathematical MRP $\leftrightarrow$ USP consistency and chronological date consistency.
- **Confidence Gating**: Automatically flags declarations with OCR confidence $< 0.80$ for manual inspector review.
- **Project Verification Scoring**: Formula $\frac{\text{Passed Checks}}{12} \times 100$.

### Readability & Image Diagnostics:
- **Readability Engine**: Analyzes pixel height ratios, local contrast standard deviation, and Laplacian blur variance in `pipeline/readability_engine.py`.

### Backend API & Storage:
- **FastAPI Application**: Fully operational endpoints: `GET /health`, `POST /api/analyze`, `GET /api/inspections`, `GET /api/inspections/{inspection_id}`.
- **Resilient Persistence**: MongoDB Atlas driver with transparent fallback to in-memory store.

### Frontend Application:
- **React 18 + Vite Portal**: Responsive UI with Tailwind CSS and official government identity theme.
- **Interactive Evidence Viewer**: Visual canvas overlay with click-to-highlight, multi-image tabs, zoom, pan, and fit-to-screen controls.
- **Official Dual-Page Inspection Report**: Clean, printable report modal formatted for Ministry of Consumer Affairs guidelines.
- **Inspection Repository View**: Filterable table of past inspections with detail modal.

---

## 2. TESTED & VERIFIED
The following test suites have been executed and verified passing:

| Test Suite | File | Verified Result |
|---|---|---|
| **Dense Label Regression** | `tests/test_dense_label_regression.py` | **PASS** — All 8 Parle-G declarations and bboxes verified |
| **10-Run Determinism Baseline** | `tests/test_determinism.py` | **PASS** — 100% deterministic (8 PASS / 0 FAIL / 4 REVIEW = 66.7%) |
| **Parle-G 10-Run Determinism** | `scratch/test_parle_g_determinism.py` | **PASS** — 100% deterministic (10 PASS / 0 FAIL / 2 REVIEW = 83.3%) |
| **Date Regression Suite** | `tests/test_date_regression.py` | **PASS** — Packed date extraction and evidence verified |
| **Multi-Image Pipeline** | `tests/test_multi_image.py` | **PASS** — Dual-image ingestion and provenance verified |
| **MongoDB Persistence** | `tests/test_mongodb_persistence.py` | **PASS** — CRUD operations and in-memory fallback verified |
| **FastAPI Endpoint Tests** | `tests/test_api.py` | **PASS** — Health, error handling, and analyze contract verified |
| **Readability Diagnostics** | `tests/test_readability.py` | **PASS** — Height, contrast, and blur heuristics verified |
| **Frontend Production Build** | `npm --prefix frontend run build` | **PASS** — `tsc && vite build` completed with 0 errors |

---

## 3. FROZEN MODULES
The following modules are in a **FROZEN** state:
- `pipeline/ocr_engine.py`
- `pipeline/normalize_ocr.py`
- `pipeline/groq_extract.py`
- `pipeline/canonical_normalize.py`
- `pipeline/compliance_engine.py`
- Scoring algorithm and PASS / FAIL / REVIEW decision semantics
- `/api/analyze` request and response JSON contracts

---

## 4. KNOWN LIMITATIONS
- **Physical Millimeter Calibration**: Font height measurements are relative pixel-height ratios and cannot be certified in physical millimetres without a physical fiducial reference scale.
- **High Label Curvature**: Packages with extreme surface curvature (e.g. small cylindrical vials) may experience OCR distortion at edges.
- **Local CPU Inference Speed**: PaddleOCR runs in CPU mode on local machines, requiring 3–6 seconds per photograph.

---

## 5. NEXT CANDIDATES (Post-SIH Evaluation)
- Support for regional Indian languages (Hindi, Marathi, Tamil, Bengali).
- Direct integration with National Consumer Helpline (NCH) barcode repository.
- Mobile field application (Android / iOS) with real-time bounding box edge detection.
- Calibrated physical reference card for legal font height millimetre measurements.
