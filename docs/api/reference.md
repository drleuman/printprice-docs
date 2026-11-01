---
id: reference
title: "Complete REST API Reference & cURL Samples (Phases 10–16)"
sidebar_label: "Complete API Reference (cURL)"
---

# Complete REST API Reference & cURL Samples (Phases 10–16)

This reference catalogs the canonical production REST API endpoints exposed by the **PrintPriceOS Industrial Control Plane** (`https://control.printprice.pro`, `server.js` on `:8081`) and proxied through the **Publisher Hub BFF** (`https://budget.printprice.pro`, `:3001`). Every endpoint listed below is verified by the automated route-parity suite (`tests/api_docs_route_parity.test.js`).

---

## 1. Authentication, Service Tokens & B2B RBAC Headers

| Header Name | Required On | Value Format / Example | Description |
| :--- | :--- | :--- | :--- |
| `x-marketplace-token` | Marketplace, Customer Portal, Financials & Logistics APIs | `Secret Intake Token` | Authenticates BFF-to-Control Plane requests on paths matched by `isMarketplaceOrderPath` in `server.js`. |
| `Authorization` | Admin & JWT-Protected Control Plane APIs | `Bearer <JWT_OR_CONTROL_TOKEN>` | Standard JWT (`ppos:control`) or Break-Glass Control Token authentication. |
| `x-service-token` | Internal Admin Telemetry & Storage Maintenance | `Secret Control Token` | Authenticates internal SRE calls to `/api/admin/operations/*` and `/api/admin/storage/*`. |
| `x-api-key` | Native Preflight Proxy (`/api/preflight/jobs`, `/policies`, `/workers`) | `Secret API Key` | Authenticates direct binary inspection requests forwarded via `@fastify/http-proxy` to Docker `:8001`. |
| `x-b2b-role` | B2B RBAC Protected Endpoints (`b2bOrgRbacMiddleware.js`) | `ORG_ADMIN` \| `PRODUCTION_MANAGER` \| `FINANCE_APPROVER` \| `PREPRESS_DESIGNER` | Declares the active editorial role evaluated by `requireSignOffRights`, `requireFinanceRights`, `requireAssetUploadRights`, and `requireOrgAdminRights`. |
| `x-b2b-member-id` | B2B RBAC Protected Endpoints (`b2bOrgRbacMiddleware.js`) | `MEM_2026_0001` | Identifies the normalized member record in `customer_b2b_members` (`ACTIVE` vs `SUSPENDED`). |
| `x-b2b-email` | B2B RBAC Protected Endpoints | `publisher@printprice.pro` | Secondary lookup key for organization membership verification and cryptographic audit trails. |
| `x-b2b-org-id` | Multi-User Organization Endpoints | `org-publisher-default` | Scopes B2B membership queries and role mutations to a specific corporate organization. |

---

## 2. Canonical Endpoint Catalog by Router Domain

### 2.1 Marketplace Order Intake, Asset Upload & Dual Checkout (`src/api/routes/marketplaceOrders.js` + Fastify Proxy)

Mounted at `/api/marketplace/orders` (with upstream preflight proxy at `/api/preflight/*`):

| Method | Canonical Endpoint Path | Auth & RBAC Middleware | Required Headers | HTTP Codes | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/marketplace/orders` | `requireMarketplaceOrAdmin` | `x-marketplace-token` | `201`, `400`, `401` | Creates a new marketplace print order from a parametric BPE quote (`FILES_REQUIRED`). |
| `GET` | `/api/marketplace/orders` | `requireAdmin` | `Authorization` | `200`, `401`, `500` | Lists marketplace orders with optional `status`, `tenantId`, `printhouseId`, and `customerId` filters. |
| `GET` | `/api/marketplace/orders/:orderId` | `requireMarketplaceOrAdmin` | `x-marketplace-token` | `200`, `404` | Retrieves full order state, registered `files`, `preflightBindings`, `events`, and `readiness`. |
| `POST` | `/api/marketplace/orders/:orderId/selected-offer` | `requireMarketplaceOrAdmin` | `x-marketplace-token` | `200`, `400` | Updates the selected printhouse offer for an existing order. |
| `POST` | `/api/marketplace/orders/:orderId/files/register` | `requireMarketplaceOrAdmin` | `x-marketplace-token` | `200`, `400`, `404` | Registers file metadata (`role`, `originalName`, `checksumSha256`, `sizeBytes`). |
| `POST` | `/api/marketplace/orders/:orderId/files/:fileId/preflight-bind` | `requireMarketplaceOrAdmin` | `x-marketplace-token` | `200`, `400`, `404` | Binds a native `preflightJobId` to a registered order file slot. |
| `POST` | `/api/marketplace/orders/:orderId/readiness/recompute` | `requireMarketplaceOrAdmin` | `x-marketplace-token` | `200`, `404` | Recomputes production readiness and geometric/file blockers for an order. |
| `POST` | `/api/marketplace/orders/:orderId/files/upload` | `requireMarketplaceOrAdmin`, `requireAssetUploadRights` | `x-marketplace-token`, `x-b2b-role`, `x-b2b-member-id` | `200`, `403`, `404` | Streams binary `INTERIOR_PDF` or `COVER_PDF` (up to 5 GB via `multer`), computes `SHA-256`, and dispatches preflight. |
| `POST` | `/api/marketplace/orders/:orderId/files/external-link` | `requireMarketplaceOrAdmin`, `requireAssetUploadRights` | `x-marketplace-token`, `x-b2b-role`, `x-b2b-member-id` | `200`, `400`, `403` | Ingests external artwork links (S3, Dropbox, Drive, WeTransfer) with SSRF protection. |
| `POST` | `/api/marketplace/orders/:orderId/checkout/session` | `requireMarketplaceOrAdmin`, `requireFinanceRights` | `x-marketplace-token`, `x-b2b-role`, `x-b2b-member-id` | `200`, `403`, `404` | Initializes Dual Checkout session (`STRIPE_CARD`, `SEPA_DEBIT`, or `BANK_TRANSFER_B2B`). |
| `POST` | `/api/marketplace/orders/:orderId/payment/wire-proof` | `requireMarketplaceOrAdmin`, `requireFinanceRights` | `x-marketplace-token`, `x-b2b-role`, `x-b2b-member-id` | `200`, `403`, `404` | Uploads B2B SEPA wire transfer receipt (`PDF`/`PNG`), sets `WIRE_PROOF_UPLOADED`, and funds escrow. |
| `POST` | `/api/marketplace/orders/:orderId/payment/webhook` | `requireMarketplaceOrAdmin` | `x-marketplace-token` | `200`, `404` | Confirms Stripe/SEPA payment, transitions order to `IN_PRODUCTION`, and locks MoR Escrow. |
| `POST` | `/api/marketplace/orders/:orderId/preflight/callback` | `requireMarketplaceOrAdmin` | `x-marketplace-token` | `200`, `404` | Receives asynchronous 6-axis preflight verdict telemetry and updates `marketplace_orders`. |
| `GET` | `/api/marketplace/orders/:orderId/preflight/report` | `requireMarketplaceOrAdmin` | `x-marketplace-token` | `200`, `500` | Retrieves the consolidated 6-axis preflight & spine geometry report for an order. |

---

### 2.2 Native Preflight Engine & Proxy Routes (`src/api/routes/preflightRoutes.js` + `server.js`)

Mounted at `/api/preflight`:

| Method | Canonical Endpoint Path | Auth & RBAC Middleware | Required Headers | HTTP Codes | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/preflight/jobs` | `@fastify/http-proxy` (`:8001`) | `x-api-key`, `x-marketplace-token` | `200`, `202` | Proxies multipart binary PDF inspection jobs directly to the native Docker Preflight Engine (`:8001`). |
| `GET` | `/api/preflight/policies` | `@fastify/http-proxy` (`:8001`) | `x-api-key`, `x-marketplace-token` | `200` | Lists active ISO 12647-2 / PDF/X-4 preflight policies from the native engine. |
| `GET` | `/api/preflight/workers` | `@fastify/http-proxy` (`:8001`) | `x-api-key`, `x-marketplace-token` | `200` | Returns live worker health and queue metrics from the native preflight container. |
| `GET` | `/api/preflight/inspections` | `requireLogisticsControlPlaneAuth` | `x-marketplace-token` | `200`, `403` | Lists tenant preflight inspections, `PREFLIGHT_STANDARDS`, and `MASTER_PAPER_CATALOG`. |
| `GET` | `/api/preflight/inspections/:id` | `requireLogisticsControlPlaneAuth` | `x-marketplace-token` | `200`, `403` | Returns detailed 6-axis inspection telemetry for a specific inspection or job ID. |
| `POST` | `/api/preflight/inspect` | `requireLogisticsControlPlaneAuth` | `x-marketplace-token` | `200`, `400`, `403` | Executes synchronous 6-axis preflight and parametric spine bulk validation. |
| `POST` | `/api/preflight/auto-fix` | `requireLogisticsControlPlaneAuth` | `x-marketplace-token` | `200`, `400`, `403` | Runs the automated FIX IT Engine (CMYK GCR conversion, +3.0 mm bleed extension, spine resize). |
| `POST` | `/api/preflight/callback` | `requireLogisticsControlPlaneAuth` | `x-marketplace-token` | `200`, `400` | Global webhook receiver for asynchronous preflight worker verdict callbacks. |

---

### 2.3 B2B Customer Portal, 3D Soft-Proof, Multi-User RBAC & SRE (`src/api/routes/customerPortalRoutes.js`)

Mounted at `/api/customer`:

| Method | Canonical Endpoint Path | Auth & RBAC Middleware | Required Headers | HTTP Codes | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/customer/orders` | `isMarketplaceOrderPath` | `x-marketplace-token` | `200`, `500` | Lists active and historical B2B customer orders hydrated from MySQL and runtime store. |
| `POST` | `/api/customer/orders/:orderId/reorder` | `requireSignOffRights` | `x-marketplace-token`, `x-b2b-role`, `x-b2b-member-id` | `201`, `400`, `403`, `404` | Executes a 1-Click Exact Reprint / New Edition (auto-unpacking cold `.tar.gz` archives if needed). |
| `POST` | `/api/customer/orders/:orderId/archive/unpack` | `isMarketplaceOrderPath` | `x-marketplace-token` | `200`, `404`, `500` | Restores a cold-archived order (`.tar.gz`) back to hot disk and verifies `SHA-256` file integrity. |
| `GET` | `/api/customer/orders/:orderId/tracking` | `isMarketplaceOrderPath` | `x-marketplace-token` | `200`, `404` | Returns the 5-stage industrial manufacturing timeline, carrier telemetry, and POD metadata. |
| `POST` | `/api/customer/orders/:orderId/stage` | `isMarketplaceOrderPath` | `x-marketplace-token` | `200`, `404` | Advances the industrial production stage (`Stage 01`..`Stage 05`) and triggers POD SMTP notifications. |
| `POST` | `/api/customer/orders/:orderId/soft-proof/approve` | `requireSignOffRights` | `x-marketplace-token`, `x-b2b-role`, `x-b2b-member-id` | `200`, `400`, `403`, `404` | Executes cryptographic 3D Soft-Proof Imprimatur (`SHA-256`), locks Escrow, and emails `CERT-SP` PDF. |
| `POST` | `/api/customer/orders/:orderId/soft-proof/reject` | `isMarketplaceOrderPath` | `x-marketplace-token` | `200`, `400`, `404` | Records a 3D Soft-Proof rejection with geometric correction notes and resets status to `FILES_REQUIRED`. |
| `GET` | `/api/customer/orders/:orderId/soft-proof/certificate.pdf` | `isMarketplaceOrderPath` | `x-marketplace-token` | `200`, `404` | Streams the DIN A4 vector Digital Imprimatur Certificate (`CERT-SP-YYYY-XXXXXXXX`, `PDF-1.4`). |
| `GET` | `/api/customer/orders/:orderId/notifications` | `isMarketplaceOrderPath` | `x-marketplace-token` | `200` | Lists all transactional SMTP notifications dispatched for the specified order. |
| `POST` | `/api/customer/orders/:orderId/notifications/send` | `isMarketplaceOrderPath` | `x-marketplace-token` | `200`, `400`, `404` | Triggers an on-demand transactional SMTP dispatch (`IMPRIMATUR_SIGNED_ESCROW_LOCKED`, etc.). |
| `GET` | `/api/customer/operations/summary` | `isMarketplaceOrderPath` | `x-marketplace-token` | `200`, `500` | Returns the real-time Executive Operational Telemetry summary across all 5 industrial vectors. |
| `GET` | `/api/customer/storage/backup/status` | `isMarketplaceOrderPath` | `x-marketplace-token` | `200`, `500` | Returns hot/cold storage lifecycle metrics and latest `.sql.gz` MySQL snapshot status. |
| `POST` | `/api/customer/storage/retention/run` | `isMarketplaceOrderPath` | `x-marketplace-token` | `200`, `500` | Executes an on-demand Hot-to-Cold POSIX `.tar.gz` retention sweep. |
| `POST` | `/api/customer/storage/backup/run` | `isMarketplaceOrderPath` | `x-marketplace-token` | `200`, `500` | Triggers an immediate atomic `mysqldump` `.sql.gz` snapshot with 14-snapshot rotation. |
| `GET` | `/api/customer/profile` | `isMarketplaceOrderPath` | `x-marketplace-token` | `200` | Retrieves the B2B fiscal profile (`VIES`, `DIR3`, `Leitweg-ID`) and dock shipping address book. |
| `PUT` | `/api/customer/profile` | `isMarketplaceOrderPath` | `x-marketplace-token` | `200`, `400` | Updates the B2B fiscal profile and shipping addresses with EU VIES VAT syntax validation. |
| `GET` | `/api/customer/organization/members` | `isMarketplaceOrderPath` | `x-marketplace-token` | `200`, `500` | Lists all organization members in `customer_b2b_members` and the 4-role RBAC permission matrix. |
| `POST` | `/api/customer/organization/members` | `requireOrgAdminRights` | `x-marketplace-token`, `x-b2b-role`, `x-b2b-member-id` | `201`, `400`, `403` | Provisions a new member (`ORG_ADMIN`, `PRODUCTION_MANAGER`, `FINANCE_APPROVER`, `PREPRESS_DESIGNER`). |
| `PUT` | `/api/customer/organization/members/:memberId/role` | `requireOrgAdminRights` | `x-marketplace-token`, `x-b2b-role`, `x-b2b-member-id` | `200`, `400`, `403`, `404` | Updates an existing organization member's role or status (`ACTIVE` / `SUSPENDED`). |
| `DELETE` | `/api/customer/organization/members/:memberId` | `requireOrgAdminRights` | `x-marketplace-token`, `x-b2b-role`, `x-b2b-member-id` | `200`, `403`, `404` | Revokes/suspends a member from the B2B organization. |

---

### 2.4 Financials, MoR Escrow & EN 16931 Electronic Invoicing (`src/api/routes/escrowRoutes.js`)

Mounted at `/api/financials/escrow`:

| Method | Canonical Endpoint Path | Auth & RBAC Middleware | Required Headers | HTTP Codes | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/financials/escrow/ledger` | `requireLogisticsControlPlaneAuth` | `x-marketplace-token` | `200`, `403` | Lists all MoR Escrow ledger entries and fund states (`UNFUNDED`, `FUNDS_LOCKED_ON_PROOF_APPROVAL`, `RELEASED_ON_SIGNED_POD`). |
| `POST` | `/api/financials/escrow/lock` | `requireLogisticsControlPlaneAuth` | `x-marketplace-token` | `201`, `400`, `403` | Locks gross order funds in MoR Escrow upon cryptographic 3D Soft-Proof approval. |
| `POST` | `/api/financials/escrow/:orderId/settle-on-pod` | `requireLogisticsControlPlaneAuth` | `x-marketplace-token` | `200`, `400`, `403` | Releases locked escrow funds and executes split payout upon signed Stage 05 POD confirmation. |
| `GET` | `/api/financials/escrow/profitability` | `requireLogisticsControlPlaneAuth` | `x-marketplace-token` | `200`, `403` | Computes real-time executive profitability crossing Escrow shares, JMF waste variance, and machine OEE %. |
| `GET` | `/api/financials/escrow/:orderId/e-invoice.xml` | `requireLogisticsControlPlaneAuth`, `requireFinanceRights` | `x-marketplace-token`, `x-b2b-role`, `x-b2b-member-id` | `200`, `403`, `404` | Generates EN 16931 compliant XML (`?format=FACTURAE_3_2_2` or `?format=XRECHNUNG_3_0`, plus `?raw=true` for raw XML stream). |

---

### 2.5 Governed Logistics, 3D Cubing, POD/CMR & GS1-128 SSCC-18 (`src/api/routes/logisticsRoutes.js`)

Mounted at `/api/logistics` (and `/api/printhouses` for freight matrices):

| Method | Canonical Endpoint Path | Auth & RBAC Middleware | Required Headers | HTTP Codes | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/logistics/warehouses` | `requireLogisticsControlPlaneAuth` | `x-marketplace-token`, `x-user-role` | `200`, `403` | Lists active editorial distribution warehouse profiles (`LOGISTA_ES`, `ZEITFRACHT_ERFURT`, `ARVATO_VVA_GUETERSLOH`). |
| `GET` | `/api/logistics/warehouses/:code` | `requireLogisticsControlPlaneAuth` | `x-marketplace-token`, `x-user-role` | `200`, `404` | Returns dock constraints, pallet height limits, and slot booking rules for a warehouse profile. |
| `POST` | `/api/logistics/calculate-quote` | `requireLogisticsControlPlaneAuth` | `x-marketplace-token`, `x-user-role` | `200`, `400`, `404` | Computes 3D FEFCO 0201 carton & EPAL pallet cubing, pallet optimization (`Delta Q`), and landed freight cost. |
| `GET` | `/api/logistics/shipments/:id/labels/sscc-pdf` | `requireLogisticsControlPlaneAuth` | `x-marketplace-token` | `200`, `400`, `403` | Generates DIN A6 (or `?format=A4_SHEET_4UP`) vector `GS1-128 SSCC-18` pallet barcode labels (`PDF-1.4`). |
| `POST` | `/api/logistics/shipments/:id/labels/sscc-pdf` | `requireLogisticsControlPlaneAuth` | `x-marketplace-token` | `200`, `400`, `403` | Generates DIN A6 / A4 4-UP vector `GS1-128 SSCC-18` pallet labels with custom payload overrides. |
| `GET` | `/api/logistics/shipments/:id/delivery-note/pdf` | `requireLogisticsControlPlaneAuth` | `x-marketplace-token` | `200`, `400`, `403` | Generates the official DIN A4 Delivery Note / Signed POD / CMR Waybill (`PDF-1.4`) with EPAL voucher box. |
| `GET` | `/api/logistics/carrier-protocol/pdf` | `requireLogisticsControlPlaneAuth` | `x-marketplace-token` | `200`, `400` | Streams the official DIN A4 Carrier Integration Protocol & Dock Service Conditions PDF. |
| `POST` | `/api/logistics/carrier/milestones` | `requireLogisticsControlPlaneAuth` | `x-marketplace-token`, `x-user-role` | `200`, `400` | Ingests carrier scan events (`SSCC-18`), digital POD closure, and dock EPAL exchange counts. |
| `POST` | `/api/logistics/epal/settlement-run` | `requireLogisticsControlPlaneAuth` | `x-marketplace-token`, `x-user-role` | `200`, `403` | Evaluates the 14-day EPAL Palettenschein return window and issues `15.00 EUR/pallet` compensation lines. |
| `GET` | `/api/logistics/epal/scheduler-status` | `requireLogisticsControlPlaneAuth` | `x-marketplace-token`, `x-user-role` | `200` | Returns the live status of the automated 14-day EPAL settlement cron daemon. |
| `POST` | `/api/logistics/epal/scheduler-control` | `requireLogisticsControlPlaneAuth` | `x-marketplace-token`, `x-user-role` | `200`, `400` | Starts or stops the automated daily EPAL settlement scheduler (`START` / `STOP`). |
| `GET` | `/api/logistics/notifications/publisher-pod` | `requireLogisticsControlPlaneAuth` | `x-marketplace-token`, `x-user-role` | `200` | Lists automatic publisher POD delivery notifications and webhook dispatches. |
| `POST` | `/api/logistics/landed-cost/consolidate` | `requireLogisticsControlPlaneAuth` | `x-marketplace-token`, `x-user-role` | `200`, `400` | Consolidates manufacturing, packaging, carrier freight, and overdue EPAL charges into the order balance. |
| `GET` | `/api/printhouses/:id/freight-matrices` | `requireLogisticsControlPlaneAuth` | `Authorization`, `x-user-role` | `200`, `403` | Lists printhouse freight rate matrices and packaging consumable rates. |
| `PUT` | `/api/printhouses/:id/freight-matrices` | `requireLogisticsControlPlaneAuth` | `Authorization`, `x-user-role` | `200`, `400`, `403` | Upserts printhouse freight rate matrices and pallet/carton consumable tariffs. |

---

### 2.6 Publisher B2B Hub & Admin SRE Mirrors (`src/api/routes/publisherRoutes.js` & `src/api/routes/admin.js`)

Mounted at `/api/publisher` and `/api/admin`:

| Method | Canonical Endpoint Path | Auth & RBAC Middleware | Required Headers | HTTP Codes | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/publisher/orders` | `requirePublisherHubAuth` | `x-marketplace-token`, `x-user-role` | `200`, `403` | Lists active and completed editorial orders scoped to `publisherTenantId`. |
| `POST` | `/api/publisher/orders` | `requirePublisherHubAuth` | `x-marketplace-token`, `x-user-role` | `201`, `400` | Submits a new editorial title order into the Publisher B2B Hub. |
| `GET` | `/api/publisher/orders/:id` | `requirePublisherHubAuth` | `x-marketplace-token`, `x-user-role` | `200`, `404` | Returns order detail and parametric 3D Soft-Proofing geometry. |
| `GET` | `/api/publisher/orders/:id/telemetry` | `requirePublisherHubAuth` | `x-marketplace-token`, `x-user-role` | `200`, `404` | Returns the 6-stage real-time manufacturing timeline and logistics tracking. |
| `POST` | `/api/publisher/orders/:id/proof-decision` | `requirePublisherHubAuth` | `x-marketplace-token`, `x-user-role` | `200`, `400` | Submits formal 3D Soft-Proof approval (`APPROVED` / `REJECTED`) and delegates to `customerPortalRoutes`. |
| `POST` | `/api/publisher/proofs/:orderId/sign-off` | `requirePublisherHubAuth` | `x-marketplace-token`, `x-user-role` | `200`, `400` | Alias for `POST /api/publisher/orders/:id/proof-decision`. |
| `GET` | `/api/publisher/proofs/:orderId/certificate.pdf` | `requirePublisherHubAuth` | `x-marketplace-token`, `x-user-role` | `200`, `500` | Streams the DIN A4 vector Digital Imprimatur Certificate (`CERT-SP`) via the Publisher Hub namespace. |
| `GET` | `/api/publisher/notifications` | `requirePublisherHubAuth` | `x-marketplace-token`, `x-user-role` | `200` | Lists publisher lifecycle notifications for the authenticated tenant. |
| `GET` | `/api/publisher/orders/:id/certificates/fsc-pefc` | `requirePublisherHubAuth` | `x-marketplace-token`, `x-user-role` | `200`, `404` | Returns the FSC / PEFC Chain of Custody substrate verification certificate. |
| `GET` | `/api/admin/operations/telemetry-summary` | `hasTrustedInternalStorageOrTelemetryToken` | `x-marketplace-token` or `x-service-token` | `200`, `401`, `500` | Admin SRE mirror returning the 5-vector Executive Operational Telemetry summary. |
| `GET` | `/api/admin/storage/backup/status` | `hasTrustedInternalStorageOrTelemetryToken` | `x-marketplace-token` or `x-service-token` | `200`, `401`, `500` | Admin SRE mirror returning hot/cold storage metrics and MySQL snapshot status. |
| `POST` | `/api/admin/storage/retention/run` | `hasTrustedInternalStorageOrTelemetryToken` | `x-marketplace-token` or `x-service-token` | `200`, `401`, `500` | Admin SRE mirror triggering an immediate Hot-to-Cold `.tar.gz` retention cycle. |
| `POST` | `/api/admin/storage/backup/run` | `hasTrustedInternalStorageOrTelemetryToken` | `x-marketplace-token` or `x-service-token` | `200`, `401`, `500` | Admin SRE mirror triggering an immediate atomic `mysqldump` `.sql.gz` snapshot. |
| `POST` | `/api/admin/storage/retention/unpack/:orderId` | `requireAdmin` | `Authorization`, `x-service-token` | `200`, `404`, `500` | Admin SRE mirror restoring a cold-archived `.tar.gz` order back to hot storage. |

---

## 3. Executable End-to-End cURL Walkthrough

### Step 1: Create an Industrial Print Order (`POST /api/marketplace/orders`)

```bash
curl -X POST "https://control.printprice.pro/api/marketplace/orders" \
  -H "Content-Type: application/json" \
  -H "x-marketplace-token: YOUR_MARKETPLACE_TOKEN" \
  -d '{
    "tenantId": "tenant-default",
    "printhouseId": "ph-eurograf-b1",
    "customer": {
      "name": "Editorial Planeta S.A.",
      "email": "publisher@printprice.pro"
    },
    "bookSpec": {
      "title": "El Laberinto de los Espíritus (Edición Especial)",
      "isbn": "978-84-08-16317-6",
      "copies": 3000,
      "interior_pages": 240,
      "trimWidthMm": 150,
      "trimHeightMm": 230,
      "paper_weight_interior": 90,
      "binding_method": "softcover_pur"
    }
  }'
```

### Step 2: Upload Prepress Binary Assets (`POST /api/marketplace/orders/:orderId/files/upload`)

Requires `canUploadProductionFiles` (`ORG_ADMIN`, `PRODUCTION_MANAGER`, or `PREPRESS_DESIGNER`):

```bash
curl -X POST "https://control.printprice.pro/api/marketplace/orders/ORD_2026_101/files/upload" \
  -H "x-marketplace-token: YOUR_MARKETPLACE_TOKEN" \
  -H "x-b2b-role: PREPRESS_DESIGNER" \
  -H "x-b2b-member-id: MEM_2026_0004" \
  -F "role=INTERIOR_PDF" \
  -F "file=@./interior_240pp.pdf;type=application/pdf"
```

### Step 3: Sign the 3D Soft-Proof Imprimatur & Download `CERT-SP` PDF

Requires `canApproveSoftProof` (`ORG_ADMIN` or `PRODUCTION_MANAGER`):

```bash
# 1. Approve 3D Soft-Proof & Lock Escrow
curl -X POST "https://control.printprice.pro/api/customer/orders/ORD_2026_101/soft-proof/approve" \
  -H "Content-Type: application/json" \
  -H "x-marketplace-token: YOUR_MARKETPLACE_TOKEN" \
  -H "x-b2b-role: PRODUCTION_MANAGER" \
  -H "x-b2b-member-id: MEM_2026_0002" \
  -d '{
    "approvedBy": "production@printprice.pro",
    "comments": "Spine 27.66 mm and +3.0 mm BleedBox verified for CTP platesetter.",
    "geometry": {
      "trimWidthMm": 210,
      "trimHeightMm": 280,
      "spineThicknessMm": 27.66,
      "bleedMarginMm": 3.0
    }
  }'

# 2. Download DIN A4 Vector Imprimatur Certificate PDF
curl -sS "https://control.printprice.pro/api/customer/orders/ORD_2026_101/soft-proof/certificate.pdf" \
  -H "x-marketplace-token: YOUR_MARKETPLACE_TOKEN" \
  -o Imprimatur_CERT-SP_ORD_2026_101.pdf
```

### Step 4: Execute B2B Checkout, Upload Wire Proof & Download EN 16931 XML Invoice

Requires `canExecutePayments` (`ORG_ADMIN` or `FINANCE_APPROVER`):

```bash
# 1. Initialize Dual Checkout Session
curl -X POST "https://control.printprice.pro/api/marketplace/orders/ORD_2026_103/checkout/session" \
  -H "Content-Type: application/json" \
  -H "x-marketplace-token: YOUR_MARKETPLACE_TOKEN" \
  -H "x-b2b-role: FINANCE_APPROVER" \
  -H "x-b2b-member-id: MEM_2026_0003" \
  -d '{
    "paymentMethod": "BANK_TRANSFER_B2B",
    "settlementModality": "MODALITY_A_ESCROW_MOR"
  }'

# 2. Upload B2B Wire Transfer Remittance Proof
curl -X POST "https://control.printprice.pro/api/marketplace/orders/ORD_2026_103/payment/wire-proof" \
  -H "Content-Type: application/json" \
  -H "x-marketplace-token: YOUR_MARKETPLACE_TOKEN" \
  -H "x-b2b-role: FINANCE_APPROVER" \
  -H "x-b2b-member-id: MEM_2026_0003" \
  -d '{
    "originalName": "SEPA_Receipt_ORD_2026_103.pdf",
    "reference": "PPOS-ORD-2026103",
    "ibanOrigin": "ES9121000418450200051332"
  }'

# 3. Download Spanish Facturae 3.2.2 or EU XRechnung 3.0 (UBL 2.1) XML
curl -sS "https://control.printprice.pro/api/financials/escrow/ORD_2026_101/e-invoice.xml?format=FACTURAE_3_2_2&raw=true" \
  -H "x-marketplace-token: YOUR_MARKETPLACE_TOKEN" \
  -H "x-b2b-role: FINANCE_APPROVER" \
  -H "x-b2b-member-id: MEM_2026_0003" \
  -o Facturae_ORD_2026_101.xml
```

### Step 5: Advance Production to Stage 05 & Download Signed POD/CMR + GS1-128 SSCC-18 Labels

```bash
# 1. Advance Order to Stage 05 (Delivered & Signed POD)
curl -X POST "https://control.printprice.pro/api/customer/orders/ORD_2026_101/stage" \
  -H "Content-Type: application/json" \
  -H "x-marketplace-token: YOUR_MARKETPLACE_TOKEN" \
  -d '{
    "step": 5,
    "stage": "DELIVERED",
    "operatorNotes": "Delivered at Logista Guadalajara Bay 14 with signed CMR."
  }'

# 2. Download Official DIN A4 Delivery Note / Signed POD PDF
curl -sS "https://control.printprice.pro/api/logistics/shipments/SHP-2026-0101/delivery-note/pdf" \
  -H "x-marketplace-token: YOUR_MARKETPLACE_TOKEN" \
  -o DeliveryNote_POD_SHP-2026-0101.pdf

# 3. Download DIN A6 GS1-128 SSCC-18 Pallet Labels PDF
curl -sS "https://control.printprice.pro/api/logistics/shipments/SHP-2026-0101/labels/sscc-pdf?format=A6" \
  -H "x-marketplace-token: YOUR_MARKETPLACE_TOKEN" \
  -o SSCC_Labels_A6_SHP-2026-0101.pdf
```

### Step 6: Trigger 1-Click Exact Reorder (`POST /api/customer/orders/:orderId/reorder`)

Requires `canApproveSoftProof` (`ORG_ADMIN` or `PRODUCTION_MANAGER`):

```bash
curl -X POST "https://control.printprice.pro/api/customer/orders/ORD_2026_102/reorder" \
  -H "Content-Type: application/json" \
  -H "x-marketplace-token: YOUR_MARKETPLACE_TOKEN" \
  -H "x-b2b-role: PRODUCTION_MANAGER" \
  -H "x-b2b-member-id: MEM_2026_0002" \
  -d '{
    "copies": 2500,
    "editionLabel": "2nd Edition — Straight Reprint",
    "reprintPurpose": "STRAIGHT_REPRINT",
    "reuseApprovedFiles": true
  }'
```
