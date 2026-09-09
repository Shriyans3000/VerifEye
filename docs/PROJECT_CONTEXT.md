# VerifEye — Project Context & System Overview

## 1. Project Purpose & Problem Statement
- **Project Name**: VerifEye
- **Hackathon Context**: Smart India Hackathon (SIH) — Problem Statement **SIH26034**
- **Domain**: Legal Metrology / Packaged Commodities Enforcement
- **Statutory Authority**: Legal Metrology Act, 2009 & Legal Metrology (Packaged Commodities) Rules, 2011 (specifically Rule 6 mandatory declarations).
- **Core Problem**: Packaged commodities sold across retail stores and commercial warehouses often violate mandatory declaration norms (missing MRP, non-inclusion of taxes, illegible print, absent batch numbers, or omitted manufacturer addresses). Manual inspection is slow, error-prone, and lacks auditable photographic evidence chains.
- **Solution**: VerifEye is an AI-assisted computer vision and compliance evaluation platform that enables field inspectors to photograph packaged commodities, automatically extract mandatory declarations, evaluate compliance via a deterministic statutory rule engine, inspect visual OCR evidence overlays, and generate legal inspection reports.

---

## 2. Product Vision & Operating Philosophy
VerifEye operates on a strict tripartite separation of concerns:

$$\textbf{AI EXTRACTS} \longrightarrow \textbf{RULES DECIDE} \longrightarrow \textbf{EVIDENCE PROVES}$$

1. **AI Perception Layer**: Uses computer vision (PaddleOCR) and LLMs (Groq LLaMA 3.3 70B / 8B) to perceive visual label text, detect regions, and parse messy text into structured declaration key-values.
2. **Deterministic Compliance Layer**: AI is **not** an adjudicator. A dedicated Python rule engine (`pipeline/compliance_engine.py`) enforces statutory requirements deterministically, guaranteeing that identical label data produces identical legal outcomes every single time.
3. **Auditable Evidence Layer**: Every compliance finding links directly to bounding box polygons, OCR confidence scores, and crop regions on the actual photograph, ensuring legally defensible evidence chains.

---

## 3. Architecture & Data Flow Overview

```
[ Packaging Photograph ]
         │
         ▼
[ FastAPI Ingestion (/api/analyze) ]
         │
         ▼
[ Image Preprocessing (OpenCV, PIL) ]
         │
         ▼
[ PaddleOCR Detection & Recognition ]
  ↳ Produces: [{ id, text, confidence, bbox, image_index }]
         │
         ▼
[ Groq LLM Extraction / Spatial Parser ]
  ↳ Structures messy OCR tokens into candidate JSON declarations
         │
         ▼
[ Canonical Normalization & 2D Spatial Rescue ]
  ↳ Resolves split OCR boxes, tabular columns, date stems, unit sale prices
         │
         ▼
[ Deterministic Compliance Engine ]
  ↳ Evaluates 12 Rule 6 declarations -> PASS / FAIL / REVIEW
  ↳ Evaluates 2 consistency validations (MRP vs USP, Date Chronology)
         │
         ▼
[ Readability & Contrast Engine ]
  ↳ Pixel height ratios, Laplacian blur variance, contrast standard deviation
         │
         ▼
[ Evidence Binding & Persistence ]
  ↳ Bounds OCR polygons to statutory checks; persists to MongoDB Atlas / Memory
         │
         ▼
[ React + Vite Inspector UI ]
  ↳ EvidenceViewer, InspectionReportModal, Repository, Readability diagnostics
```

---

## 4. Current Feature Inventory

### A. Label Ingestion & Inspection
- **Drag-and-Drop & File Picker**: Upload JPG, JPEG, PNG, or WEBP label imagery.
- **Multi-Image Inspection**: Supports uploading both Front and Back packaging panels simultaneously (up to 2 images per inspection).
- **Interactive Camera Capture**: Browser-based camera stream integration for live mobile/tablet field capture.
- **Quick-Test Regression Fixtures**: Immediate one-click testing using real-world packaged commodity samples (`test_image2.png` and `parle_g_gold_back.jpeg`).

### B. Visual Evidence Viewer
- **Interactive Evidence Overlay**: Canvas rendering bounding boxes over the packaging image.
- **Click-to-Trace**: Clicking any check item in the compliance list highlights the specific bounding box on the image and scrolls the visual viewer into focus.
- **Visual Tools**: Zoom In, Zoom Out, Fit to Screen, 100% Native Scale, Toggle All OCR Regions.
- **Multi-Image Panel Switcher**: Tabs allowing seamless switching between Image 1 (Front) and Image 2 (Back) with correct evidence coordinate mapping.

### C. Statutory Compliance Engine
- **12 Mandatory Legal Declarations**: Manufacturer, Manufacturer Address, Common Name, Net Quantity, MRP, Tax Inclusion, Pack/Mfg Date, Best Before/Use By, Batch Number, Consumer Care, Unit Sale Price, Country of Origin.
- **2 Automated Consistency Validations**: Mathematical verification between MRP and Unit Sale Price; chronological validation between manufacturing and expiry dates.
- **Three-State Semantics**: Rigorously categorizes checks into `PASS`, `FAIL`, and `REVIEW`. Missing evidence defaults to `REVIEW` (*Inspector Assessment Required*) rather than false positive violations.

### D. Readability & Label Diagnostics
- **Typography Diagnostics**: Evaluates relative text height, local contrast ratios, and image blur metrics.
- **Priority Warnings**: Surfaces potential legibility issues that may impact consumer readability under Rule 9.

### E. Official Inspection Report Generation
- **Governmental Report Styling**: Formatted according to Ministry of Consumer Affairs inspection guidelines.
- **Dual-Page Layout**:
  - Page 1: Official Header, Verification Score, Extracted Declarations, and 12-Point Declaration Table.
  - Page 2: Automated Consistency Validations, Linked Visual OCR Evidence Registry, Officer Sign-Off & Remarks block.
- **Print / PDF Ready**: Native `window.print()` styling with `@media print` clean formatting.

### F. Repository & Inspection History
- **Persistent Storage**: MongoDB Atlas persistence with automatic fallback to in-memory storage when offline.
- **Inspection Repository View**: Search, filter, and inspect past compliance records with full detail reloading.

---

## 5. Frontend Routes & Pages
- `/` or `/landing`: Public landing page with national identity banner, problem statement overview, and system workflow.
- `/inspection`: Primary operational inspection portal containing the dropzone, camera capture, live analysis state, evidence viewer, compliance check list, and readability panel.
- `/inspection/result`: Direct link to view completed inspection outcomes.
- `/repository`: Inspection history table with pagination, status filtering, and inspection detail modal.
- `/guidelines`: Reference page outlining Legal Metrology (Packaged Commodities) Rules, 2011 statutory provisions.
- `/about`: System background, architecture overview, and team information.

---

## 6. Backend API Endpoints
- `GET /health`: Health status endpoint returning `{"status": "ok", "service": "verifeye-api"}`.
- `POST /api/analyze`: Multipart form upload accepting `file` (single image) or `files` (up to 2 images). Executes OCR, extraction, normalization, compliance assessment, readability analysis, and database logging.
- `GET /api/inspections`: Retrieves historical inspections with pagination query parameters (`limit`, `skip`).
- `GET /api/inspections/{inspection_id}`: Retrieves specific saved inspection record by ID.

---

## 7. Current Prototype Status
- **Core Pipeline**: 100% frozen, validated, and deterministic across all regression suites.
- **Dense Label Handling**: Successfully resolves complex, multi-box, compressed packaging labels (demonstrated on Parle-G Gold fixture achieving 10/12 PASS, 83.3% score, with zero false violations).
- **Execution Stability**: 10/10 consecutive deterministic runs verified on both benchmark fixtures.

---

## 8. Known Limitations
1. **Physical Font Size Calibration**: The current readability module assesses pixel-height ratios and relative image resolution. Physical millimetre font heights cannot be guaranteed without a calibrated physical reference scale or known focal distance.
2. **Single Camera Perspective per Image**: Curvature on cylindrical cans or bottles may distort text at extreme margins; multi-angle photography is recommended for curved surfaces.
3. **Hardware GPU Acceleration**: PaddleOCR currently operates in CPU mode in the primary local conda environment; processing time per image is approximately 3–6 seconds.

---

## 9. Future Roadmap (Post-SIH Prototype)
- Integration with National Consumer Helpline (NCH) database for real-time brand verification.
- Mobile field application (React Native / Flutter) with on-device camera guidance and auto-crop.
- Multilingual label support for regional language statutory declarations (Hindi, Tamil, Marathi, Bengali).
- Calibrated physical reference card integration for millimeter-accurate legal font height measurements.
