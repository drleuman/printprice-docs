---
id: production-validation-checklist
title: Production Validation Checklist
sidebar_label: Validation Checklist
---

# Production Validation Checklist

This checklist defines the rigorous validation assertions that must pass for the PrintPrice OS preflight diagnostic chain to be validated for production deployment.

Each check acts as a quality gate ensuring the operational stability of our distributed pipeline.

This validation protocol guarantees the system's core operational promise:

> **Engine produces truth. Service preserves truth. Worker executes and persists truth. BFF displays truth. ControlPlane governs truth.**

---

## The Production Validation Checklist

### 1. Validated in Production
These checks have been successfully run, validated by automated integration suites, and confirmed in live production environments:

*   [x] **CLI Degradation Recovery**: Confirm that the Preflight Engine CLI handles missing local system dependencies (such as PDF fonts or color parser binaries) by degrading gracefully and completing with status `DEGRADED` rather than crashing the worker container.
*   [x] **Outcome Category Serialization**: Verify that the database schema correctly saves the `outcome_category` as `DEGRADED_ANALYSIS` for degraded runs, preserving the extraction findings count.
*   [x] **Job Registry Schema Integrity**: Assert that `analysisIntegrity.realExtraction = true` is persisted in the job table, confirming actual PDF parsing occurred.
*   [x] **Autofix Artifact immutability**: Verify that successful vector repairs write a persistent `fixed.pdf` to object storage and save its exact SHA-256 hash in the database.
*   [x] **Token Isolation Security**: Check that the `PreflightContractGateway` intercepts requests on admin routes and completely strips administrative credentials (`PPOS_CONTROL_TOKEN`) from downstream preflight API requests.
*   [x] **JWT Background Sync**: Verify that background queue synchronization calls explicitly construct requests using `process.env.PREFLIGHT_JWT`.

---

### 2. Implemented but Active Watchpoint
These capabilities are functional in production but are flagged as active watchpoints requiring continuous telemetry monitoring:

*   [ ] **Autofix CPU load and storage write latency**: Autofix CPU load and storage write latency remain operational watchpoints to measure under production load.
*   [ ] **Object Storage Put Latency**: Monitor database transaction timeouts during high storage write latencies for massive `fixed.pdf` uploads.
*   [ ] **Zombie In-Flight Tasks**: Sweep jobs stuck in `PROCESSING` status for over 15 minutes and transition them to `FAILED` with appropriate system notices.

---

### 3. Next Phase (Phase 36 Preview - Future Design)
These items represent future design blueprints scheduled to begin after the Phase 35.5 production freeze. No invoice, payment, MES, or automatic production-routing behavior is considered production-complete:

*   [ ] **Dynamic Policy Enforcement**: Automatic rejection of orders during intake if preflight findings exceed the allowed threshold (e.g. invalid color profiles or missing bleed parameters).
*   [ ] **Location-Aware Network Routing**: Automatically routing repaired PDFs (`fixed.pdf`) to print partners depending on regional capability matches and shipping proximity.
*   [ ] **Client Dashboard Self-Service Autofix**: Providing users with interactive self-service buttons on the preflight UI to trigger manual autofixes with granular parameter controls.
