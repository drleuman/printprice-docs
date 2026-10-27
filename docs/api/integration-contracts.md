---
title: Order Intake & File Governance Contracts
---

# Order Intake & File Governance Contracts

This contract governs the transition from quoting to production: formalizing a customer order, registering production PDF files, binding technical Preflight verification jobs, and automatically evaluating manufacturing readiness.

:::note Implementation Traceability
This contract is implemented in the Control Plane at `src/api/routes/marketplaceOrders.js` (`ppos-control-plane`) and served under `/api/marketplace/orders`.
:::

---

## 1. Create Manufacturing Order (`POST /api/marketplace/orders`)

Initializes a new order in `DRAFT` status and registers the mandatory file slots (`INTERIOR_PDF` and `COVER_PDF`).

### Authentication
Requires `X-Marketplace-Token: <PPOS_MARKETPLACE_INTAKE_TOKEN>` or `Authorization: Bearer <token>`.

### Request Body (JSON)
```json
{
  "pricingSessionId": "sess_89f7a6e1-9876",
  "selectedOfferId": "off_01j7b9e84k2",
  "customer": {
    "name": "Editorial Minerva S.L.",
    "email": "produccion@editorialminerva.es",
    "phone": "+34 912 345 678",
    "address": {
      "street": "Calle Gran Vía 28, 4º",
      "city": "Madrid",
      "postal_code": "28013",
      "country": "ES"
    }
  },
  "bookSpec": {
    "copies": 500,
    "interior_pages": 192,
    "format": "148x210",
    "paper_inner": "offset_white_90",
    "paper_cover": "couche_gloss_250",
    "binding": "softcover_pur",
    "colors_inner": "1/1",
    "colors_cover": "4/0"
  }
}
```

### Response (201 Created)
```json
{
  "ok": true,
  "orderId": "ord_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "status": "DRAFT",
  "requiredFiles": [
    "INTERIOR_PDF",
    "COVER_PDF"
  ],
  "readiness": {
    "ready": false,
    "blockers": [
      "MISSING_REQUIRED_FILE_INTERIOR_PDF",
      "MISSING_REQUIRED_FILE_COVER_PDF"
    ]
  }
}
```

---

## 2. Offer Selection (`POST /api/marketplace/orders/:orderId/selected-offer`)

Updates the order's chosen commercial print offer. Per `marketplaceOrders.js:252-257` (`ppos-control-plane`), the backend evaluates `req.body.selectedOffer || req.body`:

```json
// Variant A: Wrapped with offerId
{ "selectedOffer": { "offerId": "off_01j7b9e84k2", "totalPrice": 1650.00 } }

// Variant B: Direct in body with offerId
{ "offerId": "off_01j7b9e84k2", "totalPrice": 1650.00 }

// Variant C: Combination payload (controller prioritizes selectedOffer)
{
  "selectedOffer": { "offerId": "off_A", "totalPrice": 1650.00 },
  "offerId": "off_B"
}
```

:::warning Precedence & Validation Edge Cases
1. **Precedence:** When both `selectedOffer` and root `offerId`/`id` are provided, the controller strictly prioritizes `selectedOffer`.
2. **Invalid Wrapped Payloads:** If `selectedOffer` is provided as an empty object `{}` or with empty identifier strings (`""`), the controller evaluates it first and rejects with **`HTTP 400 INVALID_OFFER`**, even if root contains an alternative identifier.
3. **Empty Identifiers:** Blank strings (`""`) fail truthiness and length requirements and return HTTP 400.
:::

---

## 3. File Registration & Preflight Binding

Once the order is initialized, client systems register uploaded file metadata and bind preflight jobs:

### A. Register File Metadata (`POST /api/marketplace/orders/:orderId/files/register`)
```json
{
  "role": "INTERIOR_PDF",
  "originalName": "manuscrito_final.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 15420310,
  "checksumSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "storagePath": "orders/ord_123/interior_v1.pdf"
}
```

### B. Bind Preflight Job (`POST /api/marketplace/orders/:orderId/files/:fileId/preflight-bind`)
Links the file slot to an active Preflight analysis worker job:
```json
{
  "preflightJobId": "pf_job_8a7d6e5c-1234"
}
```

---

## 3. Order Readiness Recomputation (`POST /api/marketplace/orders/:orderId/readiness/recompute`)

Triggers a deterministic rule evaluation over all attached files and their preflight status:
- If all required slots (`INTERIOR_PDF`, `COVER_PDF`) are uploaded and pass preflight without blocking findings, status transitions to `READY`.
- If blocking errors persist (e.g., low DPI, missing bleed, font embedding failure), the order remains blocked with an itemized `blockers` list.

---

## 4. Administrative Surface Exclusion Notice

:::warning Security Boundary: GET /api/marketplace/orders
The endpoint `GET /api/marketplace/orders` is an **administrative cross-tenant endpoint** strictly restricted to platform operators (`SUPER_ADMIN`). It is intentionally excluded from the partner API contract to prevent data leakage between tenants.
:::

---

## 5. Contract Specification

Download the formal OpenAPI 3.1 specification for this domain:
- **[Pricing & Marketplace Orders OpenAPI 3.1 Specification](/openapi/pricing-marketplace.openapi.yaml)**

