---
id: rbac-governance
title: "B2B Multi-User Organization & Editorial RBAC Matrix"
sidebar_label: "B2B Multi-User RBAC Matrix"
---

# B2B Multi-User Organization & Editorial RBAC Matrix

Enterprise publishing houses segregate operational duties across prepress designers, production directors, financial controllers, and corporate administrators. PrintPriceOS implements a strict **Multi-User B2B Role-Based Access Control (RBAC)** governance model enforced at the API middleware layer (`b2bOrgRbacMiddleware.js`) and reflected dynamically in the Publisher Hub UI (`budget.printprice.pro`).

---

## 1. Normalized Relational Schema (`MySQL`)

Multi-user B2B governance extends the corporate fiscal entity (`customer_b2b_profiles`) with a normalized membership table (`customer_b2b_members`) while maintaining backward compatibility via synchronized `members_json` snapshots.

### 1.1 Entity-Relationship Diagram

```mermaid
erDiagram
  CUSTOMER_B2B_PROFILES ||--o{ CUSTOMER_B2B_MEMBERS : "governs"
  CUSTOMER_B2B_PROFILES ||--o{ MARKETPLACE_ORDERS : "places"

  CUSTOMER_B2B_PROFILES {
    varchar(128) customer_id PK "e.g. CUST_PLANETA_ES"
    varchar(255) company_name "Legal Corporate Name"
    varchar(64) vat_number "EU VIES / NIF Tax ID"
    varchar(16) billing_country "ISO-3166 Alpha-2"
    varchar(32) einvoice_format "FACTURAE_322 | XRECHNUNG_UBL"
    longtext members_json "Synchronized JSON mirror"
    datetime updated_at "Last audit modification"
  }

  CUSTOMER_B2B_MEMBERS {
    varchar(64) member_id PK "UUID / MEM_YYYY_XXXX"
    varchar(128) customer_id FK "Links to customer_b2b_profiles"
    varchar(255) email "Unique within organization"
    varchar(255) full_name "Actor full legal name"
    varchar(64) role "ORG_ADMIN | PRODUCTION_MANAGER | FINANCE_APPROVER | PREPRESS_DESIGNER"
    varchar(32) status "ACTIVE | INVITED | SUSPENDED"
    tinyint(1) can_upload_assets "1 = Authorized"
    tinyint(1) can_sign_imprimatur "1 = Authorized"
    tinyint(1) can_approve_finance "1 = Authorized"
    tinyint(1) can_manage_org "1 = Authorized"
    datetime created_at "Provisioning timestamp"
  }
```

---

## 2. The Four Canonical Editorial Roles & Permissions Matrix

PrintPriceOS defines four canonical roles tailored to industrial publishing workflows. Every member record stores both the canonical `role` identifier and explicit boolean capability flags (`can_*`) evaluated at runtime:

| Capability / Protected Action | `ORG_ADMIN` (Corporate Admin) | `PRODUCTION_MANAGER` (Production Director) | `FINANCE_APPROVER` (Controller / CFO) | `PREPRESS_DESIGNER` (Prepress / Studio) |
| :--- | :---: | :---: | :---: | :---: |
| **Upload `INTERIOR_PDF` & `COVER_PDF` Assets** (`can_upload_assets`) | **YES** | **YES** | NO (`403`) | **YES** |
| **Inspect 6-Axis Preflight Telemetry & 3D Mesh** | **YES** | **YES** | **YES** *(Read-Only)* | **YES** *(Inspect Only)* |
| **Sign 3D Soft-Proof Imprimatur & Lock Escrow** (`can_sign_imprimatur`) | **YES** | **YES** | NO (`403`) | NO (`403`) |
| **Trigger 1-Click Reorders** (`can_sign_imprimatur`) | **YES** | **YES** | NO (`403`) | NO (`403`) |
| **Execute Checkout, Upload Wire Proof & Download EN 16931 XML** (`can_approve_finance`) | **YES** | NO (`403`) | **YES** | NO (`403`) |
| **Invite, Mutate Roles, or Revoke Organization Members** (`can_manage_org`) | **YES** | NO (`403`) | NO (`403`) | NO (`403`) |

---

## 3. Middleware Enforcement Mechanics (`b2bOrgRbacMiddleware.js`)

All sensitive endpoints in [`src/api/routes/marketplaceOrders.js`](/docs/api/reference) and [`src/api/routes/customerPortalRoutes.js`](/docs/api/reference) are guarded by `requireB2bPermission(capability)` in `src/api/middleware/b2bOrgRbacMiddleware.js`.

### 3.1 Actor Resolution Precedence

When a request arrives at the Control Plane, the middleware resolves the caller's effective RBAC profile in the following order:

1. **Database Member Lookup (`x-b2b-member-id` / `x-b2b-email` + `customer_id`):**
   - Queries `customer_b2b_members` for an `ACTIVE` member matching the organization. If the member is `SUSPENDED`, execution halts immediately with `403 FORBIDDEN_RBAC_MEMBER_SUSPENDED`.
2. **Explicit Role Header / Payload Resolution (`x-b2b-role` / `approved_by_role`):**
   - Evaluates the canonical role matrix (`ORG_ADMIN`, `PRODUCTION_MANAGER`, `FINANCE_APPROVER`, `PREPRESS_DESIGNER`) passed via BFF headers or request body.

```mermaid
flowchart TD
  classDef primaryNode fill:#E53935,stroke:#B71C1C,color:#FFFFFF,stroke-width:2px;
  classDef accentNode fill:#2A1215,stroke:#EF5350,color:#F8FAFC,stroke-width:1.5px;
  classDef serviceNode fill:#151820,stroke:#64748B,color:#F8FAFC,stroke-width:1.5px;
  classDef storageNode fill:#0B0D11,stroke:#64748B,color:#94A3B8,stroke-width:1.5px,stroke-dasharray: 4 4;

  REQ["Incoming API Request<br/>(x-b2b-role / x-b2b-member-id)"]:::serviceNode --> MW["b2bOrgRbacMiddleware.js<br/>requireB2bPermission(capability)"]:::primaryNode
  MW --> DB_LOOKUP[("Lookup customer_b2b_members<br/>in MySQL ('Control')")]:::storageNode
  DB_LOOKUP --> CHECK{"Is Capability Granted?<br/>(e.g. can_sign_imprimatur)"}:::accentNode
  CHECK -->|"true (ORG_ADMIN / PRODUCTION_MANAGER)"| ALLOW["Proceed to Route Handler<br/>(Attach req.b2bActor Audit Context)"]:::serviceNode
  CHECK -->|"false (e.g. PREPRESS_DESIGNER)"| DENY["HTTP 403 Forbidden<br/>FORBIDDEN_RBAC_INSUFFICIENT_SIGN_OFF_RIGHTS"]:::primaryNode
```

### 3.2 Canonical HTTP `403 Forbidden` Error Catalog

When an actor attempts an action outside their role's capability matrix, the API returns a deterministic `403 Forbidden` JSON contract:

| Protected Capability | Guarded Canonical Endpoints | HTTP Status | Error Code (`error` / `code`) |
| :--- | :--- | :--- | :--- |
| `canApproveSoftProof` (`requireSignOffRights`) | `POST /api/customer/orders/:orderId/soft-proof/approve`<br/>`POST /api/customer/orders/:orderId/reorder` | `403 Forbidden` | `FORBIDDEN_RBAC_INSUFFICIENT_SIGN_OFF_RIGHTS` |
| `canExecutePayments` (`requireFinanceRights`) | `POST /api/marketplace/orders/:orderId/checkout/session`<br/>`POST /api/marketplace/orders/:orderId/payment/wire-proof`<br/>`GET /api/financials/escrow/:orderId/e-invoice.xml` | `403 Forbidden` | `FORBIDDEN_RBAC_FINANCE_RIGHTS_REQUIRED` |
| `canUploadProductionFiles` (`requireAssetUploadRights`) | `POST /api/marketplace/orders/:orderId/files/upload`<br/>`POST /api/marketplace/orders/:orderId/files/external-link` | `403 Forbidden` | `FORBIDDEN_RBAC_ASSET_UPLOAD_RIGHTS_REQUIRED` |
| `canManageMembers` (`requireOrgAdminRights`) | `POST /api/customer/organization/members`<br/>`PUT /api/customer/organization/members/:memberId/role`<br/>`DELETE /api/customer/organization/members/:memberId` | `403 Forbidden` | `FORBIDDEN_RBAC_ORG_ADMIN_REQUIRED` |

#### Sample `403 Forbidden` Response Payload

```json
{
  "ok": false,
  "error": "FORBIDDEN_RBAC_INSUFFICIENT_SIGN_OFF_RIGHTS",
  "code": "FORBIDDEN_RBAC_INSUFFICIENT_SIGN_OFF_RIGHTS",
  "message": "Binding 3D Soft-Proof Sign-Off and CTP release require PRODUCTION_MANAGER or ORG_ADMIN role. Active role 'PREPRESS_DESIGNER' is not in [ORG_ADMIN, PRODUCTION_MANAGER].",
  "actorRole": "PREPRESS_DESIGNER",
  "requiredRoles": ["ORG_ADMIN", "PRODUCTION_MANAGER"]
}
```

---

## 4. Organization Member Management API Examples

### 4.1 List Organization Members & Capabilities

```bash
curl -X GET "https://control.printprice.pro/api/customer/organization/members" \
  -H "x-marketplace-token: YOUR_MARKETPLACE_TOKEN" \
  -H "Accept: application/json"
```

### 4.2 Provision a New Member (`ORG_ADMIN` Required)

```bash
curl -X POST "https://control.printprice.pro/api/customer/organization/members" \
  -H "Content-Type: application/json" \
  -H "x-marketplace-token: YOUR_MARKETPLACE_TOKEN" \
  -H "x-b2b-role: ORG_ADMIN" \
  -H "x-b2b-member-id: MEM_2026_0001" \
  -d '{
    "fullName": "Lucia Fernandez",
    "email": "lucia.fernandez@planeta.es",
    "role": "PREPRESS_DESIGNER",
    "status": "ACTIVE"
  }'
```

#### Response (`201 Created`)

```json
{
  "status": "ok",
  "customer_id": "CUST_PLANETA_ES",
  "member": {
    "member_id": "MEM_2026_8912",
    "customer_id": "CUST_PLANETA_ES",
    "full_name": "Lucia Fernandez",
    "email": "lucia.fernandez@planeta.es",
    "role": "PREPRESS_DESIGNER",
    "status": "ACTIVE",
    "can_upload_assets": true,
    "can_sign_imprimatur": false,
    "can_approve_finance": false,
    "can_manage_org": false
  }
}
```

