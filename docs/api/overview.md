---
title: API Overview & Architecture
---

# PrintPrice OS Developer Platform — API Overview

The PrintPrice OS Developer Platform exposes structured HTTP APIs and event-driven contracts designed to connect external publishing systems, print houses, and e-commerce platforms with the central manufacturing intelligence layer.

:::info Contract Verification & Production Governance
This API documentation reflects the **audited implementation contracts** running in the PrintPrice OS ecosystem (`ppos-control-plane` and `ppos-preflight-service`).
- **Runtime Environment:** Core contracts are implemented, tested, and active. Partner endpoints require authorized credentials.
- **Production Safeguard:** Live interactive mutations (*Try-it-out*) against production endpoints (`https://api.printprice.pro`) are strictly gated to authenticated partners to prevent non-governed commercial transactions.
- **Partner Access:** Onboarding and API access are governed. Integrators can request access through [api-support@printprice.pro](mailto:api-support@printprice.pro).
:::

---

## Architecture & System Domains

To ensure clear operational boundaries, the PrintPrice OS ecosystem separates public developer surfaces across three distinct environments:

1. **Developer Portal & Onboarding (`https://printprice.pro/developers`):**  
   Commercial landing, integration overview, partner qualification, and contact channel for API access.
2. **Developer Documentation (`https://docs.printprice.pro`):**  
   Technical references, OpenAPI 3.1 specifications, payload schemas, and integration guides.
3. **API Perimeter & Control Plane (`https://api.printprice.pro`):**  
   The runtime execution layer where API gateways, Fastify routers, and Node.js microservices process requests.

```mermaid
flowchart TB
    subgraph ClientZone ["CLIENT & INTEGRATION SURFACE"]
        Client["Integrator / Publishing App\n(REST HTTPS & Webhook Receiver)"]
    end

    subgraph Perimeter ["API PERIMETER & GATEWAY"]
        Gateway["NGINX Reverse Proxy / Gateway\napi.printprice.pro (:443)"]
    end

    subgraph CoreServices ["PRINTPRICE OS CLUSTER"]
        direction TB
        CP["Control Plane Fastify Router (:8080)\nAuth, Tenancy & Orders"]
        PF["Preflight Service (:8001)\nInspection, Geometric Check & Autofix"]
        BPE["Book Pricing Engine (:8004)\nDeterministic Manufacturing Cost"]
        Outbox["Transactional Outbox Worker\nHMAC-SHA256 Delivery Engine"]
    end

    subgraph DataStorage ["PERSISTENCE & STATE"]
        DB[("MySQL Cluster\nTenants, Orders & Evidences")]
        Redis[("Redis In-Memory\nPubSub & Ephemeral Tokens")]
        Storage[("Object Storage\nPDF Originals & Normalized Fixes")]
    end

    Client -->|"1. POST /api/marketplace/offers\n(x-trace-id header)"| Gateway
    Client -->|"2. POST /api/marketplace/orders\n(Bearer JWT / Intake Token)"| Gateway
    Client -->|"3. POST /api/preflight/jobs\n(Multipart up to 2GB)"| Gateway

    Gateway -->|"Proxy /api/marketplace/*"| CP
    Gateway -->|"Proxy /api/preflight/*"| PF

    CP -->|"Calculate Price Matrix"| BPE
    CP -->|"Persist Order & Evidences"| DB
    CP -->|"Cache & Rate Limiting"| Redis
    PF -->|"Store Uploaded Artifacts"| Storage
    CP -->|"Enqueue Event Outbox"| DB

    DB -.->|"Poll Events"| Outbox
    Outbox -.->|"Push Webhook with X-PPOS-Signature\n(order.ready, preflight.completed)"| Client

    classDef clientNode fill:#0F1218,stroke:#64748B,stroke-width:1.5px,color:#94A3B8;
    classDef gatewayNode fill:#151820,stroke:#FF5252,stroke-width:2px,color:#FFFFFF;
    classDef coreNode fill:#1A1E29,stroke:#E53935,stroke-width:2px,color:#FFFFFF;
    classDef dataNode fill:#11141C,stroke:#B71C1C,stroke-dasharray: 4 2,color:#F8FAFC;

    class Client clientNode;
    class Gateway gatewayNode;
    class CP,PF,BPE,Outbox coreNode;
    class DB,Redis,Storage dataNode;
```

---

## Published API Surfaces & Core Contracts

The following core contracts have been verified against active controller implementations:

<div className="table-scroll-indicator">
  <span className="table-scroll-icon">↔</span>
  <span>Full 6-column specification table. Scroll horizontally to inspect authentication, responsible service, and verification status · Keyboard navigable (<kbd>Tab</kbd> + arrow keys).</span>
</div>

<div className="table-responsive-wrapper" tabIndex={0} role="region" aria-label="PrintPrice OS public endpoint inventory, authentication, and verification status">

| Domain | Method | Effective Path | Authentication | Responsible Service | Production & Verification Status |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Preflight Capabilities** | `GET` | `/api/preflight/capabilities` | `Public Unauthenticated` | Preflight Service (Proxy) | <span className="status-badge status-badge-prod">CONFIRMED_IN_PRODUCTION</span> |
| **Preflight Job Submission** | `POST` | `/api/preflight/jobs` | `JWT (preflight:write)` | Preflight Service (Proxy) | <span className="status-badge status-badge-prod">CONFIRMED_IN_PRODUCTION</span> |
| **Preflight Job Inspection** | `GET` | `/api/preflight/jobs/:id` | `JWT (jobs:read)` | Preflight Service (Proxy) | <span className="status-badge status-badge-prod">CONFIRMED_IN_PRODUCTION</span> |
| **Outgoing Webhooks** | `POST` | `Partner HTTPS Endpoint` | `HMAC-SHA256 (X-PPOS-Signature)` | Control Plane Outbox Worker | <span className="status-badge status-badge-prod">CONFIRMED_IN_PRODUCTION</span> |
| **Marketplace Offers** | `POST` | `/api/marketplace/offers` | `x-trace-id / API Key` | Control Plane (`ppos-control-plane`) | <span className="status-badge status-badge-code">VERIFIED_IN_CODE</span> |
| **Order Intake** | `POST` | `/api/marketplace/orders` | `X-Marketplace-Token / Bearer JWT` | Control Plane (`ppos-control-plane`) | <span className="status-badge status-badge-code">VERIFIED_IN_CODE</span> |
| **Order Details & Readiness** | `GET` | `/api/marketplace/orders/:orderId` | `X-Marketplace-Token / Bearer JWT` | Control Plane (`ppos-control-plane`) | <span className="status-badge status-badge-code">VERIFIED_IN_CODE</span> |
| **Offer Selection** | `POST` | `/api/marketplace/orders/:orderId/selected-offer` | `X-Marketplace-Token / Bearer JWT` | Control Plane (`ppos-control-plane`) | <span className="status-badge status-badge-code">VERIFIED_IN_CODE</span> |
| **File Metadata Registration** | `POST` | `/api/marketplace/orders/:orderId/files/register` | `X-Marketplace-Token / Bearer JWT` | Control Plane (`ppos-control-plane`) | <span className="status-badge status-badge-code">VERIFIED_IN_CODE</span> |
| **Preflight Job Binding** | `POST` | `/api/marketplace/orders/:orderId/files/:fileId/preflight-bind` | `X-Marketplace-Token / Bearer JWT` | Control Plane (`ppos-control-plane`) | <span className="status-badge status-badge-code">VERIFIED_IN_CODE</span> |
| **Readiness Recompute** | `POST` | `/api/marketplace/orders/:orderId/readiness/recompute` | `X-Marketplace-Token / Bearer JWT` | Control Plane (`ppos-control-plane`) | <span className="status-badge status-badge-code">VERIFIED_IN_CODE</span> |
| **Shared Preflight Report** | `GET` | `/api/public/preflight/human-report/:token` | `Signed JWT (HUMAN_REPORT_VIEW)` | Control Plane (`ppos-control-plane`) | <span className="status-badge status-badge-code">VERIFIED_IN_CODE</span> |
| **Customer Action Handoff** | `GET` | `/api/marketplace/orders/:orderId/customer-action/:token` | `Ephemeral SHA-256 Token` | Control Plane (`ppos-control-plane`) | <span className="status-badge status-badge-code">VERIFIED_IN_CODE</span> |
| **Editorial Warehouse Profiles** | `GET` | `/api/logistics/warehouses` | `Bearer JWT (Control Plane / Printhouse Role)` | Control Plane (`ppos-control-plane`) | <span className="status-badge status-badge-prod">CONFIRMED_IN_PRODUCTION</span> |
| **Warehouse Profile Detail** | `GET` | `/api/logistics/warehouses/:code` | `Bearer JWT (Control Plane / Printhouse Role)` | Control Plane (`ppos-control-plane`) | <span className="status-badge status-badge-prod">CONFIRMED_IN_PRODUCTION</span> |
| **3D Cubing & Landed Freight Quote** | `POST` | `/api/logistics/calculate-quote` | `Bearer JWT (Control Plane / Printhouse Role)` | Control Plane (`ppos-control-plane`) | <span className="status-badge status-badge-prod">CONFIRMED_IN_PRODUCTION</span> |
| **Printhouse Freight Matrices** | `GET / PUT` | `/api/printhouses/:id/freight-matrices` | `Bearer JWT (Control Plane / Printhouse Role)` | Control Plane (`ppos-control-plane`) | <span className="status-badge status-badge-prod">CONFIRMED_IN_PRODUCTION</span> |

</div>

:::note Surface Exclusions & Roadmapped Features
- **Administrative Routes:** All endpoints under `/api/admin/*`, `/api/printhouse/*`, `/api/federation/*`, and global order inspection (`GET /api/marketplace/orders`) are strictly administrative and excluded from public integration contracts.
- **Mockup 3D API:** The 3D Mockup generation capability is currently a roadmapped feature (`PLANNED`). No backend API endpoints exist at this time.
- **Developer Self-Service Credentials:** Programmatic self-service creation of API keys from a developer console is undergoing security gate review. Active partner credentials are provisioned manually by contacting [api-support@printprice.pro](mailto:api-support@printprice.pro).
:::

---

## OpenAPI 3.1 Modular Specifications

The official OpenAPI 3.1 specifications are partitioned by functional domain and available for download:

- **[Pricing & Marketplace Orders Specification](/openapi/pricing-marketplace.openapi.yaml)** — Quotes, order intake, file registration, and readiness.
- **[Preflight Inspection & Normalization Specification](/openapi/preflight.openapi.yaml)** — Capabilities catalog, multipart upload, inspection, and autofix.
- **[Customer Shared Diagnostic Reports Specification](/openapi/shared-reports.openapi.yaml)** — Human visual preflight summaries and file re-upload customer links.
- **[Consolidated Partner API Bundle](/openapi/printprice-partner-api.bundle.yaml)** — Consolidated bundle for Postman, Insomnia, and SDK generators.

---

## Integration Guidelines

1. **Deterministic Pricing:** Pricing outputs are calculated on-demand by the Book Pricing Engine based on physical book specifications (trim size, page count, paper stock, binding method).
2. **Strict Separation of Economic Concepts:** Direct manufacturing costs (`total_cost`), platform margins, and commercial suggested prices (`total_price`) are strictly decoupled in all responses.
3. **Fail-Safe Preflight Inspection:** PDF inspection extracts exact geometry boxes (TrimBox, BleedBox), embedded fonts, and image resolutions up to 2GB per file.
4. **Sanitized Client Views:** Shared diagnostic reports and customer remediation links automatically filter internal server paths and technical stack traces, presenting only actionable summaries.
