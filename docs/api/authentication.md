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

## 2. Operator & Administrator Bearer JWT

Used by backoffice operations, SCADA telemetry, and administrative endpoints.

### Header Convention
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The JWT is signed with the cluster's `JWT_SECRET` and validated by `requireAdmin`. Missing or invalid tokens return:
```json
{
  "ok": false,
  "error": "UNAUTHORIZED",
  "message": "Authentication required."
}
```

---

## 3. Ephemeral Signed URL Tokens (Zero-Auth Customer Access)

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
- **Mechanism:** High-entropy token string whose SHA-256 hash is compared against the stored hash:
  ```javascript
  const providedHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  if (providedHash !== action.tokenHash) return 403;
  ```
- **Expiration:** Validated against `action.expiresAt`. If expired, returns **`HTTP 410 Gone`** with code `TOKEN_EXPIRED`.
- **Idempotency:** The first successful visit automatically marks the customer action as `VIEWED`.

---

## 4. Security & Cryptographic Best Practices

- **Never Commit Secrets:** `PPOS_MARKETPLACE_INTAKE_TOKEN` and `JWT_SECRET` must be injected exclusively through secure environment variables.
- **Production TLS Validation:** In automated tests, certificate checking must never be disabled in production environments (`check_hostname=True`, `CERT_REQUIRED`).
- **No Production Probing with Mutations:** Never run automated vulnerability or contract tests that execute `POST /api/marketplace/orders` against live production databases.
