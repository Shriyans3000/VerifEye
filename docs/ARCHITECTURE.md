# VerifEye — Technical Architecture & Pipeline Specification

## 1. Architectural Philosophy: Strict Layer Separation

The VerifEye architecture enforces an unbreachable boundary between **Perception** and **Adjudication**:

```
┌─────────────────────────────────────────────────────────────┐
│                 PERCEPTION / AI LAYER                       │
│  • PaddleOCR (Text detection, word recognition, confidence) │
│  • Groq Cloud LLM (Semantic association & key-value parsing)│
│  • Spatial layout & bounding-box geometry                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Candidate Declarations + BBoxes
                               ▼
┌─────────────────────────────────────────────────────────────┐
│            DETERMINISTIC NORMALIZATION & RESCUE             │
│  • 2D spatial relationship binding (same_line, below)      │
│  • Date format canonicalization                             │
│  • Keyword blacklists & regex validation                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Canonical Declarations + Clean Evidence
                               ▼
┌─────────────────────────────────────────────────────────────┐
│           DETERMINISTIC LEGAL DECISION LAYER                │
│  • Statutory Legal Metrology Rules, 2011 Engine             │
│  • Fixed Rule Evaluators (PASS / FAIL / REVIEW)             │
│  • Mathematical & Chronological Consistency Checks          │
│  • Strictly NO AI / LLM reasoning in compliance decisions  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. End-to-End Pipeline Breakdown

### Step 1: Ingestion & API Layer (`backend/routes/analyze.py`)
- The client submits a multipart request to `POST /api/analyze` containing either a single `file` or a list of `files` (up to 2 image files).
- The endpoint performs MIME validation (supporting `.jpg`, `.jpeg`, `.png`, `.webp`).
- Generates a persistent inspection UUID (`inspection_id`).
- Dispatches each image to the processing pipeline.

### Step 2: Image Preprocessing & OCR Engine (`pipeline/ocr_engine.py`)
- Reads raw image bytes via OpenCV (`cv2.imdecode`) and PIL.
- Standardizes colour space to RGB.
- Initializes PaddleOCR with the PP-OCRv4 model suite (`use_angle_cls=False`, `lang='en'`).
- Executes DB text detection (`det`) and SVTR text recognition (`rec`).
- Produces normalized region tokens:
  ```json
  {
    "id": 0,
    "image_index": 0,
    "text": "NET WEIGHT: 187.5 g",
    "confidence": 0.9421,
    "bbox": [[361, 567], [684, 567], [684, 607], [361, 607]]
  }
  ```
- **Error Recovery**: Handles OneDNN primitive issues with automatic fallback reinitialization.

### Step 3: Fast OCR Pre-Normalization (`pipeline/normalize_ocr.py`)
- Scans raw OCR tokens with specialized regex patterns for immediate candidate detection:
  - Merged MRP & Unit Sale Price patterns: `MRP ₹30.00 (₹0.16 / g)`
  - Tax inclusion declarations: `INCL. OF ALL TAXES`
  - Unit sale price patterns: `(?:\/|\s*PER\s*)(?:G|KG|ML|L|UNIT)`
  - Compressed dates: `PKD. : 29/7/20`
- Generates layout hints used as location anchors by downstream stages.

### Step 4: Contextual LLM Extraction (`pipeline/groq_extract.py`)
- Sends the structured OCR tokens and layout hints to Groq Cloud:
  - Primary Model: `groq/compound`
  - Fallback Model: `groq/compound-mini`
  - Temperature: `0.0` (strictly deterministic generation)
  - Response Format: `json_object`
- **System Prompt Rules**: Instructs the LLM to act strictly as a data extractor, not a legal judge. Demands that each extracted field cite its underlying OCR region `id`.
- **Fault-Tolerant Fallback**: If Groq API is unavailable (rate limit `429`, token limit, or network outage), the pipeline seamlessly falls back to the deterministic spatial parser in `canonical_normalize.py` without failing the request.

### Step 5: Canonical Normalization & 2D Spatial Rescue (`pipeline/canonical_normalize.py`)
This module guarantees data consistency and rescues declarations that OCR split into adjacent boxes:
- **2D Spatial Layout Geometry**:
  - `get_bbox_rect(bbox)`: Calculates bounding rectangle coordinates `[x_min, x_max, y_min, y_max]`, width, height, and center points.
  - `is_same_line_right(lbl_rect, cand_rect)`: Detects horizontal adjacency (e.g. `NET WEIGHT:` box adjacent to `187.5 g` box).
  - `is_directly_below(lbl_rect, cand_rect)`: Detects tabular column alignment (e.g. `BATCH:` header directly above `K9C` code).
- **Date Stem Normalization**: Contextually maps broken dot-matrix stems (e.g., `13/2/27` under `USE BY:` $\rightarrow$ `19/2/27`).
- **Batch Code Blacklisting**: Prevents declaration headers (`PKD`, `EXP`, `MFG`, `NET`, `DATE`, `INDICATES`, `ADDRESS`) from falsely populating `batch_number`.
- **Primary Responsible Entity Disambiguation**: Bypasses contract manufacturing plant prefixes (e.g. `(VT-`, `K9-`) to capture the primary declared entity (`PARLE BISCUITS PVT LTD`).
- **Composite Net Quantity**: Normalizes base + extra bonus declarations (e.g., `110g + 20g Extra` $\rightarrow$ `130g (110g + 20g Extra)`).

### Step 6: Deterministic Legal Metrology Compliance Engine (`pipeline/compliance_engine.py`)
Evaluates the canonical declarations strictly against Rule 6 of the Packaged Commodities Rules:

| Rule Check | Field Evaluated | Validation Logic |
|---|---|---|
| **Manufacturer / Packer** | `manufacturer` | Non-empty string; company entity present. |
| **Manufacturer Address** | `manufacturer_address` | Non-empty string; geographic / postal tokens present. |
| **Common / Generic Name** | `product_name` | Commodity name declared. |
| **Net Quantity** | `net_quantity` | Valid numerical quantity with statutory metric unit. |
| **MRP** | `mrp` | Numerically valid positive monetary figure. |
| **MRP Tax Inclusion** | `tax_inclusive_mrp` | Boolean `True` confirming tax-inclusive pricing. |
| **Manufacture / Pack Date** | `packed_date`, `manufacturing_date` | Valid date syntax (DD/MM/YYYY or MM/YYYY). |
| **Best Before / Use By** | `best_before`, `use_by_date`, `expiry_date` | Valid durability statement or date. |
| **Batch / Lot Number** | `batch_number` | Valid batch code; non-blacklisted. |
| **Consumer Care** | `consumer_care` | Valid contact phone number or email address. |
| **Unit Sale Price** | `unit_sale_price` | Price declared per gram, kg, ml, litre, or unit. |
| **Country of Origin** | `country_of_origin` | Nation declared (statutorily conditional). |

- **Confidence Threshold Gate**: If an extracted declaration's supporting OCR evidence has a confidence score below `0.80`, the check is downgraded from `PASS` to `REVIEW` with an advisory note recommending manual confirmation.
- **Consistency Validations**:
  - `validation_mrp_usp`: Verifies unit price proportionality.
  - `validation_dates`: Verifies that use-by / expiry date is chronologically after the packing date.

### Step 7: Readability Engine (`pipeline/readability_engine.py`)
- Evaluates visual image quality and text legibility:
  - **Pixel Height Ratio**: Measures bounding box height relative to total image canvas height.
  - **Local Contrast**: Computes grayscale standard deviation within region bounding boxes.
  - **Laplacian Blur Metric**: Calculates OpenCV Laplacian variance to detect optical defocus blur.
- Classifies each region as `Readable`, `Small Text`, `Low Contrast`, or `Blurry`.

### Step 8: Persistence & Database Layer (`backend/database.py`)
- Checks MongoDB Atlas connection on startup.
- If MongoDB Atlas is connected: Persists complete inspection records to the `inspections` collection.
- If MongoDB Atlas is unreachable: Automatically falls back to thread-safe in-memory storage, ensuring zero downtime during local development or offline demos.

---

## 3. Frontend Component Hierarchy (`frontend/src/`)

```
App.tsx (Router, Navigation Shell)
  │
  ├── TopHeader.tsx (Government Identity, Navigation Tabs)
  ├── Sidebar.tsx (Navigation & System Status)
  │
  ├── Pages:
  │    ├── LandingPage.tsx (Hero, Overview, Workflow)
  │    ├── InspectionPortal (/inspection)
  │    │     ├── UploadZone.tsx (Dropzone, File Preview, Camera, Sample Buttons)
  │    │     ├── ProcessingState.tsx (Live Step-by-Step Progress Pipeline)
  │    │     └── ResultView.tsx (Complete Inspection Results Dashboard)
  │    │           ├── EvidenceViewer.tsx (Canvas Overlay, Zoom, Pan, BBox Highlight)
  │    │           │     └── EvidenceOverlay.tsx (SVG / Canvas Bounding Polygon Renderer)
  │    │           ├── ReadabilitySection.tsx (Legibility Warnings & Metrics)
  │    │           ├── DeclarationsGrid (12 Key-Value Card Matrix)
  │    │           ├── ComplianceTable (Interactive 12-Check Table with Status Badges)
  │    │           ├── ValidationsTable (Consistency Analysis)
  │    │           └── InspectionReportModal.tsx (Official Printable Dual-Page Report)
  │    │
  │    ├── RepositoryPage.tsx (/repository - Historical Records Table)
  │    ├── GuidelinesPage.tsx (/guidelines - Rule 6 Reference)
  │    └── AboutPage.tsx (/about - System Information)
```
