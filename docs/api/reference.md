---
id: reference
title: "Complete REST API Reference & cURL Samples (Phases 10–16)"
sidebar_label: "Complete API Reference (cURL)"
---

# Complete REST API Reference & cURL Samples (Phases 10–16)

This reference catalogs the production REST API endpoints exposed by the **PrintPriceOS Industrial Control Plane** (`https://control.printprice.pro`) and proxied through the **Publisher Hub BFF** (`https://budget.printprice.pro`).

---

## 1. Authentication & Governance Headers

| Header Name | Required On | Value Format / Example | Description |
| :--- | :--- | :--- | :--- |
| `x-ppos-service-token` | Internal BFF ↔ Control Plane & Preflight Callbacks | `Bearer / Secret Token` | Authenticates service-to-service traffic between `:3001`, `:8001`, and `:8081`. |
| `x-api-key` | Native Preflight Engine (`/api/preflight/jobs`) | `Secret API Key` | Authenticates direct binary inspection jobs dispatched to the Docker Preflight Engine. |
| `x-b2b-role` | B2B RBAC Protected Endpoints | `ORG_ADMIN` \| `PRODUCTION_MANAGER` \| `FINANCE_APPROVER` \| `PREPRESS_DESIGNER` | Declares the active editorial role evaluated by `b2bOrgRbacMiddleware.js`. |
| `x-b2b-member-id` | B2B RBAC Protected Endpoints | `MEM_2026_XXXX` | Links the request to a specific normalized row in `customer_b2b_members`. |
| `x-b2b-email` | B2B RBAC Protected Endpoints | `actor@publisher.com` | Secondary lookup key for organization membership verification and audit logging. |

---

## 2. Endpoint Catalog by Domain

### 2.1 Marketplace Order Lifecycle & Prepress Endpoints

| Method | Endpoint Path | RBAC Capability | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/marketplace/orders` | Any Authenticated Buyer | Creates a new industrial print order from a parametric BPE quote (`FILES_REQUIRED`). |
| `GET` | `/api/marketplace/orders/:orderId` | Organization Member | Retrieves full order state, escrow status, preflight report, and stage history. |
| `POST` | `/api/marketplace/orders/:orderId/assets` | `can_upload_assets` | Uploads `INTERIOR_PDF` and/or `COVER_PDF` binaries, computes `SHA-256`, and triggers native preflight. |
| `POST` | `/api/marketplace/orders/:orderId/preflight/callback` | Service Token | Receives asynchronous 6-axis telemetry from the Native Preflight Engine (`:8001`). |
| `GET` | `/api/marketplace/orders/:orderId/preflight/report` | Organization Member | Returns the consolidated 6-axis preflight report and asset `SHA-256` fingerprints. |
| `POST` | `/api/marketplace/orders/:orderId/soft-proof/sign-off` | `can_sign_imprimatur` | Executes cryptographic 3D Soft-Proof sign-off, locks MoR Escrow, and emails `CERT-SP` PDF. |
| `GET` | `/api/marketplace/orders/:orderId/soft-proof/certificate.pdf` | Organization Member | Generates and streams the DIN A4 vector `CERT-SP-YYYY-XXXXXXXX` PDF (`PDF-1.4`). |

### 2.2 Financial Settlement, EN 16931 E-Invoicing & Logistics Endpoints

| Method | Endpoint Path | RBAC Capability | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/marketplace/orders/:orderId/checkout/session` | `can_approve_finance` | Initializes Dual Checkout (`STRIPE_ESCROW` or `B2B_WIRE_TRANSFER`). |
| `POST` | `/api/marketplace/orders/:orderId/wire-transfer/proof` | `can_approve_finance` | Uploads bank wire remittance receipt (`PDF`/`PNG`) and transitions order to `PAYMENT_UNDER_REVIEW`. |
| `GET` | `/api/marketplace/orders/:orderId/einvoice.xml` | `can_approve_finance` | Generates EN 16931 structured XML (`?format=facturae` for Facturae 3.2.2 or `?format=ubl` for XRechnung 3.0). |
| `GET` | `/api/marketplace/orders/:orderId/invoice.pdf` | Organization Member | Streams the DIN A4 vector Commercial Invoice PDF with strict line-item segregation. |
| `POST` | `/api/marketplace/orders/:orderId/tracking/advance` | Printhouse / Operator | Advances industrial tracking across Stages `01` through `05` (`DELIVERED` releases escrow). |
| `GET` | `/api/marketplace/orders/:orderId/logistics/pod.pdf` | Organization Member | Streams the DIN A4 vector Signed Proof of Delivery (`POD / CMR`) with eIDAS seal. |
| `GET` | `/api/marketplace/orders/:orderId/logistics/labels.pdf` | Organization Member | Streams the DIN A6 vector `GS1-128 SSCC-18` pallet identification barcode labels. |

### 2.3 B2B Customer Portal, Multi-User RBAC & SRE Operations Endpoints

| Method | Endpoint Path | RBAC Capability | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/customer-portal/profile/:customerId` | Organization Member | Retrieves corporate B2B fiscal profile, VIES status, and normalized `members` list. |
| `PUT` | `/api/customer-portal/profile/:customerId` | `can_manage_org` | Updates corporate fiscal profile, billing address, and default e-invoice format. |
| `GET` | `/api/customer-portal/profile/:customerId/members` | Organization Member | Lists all organization members and their 4-role RBAC capability flags. |
| `POST` | `/api/customer-portal/profile/:customerId/members` | `can_manage_org` | Invites or provisions a new member (`ORG_ADMIN`, `PRODUCTION_MANAGER`, `FINANCE_APPROVER`, `PREPRESS_DESIGNER`). |
| `PATCH` | `/api/customer-portal/profile/:customerId/members/:memberId` | `can_manage_org` | Mutates an existing member's role or status (`ACTIVE` / `SUSPENDED`). |
| `DELETE` | `/api/customer-portal/profile/:customerId/members/:memberId` | `can_manage_org` | Revokes a member from the B2B organization. |
| `POST` | `/api/customer-portal/orders/:orderId/reorder` | `can_sign_imprimatur` | Executes a 1-Click Exact Reorder (automatically unpacking cold `.tar.gz` archives if needed). |
| `GET` | `/api/telemetry/executive-summary` | SRE / Operator | Returns the real-time Executive Operational Telemetry summary across all 5 vectors. |
| `GET` | `/api/storage/status` | SRE / Operator | Returns hot/cold storage metrics and latest MySQL `.sql.gz` snapshot status. |
| `POST` | `/api/storage/retention/run` | SRE / Operator | Triggers an on-demand Hot-to-Cold `.tar.gz` retention sweep. |
| `POST` | `/api/storage/backups/mysql` | SRE / Operator | Triggers an immediate atomic `mysqldump` `.sql.gz` snapshot with 14-snapshot rotation. |

---

## 3. Executable End-to-End cURL Walkthrough

### Step 1: Create an Industrial Print Order

```bash
curl -X POST "https://control.printprice.pro/api/marketplace/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUST_PLANETA_ES",
    "buyer_company": "Editorial Planeta S.A.",
    "buyer_vat": "ESA08186249",
    "buyer_email": "produccion@planeta.es",
    "title": "El Laberinto de los Espíritus (Edición Especial)",
    "quantity": 3000,
    "specs": {
      "trim_width_mm": 150,
      "trim_height_mm": 230,
      "pages": 240,
      "interior_paper_gsm": 90,
      "paper_bulk_factor": 1.15,
      "binding_type": "PUR",
      "color_mode": "4/4_CMYK_FOGRA39"
    },
    "pricing_breakdown": {
      "manufacturing_eur": 4850.00,
      "packaging_eur": 180.00,
      "freight_eur": 420.00,
      "epal_compensation_eur": -45.00,
      "total_net_eur": 5405.00,
      "vat_rate_percent": 4.0,
      "total_gross_eur": 5621.20
    }
  }'
```

### Step 2: Upload Prepress Binary Assets (`INTERIOR_PDF` & `COVER_PDF`)

```bash
curl -X POST "https://control.printprice.pro/api/marketplace/orders/ORD-2026-88412/assets" \
  -H "x-b2b-role: PREPRESS_DESIGNER" \
  -H "x-b2b-member-id: MEM_2026_8912" \
  -F "interior_pdf=@./interior_240pp.pdf;type=application/pdf" \
  -F "cover_pdf=@./cover_pur_14.8mm.pdf;type=application/pdf"
```

### Step 3: Sign the 3D Soft-Proof Imprimatur & Lock Escrow

```bash
curl -X POST "https://control.printprice.pro/api/marketplace/orders/ORD-2026-88412/soft-proof/sign-off" \
  -H "Content-Type: application/json" \
  -H "x-b2b-role: PRODUCTION_MANAGER" \
  -H "x-b2b-member-id: MEM_2026_PROD01" \
  -d '{
    "approved_by_name": "Elena Rostova",
    "approved_by_email": "elena.rostova@planeta.es",
    "approved_by_role": "PRODUCTION_MANAGER",
    "geometry_confirmed": {
      "trim_width_mm": 150,
      "trim_height_mm": 230,
      "spine_width_mm": 14.8,
      "bleed_mm": 3.0
    }
  }'
```

### Step 4: Initialize B2B Checkout & Download EN 16931 XML Invoice

```bash
# 1. Initialize B2B Wire Transfer Checkout (FINANCE_APPROVER required)
curl -X POST "https://control.printprice.pro/api/marketplace/orders/ORD-2026-88412/checkout/session" \
  -H "Content-Type: application/json" \
  -H "x-b2b-role: FINANCE_APPROVER" \
  -d '{
    "payment_method": "B2B_WIRE_TRANSFER",
    "buyer_email": "tesoreria@planeta.es"
  }'

# 2. Retrieve EN 16931 Facturae 3.2.2 XML
curl -X GET "https://control.printprice.pro/api/marketplace/orders/ORD-2026-88412/einvoice.xml?format=facturae" \
  -H "x-b2b-role: FINANCE_APPROVER" \
  -o Facturae_3_2_2_ORD-2026-88412.xml
```

### Step 5: Advance Production to Stage 05 (Signed POD) & Release Escrow

```bash
curl -X POST "https://control.printprice.pro/api/marketplace/orders/ORD-2026-88412/tracking/advance" \
  -H "Content-Type: application/json" \
  -d '{
    "target_stage": "STAGE_05_DELIVERED",
    "carrier_name": "DHL Freight Iberia",
    "sscc_code": "003841234500000018",
    "pod_signed_by": "J. Gómez (Jefe de Almacén Logístico)",
    "dock_gps": "41.3874, 2.1686"
  }'
```

### Step 6: Trigger 1-Click Exact Reorder (with Cold Archive Auto-Restore)

```bash
curl -X POST "https://control.printprice.pro/api/customer-portal/orders/ORD-2026-88412/reorder" \
  -H "Content-Type: application/json" \
  -H "x-b2b-role: PRODUCTION_MANAGER" \
  -d '{
    "quantity": 5000,
    "notes": "2ª Edición — Reimpresión idéntica con hashes SHA-256 congelados"
  }'
```

