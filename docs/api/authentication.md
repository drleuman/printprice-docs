---
title: Authentication & Security Models
---

import ApiPlayground from '@site/src/components/ApiPlayground';

# Authentication & Security Models

PrintPrice OS implements dedicated authentication and authorization mechanisms adapted to each operational boundary: public B2B calculation, self-service developer API keys (`pp_test_*` / `pp_live_*`), partner order intake, backoffice administration, and customer-facing shared diagnostic links.

:::info Scope & Identity Separation
In accordance with the DEV-01B security audit, interactive backoffice user sessions (`jti` claim revocation) are strictly separated from machine-to-machine partner API tokens and ephemeral customer action links.
:::

---

## 1. Machine-to-Machine Intake Token (`PPOS_MARKETPLACE_INTAKE_TOKEN`)

Used by trusted e-commerce frontends, quoting widgets, and partner platforms for order creation and file registration via `requireMarketplaceOrAdmin` (`marketplaceOrders.js:21-58` in `ppos-control-plane`).

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

## 2. Self-Service Developer & Partner API Keys (`pp_test_*` / `pp_live_*`)

Used for automated machine-to-machine communication with granular scopes (`pricing:read`, `preflight:write`, `orders:create`, `webhooks:manage`), sliding-window rate limiting, and Stripe hybrid metered governance:

- **Key Format:** `pp_(test|live)_[secret_hex]` (also backwards-compatible with `ppos_(test|live)_*`)
- **Header Transmission:** Transmitted via `Authorization: Bearer <key>` or `X-API-Key: <key>`. Query parameter transmission (`?api_key=...`) is strictly prohibited and returns `HTTP 400 API_KEY_QUERY_PARAMETER_FORBIDDEN`.
- **Cryptographic Storage:** Secrets are hashed using SHA-256 (`developerApiKeyService.js`) and never stored or logged in plaintext after initial one-time generation.
- **Three-Tier Governance & Spend Caps:**
  - `SANDBOX_FREE` (`pp_test_*`): Instant self-service creation at **[control.printprice.pro/developers](https://control.printprice.pro/developers)**, free of charge, `60 req/min` sliding window.
  - `PRODUCTION_SCALE` (`pp_live_*`): Automated Stripe Hybrid Billing (€49/mo base commitment + €0.10/preflight & €0.005/BPE quote), `600 req/min` sliding window, with configurable Monthly Spend Caps (80% warning email and 100% automatic pause).
  - `ENTERPRISE_TENANT` (`pp_live_*`): Zero-base-fee allocation for verified partner printhouses (`PRINTHOUSE_ADMIN`).

### Live Authentication Handshake (`GET /api/developer/keys/test-ping`)

Verify your `pp_test_*` or `pp_live_*` key signature and inspect your active rate-limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`) directly below:

<ApiPlayground defaultEndpoint="test-ping" compact={true} />

---

## 3. Operator & Administrator Bearer JWT

Used by backoffice operations, SCADA telemetry, and administrative endpoints.

### Header Convention
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The JWT is signed with the cluster's `JWT_SECRET` and validated by `requireAdmin` (`auth.js:266-270` in `ppos-control-plane`). Missing or invalid tokens return:
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
- **Lifecycle & Initial Status:** The customer action is created with status **`PENDING_NOTIFICATION`** and type `FILE_REUPLOAD_REQUIRED` (`marketplaceCustomerActionService.js:165` in `ppos-control-plane`).
- **Execution Sequence & State in Handler:** In `marketplacePublic.js:125-165` (`ppos-control-plane`):
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
