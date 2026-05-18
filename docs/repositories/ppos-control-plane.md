---
id: ppos-control-plane
title: Repository Map — ppos-control-plane
sidebar_label: Control Plane
---

# Repository Map — ppos-control-plane

This document details the operational specification, integration bounds, and architectural requirements for the **Control Plane** (`ppos-control-plane`) repository.

---

## 1. Purpose
The Control Plane is the global administrative governance hub of PrintPrice OS. Its objective is to **govern diagnostic truth**, monitor worker clusters, and synchronize local job registries across distributed regions.

---

## 2. Runtime Responsibility
Operating as an administrative dashboard portal and background synchronization scheduler, the control plane orchestrates tenant provisioning, manages active queue capacities, runs health sweeps, and executes admin jobs.

---

## 3. Phase 10/35 Alignment Status
*   **Status**: **Production Validated & Locked**.
*   **Details**: The sync service (`preflightRegistrySyncService.js`) has been refactored to securely integrate with the Phase 10/35 registry database schema and handles administrative authentication boundaries cleanly.

---

## 4. Inputs
*   **Administrative Actions**: User requests made by system operators.
*   **Synchronized Ingests**: Telemetry updates pulled from external regional preflight registries.
*   **Token Verification Headers**: Incoming `PPOS_CONTROL_TOKEN` bearer headers.

---

## 5. Outputs
*   **Governance Commands**: Queue modifications, worker node re-images, and partner routings.
*   **Registry Sync Commands**: Refreshed local preflight tracking tables.

---

## 6. Must Preserve
*   **Diagnostic Truth (`canonicalPayload`)**: When syncing records, it must preserve the deep nested `canonicalPayload` containing the original engine outputs.
*   **Secure Authentication Separation**: Must strip client control tokens and sign separate, isolated `PREFLIGHT_JWT` tokens for downstream requests.

---

## 7. Must Not Do
*   **No Direct Token Leakage**: Must never forward administrative credentials (`PPOS_CONTROL_TOKEN`) down to upstream services or workers.
*   **No Fabricated Diagnostics**: Under no circumstances may the control plane generate, mock, or alter layout findings to modify job lifecycles.

---

## 8. Key Artifacts/Statuses
*   **Phase 10 Governance States**: Uses `DEGRADED`, `PARTIAL`, `COMPLETED_WITH_FINDINGS`, and `FAILED_RUNTIME_ENVIRONMENT` to drive routing and automated environment recovery processes.
*   **Node Registry**: Active lists tracking active worker container versions and readiness status.

---

## 9. Production Validation Notes
The control plane's inter-service JWT isolation was successfully verified during the Phase 35.5 milestone. Synchronization sweeps successfully integrated job telemetry from `job_1779116602472_1d246` and `fix_1779116602946` without authorization failures.

---

## 10. Known Watchpoints
*   **Sync Throttling**: Fetching thousands of deep `canonicalPayload` records during database sweeps can strain network interfaces. Keep synchronization sweeps batched and metered.
*   **Read-Only Integrity**: Administrative workers must never bypass preflight gateways to mutate diagnostic findings directly in database tables.
