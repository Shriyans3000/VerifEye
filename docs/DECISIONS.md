# VerifEye — Architecture Decision Records (ADRs)

This document records the foundational architectural, product, and technical decisions made during the design and engineering of the **VerifEye** system. These decisions represent deliberate engineering trade-offs and must not be reversed without formal review.

---

### ADR-001: AI Perception vs. Deterministic Legal Decision-Making
- **Status**: **ACCEPTED / FROZEN**
- **Context**: LLMs are proficient at semantic parsing, but they are nondeterministic, prone to hallucinations, and lack statutory auditability. In a regulatory legal metrology inspection, decisions must be legally defensible in court.
- **Decision**: AI (PaddleOCR + Groq LLM) is strictly restricted to the **Perception / Extraction Layer**. The **Legal Decision Layer** is implemented exclusively as deterministic Python rules in `pipeline/compliance_engine.py`.
- **Consequences**:
  - LLMs are never asked: *"Does this label comply with Rule 6?"*
  - LLMs are only asked: *"What text corresponds to the declared net quantity and what is its OCR region ID?"*
  - Statutory compliance checks are 100% auditable, reproducible, and mathematically verifiable.

---

### ADR-002: Three-State Semantics (`PASS` / `FAIL` / `REVIEW`)
- **Status**: **ACCEPTED / FROZEN**
- **Context**: An uploaded label photograph may capture only one face of a three-dimensional package. If a mandatory declaration (e.g. Country of Origin or Generic Name) is not present on that face, declaring it a statutory violation (`FAIL`) would cause rampant false-positive violations.
- **Decision**: Missing evidence on an inspected angle is classified as **`REVIEW`** (*Inspector Assessment Required*), not `FAIL`.
- **Consequences**:
  - `PASS`: The declaration is clearly detected, structurally and numerically valid, with high OCR confidence.
  - `FAIL`: An explicit statutory violation is detected (e.g., negative/zero MRP, use-by date preceding packing date, or tax exclusion).
  - `REVIEW`: The declaration was not found on the photographed surface, OCR confidence is low, or statutory applicability requires inspector discretion.

---

### ADR-003: No Invention of Uncalibrated Physical Font Measurements
- **Status**: **ACCEPTED / FROZEN**
- **Context**: Rule 9 of the Packaged Commodities Rules mandates minimum font heights in millimetres based on net quantity. In unconstrained mobile photography, camera sensor size, resolution, subject distance, and perspective distortion prevent accurate millimetre measurement without a calibrated physical fiducial marker.
- **Decision**: VerifEye evaluates **relative pixel-height ratios**, **contrast metrics**, and **Laplacian blur variance**. It **never fabricates or displays millimetre measurements** (e.g. "2.4 mm").
- **Consequences**: Avoids making fraudulent legal claims in court. Readability findings are presented as visual quality diagnostics (`Readable`, `Small Text`, `Low Contrast`, `Blurry`).

---

### ADR-004: Multi-Image Scope (Maximum 2 Images per Inspection)
- **Status**: **ACCEPTED / FROZEN**
- **Context**: Packaged products commonly distribute statutory declarations between the Front Panel (brand, net quantity) and the Back Panel (MRP, dates, manufacturer address, batch code).
- **Decision**: Support inspecting up to **2 images** per inspection session (`image_index: 0` for Front, `image_index: 1` for Back).
- **Consequences**:
  - Keeps server memory consumption predictable on edge and cloud environments.
  - Accurately captures full-package compliance without requiring 360-degree cylindrical unwrapping.
  - Evidence polygons preserve exact `image_index` provenance.

---

### ADR-005: Evidence Traceability & Provenance Preservation
- **Status**: **ACCEPTED / FROZEN**
- **Context**: A legal inspection report is worthless if an enforcement officer cannot prove *where* on the packaging a value was read.
- **Decision**: Every canonical declaration extracted by the pipeline must retain its originating OCR region ID, confidence score, and 4-point polygon bounding coordinates.
- **Consequences**:
  - Officers can click any check in the UI to instantly spotlight the exact visual bounding box on the original photograph.
  - Fabricated or synthetic evidence is strictly prohibited.

---

### ADR-006: Localhost as Primary Demo Environment (Conda `verifeye`)
- **Status**: **ACCEPTED / FROZEN**
- **Context**: PaddleOCR requires significant RAM and CPU/GPU instructions (C++ dynamic libraries, OneDNN primitives). Free-tier cloud instances (e.g. Render Free, 512 MB RAM limit) suffer Out-Of-Memory (OOM) process termination during PaddleOCR model loading.
- **Decision**: The official primary demonstration environment for the SIH prototype is the **local workstation runtime** (`http://127.0.0.1:8000` with Vite on `http://localhost:5174`).
- **Consequences**: Guarantees zero latency, zero cloud OOM crashes, and instantaneous local processing during live jury evaluation.

---

### ADR-007: Resilient Persistence (MongoDB Atlas with In-Memory Fallback)
- **Status**: **ACCEPTED / FROZEN**
- **Context**: Network connectivity during hackathon demonstrations can be intermittent. If cloud database connections drop, inspection workflows must not freeze or crash.
- **Decision**: Implement a dual-mode persistence layer in `backend/database.py`. It connects to MongoDB Atlas if available; if offline, it transparently falls back to thread-safe in-memory storage.
- **Consequences**: Zero demo failures due to network timeouts or database authentication outages.

---

### ADR-008: Prototype Authentication Shell vs. Production Security
- **Status**: **ACCEPTED / FROZEN**
- **Context**: The prototype includes a government-styled authentication shell (`/signin`, role selection, inspector credentials) to demonstrate the user flow.
- **Decision**: Acknowledge that the current authentication shell is a client-side prototype demonstration. **Never make fake claims of production cryptographic security or government SSO integration** until formal OAuth2 / PKI backend infrastructure is deployed.

---

### ADR-009: 2D Spatial Layout Association vs. Global Character Substitutions
- **Status**: **ACCEPTED / FROZEN**
- **Context**: Packaging labels frequently split declarations across distinct OCR boxes (e.g. `NET WEIGHT:` on the left, `187.5 g` on the right) or use dot-matrix printing that confuses OCR digits (e.g. `13/2/27` for `19/2/27`).
- **Decision**:
  - Implement generic geometric 2D spatial layout relationships (`is_same_line_right`, `is_directly_below`).
  - Disallow global character substitutions (e.g., globally replacing `3` with `9`).
  - Disallow hardcoding product names, brand keywords, or batch codes.
- **Consequences**: Algorithms generalize robustly across diverse packaged commodities rather than being fragile fixtures for a single brand.
