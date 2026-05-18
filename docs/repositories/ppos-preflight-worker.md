---
id: ppos-preflight-worker
title: Repository Map — ppos-preflight-worker
sidebar_label: Preflight Worker
---

# Repository Map — ppos-preflight-worker

This document details the operational specification, integration bounds, and architectural requirements for the **Preflight Worker** (`ppos-preflight-worker`) repository.

---

## 1. Purpose
The Preflight Worker executes all asynchronous document inspection and automated repair operations. It manages background task consumers, containerized execution environments, and direct storage synchronizations.

---

## 2. Runtime Responsibility
Operating as a background worker process, the system listens to our Redis-backed BullMQ message queue. It coordinates container startup scripts, runs binary CLI invocations, and streams files directly to and from object storage buckets.

---

## 3. Phase 10/35 Alignment Status
*   **Status**: **Production Validated & Locked**.
*   **Details**: The worker's execution harness (`ToolPreflight` script) has been hardened to support degraded execution modes, ensuring that minor local tool setup issues do not result in complete container crashes.

---

## 4. Inputs
*   **Queue Event Tasks**: Asynchronous job messages defining execution type (`ANALYZE` or `AUTOFIX`).
*   **Physical Files**: Raw PDF streams downloaded from storage buckets.
*   **Autofix Instructions**: Detailed correction matrices defining which vector repairs should be applied.

---

## 5. Outputs
*   **JSON Report**: Raw diagnostic results written to `report.json`.
*   **Repaired Documents**: Output PDF streams uploaded to storage as `fixed.pdf` or `certified.pdf`.
*   **Progress Metrics**: Telemetry updates (0-100%) pushed directly to the service registry.

---

## 6. Must Preserve
*   **State Traceability**: Must continuously persist the diagnostic result, status, error stacks, and job progress.
*   **Binary Integrity**: Cryptographical verification hashes of physical file streams before and after execution.

---

## 7. Must Not Do
*   **No Uncertified PDFs**: Must never generate or upload a `certified.pdf` unless the document has officially been cleared of all layout, resolution, and color space failures.
*   **No Silent Failures**: Must not allow crashed parser subprocesses to fail silently; all runtime process exceptions must be captured and logged.

---

## 8. Key Artifacts/Statuses
*   **Certified Document**: `certified.pdf` (Only generated for validated, clean documents).
*   **Autofix Audit**: `fix_audit.json` (Exposing requested, applied, skipped, and failed repairs).
*   **Terminal States**: `COMPLETED`, `COMPLETED_WITH_FINDINGS`, `DEGRADED`, `FAILED_RUNTIME_ENVIRONMENT`.

---

## 9. Production Validation Notes
The worker successfully consumed, executed, and persisted the validated autofix job `fix_1779116602946` (source: `job_1779116602472_1d246`), confirming that vector repairs were applied and verified with exactly `appliedCount: 4` and `failedCount: 0`.

---

## 10. Known Watchpoints
*   **S3 Stream Latency**: Large document downloads or uploads may occasionally experience network throttling. Robust exponential retry policies are required on storage client modules.
*   **Ghost Containers**: In rare infrastructure failures, parser CLI subprocesses can survive main worker process terminations. A zombie process sweep is required on container startup.
