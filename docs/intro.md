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

- **[System Architecture & Production Topology (Phases 10–16)](architecture/overview)** — Decoupled 4-service topology (`budget.printprice.pro`, `control.printprice.pro`, Native Preflight Docker, and BPE), telemetry flow, and E2E benchmarks.
- **[Parametric 3D Soft-Proofing & Cryptographic Sign-Off (Phase-11C)](prepress/3d-soft-proof)** — Dynamic spine bulk calculation, TrimBox/BleedBox geometry, SHA-256 Imprimatur signatures, and DIN A4 `CERT-SP` vector PDF certificates.
- **[Native Preflight Engine & Bidirectional Telemetry](prepress/preflight-engine)** — 6-axis ISO 12647-2 / PDF/X-4 binary validation (CMYK FOGRA39, DPI, Max TAC, embedded fonts, BleedBox, and Spine Bulk) and asynchronous webhook callbacks.
- **[B2B Multi-User Organization & Editorial RBAC Matrix](security/rbac-governance)** — Normalized MySQL membership schema (`customer_b2b_members`), 4 canonical editorial roles (`ORG_ADMIN`, `PRODUCTION_MANAGER`, `FINANCE_APPROVER`, `PREPRESS_DESIGNER`), and `403` middleware enforcement.
- **[Regulatory Documents, EN 16931 E-Invoicing & Signed POD/CMR](compliance/electronic-invoicing-pod)** — Spanish `Facturae 3.2.2` and EU `XRechnung 3.0` (`UBL 2.1`) XML generation, strict line-item segregation, `GS1-128 SSCC-18` pallet labels, and SMTP notifications.
- **[Storage Lifecycle, Cold Archiving & Database Snapshots (SRE)](operations/storage-retention-backups)** — Automated 30-day POSIX `.tar.gz` cold archiving with frozen SHA-256 hashes for 1-Click Reorders, daily `.sql.gz` MySQL snapshots, and Executive Operational Telemetry.
- **[Complete REST API Reference & cURL Samples (Phases 10–16)](api/reference)** — End-to-end REST endpoint contracts and executable `curl` commands for Publisher, Printhouse, and Customer Portal workflows.
- **[Architecture](architecture/platform-architecture)** — High-level system design, decoupling rules, and diagnostic contracts.
- **[Repositories](repositories/ppos-control-plane)** — Operational maps for `ppos-control-plane`, `ppos-preflight-engine`, `ppos-preflight-service`, and worker pools.
- **[Platform](platform/overview)** — System data models, production pipelines, and print networks.
- **[Engines](engines/book-pricing-engine)** — Algorithmic specifications for BPE, Preflight, Compatibility, and Matchmaker.
- **[API & Contracts](api/overview)** — REST specifications, webhook contracts, and authentication protocols.
- **[Infrastructure](infrastructure/deployment-blueprint)** — Deployment playbooks, CI/CD pipelines, and observability standards.
