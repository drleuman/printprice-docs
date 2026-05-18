---
id: ppos-preflight-service
title: Repository Map — ppos-preflight-service
sidebar_label: Preflight Service
---

# Repository Map — ppos-preflight-service

This document details the operational specification, integration bounds, and architectural requirements for the **Preflight Service** (`ppos-preflight-service`) repository.

---

## 1. Purpose
The Preflight Service serves as the core database registry, state coordinator, and API gateway for all preflight operations. Its primary objective is to **preserve Engine truth** and expose secure query routes for processing applications.

---

## 2. Runtime Responsibility
Operating as a stateless Node.js microservice behind our API gateway, the service orchestrates REST endpoints, processes database migrations, registers job metadata, and enforces token-checking scopes.

---

## 3. Phase 10/35 Alignment Status
*   **Status**: **Production Validated & Locked**.
*   **Details**: The service's database layer has been migrated (`008_enrich_preflight_job_registry.sql`) to store detailed metadata, including `outcome_category`, `analysisIntegrity`, and policy rules.

---

## 4. Inputs
*   **Engine JSON Traces**: Raw diagnostic reports (`report.json`) received from workers.
*   **REST Ingest Payloads**: Job creation triggers containing targets and tenant configurations.
*   **Authorization Headers**: Incoming REST calls carrying JWT tokens.

---

## 5. Outputs
*   **Job Status Registry Records**: Persisted relational job records including state and progress.
*   **API Payloads**: Standardized responses exposed over endpoints:
    *   `/api/preflight/jobs`
    *   `/api/preflight/jobs/:jobId`
    *   `/api/preflight/jobs/policies`

---

## 6. Must Preserve
*   **Engine Diagnostic Integrity**: Must store `report.json` data byte-for-byte in the job registry without filtering or structural alterations.
*   **Policies Ingestion Metadata**: For every parsed file, it must associate and record:
    *   `source`: System configuration origin.
    *   `fallbackMode`: Recovery configuration flag when parsing degrades.
    *   `policyVersion`: Schema version of the rules engine.
    *   `loadedAt`: Timestamp indicating when policies were loaded.

---

## 7. Must Not Do
*   **No Fabricated PASS States**: Under no circumstances may the service return a fake `PASS` or `COMPLETED` fallback status if the underlying Engine analysis reported diagnostic findings or failed integrity checks.
*   **No Administrative Token Leakage**: Must never forward administrative credentials (`PPOS_CONTROL_TOKEN`) down to upstream workers or public channels.

---

## 8. Key Artifacts/Statuses
*   **Artifact Mapping**: Dynamic resolution of `final_fixed_pdf` down to the highest available physical asset (`fixed.pdf` ➔ `normalized.pdf` ➔ `certified.pdf`).
*   **Error Registry**: Standardized `ARTIFACT_NOT_FOUND` envelopes.
*   **Terminal States**: `COMPLETED`, `COMPLETED_WITH_FINDINGS`, `DEGRADED`, `FAILED_RUNTIME_ENVIRONMENT`.

---

## 9. Production Validation Notes
The service successfully processed and persisted validated degraded job `job_1779116602472_1d246` and autofix job `fix_1779116602946`, confirming that the API gateways correctly map transaction boundaries under real production load.

---

## 10. Known Watchpoints
*   **API Performance**: When serving large batches of jobs to the ControlPlane, query latencies may increase if indexing of the `outcome_category` column is not maintained.
*   **Schema Evolution**: Any change in the preflight engine's output fields must be aligned with service JSON schema checkers to prevent validation errors.
