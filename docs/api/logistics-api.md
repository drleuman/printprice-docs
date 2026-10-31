---
id: logistics-api
title: Logistics, 3D Cubing & Freight Matrices API
sidebar_label: Logistics & 3D Cubing API
---

# Logistics, 3D Cubing & Freight Matrices API

The **Logistics, 3D Cubing & Freight Matrices API** (`src/api/routes/logisticsRoutes.js`) exposes deterministic endpoints for querying editorial warehouse receiving profiles, executing full 3D carton and Euro-pallet cubing calculations, and managing printhouse-specific LTL/FTL freight rate matrices and packaging consumable tariffs.

:::info Contract Verification & Cost Segregation Invariant
All endpoints documented on this page are **verified against active controller implementations** (`src/api/routes/logisticsRoutes.js`, `src/api/services/logistics/logisticsDatabaseService.js`, and `src/api/services/logistics/packagingAndCubingEngine.js` v1.1.0).
- **Strict Cost Segregation:** Packaging consumables (`packagingMaterialsCostBreakdownEur`), carrier freight (`freightCostBreakdownEur`), and print manufacturing costs (`manufacturingPrice`) are returned in strictly separated objects and are never conflated.
- **Dual Mount Path:** In addition to `/api/logistics/*` and `/api/printhouses/:id/freight-matrices`, these routes are also mounted under `/api/printhouse/onboarding/shipping/*` for seamless Printhouse Setup integration.
:::

---

## 1. Authentication, RBAC & Tenant Isolation

All Logistics API endpoints are protected by the `requireLogisticsControlPlaneAuth` middleware and enforce two mandatory security gates:

### A. Role-Based Access Control (RBAC)
Requests must carry an authenticated session (`Authorization: Bearer <jwt>`) or internal gateway context resolving to one of the following authorized Control Plane roles:
- `PRINTHOUSE_OPERATOR`
- `PRINTHOUSE_ADMIN`
- `OPERATOR`
- `ADMIN`
- `SUPER_ADMIN`

If the caller lacks a valid role, the endpoint immediately rejects the request with `403 Forbidden`:

```json
{
  "ok": false,
  "error": "FORBIDDEN: Valid Control Plane or Printhouse role is required to access Logistics APIs."
}
```

### B. Anti-Tenant Spoofing Guard
When the authenticated user session is bound to a specific `tenantId` (`req.user.tenantId`), any attempt to query or mutate another tenant's data via `req.body.tenantId`, `req.query.tenantId`, or the `x-tenant-id` header is blocked (unless the caller holds `SUPER_ADMIN` privileges):

```json
{
  "ok": false,
  "error": "FORBIDDEN_TENANT_MISMATCH: Cross-tenant access is prohibited."
}
```

---

## 2. Endpoint Summary

<div className="table-responsive-wrapper" tabIndex={0} role="region" aria-label="Logistics REST API Endpoints">

| Method | Endpoint Path | Description | Auth / Role Required | Status |
| :---: | :--- | :--- | :--- | :--- |
| `GET` | `/api/logistics/warehouses` | Lists all active editorial and fulfillment warehouse receiving profiles. | Control Plane / Printhouse Role | <span className="status-badge status-badge-prod">CONFIRMED_IN_PRODUCTION</span> |
| `GET` | `/api/logistics/warehouses/:code` | Retrieves physical constraints, dock rules, and penalties for a specific warehouse profile. | Control Plane / Printhouse Role | <span className="status-badge status-badge-prod">CONFIRMED_IN_PRODUCTION</span> |
| `POST` | `/api/logistics/calculate-quote` | Executes 3D book/carton/EPAL pallet cubing, run optimization (`ΔQ-` / `ΔQ+`), operational scenarios, and landed freight calculation. | Control Plane / Printhouse Role | <span className="status-badge status-badge-prod">CONFIRMED_IN_PRODUCTION</span> |
| `GET` | `/api/printhouses/:id/freight-matrices` | Lists printhouse freight rate matrices (plus platform defaults) and packaging consumable rates. | Control Plane / Printhouse Role | <span className="status-badge status-badge-prod">CONFIRMED_IN_PRODUCTION</span> |
| `PUT` | `/api/printhouses/:id/freight-matrices` | Upserts printhouse freight matrices, operational scenarios (LDM, slot booking, tracking), or adopts platform defaults (`adoptPlatformDefault: true`). | Control Plane / Printhouse Role | <span className="status-badge status-badge-prod">CONFIRMED_IN_PRODUCTION</span> |

</div>

---

## 3. Warehouse Delivery Profiles

### `GET /api/logistics/warehouses`

Returns all active editorial distribution hubs and fulfillment center profiles configured in `warehouse_delivery_profiles` (falling back deterministically to `BUILTIN_WAREHOUSE_PROFILES` in offline environments).

#### Request Headers
```http
GET /api/logistics/warehouses HTTP/1.1
Host: control.printprice.pro
Authorization: Bearer <jwt_token>
Accept: application/json
```

#### Response `200 OK`
```json
{
  "ok": true,
  "success": true,
  "count": 4,
  "warehouses": [
    {
      "id": "wdp-zeitfracht-erfurt-001",
      "code": "ZEITFRACHT_ERFURT",
      "profileCode": "ZEITFRACHT_ERFURT",
      "name": "Zeitfracht Medien GmbH (Erfurt Book Logistics Hub)",
      "displayName": "Zeitfracht Medien GmbH (Erfurt Book Logistics Hub)",
      "countryCode": "DE",
      "postalCode": "99098",
      "city": "Erfurt",
      "addressLine": "Ferdinand-Jühlke-Straße 7",
      "palletStandard": "EUR_EPAL_1200x800",
      "palletFootprintLengthMm": 1200,
      "palletFootprintWidthMm": 800,
      "palletBaseHeightMm": 144,
      "palletTareWeightKg": 25,
      "maxTotalPalletHeightMm": 1200,
      "maxGrossPalletWeightKg": 1000,
      "maxCartonWeightKg": 15,
      "minPerimeterSetbackMm": 30,
      "maxOverhangMm": 0,
      "requiresSlotBooking": true,
      "slotBookingLeadTimeHours": 48,
      "requiresFlatTopLayer": false,
      "requiresLoadingDock": true,
      "allowsTailLift": false,
      "requiresIsbnCartonLabel": true,
      "requiresPalletContentSheet": true,
      "penalties": {
        "repalletizingFeePerPalletEur": 40,
        "overweightCartonFeePerCartonEur": 12,
        "unbookedSlotPenaltyEur": 128,
        "nonCompliantLabelFeeEur": 25
      },
      "isActive": true
    },
    {
      "id": "wdp-arvato-vva-guetersloh-002",
      "code": "ARVATO_VVA_GUETERSLOH",
      "profileCode": "ARVATO_VVA_GUETERSLOH",
      "name": "VVA — Vereinigte Verlagsauslieferung (Arvato / Bertelsmann Gütersloh)",
      "countryCode": "DE",
      "postalCode": "33334",
      "city": "Gütersloh",
      "maxTotalPalletHeightMm": 1300,
      "maxGrossPalletWeightKg": 700,
      "maxCartonWeightKg": 16,
      "minPerimeterSetbackMm": 20,
      "requiresSlotBooking": true,
      "slotBookingLeadTimeHours": 48,
      "requiresFlatTopLayer": true,
      "requiresLoadingDock": true,
      "penalties": {
        "repalletizingFeePerPalletEur": 40,
        "nonFlatTopLayerFeePerPalletEur": 35,
        "overweightCartonFeePerCartonEur": 15,
        "unbookedSlotPenaltyEur": 128
      },
      "isActive": true
    }
  ]
}
```

---

### `GET /api/logistics/warehouses/:code`

Retrieves the full constraint specification and non-compliance penalty schedule for a single warehouse profile by its canonical code (`ZEITFRACHT_ERFURT`, `ARVATO_VVA_GUETERSLOH`, `AMAZON_EU_FBA_STD`, or `STANDARD_COMMERCIAL_DOCK`).

#### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `code` | `string` | Yes | Canonical profile code (case-insensitive, e.g. `ZEITFRACHT_ERFURT`). |

#### Response `200 OK`
```json
{
  "ok": true,
  "success": true,
  "warehouse": {
    "id": "wdp-zeitfracht-erfurt-001",
    "code": "ZEITFRACHT_ERFURT",
    "profileCode": "ZEITFRACHT_ERFURT",
    "name": "Zeitfracht Medien GmbH (Erfurt Book Logistics Hub)",
    "countryCode": "DE",
    "postalCode": "99098",
    "city": "Erfurt",
    "addressLine": "Ferdinand-Jühlke-Straße 7",
    "maxTotalPalletHeightMm": 1200,
    "maxGrossPalletWeightKg": 1000,
    "maxCartonWeightKg": 15,
    "minPerimeterSetbackMm": 30,
    "requiresSlotBooking": true,
    "slotBookingLeadTimeHours": 48,
    "requiresFlatTopLayer": false,
    "requiresLoadingDock": true,
    "penalties": {
      "repalletizingFeePerPalletEur": 40,
      "overweightCartonFeePerCartonEur": 12,
      "unbookedSlotPenaltyEur": 128,
      "nonCompliantLabelFeeEur": 25
    }
  }
}
```

#### Error Response `404 Not Found`
```json
{
  "ok": false,
  "error": "WAREHOUSE_PROFILE_NOT_FOUND: Profile 'UNKNOWN_HUB' was not found."
}
```

---

## 4. 3D Cubing & Landed Freight Quote Calculation

### `POST /api/logistics/calculate-quote`

Computes end-to-end 3D cubing (unit trimmed book weight, ergonomic FEFCO 0201 carton selection, interlocked EPAL Euro-pallet stacking), warehouse dock compliance, full-pallet print run optimization (`ΔQ-` / `ΔQ+`), operational scenarios (LDM taxable weight, 48h slot booking, GS1-128 SSCC barcodes), and segregated landed costs. Also supports **Split-Delivery (Multi-Destination)** when a `segments` array is provided.

#### Request Body Schema

| Field | Type | Required | Default | Description |
| :--- | :---: | :---: | :---: | :--- |
| `trimWidthMm` | `number` | **Yes** | — | Final trimmed book width in millimeters (aliases: `book_width_mm`, `widthMm`). |
| `trimHeightMm` | `number` | **Yes** | — | Final trimmed book height in millimeters (aliases: `book_height_mm`, `heightMm`). |
| `pages` | `number` | **Yes** | — | Total interior page count (aliases: `interior_pages`, `pageCount`). |
| `quantity` | `number` | **Yes*** | `1000` | Print run quantity in copies (alias: `copies`). *Optional if `segments` is non-empty. |
| `interiorGrammageGsm` | `number` | No | `90` | Interior paper grammage in `g/m²` (alias: `paperGsm`). |
| `interiorBulkFactor` | `number` | No | `1.15` | Paper volume / bulk factor (`cm³/g`). |
| `bindingType` | `string` | No | `"perfect"` | Binding method: `"perfect"` (PUR/hotmelt), `"hardcover"` (casebound with `1.20 g/cm³` greyboard + endpapers), `"saddle_stitch"`. |
| `coverGrammageGsm` | `number` | No | `250` | Softcover or dust-jacket grammage in `g/m²`. |
| `boardThicknessMm` | `number` | No | `2.5` | Hardcover greyboard caliper in millimeters (only used when `bindingType === "hardcover"`). |
| `warehouseProfileCode` | `string` | No | `"ZEITFRACHT_ERFURT"` | Target editorial warehouse code (`ZEITFRACHT_ERFURT`, `ARVATO_VVA_GUETERSLOH`, `AMAZON_EU_FBA_STD`, `STANDARD_COMMERCIAL_DOCK`). |
| `printhouseId` | `string` | No | `null` | Printhouse tenant identifier to resolve custom freight matrices and consumable rates. |
| `originCountry` | `string` | No | `"DE"` | 2-letter ISO origin country code. |
| `destCountry` | `string` | No | `"DE"` | 2-letter ISO destination country code (alias: `delivery_country`). |
| `destPostal` | `string` | No | `"*"` | Destination postal code or 2-digit zone prefix (e.g. `"99098"`, `"33334"`). |
| `requiresTailLift` | `boolean` | No | `false` | Adds hydraulic tail-lift surcharge if required at destination. |
| `trackingIntegrationMode` | `string` | No | Matrix default | Override tracking protocol: `"CARRIER_API"` or `"MANUAL_PORTAL_OR_CMR"`. |
| `slotBookingManagement` | `string` | No | Matrix default | Override slot booking governance: `"CARRIER_MANAGED"` or `"SHIPPER_MANAGED"`. |
| `stackabilityHandling` | `string` | No | Matrix default | Override stackability mode: `"STRICT_LDM_NON_STACKABLE"`, `"DOUBLE_DECK_SUPPORTED"`, or `"AUTO_STACK_AT_PRINTSHOP"`. |
| `segments` | `Array` | No | `[]` | Optional multi-destination split-delivery segments (`[{ quantity, warehouseProfileCode, destCountry, destPostal }]`). |

#### Example Request
```json
{
  "trimWidthMm": 148,
  "trimHeightMm": 210,
  "pages": 320,
  "interiorGrammageGsm": 90,
  "interiorBulkFactor": 1.2,
  "bindingType": "hardcover",
  "boardThicknessMm": 2.5,
  "quantity": 2500,
  "warehouseProfileCode": "ZEITFRACHT_ERFURT",
  "originCountry": "DE",
  "destCountry": "DE",
  "destPostal": "99098",
  "stackabilityHandling": "STRICT_LDM_NON_STACKABLE",
  "slotBookingManagement": "SHIPPER_MANAGED",
  "trackingIntegrationMode": "MANUAL_PORTAL_OR_CMR"
}
```

#### Response `200 OK`
```json
{
  "ok": true,
  "success": true,
  "quote": {
    "engineVersion": "1.1.0",
    "warehouseProfile": {
      "code": "ZEITFRACHT_ERFURT",
      "name": "Zeitfracht Medien GmbH (Erfurt Book Logistics Hub)",
      "maxTotalPalletHeightMm": 1200,
      "maxGrossPalletWeightKg": 1000,
      "minPerimeterSetbackMm": 30,
      "requiresSlotBooking": true,
      "slotBookingLeadTimeHours": 48
    },
    "packagingMaterialsCostBreakdownEur": {
      "euroPalletsCount": 3,
      "euroPalletUnitRateEur": 14.5,
      "euroPalletsCostEur": 43.5,
      "cartonBoxesCount": 114,
      "cartonBoxUnitRateEur": 0.85,
      "cartonBoxesCostEur": 96.9,
      "stretchWrapPerPalletRateEur": 2.2,
      "stretchWrapCostEur": 6.6,
      "totalPackagingMaterialsCostEur": 147.0
    },
    "freightCostBreakdownEur": {
      "carrierName": "DACHSER",
      "pricingMode": "PER_PALLET_STEPPED",
      "billedPallets": 3,
      "physicalPallets": 3,
      "effectiveLoadingMetersLdm": 1.2,
      "actualGrossWeightKg": 1598.4,
      "chargeableWeightKg": 2220.0,
      "ldmTaxableWeightPenaltyKg": 621.6,
      "baseFreightEur": 192.0,
      "fuelSurchargePercent": 6.5,
      "fuelSurchargeEur": 12.48,
      "tailLiftSurchargeEur": 0,
      "totalCarrierFreightCostEur": 204.48,
      "transitDaysMin": 1,
      "transitDaysMax": 2
    },
    "operationalScenarios": {
      "stackability": {
        "mode": "STRICT_LDM_NON_STACKABLE",
        "physicalPallets": 3,
        "effectiveFloorPalletSpaces": 3,
        "effectiveLoadingMetersLdm": 1.2,
        "ldmTaxableWeightRatioKg": 1850,
        "actualGrossWeightKg": 1598.4,
        "minLdmTaxableWeightKg": 2220.0,
        "chargeableWeightKg": 2220.0,
        "ldmTaxableWeightPenaltyKg": 621.6
      },
      "slotBooking": {
        "requiresSlotBooking": true,
        "managementMode": "SHIPPER_MANAGED",
        "leadTimeHours": 48,
        "unbookedSlotPenaltyExposureEur": 128.0,
        "effectiveTransitDaysMin": 1,
        "effectiveTransitDaysMax": 2,
        "automatedDispatchNoticePayload": {
          "recipientEmail": "avis-wareneingang-va@zeitfracht.de",
          "warehouseCode": "ZEITFRACHT_ERFURT",
          "totalPallets": 3,
          "totalCartons": 114,
          "totalGrossWeightKg": 1598.4,
          "maxPalletHeightMm": 1064,
          "vehicleDockRequirements": {
            "requiresLoadingDock": true,
            "minLoadingBedHeightCm": 120,
            "minLoadingBedWidthCm": 220,
            "rearDockUnloadable": true
          }
        }
      },
      "tracking": {
        "integrationMode": "MANUAL_PORTAL_OR_CMR",
        "requiresManualPodUpload": true,
        "requiresPalletContentSheet": true,
        "generatedPalletSsccList": [
          {
            "palletIndex": 1,
            "sscc18": "340123450000000105",
            "gs1128HumanReadable": "(00) 340123450000000105"
          },
          {
            "palletIndex": 2,
            "sscc18": "340123450000000112",
            "gs1128HumanReadable": "(00) 340123450000000112"
          },
          {
            "palletIndex": 3,
            "sscc18": "340123450000000129",
            "gs1128HumanReadable": "(00) 340123450000000129"
          }
        ]
      }
    },
    "totalLandedLogisticsCostEur": 351.48,
    "landedLogisticsCostPerBookEur": 0.1406
  },
  "logisticsCubing": {
    "bookUnit": {
      "trimWidthMm": 148,
      "trimHeightMm": 210,
      "spineWidthMm": 24.1,
      "unitNetWeightGrams": 592.4,
      "bindingType": "hardcover"
    },
    "cartonPacking": {
      "cartonCode": "STANDARD_400x300",
      "booksPerCarton": 22,
      "cartonGrossWeightKg": 13.45,
      "totalCartons": 114
    },
    "palletStacking": {
      "cartonsPerLayer": 9,
      "maxLayersPerPallet": 4,
      "maxCartonsPerPallet": 36,
      "booksPerFullPallet": 792,
      "totalPallets": 4,
      "fullPalletHeightMm": 1064,
      "fullPalletGrossWeightKg": 509.2,
      "lastPalletUtilizationPercent": 41.7
    },
    "runOptimization": {
      "hasOptimizationOpportunity": true,
      "deltaQMinus": {
        "recommendedQuantity": 2376,
        "quantityDelta": -124,
        "palletsSaved": 1
      },
      "deltaQPlus": {
        "recommendedQuantity": 3168,
        "quantityDelta": 668,
        "additionalBooksOnSamePallets": 668
      }
    }
  }
}
```

#### Validation Error Responses (`400 Bad Request`)
```json
{
  "ok": false,
  "error": "INVALID_BOOK_DIMENSIONS: trimWidthMm and trimHeightMm must be positive numbers."
}
```
```json
{
  "ok": false,
  "error": "INVALID_QUANTITY: quantity must be a positive integer."
}
```

---

## 5. Printhouse Freight Matrices & Consumable Tariffs

### `GET /api/printhouses/:id/freight-matrices`

Retrieves the active LTL/FTL freight rate matrices (`freight_rate_matrices`) and packaging consumable rates (`packaging_consumable_rates`) for a specific printhouse tenant. By default, platform baseline matrices (`printhouse_id IS NULL`) are included so newly onboarded printhouses have immediate tariff coverage.

#### Path & Query Parameters
| Parameter | Location | Type | Default | Description |
| :--- | :---: | :---: | :---: | :--- |
| `id` | Path | `string` | — | Printhouse identifier (e.g. `ph-demo-de-01`). |
| `includePlatformDefaults` | Query | `boolean` | `true` | Set to `"false"` to return only custom matrices owned by `:id`. |

#### Response `200 OK`
```json
{
  "ok": true,
  "success": true,
  "printhouseId": "ph-demo-de-01",
  "count": 4,
  "matrices": [
    {
      "id": "frm-global-de-99-dachser-001",
      "printhouseId": null,
      "originCountry": "DE",
      "originPostalZone": "*",
      "destinationCountry": "DE",
      "destinationPostalZone": "99",
      "carrierName": "DACHSER",
      "transitDaysMin": 1,
      "transitDaysMax": 2,
      "pricingMode": "PER_PALLET_STEPPED",
      "rateTiers": [
        { "minPallets": 1, "maxPallets": 1, "ratePerPalletEur": 85.0 },
        { "minPallets": 2, "maxPallets": 2, "ratePerPalletEur": 72.0 },
        { "minPallets": 3, "maxPallets": 5, "ratePerPalletEur": 64.0 },
        { "minPallets": 6, "maxPallets": 10, "ratePerPalletEur": 56.0 },
        { "minPallets": 11, "maxPallets": 33, "ratePerPalletEur": 48.0, "ftlFlatRateEur": 1350.0 }
      ],
      "fuelSurchargePercent": 6.5,
      "tailLiftSurchargeEur": 35.0,
      "trackingIntegrationMode": "CARRIER_API",
      "slotBookingManagement": "CARRIER_MANAGED",
      "carrierSlotBufferDays": 2,
      "stackabilityHandling": "DOUBLE_DECK_SUPPORTED",
      "ldmTaxableWeightRatioKg": 1850.0,
      "isPlatformDefault": true,
      "isActive": true
    }
  ],
  "consumableRates": {
    "printhouseId": "ph-demo-de-01",
    "euroPalletEpalEur": 14.5,
    "cartonBoxStandardEur": 0.85,
    "stretchWrapPerPalletEur": 2.2,
    "isPlatformDefault": true
  }
}
```

---

### `PUT /api/printhouses/:id/freight-matrices`

Upserts custom freight rate matrices and/or packaging consumable rates for a printhouse, or clones the platform standard logistics matrix in 1 click when `adoptPlatformDefault: true` is passed.

#### Request Body Schema

| Field | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `adoptPlatformDefault` | `boolean` | No | When `true`, clones the platform baseline freight matrices and consumable rates into the printhouse's tenant scope. |
| `consumableRates` | `object` | No | `{ euroPalletEpalEur, cartonBoxStandardEur, stretchWrapPerPalletEur }` |
| `matrices` | `Array` | No | Array of freight rate matrix objects including stepped pallet tiers and operational scenario flags (`trackingIntegrationMode`, `slotBookingManagement`, `carrierSlotBufferDays`, `stackabilityHandling`, `ldmTaxableWeightRatioKg`). |

#### Example Request
```json
{
  "adoptPlatformDefault": false,
  "consumableRates": {
    "euroPalletEpalEur": 15.0,
    "cartonBoxStandardEur": 0.9,
    "stretchWrapPerPalletEur": 2.5
  },
  "matrices": [
    {
      "originCountry": "DE",
      "originPostalZone": "*",
      "destinationCountry": "DE",
      "destinationPostalZone": "99",
      "carrierName": "DACHSER_CUSTOM",
      "transitDaysMin": 1,
      "transitDaysMax": 2,
      "pricingMode": "PER_PALLET_STEPPED",
      "rateTiers": [
        { "minPallets": 1, "maxPallets": 1, "ratePerPalletEur": 82.0 },
        { "minPallets": 2, "maxPallets": 5, "ratePerPalletEur": 65.0 },
        { "minPallets": 6, "maxPallets": 33, "ratePerPalletEur": 49.0, "ftlFlatRateEur": 1320.0 }
      ],
      "fuelSurchargePercent": 6.0,
      "tailLiftSurchargeEur": 35.0,
      "trackingIntegrationMode": "CARRIER_API",
      "slotBookingManagement": "CARRIER_MANAGED",
      "carrierSlotBufferDays": 2,
      "stackabilityHandling": "DOUBLE_DECK_SUPPORTED",
      "ldmTaxableWeightRatioKg": 1850.0
    }
  ]
}
```

#### Response `200 OK`
```json
{
  "ok": true,
  "success": true,
  "printhouseId": "ph-demo-de-01",
  "adoptedPlatformDefault": false,
  "upsertedMatricesCount": 1,
  "matrices": [
    {
      "id": "frm-ph-demo-de-01-de-99-dachser_custom",
      "printhouseId": "ph-demo-de-01",
      "originCountry": "DE",
      "originPostalZone": "*",
      "destinationCountry": "DE",
      "destinationPostalZone": "99",
      "carrierName": "DACHSER_CUSTOM",
      "pricingMode": "PER_PALLET_STEPPED",
      "trackingIntegrationMode": "CARRIER_API",
      "slotBookingManagement": "CARRIER_MANAGED",
      "carrierSlotBufferDays": 2,
      "stackabilityHandling": "DOUBLE_DECK_SUPPORTED",
      "ldmTaxableWeightRatioKg": 1850.0,
      "isActive": true
    }
  ],
  "consumableRates": {
    "printhouseId": "ph-demo-de-01",
    "euroPalletEpalEur": 15.0,
    "cartonBoxStandardEur": 0.9,
    "stretchWrapPerPalletEur": 2.5,
    "isPlatformDefault": false
  }
}
```
