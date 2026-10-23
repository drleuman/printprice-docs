---
id: intro
title: PrintPrice OS Documentation
slug: /
---

# PrintPrice OS Documentation

Welcome to the official developer and architecture documentation for **PrintPrice OS**.

PrintPrice OS is the **Production Intelligence Operating System for the commercial print and book manufacturing industry**. It transforms incoming print specifications and PDF artwork into verified, manufacturable, and commercially governed print jobs.

---

## Core System Pillars

The platform coordinates six tightly decoupled subsystems:

1. **[Control Plane](repositories/ppos-control-plane)** — Global operational cockpit, multi-tenant RBAC, printhouse machine profiling, and commercial evidence governance.
2. **[Paper Supplier Hub](platform/paper-supplier-hub)** — Federated substrate master database, self-service multilingual onboarding (`/supplier/register`), and real-time printhouse substrate linking.
3. **[Book Pricing Engine (BPE)](engines/book-pricing-engine)** — Deterministic print cost matrix calculating sheet yields, imposition, press run speeds, and binding costs.
4. **[Preflight Engine & Service](engines/preflight-engine)** — Autonomous PDF preflight inspection pipeline preserving diagnostic truth (`canonicalPayload`).
5. **[Production Intelligence](engines/production-intelligence)** — Intent detection, physical manufacturability rules, and format validation.
6. **[Matchmaker & Capability Graph](engines/matchmaker)** — Graph-based routing matching job requirements with printer capability graphs, SLAs, and geographic zones.

---

## Architectural Guarantees & Invariants

All modules operate under five non-negotiable architectural guarantees:

- **Server-Side Pricing Authority**: Prices and matrices are resolved exclusively by the backend; clients never compute or extrapolate pricing.
- **Strict Tenant Isolation**: Complete data segregation between printhouses, customers, and suppliers at both the middleware and database levels.
- **Commercial Traceability**: Every quote carries immutable `evidenceId` and `selectedVariantId` tags for complete auditability.
- **Diagnostic Truth**: Preflight inspection results are never mutated or truncated between engines and administrative dashboards.
- **Strict Trilingual Parity**: Partner and user portals maintain simultaneous support across **English (`en`)**, **Spanish (`es`)**, and **German (`de`)**.

---

## Documentation Categories

- **[Architecture](architecture/platform-architecture)** — High-level system design, decoupling rules, and diagnostic contracts.
- **[Repositories](repositories/ppos-control-plane)** — Operational maps for `ppos-control-plane`, `ppos-preflight-engine`, `ppos-preflight-service`, and worker pools.
- **[Platform](platform/overview)** — System data models, production pipelines, and print networks.
- **[Engines](engines/book-pricing-engine)** — Algorithmic specifications for BPE, Preflight, Compatibility, and Matchmaker.
- **[API & Contracts](api/overview)** — REST specifications, webhook contracts, and authentication protocols.
- **[Infrastructure](infrastructure/deployment-blueprint)** — Deployment playbooks, CI/CD pipelines, and observability standards.
