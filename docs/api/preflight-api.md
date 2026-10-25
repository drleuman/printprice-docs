---
title: Preflight & Shared Reports API
---

# Preflight & Shared Reports API

The Preflight API provides programmatic access to technical PDF inspection, production fact extraction, and sanitized customer-facing diagnostic reports.

:::note Implementation Traceability
The shared diagnostic report endpoint is implemented at [`src/api/routes/publicPreflight.js:6`](file:///c:/Users/KIKE/Downloads/ppos-control-plane-phase-10-intelligence-layer/src/api/routes/publicPreflight.js#L6) and served under `/api/public/preflight/human-report/:token`. Customer action handoff is implemented at [`src/api/routes/marketplacePublic.js:125`](file:///c:/Users/KIKE/Downloads/ppos-control-plane-phase-10-intelligence-layer/src/api/routes/marketplacePublic.js#L125).
:::

---

## 1. Shared Preflight Human Report (`GET /api/public/preflight/human-report/:token`)

Allows print houses to share a customer-safe, visual diagnostic of an uploaded PDF without exposing internal server paths or operational logs.

### Authentication & Token Validation
- **Token Format:** Signed JWT in path parameter (`:token`).
- **Required Scope:** Must be signed with `HUMAN_REPORT_VIEW`.
- **Database Isolation:** Enforces multitenant boundary matching `tenant_id`, `job_id`, and `id`.

### Response (200 OK)
```json
{
  "ok": true,
  "job_id": "pf_job_8a7d6e5c-1234",
  "snapshot_id": "snap_998877",
  "tenant_id": "tenant_default",
  "report": {
    "outcome": "FIXED_REVIEW_REQUIRED",
    "summary": {
      "title": "Informe de Verificación de Archivos",
      "description": "Se detectaron advertencias que requieren confirmación visual.",
      "pages_analyzed": 192,
      "color_space": "CMYK (FOGRA39)"
    },
    "artifact_recommendations": [
      {
        "artifact_id": "art_visual_diff_01",
        "artifact_type": "VISUAL_DIFF_PAGE_12",
        "label": "Comparativa de corrección en página 12 (resolución de imagen)",
        "customer_visible": true,
        "download_url": "/api/public/preflight/artifacts/art_visual_diff_01?token=..."
      }
    ],
    "customer_actions": [
      {
        "action_id": "review_required",
        "label": "Revisión requerida antes de imprimir",
        "description": "El archivo corregido debe ser aprobado antes de enviar a planchas.",
        "severity": "warning"
      }
    ]
  }
}
:::note Error Handling
In the current implementation (`publicPreflight.js:12`), missing snapshots (`SNAPSHOT_NOT_FOUND`) return **HTTP 400** because the service does not assign a custom `statusCode` before the `result.statusCode || 400` evaluation. Returning **HTTP 404** represents a target contract proposal (`[PROPUESTA DEV-02]`).
:::

---

## 2. Customer Action Remediation Link (`GET /api/marketplace/orders/:orderId/customer-action/:token`)

When preflight detects blocking errors that require the client to supply new files, a time-limited customer remediation token is dispatched.

### Security & Lifecycle Details
1. **Hash Verification:** The server computes `SHA-256(token)` and matches it using string inequality `!==` ([`marketplaceCustomerActionService.js:522`](file:///c:/Users/KIKE/Downloads/ppos-control-plane-phase-10-intelligence-layer/src/api/services/marketplaceCustomerActionService.js#L522)) against `tokenHash`. Constant-time comparison (`crypto.timingSafeEqual`) is a recommended future hardening.
2. **Expiration Enforcement:** Validates `expiresAt`. Expired links return **`HTTP 410 Gone`**.
3. **Execution Sequence & State:** The endpoint returns `validation.action` as read from the database upon token validation. Therefore, on the first successful request, `status` is `"PENDING"`. The operation attempts an asynchronous, non-fatal database update to set `VIEWED` without blocking the 200 OK response. Subsequent queries will return `"VIEWED"`.

### Response (200 OK — Initial Request)
```json
{
  "success": true,
  "orderId": "ord_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "action": {
    "type": "REUPLOAD_REQUIRED",
    "status": "PENDING",
    "requiredFiles": ["INTERIOR_PDF"],
    "blockers": ["LOW_IMAGE_DPI_PAGE_45"],
    "message": "Por favor, sustituya el PDF interior con imágenes a 300 DPI.",
    "expiresAt": "2026-11-01T23:59:59.000Z",
    "createdAt": "2026-10-25T14:00:00.000Z"
  },
  "currentFiles": [
    {
      "file_id": "fil_int_01",
      "role": "INTERIOR_PDF",
      "status": "REJECTED",
      "preflight_status": "FAILED",
      "preflight_outcome_category": "REJECTED_RESOLUTION",
      "findings_count": 3,
      "version": 1
    }
  ],
  "trace_id": "trace_99887766"
}
```
