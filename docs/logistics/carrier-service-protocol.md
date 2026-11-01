---
title: Carrier Integration Protocol & Service Conditions
sidebar_label: Carrier Service Protocol
---

# PrintPriceOS — Carrier Integration Protocol & Freight Service Conditions

This protocol establishes the binding operational standards, editorial receiving dock compliance rules, and tariff conditions applicable to road freight services contracted through or on behalf of the **PrintPriceOS** industrial manufacturing network.

> **Document Reference:** `PPOS-LOG-SLA-2026.1`  
> **Official DIN A4 PDF Download (Control Plane):** `GET /api/logistics/carrier-protocol/pdf`

---

## 1. Billing Parameters & Volumetric Conversion

1. **Loading Meter (LDM) Tariff Regime:**
   * **Unit Equivalence:** `1 Euro-Pallet EPAL (1,200 × 800 mm) = 0.40 LDM`.
   * **Standard Mass-to-Volume Ratio:** `1 LDM = 1,850 kg` chargeable weight.
   * **Chargeable Weight Calculation per Pallet:** `Chargeable Weight = max(Actual Gross Weight, 740 kg)`.
   * **Stackability Condition (*Strict LDM*):** Editorial book shipments are **non-stackable in transit** by default (`STRICT_LDM_NON_STACKABLE`), except inside semi-trailers equipped with a certified double-deck beam system (*Doppelstock* / `DOUBLE_DECK_TRAILER`).

2. **Strict Cost Segregation:**
   * The freight tariff covers exclusively road transport, cargo insurance, and applicable surcharges (fuel and highway tolls).
   * Packaging consumables (double-wall corrugated cardboard boxes **FEFCO 0201**, strapping bands, corner edge protectors, and stretch wrap film) are part of the print plant manufacturing cost and are not subject to carrier handling surcharges.

---

## 2. Operational Compliance at European Editorial Distribution Hubs

Shipments bound for editorial distribution platforms and fulfillment centers must strictly comply with the physical receiving guidelines of each hub. The carrier is responsible for honoring the assigned dock time slot.

| Destination Hub | Max Loaded Height | Max Gross Weight | Critical Dock Requirement | Advance Slot Booking Window (*Avis*) |
| :--- | :--- | :--- | :--- | :--- |
| **Zeitfracht Erfurt**<br/>`GLN: 4026635000006` | `1,200 mm`<br/>*(pallet included)* | `1,000 kg` | Minimum `>= 30 mm` perimeter setback (*zero overhang*). Cartons must be aligned inside the pallet deck perimeter. | **Mandatory `>= 48 h` prior to delivery**. Electronic notification of truck registration plate and unloading slot. |
| **VVA Arvato Gütersloh**<br/>`GLN: 4002693000002` | `1,300 mm`<br/>*(pallet included)* | `700 kg` | Mandatory flat top layer (`requiresFlatTopLayer: true`). Partial or remainder layers must be placed in intermediate tiers. | **Mandatory `>= 24 h`**. Unloading dock slot reservation via the supplier portal. |
| **Amazon EU FBA**<br/>`GLN: 5450534000007` | Per ASIN / Slot (`<= 1,800 mm`) | Max carton weight: `<= 15.0 kg` | Standardized EUR-1 palletization. Double-stacking without safety stretch wrap is prohibited. | **Mandatory via Carrier Central (CARP)**. Appointment linked to PO and FBA Shipment ID. |

*Any delay, dock rejection, or penalty surcharge resulting from failure to honor a booked unloading slot attributable to the carrier shall be rebilled according to the contractual terms.*

---

## 3. EPAL Euro-Pallet Exchange Loop & Vouchers (*Palettenschein*)

1. **Immediate `1:1` Dock Exchange Mode:**
   At the time of loading at the print plant dock, the carrier must hand over the exact same quantity of **EPAL** Euro-pallets (`1,200 × 800 mm`, **UIC 435-2** standard) in industrial-grade condition (Category A/B, free of broken deck boards or protruding nails).

2. **Pallet Exchange Voucher (*Palettenschein* — Non-Extendable 14-Day Deadline):**
   If the carrier does not have empty exchange pallets available at pickup:
   * The print plant will issue a formal pallet exchange voucher recorded in Section 4 of the DIN A4 Delivery Note (*Lieferschein*).
   * The carrier has a non-extendable deadline of **14 calendar days** to return the owed pallet balance to the issuing print plant or designated consolidation hub.
   * **Non-Return Settlement Penalty:** Once the 14-day window expires without physical return, unreturned pallets are automatically settled and invoiced at **15.00 EUR / unit** plus VAT on the next freight billing cycle.

---

## 4. Document Traceability & Barcode Scanning Requirements

1. **GS1-128 SSCC-18 (NVE) Pallet Labeling:**
   * Every pallet bears a physical thermal label (**A6 `105 × 148 mm`** format or **DIN A4 4-UP** sheet) featuring a **GS1-128 Subset C** barcode with Application Identifier `(00)`.
   * The carrier must scan the SSCC-18 barcode at pickup and at every cross-docking hub.
   * Labels must not be torn, covered with opaque tape, or damaged during transit.

2. **Proof of Delivery (POD / CMR) Confirmation:**
   * **Telematic Channel (Recommended):** Electronic delivery milestone webhook via API including SSCC-18 code, ISO-8601 timestamp, and GPS coordinates within **2 hours** after unloading.
   * **Physical Document Channel:** In the absence of an API integration, the carrier must retain the copy of the DIN A4 Delivery Note (*Lieferschein*), duly signed and stamped by the consignee in the designated POD box, and upload a digitized copy within **24 hours**.

---

## 5. Acknowledgment & Carrier Adherence

| Carrier Company Details | Operational Acceptance |
| :--- | :--- |
| **Legal Entity Name:** | **Authorized Signature & Company Stamp:** |
| **Tax ID / VAT Number:** | |
| **Legal / Operations Representative:** | |
| **Tracking Notification Channel (Email / API Endpoint):** | **Date:** |

---

## 6. Programmatic Protocol PDF Generation (Control Plane API)

The Control Plane exposes a native vector PDF generator for this protocol in DIN A4 format ready for signature:

```http
GET /api/logistics/carrier-protocol/pdf?carrierName=DACHSER%20SE&carrierVatId=DE123456789
Authorization: Bearer <JWT_TOKEN>
```

* **Response Headers:**
  * `Content-Type: application/pdf`
  * `Content-Disposition: inline; filename="ppos-carrier-service-protocol-A4.pdf"`
  * `X-PPOS-Protocol-Version: PPOS-LOG-SLA-2026.1`

---

## 7. Telematic Execution Endpoints (POD Webhook & 14-Day EPAL Settlement)

1. **Telematic Milestone & Digital POD Webhook (`POST /api/logistics/carrier/milestones`):**
   * Deterministically validates the Modulo-10 check digit of the **GS1-128 SSCC-18** code on every scan (`PICKED_UP`, `CROSS_DOCK_SCANNED`, `DELIVERED_POD`).
   * Verifies compliance with the telematic notification SLA (`<= 120 minutes` from `unloadedAt` to `timestamp`) and records the number of EPAL Euro-pallets exchanged at the dock (`epalExchangedCount`).

2. **Automated EPAL Pallet Settlement Engine (`POST /api/logistics/epal/settlement-run`):**
   * Periodically evaluates shipments against the non-extendable **14-calendar-day** deadline (`EPAL_EXCHANGE_DEADLINE_DAYS = 14`).
   * Whenever unreturned pallets remain (`outstandingEpalPallets > 0`) past the 14-day window, it automatically issues the settlement charge at **`15.00 EUR / EPAL pallet`** plus VAT (`EPAL-SETTLE-<shipmentId>`).
