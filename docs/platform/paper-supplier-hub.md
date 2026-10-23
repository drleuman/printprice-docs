---
id: paper-supplier-hub
title: Paper Supplier Hub & Master Catalog Federation
sidebar_label: Paper Supplier Hub
---

# Paper Supplier Hub & Master Catalog

Paper represents between **35% and 55% of the total manufacturing cost** in industrial book and commercial printing. Yet, traditional print workflows remain plagued by fragmented, outdated, and manually keyed paper catalogs.

The **Paper Supplier Hub** in PrintPrice OS solves this friction by providing a **federated substrate master database**, real-time supplier onboarding, and seamless integration with printhouse cost calculations.

---

## 1. Architectural Architecture

The Paper Supplier Hub operates as an intelligence bridge between paper manufacturers, distributors, and printing houses:

```
┌─────────────────────────────────┐
│     Paper Manufacturers &       │
│          Distributors           │
└────────────────┬────────────────┘
                 │ Self-Service Registration (/supplier/register)
                 │ Automated Tax/VAT & Catalog Ingestion
                 ▼
┌───────────────────────────────────────────────────────────────┐
│                 PAPER SUPPLIER HUB (CONTROL PLANE)            │
│                                                               │
│   ┌──────────────────────────┐    ┌───────────────────────┐   │
│   │ Master Substrates DB     │    │ Verified Supplier     │   │
│   │ (materials_catalog)      │    │ Directory             │   │
│   └────────────┬─────────────┘    └───────────┬───────────┘   │
│                │                              │               │
│                └──────────────┬───────────────┘               │
│                               ▼                               │
│                ┌─────────────────────────────┐                │
│                │ Dynamic Resolution Engine   │                │
│                │ (GET /api/admin/materials)  │                │
│                └──────────────┬──────────────┘                │
└───────────────────────────────┼───────────────────────────────┘
                                │ Live Linking & Auto-Country
                                ▼
┌───────────────────────────────────────────────────────────────┐
│              PRINTHOUSE SETUP & MATERIALS PANEL               │
│                                                               │
│    [SupplierSelect Combobox] ──► [CountrySelect]             │
│    Custom Margin Multipliers ──► Manufacturing vs Transport   │
└───────────────────────────────────────────────────────────────┘
```

---

## 2. Core Capabilities

### A. Federated Master Substrate Catalog
Centrally manages verified physical and technical attributes for printing substrates:
- **Categories**: Coated (Gloss / Silk / Matt), Uncoated (Offset), Recycled, Graphic Board, and Specialty stocks.
- **Physical Specifications**: Grammage (`g/m²`), caliper/thickness (`µm`), volume/bulk ratio, grain direction (Long Grain / Short Grain), opacity, and whiteness (CIE).
- **Format Dimensions**: Standard mill parent sheets (e.g., `640 × 900 mm`, `700 × 1000 mm`) and custom sizes.
- **Environmental Certifications**: FSC Mixed, FSC Recycled, PEFC, EU Ecolabel, Cradle to Cradle.

### B. Multilingual Self-Service Supplier Onboarding
Suppliers and paper merchants can self-onboard directly through the public onboarding gateway at `/supplier/register`:
- **Trilingual Parity**: Full native support across **English (`en`)**, **Spanish (`es`)**, and **German (`de`)**.
- **Instant Reactive Switching**: Allows the registrant to switch language dynamically via header pills without losing form data or reloading the session.
- **Automated Verification**: Real-time tax identification (VAT / CIF / NIF) verification and normalized country routing.

### C. Printhouse Setup & Substrate Binding
Within the Printhouse Control Plane (`MaterialsPanel.tsx`), estimators and production managers configure their material inventory:
- **Dynamic `<SupplierSelect>` Combobox**: Real-time searchable selector aggregating registered suppliers, historical catalog vendors, and system baselines.
- **Canonical `<CountrySelect>`**: Standardized country selector with multi-language search filtering.
- **Auto-Country Resolution**: Selecting a registered supplier automatically populates the origin country for accurate freight modeling.
- **Custom Margin Management**: Printhouses can set custom paper markup multipliers without altering the underlying base paper price index.

---

## 3. Commercial & Technical Invariants

To guarantee financial precision and legal certainty across all quotes, the Paper Supplier Hub enforces three invariants:

1. **Separation of Paper and Freight Economics**:
   Base paper purchase prices are strictly separated from shipping, transport zones, and handling fees. A change in diesel surcharges never corrupts paper grammage matrices.
2. **Authoritative Server-Side Pricing**:
   Calculations involving sheet yields, parent sheet cuts, waste allowances, and paper cost per copy are executed strictly on the server by the Book Pricing Engine (BPE).
3. **Tenant Data Boundary**:
   A printhouse's custom contracted paper rates and margin markups remain strictly private to that tenant and are never visible to competitors.

---

## 4. Supplier Onboarding Workflow

1. **Intake**: Supplier navigates to `https://control.printprice.pro/supplier/register`.
2. **Identity & Tax**: Submits company name, commercial brand, VAT identification number, and normalized headquarters country.
3. **Catalog Scope**: Selects supported paper categories and distribution coverage (Regional, National, International).
4. **Ingestion & Review**: The Control Plane validates credentials and creates a secure supplier profile ready for automated catalog synchronization.
