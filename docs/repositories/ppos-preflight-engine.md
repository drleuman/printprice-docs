---
id: ppos-preflight-engine
title: Repository Map — ppos-preflight-engine
sidebar_label: Preflight Engine
---

# Repository Map — ppos-preflight-engine

This document details the operational specification, integration bounds, and architectural requirements for the **Preflight Engine** (`ppos-preflight-engine`) repository.

---

## 1. Purpose
The Preflight Engine is the foundational parsing runtime of PrintPrice OS. Its sole objective is to inspect physical PDF documents and **produce diagnostic truth** regarding layouts, font encodings, color profiles, bleeds, and image resolutions.

---

## 2. Runtime Responsibility
The engine runs as a deterministic command-line interface (CLI) or core library invocation within sandboxed worker containers. It directly executes low-level document streams parsing and reports results in a structured format.

---

## 3. Phase 10/35 Alignment Status
*   **Status**: **Production Validated & Locked**.
*   **Details**: The engine's core parsing logic has been aligned with Phase 10 semantic outcomes, implementing graceful degradation strategies (e.g., in `ReportBuilder.js`) rather than crashing when optional binaries are unavailable.

---

## 4. Inputs
*   **File Stream / Local Path**: A physical PDF asset stored in the worker's execution directory.
*   **Profile Specifications**: Quality gating guidelines defining minimum resolution, color space rules (e.g., CMYK-only), and bleed requirements (e.g., minimum 3mm).

---

## 5. Outputs
*   **JSON Report**: A structured JSON trace containing:
    *   `findings`: Explicit document layout or bleed violations.
    *   `analyzerCoverage`: Metrics detailing which quality gates were checked.
    *   `analysisIntegrity`: Operational checks including `realExtraction` and `degradedMode` flags.
    *   `outcome_category`: The high-level outcome label (e.g. `SUCCESSFUL_ANALYSIS`, `DEGRADED_ANALYSIS`).
*   **Modified Document Stream**: In autofix execution contexts, the engine writes an updated, repaired vector document (`fixed.pdf`).

---

## 6. Must Preserve
*   **Factual Layout Diagnostics**: Exact numeric values of crop boxes, bounding regions, font identifiers, and color coordinates.
*   **Graceful Status Tracing**: When optional sub-tools are missing, the engine must write `degradedMode: true` and preserve the `realExtraction: true` flag in the report.

---

## 7. Must Not Do
*   **No Unwarranted Failures**: Must not convert a missing optional command-line parsing tool alone into a fatal `FAILED_RUNTIME_ENVIRONMENT` status.
*   **No Mock Findings**: Under no circumstances may the engine generate simulated or synthetic findings to mask parsing timeouts or failures.
*   **No Silent Fallbacks**: Must never report `fallbackUsed: true` without explicitly registering that physical parsing did not take place.

---

## 8. Key Artifacts/Statuses
*   **Primary Artifact**: `report.json` (`analysis_report`)
*   **Output Document**: `fixed.pdf` (`final_fixed_pdf`)
*   **Terminal States**: `COMPLETED`, `COMPLETED_WITH_FINDINGS`, `DEGRADED`, `PARTIAL`, `FAILED`.

---

## 9. Production Validation Notes
The engine's graceful degradation was successfully verified under job `job_1779116602472_1d246`. The host container lacked an optional spot-color CLI utility. Instead of crashing, the engine completed execution, returned `degradedMode: true`, and successfully extracted `canonicalFindingsCount: 5` with `realExtraction: true`.

---

## 10. Known Watchpoints
*   **Coordinate Flooding**: Files with extensive vector coordinates generate massive coordinate telemetry. These must be compacted before final serialization to prevent DB transport bottlenecks.
*   **LTS CLI Upgrades**: Upgrading underlying parsing packages (like `pdfjs` or `mutool` interfaces) must be verified against schema contracts to prevent mapping variations.
