# VerifEye — System Instructions & Primary Source of Truth

This document serves as the primary system instruction and operational guide for all AI agents, developers, and maintainers working on the **VerifEye** repository. All work in this codebase must conform to the architecture, constraints, and development disciplines defined herein.

---

## A. Project Identity
- **Project Name**: VerifEye
- **Purpose**: AI-assisted Legal Metrology compliance inspection platform for packaged commodities.
- **Problem Statement**: Smart India Hackathon (SIH) — **SIH26034** (*Automated Compliance Verification of Declarations on Packaged Commodities as per Legal Metrology Act & Packaged Commodities Rules*).
- **Domain**: Legal Metrology / Packaged Commodities Enforcement.
- **Target Users**: Enforcement Officers, Legal Metrology Inspectors, Regulatory Compliance Auditors.
- **Current State**: Fully functional, deterministic end-to-end prototype with live inspection viewer, evidence traceability, readability diagnostics, and inspection reporting.

---

## B. Core Product Philosophy

### The Core Law:
$$\textbf{AI EXTRACTS} \longrightarrow \textbf{RULES DECIDE} \longrightarrow \textbf{EVIDENCE PROVES}$$

### Inspection Progression:
$$\textbf{SEE} \longrightarrow \textbf{READ} \longrightarrow \textbf{STRUCTURE} \longrightarrow \textbf{VERIFY} \longrightarrow \textbf{PROVE} \longrightarrow \textbf{REPORT}$$

### Architectural Boundary:
- **Perception / Extraction (AI / OCR)**: PaddleOCR detects raw text tokens, bounding coordinates, and confidence. An LLM (Groq) or deterministic contextual parser converts unorganized text tokens into structured candidate declarations.
- **The Legal Decision-Maker (Deterministic Engine)**: AI and LLMs are **never** permitted to make legal decisions, determine statutory compliance, or declare violations. Compliance evaluation is handled exclusively by a rigid, deterministic Python rule engine (`pipeline/compliance_engine.py`) codifying the Legal Metrology (Packaged Commodities) Rules, 2011.
- **Evidence Burden**: Every declaration evaluated by the legal engine must be bound directly to underlying visual OCR coordinates and confidence metrics on the original label image. The system never invents compliance results without evidentiary backing.

---

## C. Current Architecture

The complete runtime pipeline operates as follows:

```
OFFICER
  │
  ▼
IMAGE CAPTURE / UPLOAD (Single or Dual Image: Front / Back)
  │
  ▼
IMAGE PREPROCESSING (RGB Conversion, Dimension & Rotation Handling)
  │
  ▼
PaddleOCR (PP-OCRv4 Text Detection & Recognition)
  │
  ▼
OCR TEXT + BOUNDING BOXES + CONFIDENCE SCORES
  │
  ▼
CONTEXTUAL EXTRACTION (Groq LLM LLaMA 3.3 70B / 8B or Deterministic Fallback)
  │
  ▼
STRUCTURED DECLARATIONS (Candidate Key-Value Pairs)
  │
  ▼
CANONICAL NORMALIZATION & 2D SPATIAL RESCUE (pipeline/canonical_normalize.py)
  │
  ▼
DETERMINISTIC LEGAL METROLOGY RULE ENGINE (pipeline/compliance_engine.py)
  │
  ▼
PASS / FAIL / REVIEW CLASSIFICATIONS (12 Mandatory Checks + 2 Consistency Validations)
  │
  ▼
EVIDENCE LINKING (Bounding Box & Confidence Binding with Multi-Image Provenance)
  │
  ▼
READABILITY & TEXT QUALITY ANALYSIS (pipeline/readability_engine.py)
  │
  ▼
INSPECTION REPORT GENERATION (Interactive Viewer & Printable PDF/HTML Report)
  │
  ▼
MONGODB ATLAS PERSISTENCE (With Resilient In-Memory Fallback)
  │
  ▼
OFFICER DASHBOARD / INSPECTION REPOSITORY (/inspection, /repository)
```

---

## D. Tech Stack

### Frontend:
- **Framework**: React 18 with TypeScript
- **Tooling / Bundler**: Vite (runs on `http://localhost:5174`, `--port 5174 --host`)
- **Styling**: Tailwind CSS (Utility-first, responsive official government aesthetic)
- **Icons**: Lucide React
- **HTTP Client**: Axios (configured with `baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'`, 60-second timeout)

### Backend:
- **Language**: Python 3.10+ (Current environment: Python 3.13 / Conda `verifeye`)
- **API Framework**: FastAPI with Uvicorn (`http://127.0.0.1:8000`, run with `--reload` in development)
- **OCR Engine**: PaddleOCR (PP-OCRv4 detection + recognition models)
- **Image Processing**: OpenCV (`cv2`), Pillow (`PIL`), NumPy
- **Extraction LLM**: Groq Cloud SDK (`groq/compound` / `groq/compound-mini` / `llama-3.3-70b-versatile` with deterministic fallback)
- **Database**: MongoDB Atlas via `pymongo` (with automatic fallback to in-memory store if offline)

---

## E. Legal Compliance Model

### 12 Mandatory Statutory Checks (Rule 6, Legal Metrology (Packaged Commodities) Rules, 2011):
1. **Manufacturer / Packer / Importer**: Name of the declared entity responsible for the commodity.
2. **Manufacturer Address**: Physical plant, registered office, or complete postal address.
3. **Common / Generic Name**: Standard identity or generic trade name of the commodity.
4. **Net Quantity**: Nominal weight, volume, measure, or count (e.g., grams, kg, ml, litres). Supports base + extra bonus formats (e.g. `110g + 20g Extra`).
5. **MRP (Maximum Retail Price)**: Numerically valid retail price in Indian Rupees (₹ / Rs.).
6. **MRP Tax Inclusion**: Explicit declaration that the MRP is inclusive of all taxes (`INCL. OF ALL TAXES`).
7. **Manufacture / Pack Date**: Month and year (or day, month, year) of packing or manufacturing.
8. **Best Before / Use By**: Consumer durability date, expiry date, or best-before period.
9. **Batch / Lot Number**: Batch identification, lot code, or manufacturing mark (strictly blacklisted from capturing keyword headers like `PKD`, `EXP`, or plant codes).
10. **Consumer Care Details**: Valid contact phone number, helpline, or email address.
11. **Unit Sale Price (USP)**: Price declared per unit measure (e.g. `₹0.16/g` or `Rs. 20/kg`).
12. **Country of Origin**: Declared nation of manufacture/assembly (statutorily conditional).

### Separate Automated Consistency Validations:
1. **MRP $\leftrightarrow$ Unit Sale Price Consistency**: Mathematical verification that $MRP \approx Net\ Quantity \times Unit\ Sale\ Price$.
2. **Date Chronology Consistency**: Mathematical verification that the declared *Use By / Expiry Date* is chronologically after the *Manufacture / Pack Date*.

### Three-State Evaluation Semantics:
- **PASS**: Required declaration is detected, syntactically and numerically valid, and supported by reliable OCR evidence.
- **FAIL**: Explicit statutory violation detected (e.g., negative/zero MRP, use-by date earlier than manufacturing date, missing mandatory tax inclusion when excluded).
- **REVIEW**: Declaration is not detected on the current image surface, OCR confidence is low, or field is conditional (e.g., Country of Origin on indigenous goods).
> **Critical Rule**: Missing visual evidence on an inspected angle is **never** automatically classified as a confirmed violation (`FAIL`); it must be classified as **`REVIEW`** (*Inspector Assessment Required*).

---

## F. Scoring Model

### Calculation Formula:
$$\text{Compliance Score} = \frac{\text{Passed Checks}}{12} \times 100$$

### Definition:
- This is strictly a **PROJECT VERIFICATION SCORE** indicating the automated confidence and declaration completeness on the inspected imagery.
- It is **never** presented as an official statutory judicial ruling or legal penalty calculation.

---

## G. Evidence System

The evidence subsystem provides 100% mathematical auditability from visual label pixel to legal decision:
- **OCR Bounding Boxes**: Normalized 4-point polygon coordinates `[[x1, y1], [x2, y2], [x3, y3], [x4, y4]]` representing the exact region detected on the packaging.
- **Confidence Values**: Per-region OCR confidence score ($0.0 \le \text{conf} \le 1.0$).
- **Evidence Linking**: Each check in the compliance report binds directly to an `evidence` array containing the relevant OCR snippets.
- **Interactive UI**: Clicking any row in the compliance table highlights the bounding box on the label viewer, highlights the snippet in the side drawer, and scrolls into visual focus.
- **Image Provenance**: Every evidence snippet records its origin (`image_index`: `0` for Front/Image 1, `1` for Back/Image 2).
- **Visual Canvas Tools**: Includes zoom in/out, fit-to-screen, rotate, and an overlay toggle (*Show All OCR Regions*).

---

## H. Readability Analysis

The readability engine evaluates visual label clarity without making uncalibrated physical claims:
- **Diagnostic Categories**: `Readable`, `Small Text`, `Low Contrast`, `Blurry`, `Glares/Artifacts`.
- **Methodology**: Evaluates pixel height ratios relative to the label canvas, local contrast (standard deviation of pixel intensity), and Laplacian variance (defocus blur).
- **Important Constraint**: Smartphone and desktop camera resolutions vary significantly. **Physical font height in millimetres is uncalibrated without a physical millimeter reference scale.** Never fabricate or assert physical millimeter dimensions (e.g. "2.4 mm") unless a calibrated physical fiducial marker is present.

---

## I. Multi-Image Support

Packaged goods frequently distribute mandatory declarations across front, back, and side panels:
- VerifEye supports inspecting up to **2 images** per single inspection batch.
- Images are tagged with `image_index: 0` (Primary/Front) and `image_index: 1` (Secondary/Back).
- OCR runs on each image independently; evidence preserves the precise `image_index` and bounding box for each declaration.
- The compliance engine evaluates declarations aggregated across all uploaded panels.

---

## J. API Contracts

### Endpoints:
- `GET /health`: Health check returning `{"status": "ok", "service": "verifeye-api"}`.
- `POST /api/analyze`: Multipart form upload accepting `file` (single image) or `files` (multi-image list up to 2 files). Returns full inspection payload including `compliance_score`, `status`, `summary`, `product`, `checks`, `validation_checks`, `readability`, and `evidence`.
- `GET /api/inspections`: Retrieves historical inspections with pagination (`limit`, `skip`).
- `GET /api/inspections/{inspection_id}`: Retrieves full stored inspection record by UUID/ID.

All endpoints must maintain strict backward compatibility.

---

## K. Frozen Core Pipeline Modules

The following core inspection modules are **FROZEN**. Do NOT refactor, optimize, reorganize, or rewrite these components unless an explicit, reproducible defect is demonstrated:
1. [`pipeline/ocr_engine.py`](file:///c:/Users/SHRIYANS/Downloads/Verifeye_SIH/pipeline/ocr_engine.py)
2. [`pipeline/normalize_ocr.py`](file:///c:/Users/SHRIYANS/Downloads/Verifeye_SIH/pipeline/normalize_ocr.py)
3. [`pipeline/groq_extract.py`](file:///c:/Users/SHRIYANS/Downloads/Verifeye_SIH/pipeline/groq_extract.py)
4. [`pipeline/canonical_normalize.py`](file:///c:/Users/SHRIYANS/Downloads/Verifeye_SIH/pipeline/canonical_normalize.py)
5. [`pipeline/compliance_engine.py`](file:///c:/Users/SHRIYANS/Downloads/Verifeye_SIH/pipeline/compliance_engine.py)
6. Scoring formulas and PASS / FAIL / REVIEW decision semantics.
7. Public `/api/analyze` response contracts and evidence data schemas.

---

## L. Mandatory Regression Gates

Before any modification to the pipeline is accepted, all of the following tests must pass cleanly:

```bash
python -m unittest tests/test_dense_label_regression.py
python -m unittest tests/test_determinism.py
python -m unittest tests/test_date_regression.py
python -m unittest tests/test_multi_image.py
python -m unittest tests/test_mongodb_persistence.py
python -m unittest tests/test_api.py
python -m unittest tests/test_readability.py
npm --prefix frontend run build
```

- **Frozen Baseline Check**: `tests/test_determinism.py` on `test_images/test_image2.png` must yield exactly **8 PASS / 0 FAIL / 4 REVIEW = 66.7%** across all 10 consecutive iterations.
- **Dense Label Check**: `tests/test_dense_label_regression.py` on `test_images/parle_g_gold_back.jpeg` must correctly extract `net_quantity="187.5 g"`, `batch_number="K9C"`, `mrp="30.00"`, `unit_sale_price="0.16/g"`, `manufacturer="PARLE BISCUITS PVT LTD"`, and `use_by_date="19/2/27"`.

---

## M. Solved Dense-Label Problems (Reference Regressions)

The Parle-G Gold back label (`test_images/parle_g_gold_back.jpeg`) contains dense layout challenges that were surgically solved:
- **Net Quantity**: Header (`NET WEIGHT:`) and numeric amount (`187.5 g`) are in separate horizontal OCR boxes $\rightarrow$ Resolved via horizontal layout association (`is_same_line_right`).
- **Use-By Date**: Formatted as broken matrix digits $\rightarrow$ Resolved contextually directly beneath `USE BY:` header.
- **Batch Number**: Previously became `"PKD"` due to adjacent keywords $\rightarrow$ Resolved by strictly blacklisting keywords (`PKD`, `EXP`, `MFG`, `NET`, `DATE`, `INDICATES`) and binding vertically aligned codes (`is_directly_below`).
- **MRP & Unit Sale Price**: Printed on same line `MRP ₹30.00 (₹0.16 / g)` $\rightarrow$ Resolved by deterministic regex separating retail price from unit sale price.
- **Manufacturer & Address**: 10 third-party contract packers listed $\rightarrow$ Resolved by filtering plant batch prefixes (e.g. `(VT-`, `K9-`) and extracting the declared primary entity (`PARLE BISCUITS PVT LTD`).

---

## N. Absolute Anti-Hardcoding Rule

**NEVER** introduce image-specific or brand-specific hardcoded values into production extraction or compliance modules:
- Do NOT add `if "parle" in text:`
- Do NOT hardcode batch numbers (e.g. `batch = "K9C"`)
- Do NOT hardcode dates (e.g. `date = "19/2/27"`)
- Do NOT hardcode pixel coordinates
- Do NOT implement global character substitutions (e.g. globally replacing `3` with `9`)

All logic must rely on generic 2D spatial layout relationships, standard regex patterns, and contextual association.

---

## O. Frontend-First Discipline

- If a user request asks for a presentation, dashboard, layout, or modal change, **implement it strictly in the frontend layer**.
- Never alter the backend, legal rule engine, or API schemas to solve what is purely a frontend presentation or user experience requirement.

---

## P. Change Discipline (7 Steps)

For every future engineering task:
1. **Understand Requirements**: Read instructions thoroughly; clarify any ambiguous constraints.
2. **Isolate Scope**: Identify the smallest responsible file or component.
3. **Make Minimal Edits**: Apply surgical, minimal additions without collateral alterations.
4. **Preserve Integrity**: Do not touch frozen components or unrelated lines of code.
5. **Run Regression Gates**: Execute automated unit tests and verify frozen baselines.
6. **Verify Live Runtime**: Verify real browser upload and live API behavior.
7. **Report Transparently**: Detail exactly which files changed and what verification steps succeeded.
