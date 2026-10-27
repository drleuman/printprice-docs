---
title: Authentication & Security Models
---

# Authentication & Security Models

PrintPrice OS implements dedicated authentication and authorization mechanisms adapted to each operational boundary: public B2B calculation, partner order intake, backoffice administration, and customer-facing shared diagnostic links.

:::info Scope & Identity Separation
In accordance with the DEV-01B security audit, interactive backoffice user sessions (`jti` claim revocation) are strictly separated from machine-to-machine partner API tokens and ephemeral customer action links.
:::

---

## 1. Machine-to-Machine Intake Token (`PPOS_MARKETPLACE_INTAKE_TOKEN`)

Used by trusted e-commerce frontends, quoting widgets, and partner platforms for order creation and file registration via `requireMarketplaceOrAdmin` ([`marketplaceOrders.js:21-58`](file:///c:/Users/KIKE/Downloads/ppos-control-plane-phase-10-intelligence-layer/src/api/routes/marketplaceOrders.js#L21-L58)).

### Header Convention
The intake token can be supplied via either of the following standard headers:

```http
X-Marketplace-Token: your-intake-secret-token
```
or
```http
Authorization: Bearer your-intake-secret-token
```

When validated, the system grants the request the internal system identity:
```json
{
  "id": "marketplace-token-actor",
  "role": "SUPER_ADMIN",
  "authMode": "MARKETPLACE"
}
```

---

## 2. Partner API Keys (`ppos_live_*` / `ppos_test_*`)

Used for automated machine-to-machine communication with high throughput and rate limiting:

- **Key Format:** `ppos_(live|test)_[key_id_16hex]_[secret_43b64url]`
- **Header Transmission:** Transmitted via `X-API-Key` header or `Authorization: Bearer <key>`. Query parameter transmission (`?api_key=...`) is strictly prohibited and returns `HTTP 400 API_KEY_QUERY_PARAMETER_FORBIDDEN`.
- **Cryptographic Storage:** Secrets are stored using unique salt and SHA-256 with constant-time verification (`crypto.timingSafeEqual`).
- **Distributed Revocation:** Checked in real time against Redis revocation registry and fail-closed MySQL verification.

:::note Partner Key Provisioning
Self-service generation of API keys directly from a web console is currently in security review (GATE 2). Active partner integrations are provisioned manually by contacting [api-support@printprice.pro](mailto:api-support@printprice.pro).
:::

---

## 3. Operator & Administrator Bearer JWT

Used by backoffice operations, SCADA telemetry, and administrative endpoints.

### Header Convention
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The JWT is signed with the cluster's `JWT_SECRET` and validated by `requireAdmin` ([`auth.js:266-270`](file:///c:/Users/KIKE/Downloads/ppos-control-plane-phase-10-intelligence-layer/src/api/middleware/auth.js#L266-L270)). Missing or invalid tokens return:
```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Bearer token required"
  }
}
```

---

## 4. Ephemeral Signed URL Tokens (Zero-Auth Customer Access)

To allow authors, print buyers, and external collaborators to inspect preflight reports or re-upload files without registering accounts, the API employs cryptographic, time-bound URL tokens:

### A. Shared Preflight Human Report (`GET /api/public/preflight/human-report/:token`)
- **Mechanism:** Signed JWT embedded directly in the URL path.
- **Mandatory Scope:** `payload.scope === 'HUMAN_REPORT_VIEW'`.
- **Payload Claims:** Contains `{ jobId, snapshotId, tenantId }`.
- **Tenant Isolation:** Enforces database-level tenant isolation:
  ```sql
  SELECT * FROM control_plane_preflight_human_reports 
  WHERE tenant_id = ? AND job_id = ? AND id = ?
  ```

### B. Customer Action Re-upload Token (`GET /api/marketplace/orders/:orderId/customer-action/:token`)
- **Mechanism:** High-entropy token string whose SHA-256 hash is compared against the stored hash in `marketplaceCustomerActionService.js:522`:
  ```javascript
  const providedHash = hashToken(rawToken);
  if (providedHash !== action.tokenHash) return { ok: false, error: 'INVALID_TOKEN' };
  ```
- **Lifecycle & Initial Status:** The customer action is created with status **`PENDING_NOTIFICATION`** and type `FILE_REUPLOAD_REQUIRED` ([`marketplaceCustomerActionService.js:165`](file:///c:/Users/KIKE/Downloads/ppos-control-plane-phase-10-intelligence-layer/src/api/services/marketplaceCustomerActionService.js#L165)).
- **Execution Sequence & State in Handler:** In [`marketplacePublic.js:125-165`](file:///c:/Users/KIKE/Downloads/ppos-control-plane-phase-10-intelligence-layer/src/api/routes/marketplacePublic.js#L125-L165):
  1. `validateCustomerToken` validates the hash and expiration date, loading the action snapshot directly from the database.
  2. The controller executes `await customerActionService.markCustomerActionViewed(orderId, token)` **before** sending the response. This call is awaited, but wrapped in a non-fatal `try/catch` so that database update failures do not prevent the client from receiving the remediation instructions.
  3. The response payload returns `action: validation.action` (the snapshot retrieved during step 1). Therefore, on initial access the payload reflects the database status at validation time (**`PENDING_NOTIFICATION`**, not `PENDING`).
  4. If the database update in step 2 fails, `VIEWED` is not persisted in the database; consequently, subsequent requests cannot guarantee `VIEWED`.
- **Expiration:** Validated against `action.expiresAt`. If expired, returns **`HTTP 410 Gone`** with error `TOKEN_EXPIRED` and the expiration timestamp.

---

## 5. Security & Cryptographic Best Practices

- **Never Commit Secrets:** `PPOS_MARKETPLACE_INTAKE_TOKEN` and `JWT_SECRET` must be injected exclusively through secure environment variables or Docker secrets.
- **Production TLS Validation:** In automated tests, certificate checking must never be disabled in production environments (`check_hostname=True`, `CERT_REQUIRED`).
- **No Production Probing with Mutations:** Never run automated vulnerability or contract tests that execute `POST /api/marketplace/orders` against live production databases.
- **Request Ingestion Invariants:** Server strictly rejects API keys passed via URL query parameters to avoid logging credentials in proxy access logs.
