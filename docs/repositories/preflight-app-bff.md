---
id: preflight-app-bff
title: Repository Map — preflight-app-bff
sidebar_label: Preflight App & BFF
---

# Repository Map — preflight-app-bff

This document details the operational specification, integration bounds, and architectural requirements for the **Preflight App & BFF** (`preflight-app-bff`) repository.

---

## 1. Purpose
The Preflight App & BFF serves as the user-facing presentation layer of PrintPrice OS. Its objective is to **display diagnostic truth** to developers and print managers, providing dashboards, real-time progress notifications, and download links.

---

## 2. Runtime Responsibility
The BFF acts as a read-only presentation gateway, shielding core transaction registries. It exposes client-friendly endpoints (such as `/api/v2/jobs*`), runs Server-Sent Events (SSE) progress streams, and serves static frontend bundles to browser clients.

---

## 3. Phase 10/35 Alignment Status
*   **Status**: **Production Validated & Locked**.
*   **Details**: The frontend dashboard has been fully aligned to render Phase 10 status tags (`DEGRADED` and `PARTIAL`) and can stream real-time progress updates dynamically.

---

## 4. Inputs
*   **Registry Payloads**: Raw diagnostic records and token scopes retrieved from the Preflight Service database.
*   **User Action Triggers**: Document query, policy inspections, and file download requests.

---

## 5. Outputs
*   **API Payloads**: Formatted, client-optimized responses under `/api/v2/jobs*`.
*   **User Interface Displays**: High-fidelity dashboard views containing bleed rulers, resolution charts, and color space lists.
*   **SSE Streams**: Real-time progress percentage indicators pushed directly to browser components.

---

## 6. Must Preserve
*   **Policies Ingestion Metadata**: Must propagate configuration schemas (`source`, `fallbackMode`, `policyVersion`, `loadedAt`) directly to policy summary panels.
*   **Detailed Error Payloads**: Must propagate the exact JSON details of `ARTIFACT_NOT_FOUND` errors directly to developers without sanitizing or collapsing them into generic error codes.

---

## 7. Must Not Do
*   **No Polling Loops**: Must not invoke continuous background HTTP polling loops once a job has transitioned into a terminal diagnostic status (such as `COMPLETED`, `DEGRADED`, or `PARTIAL`).
*   **No Write Mutators**: Must not bypass the Preflight Service registry to execute direct database updates or file deletions.

---

## 8. Key Artifacts/Statuses
*   **Artifact Routing**: Direct support for the `final_fixed_pdf` alias, routing callers to the best available document (`fixed.pdf` ➔ `normalized.pdf` ➔ `certified.pdf`).
*   **State Badge Indicators**: Dashboard badges representing the exact state of the job.

---

## 9. Production Validation Notes
The BFF successfully rendered the complex diagnostic layout of the degraded job `job_1779116602472_1d246` and dynamically exposed the download link for the repaired file `fixed.pdf` (`fix_1779116602946`).

---

## 10. Known Watchpoints
*   **SSE Interruption**: Network drops can occasionally interrupt live progress streams. The UI must gracefully fall back to single-request polling only when an SSE connection is lost.
*   **Static Asset Caching**: Ensure frontend build caches are cleared during minor deployments to prevent browser rendering issues with newly introduced status formats.
