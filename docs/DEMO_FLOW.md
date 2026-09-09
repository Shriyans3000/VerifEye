# VerifEye: Official SIH Demonstration Flow & Protocol

## 1. Demonstration Purpose & Scope
This document outlines the standard end-to-end demonstration script and technical flow for **VerifEye** (AI-assisted Legal Metrology compliance verification platform, Problem Statement **SIH26034**). 

The goal of the demonstration is to prove how an Enforcement Officer uses VerifEye to inspect packaged commodities under the **Legal Metrology (Packaged Commodities) Rules, 2011 (Rule 6)**, shifting from tedious manual review to an auditable, evidence-backed, semi-automated inspection workflow.

---

## 2. Core Narrative & Value Proposition
During the demonstration, emphasize the core product philosophy:
> **AI Extracts → Rules Decide → Evidence Proves**
> 
> *Perception is not legal authority.* Machine learning models (PaddleOCR and contextual LLM extraction) read and structure the packaging text, but every legal finding (PASS, FAIL, REVIEW) is decided by a deterministic compliance rule engine. Every single finding is linked directly to image bounding boxes, providing unalterable legal provenance.

---

## 3. Pre-Demo Setup & Environment Checklist

Ensure the local environment is running and healthy:
1. **Backend Server**:
   ```bash
   conda activate verifeye
   python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   Verify health: `curl http://127.0.0.1:8000/health` → `{"status": "ok", "service": "verifeye-backend"}`
2. **Frontend Dev Server**:
   ```bash
   cd frontend
   npm run dev -- --port 5174
   ```
   Access application in browser: `http://localhost:5174`
3. **Prepared Test Fixtures**:
   - Primary single-label / dense packaging fixture: e.g., `Parle-G Gold` (back of pack with dense statutory declarations, date cluster, and manufacturer table).
   - Multi-image fixture: Front of pack + Back of pack (demonstrating Rule 6 split across display surface and information panel).

---

## 4. Step-by-Step Demonstration Protocol

### Step 1: Officer Ingestion & Interface Overview
- **Action**: Navigate to `http://localhost:5174`. The officer lands on the streamlined, professional inspection workspace.
- **Talking Points**:
  - Point out the dedicated Legal Metrology enforcement portal designed specifically for weights and measures inspectors and market surveillance teams.
  - Show the dual-slot image capture interface. Point out that Rule 6 declarations frequently span across the Principal Display Panel (PDP) and the back/side information panel (e.g., Brand and Generic Name on Front, Net Qty, MRP, Batch, Dates on Back).
  - VerifEye natively handles multi-image ingestion (`image_index: 0` and `image_index: 1`) in a single inspection session.

### Step 2: Image Ingestion & Analysis Trigger
- **Action**: Upload the packaging image (e.g. Parle-G Gold dense statutory label). Click **"Analyze Packaging"** (or inspect).
- **Technical Flow**:
  1. Frontend submits `multipart/form-data` with images to `POST /api/analyze`.
  2. OpenCV pre-processes the image (contrast, scaling, orientation checks).
  3. PaddleOCR detects text polygons and confidence scores.
  4. Contextual extraction maps raw OCR tokens to the canonical Legal Metrology data schema.
  5. Canonical normalizers clean dates, currency, and quantities without destroying raw evidence strings.
  6. Deterministic Rule Engine evaluates all 12 mandatory declarations + cross-validations.
  7. Readability diagnostics calculate physical legibility proxies (pixel height ratios, contrast, blur).
  8. Inspection record is persisted with an unalterable UUID into MongoDB Atlas (or local fallback).

### Step 3: Verification Score & Summary Dashboard
- **Action**: The analysis completes, rendering the results view.
- **Talking Points**:
  - **Project Verification Score**: Point to the verification gauge (e.g., `75.0%` or `83.3%`). Clarify to the jury: *This is an engineering verification score indicating extraction completeness (`passed_checks / 12 * 100`), not a statutory judicial penalty.*
  - **Status Counters**: Pass, Fail, and Review counts are clearly segregated.
  - Explain the **REVIEW** state: Legal metrology carries statutory liability. When OCR confidence is marginal or packaging text is ambiguous, VerifEye flags the item as **REVIEW** rather than issuing a false penalty. Missing evidence is never automatically assumed to be a confirmed violation.

### Step 4: Deterministic Compliance Table & Extracted Declarations
- **Action**: Scroll through the 12 Legal Metrology Checks:
  1. Manufacturer / Packer / Importer Name
  2. Manufacturer Complete Address
  3. Common / Generic Name
  4. Net Quantity (including metric unit verification)
  5. Maximum Retail Price (MRP)
  6. MRP Tax Inclusion Clause ("incl. of all taxes")
  7. Date of Manufacture / Packing
  8. Best Before / Expiry / Use By Date
  9. Batch / Lot Number
  10. Consumer Care (Name, Phone, Email, Address)
  11. Unit Sale Price (USP)
  12. Country of Origin
- **Validation Checks**:
  - Show the **USP ↔ MRP Consistency Check** (`MRP / Net Quantity == Unit Sale Price`). VerifEye automatically computes the mathematical ratio to detect misleading unit pricing.
  - Show the **Date Consistency Check** (validating that Best Before / Expiry chronologically succeeds the Packing Date).

### Step 5: Visual Evidence Linking & Click-to-Highlight
- **Action**: Click on a specific declaration row (e.g., **Net Quantity: 187.5 g** or **Batch: K9C**).
- **Interactive UI Behavior**:
  - The high-resolution image viewer instantly pans/zooms to the exact bounding box on the package image.
  - An animated green/amber bounding polygon outlines the exact physical text printed on the wrapper.
  - The tooltip displays the raw OCR text and confidence score.
- **Talking Points**:
  - *This solves the "black-box AI" problem.* An enforcement officer cannot take legal action on an LLM summary. VerifEye provides courtroom-grade visual evidence provenance. If an officer must issue a notice under Section 39 of the Legal Metrology Act, the visual crop and exact coordinates are right in front of them.

### Step 6: Multi-Image Provenance (If 2 images used)
- **Action**: Toggle between Image 1 (Front) and Image 2 (Back) in the evidence viewer.
- **Talking Points**:
  - Point out that every evidence item retains its `image_index`. Selecting a declaration located on the back panel switches the viewer directly to Image 2 with the corresponding coordinate overlay.

### Step 7: Label Readability & Diagnostics
- **Action**: Expand the **Readability & Diagnostics** panel.
- **Talking Points**:
  - Point out the diagnostic indicators: Blur assessment (Laplacian variance), Contrast ratio (RMS/WCAG proxies), and Text region height analysis.
  - Point out: *VerifEye does not fabricate uncalibrated physical millimeter font sizes.* Without physical camera calibration markers, DPI varies wildly. Instead, VerifEye provides calibrated relative metrics to flag illegible, low-contrast, or blurred declarations for manual officer measurement.

### Step 8: Formal Dual-Page Statutory Inspection Report
- **Action**: Click the **"View Inspection Report"** button (`#view-inspection-report-btn`).
- **UI Behavior**:
  - A modal appears showing an official, Government-standard inspection document formatted to strict A4 print standards.
  - **Page 1**: Inspection Metadata, Facility / Manufacturer details, Product Name, Overall Verification Score, and the complete 12-Point Statutory Checklist with Legal Rule citations (Rule 6(1)(a)-(k)).
  - **Page 2**: Photographic Evidence Plates (Front & Back captures with bounding box overlays), Readability Diagnostic Findings, Discrepancy Summaries, and the Enforcement Officer's Signature & Verification block.
- **Action**: Demonstrate the **"Print / Export PDF"** button triggering clean, print-optimized media styles without UI chrome.

### Step 9: Historical Repository & Surveillance Audit Log
- **Action**: Navigate to `/repository` (or Inspection History).
- **Talking Points**:
  - Every completed inspection is automatically cataloged with its timestamp, product name, manufacturer, verification score, status, and unique `inspection_id`.
  - Officers can search, filter by manufacturer or pass/fail status, and re-open any past inspection to review the exact visual evidence plates recorded during that inspection.

---

## 5. Defense & Q&A Talking Points for Judges

| Question / Challenge | Ground Truth Response |
| :--- | :--- |
| **"What if the LLM hallucinates a declaration?"** | VerifEye enforces a strict two-layer boundary. Groq/LLM extraction is constrained by spatial token mappings. Crucially, the compliance engine will **reject or flag as REVIEW** any declaration that cannot be cross-referenced against confirmed OCR bounding boxes. Furthermore, the final legal determination is 100% deterministic code—no LLM makes the Pass/Fail decision. |
| **"How do you handle dense labels like Parle-G where batch, date, and MRP are clustered together?"** | VerifEye uses proximity-bounded, spatial contextual extraction rather than simple regex. It searches within local bounding-box neighborhoods for anchor prefixes (`Pkd`, `B.No`, `M.R.P.`) to separate clustered tokens reliably without global regex replacements. |
| **"Does this replace the inspection officer?"** | Absolutely not. VerifEye is an **AI-assisted verification copilot**. It automates 90% of the reading and mathematical calculation (like USP consistency), flagging anomalies so the officer can focus on high-risk violations and legal adjudication. |
| **"Can you measure exact 1mm / 3mm statutory font heights?"** | Physical height measurement requires camera distance calibration or a physical reference standard (like an ArUco fiducial marker). VerifEye honestly computes text-to-package ratio and optical readability, refusing to fabricate bogus millimeter claims. |
| **"Is this scalable to state-wide deployment?"** | Yes. The FastAPI backend is stateless and asynchronous. OCR workers can be scaled horizontally. Persistence uses MongoDB Atlas with lightweight JSON inspection documents containing relative bounding coordinates rather than heavy duplicate images. |

---

## 6. Demonstration Fail-Safes

- If internet connectivity to external LLM APIs drops:
  - The deterministic compliance engine remains functional.
  - The system logs the fallback and defaults unextracted declarations to `REVIEW` with clear visual feedback rather than crashing.
- If MongoDB Atlas is unreachable:
  - The backend smoothly falls back to its in-memory storage dictionary (`in_memory_inspections`), ensuring the active live demo and dashboard remain completely uninterrupted.
