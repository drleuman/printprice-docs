---
title: Platform Overview
---

# PrintPrice OS Platform Overview

PrintPrice OS is the **Production Intelligence Operating System for the commercial print and book manufacturing industry**.

It coordinates:

- **[Control Plane](../repositories/ppos-control-plane)** — Operations, multi-tenant RBAC, printhouse machine profiling, and commercial evidence governance.
- **[Paper Supplier Hub](paper-supplier-hub)** — Substrate master catalog, self-service onboarding, and material linking.
- **[Book Pricing Engine (BPE)](../engines/book-pricing-engine)** — Authoritative cost calculation and press imposition matrix.
- **[PDF Preflight Engine](../engines/preflight-engine)** — Deterministic inspection pipeline preserving diagnostic truth.
- **[Production Intelligence](../engines/production-intelligence)** — Intent detection and manufacturability verification.
- **[Matchmaker Routing](../engines/matchmaker)** — Machine capability matching and multi-facility order routing.

The platform transforms uploaded print files and specifications into **validated, manufacturable, and commercially assured production jobs**.

---

## What PrintPrice OS Does

PrintPrice OS automates the complete lifecycle from initial quote inquiry to press-ready manufacturing dispatch:

1. **Job Definition & Specification**: User configures trim dimensions, page counts, paper stock, and binding style.
2. **Deterministic Cost Resolution**: The Book Pricing Engine (BPE) computes sheet yields, plate costs, machine runtime, and paper requirements.
3. **Autonomous Preflight Analysis**: Uploaded PDF artwork is analyzed deterministically against press profiles (TAC, bleed, fonts, resolutions).
4. **Production Intent & Compatibility**: The system checks geometry and binding parameters against real-world manufacturing physics.
5. **Paper Substrate Verification**: Substrates are validated against verified supplier stocks in the **Paper Supplier Hub**.
6. **Matchmaker Press Routing**: The Matchmaker evaluates candidate printing facilities and assigns the job to the optimal press line.
7. **Commercial Evidence Sealing**: An immutable `evidenceId` and `selectedVariantId` are attached to ensure reproducible, auditable quotes.

---

## Core Subsystems

### Control Plane
The central operational cockpit. Manages multi-tenant authorization, printhouse machine digital twins (sheetfed offset, digital toner, web offset, inkjet), binding lines, margin multipliers, and system telemetry.

### Paper Supplier Hub
A federated repository connecting paper manufacturers and merchants directly to printhouse cost estimators. Supports multilingual onboarding (ES, EN, DE) and automated tax identification checks.

### Book Pricing Engine (BPE)
Deterministic calculation solver resolving paper consumption, ink coverage, makeready setup times, run speeds, waste allowances, and finishing operations.

### Preflight Engine & Service
High-throughput inspection engine that evaluates PDF geometry, color spaces, separations, and compliance, persisting an unmutated `canonicalPayload`.

### Matchmaker & Capability Graph
Evaluates print jobs against industrial machinery constraints, physical press boundaries, geographic proximity, and turnaround commitments.

---

## Strategic Value

PrintPrice OS replaces fragmented legacy spreadsheets, disjointed PDF checkers, and manual estimating tables with an integrated, deterministic production intelligence platform.
