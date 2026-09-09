# VerifEye — Development Guardrails & Engineering Rules

This document establishes the binding engineering rules and behavioral constraints for any engineer or AI coding assistant contributing to the **VerifEye** codebase. Violation of these rules leads to system regression and is strictly prohibited.

---

### Rule 1: No Unsolicited Refactoring
- **Never refactor existing working code** unless explicitly commanded by the user with a defined architectural scope.
- Do not rename variables, reorganize folder hierarchies, or rewrite working algorithms under the guise of "optimization" or "cleanup."

### Rule 2: Respect Frozen Modules
- Core inspection modules (`pipeline/ocr_engine.py`, `pipeline/normalize_ocr.py`, `pipeline/groq_extract.py`, `pipeline/canonical_normalize.py`, `pipeline/compliance_engine.py`) are **FROZEN**.
- You may not edit these files unless a reproducible defect is demonstrated with a failing test case.

### Rule 3: Frontend Tasks Stay in the Frontend
- When tasked with UI, workflow, presentation, dashboard, or styling changes, **make all changes strictly in `frontend/src/`**.
- Do not alter backend route logic, data models, or compliance algorithms to accommodate UI adjustments.

### Rule 4: No Fabricated or Synthetic Evidence
- Visual bounding boxes and confidence metrics must originate from actual PaddleOCR detection outputs.
- Never invent coordinates, synthetic bounding polygons, or mock confidence scores to force a check to pass.

### Rule 5: No Fake Security or Production SSO Claims
- The current prototype includes a demonstration role-selection and authentication shell.
- Never present this client-side shell as a hardened, cryptographically secure production authentication system or government SSO integration.

### Rule 6: Deterministic Adjudication Is Non-Negotiable
- LLMs are prohibited from deciding statutory compliance.
- Compliance decisions must be rendered exclusively by deterministic Python functions implementing Rule 6 of the Packaged Commodities Rules, 2011.
- Never replace deterministic rules in `compliance_engine.py` with LLM prompt-based evaluation.

### Rule 7: Strict Anti-Hardcoding Law
- **Never hardcode brand-specific or fixture-specific values** into production logic.
- Prohibited:
  - `if "parle" in text:`
  - `batch_number = "K9C"`
  - `date = "19/2/27"`
  - Hardcoded bounding box pixel coordinates
- Every extraction rule must generalize through regex patterns and 2D spatial layout relationships (`is_same_line_right`, `is_directly_below`).

### Rule 8: No Global Character Replacements
- Packaging labels often feature low-resolution or broken dot-matrix printing (e.g. `13/2/27` for `19/2/27`).
- Never fix this by globally replacing digits across the OCR output (e.g. replacing all `3`s with `9`s).
- Corrections must be strictly contextual, scoped to the specific declaration region, and evidence-grounded.

### Rule 9: Missing Evidence Defaults to `REVIEW`, Never `FAIL`
- A single camera angle cannot view all sides of a three-dimensional package.
- If a mandatory declaration is absent from the photographed label, it must evaluate to **`REVIEW`** (*Inspector Assessment Required*).
- Never assign `FAIL` simply because an item was not visible on the submitted photograph.

### Rule 10: No Invented Millimetre Measurements
- Rule 9 specifies minimum font heights in millimetres.
- Smartphone photographs without a calibrated physical reference marker lack physical spatial scale.
- Never display or invent physical millimetre dimensions (e.g. "2.4 mm"). Surface legibility findings as visual diagnostics (`Readable`, `Small Text`, `Low Contrast`, `Blurry`).

### Rule 11: Preserve Strict API Backward Compatibility
- Never alter existing field names or data types in `/api/analyze` responses.
- Any additive fields must be optional and non-breaking for existing frontend consumers.

### Rule 12: Verify Live Runtime, Not Just Unit Tests
- Passing unit tests is a necessary condition, but not a sufficient condition.
- A long-running background server without `--reload` can continue serving stale bytecode.
- Always verify the actual live HTTP request path (`POST http://127.0.0.1:8000/api/analyze`) and real browser uploads before declaring completion.

### Rule 13: Change Discipline
For every modification:
1. Understand the exact problem.
2. Isolate the single responsible file.
3. Make the smallest necessary change.
4. Run all regression tests (`test_determinism.py`, `test_dense_label_regression.py`, etc.).
5. Run `npm --prefix frontend run build`.
6. Verify live runtime behavior.
7. Report exactly what was changed and verified.
