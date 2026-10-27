---
title: Quickstart Guide
---

# Developer Quickstart Guide

This guide walks you through making your first API calls to PrintPrice OS using standard HTTP tools (`curl` and modern JavaScript `fetch`).

:::tip Zero Proprietary Dependencies
PrintPrice OS uses standard REST and JSON interfaces. You do not need any proprietary SDKs to integrate with the platform. Native Node.js 18+ `fetch` or Python `requests` works out of the box.
:::

---

## 1. Request Instant Book Quotes

The **Pricing & Offers API** allows you to calculate real print manufacturing costs and competitive offers from qualified print facilities based on the physical specifications of a book.

### Terminal (`curl`)

```bash
curl -X POST "https://api.printprice.pro/api/marketplace/offers" \
  -H "Content-Type: application/json" \
  -H "x-trace-id: trace_quickstart_001" \
  -d '{
    "copies": 500,
    "interior_pages": 192,
    "format": "148x210",
    "paper_inner": "offset_white_90",
    "paper_cover": "couche_gloss_250",
    "binding_method": "perfect_bound",
    "finishing_options": "matt_lam_scratch",
    "colors_inner": "1/1",
    "colors_cover": "4/0",
    "delivery_country": "ES"
  }'
```

### Node.js (Native `fetch`)

```javascript
// calculate-offers.mjs
const response = await fetch('https://api.printprice.pro/api/marketplace/offers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-trace-id': `trace_${Date.now()}`
  },
  body: JSON.stringify({
    copies: 500,
    interior_pages: 192,
    format: '148x210',
    paper_inner: 'offset_white_90',
    paper_cover: 'couche_gloss_250',
    binding_method: 'perfect_bound',
    finishing_options: 'matt_lam_scratch',
    colors_inner: '1/1',
    colors_cover: '4/0',
    delivery_country: 'ES'
  })
});

const data = await response.json();
console.log(`Offers found: ${data.offers.length}`);
console.log(`Recommended print house: ${data.offers[0].print_house}`);
console.log(`Suggested Price: €${data.offers[0].total_price} (${data.offers[0].currency})`);
```

### Expected Response (`200 OK`)

```json
{
  "success": true,
  "offers": [
    {
      "id": "off_01j7b9e84k2",
      "offer_id": "off_01j7b9e84k2",
      "house_id": "ph_valencia_01",
      "printer_id": "ph_valencia_01",
      "print_house": "Talleres Gráficos Levante",
      "total_cost": 1240.50,
      "total_price": 1650.00,
      "currency": "EUR",
      "margin": 409.50,
      "margin_percent": 24.82,
      "estimated_delivery_time": "5-7 días laborables",
      "lead_time_days": 6,
      "breakdown": [
        { "label": "Papel interior", "amount": 420.00 },
        { "label": "Impresión y planchas", "amount": 380.50 },
        { "label": "Encuadernación rústica", "amount": 310.00 },
        { "label": "Embalaje y paletizado", "amount": 130.00 }
      ],
      "recommended": true,
      "checkout_allowed": true,
      "source": "BPE_MARKETPLACE_NATIVE"
    }
  ],
  "recommended_offer_id": "off_01j7b9e84k2",
  "raw_recommended_offer_id": "ph_valencia_01",
  "trace_id": "trace_quickstart_001"
}
```

---

## 2. Check Preflight Inspection Capabilities

You can inspect the active validation rules, supported trim geometry policies, and maximum upload limits supported by the Preflight engine without authentication:

```bash
curl -X GET "https://api.printprice.pro/api/preflight/capabilities"
```

### Expected Response

```json
{
  "supportedRules": [
    "GEOMETRY_TRIMBOX_VALIDATION",
    "BLEED_3MM_ENFORCEMENT",
    "IMAGE_RESOLUTION_300DPI",
    "COLOR_CMYK_ONLY",
    "FONTS_EMBEDDED_CHECK"
  ],
  "availableFixes": [
    "NORMALIZE_PAGE_BOXES",
    "GENERATE_SYNTHETIC_BLEED",
    "RGB_TO_FOGRA39_CONVERSION"
  ],
  "geometryPolicies": [
    "ISO_216_A_SERIES",
    "STANDARD_BOOK_SIZES"
  ],
  "maxUploadSizeBytes": 2147483648
}
```

---

## 3. Submit a PDF File for Preflight Analysis

Preflight inspection accepts PDF uploads up to 2GB via standard `multipart/form-data`. Partner authentication is required (`Authorization: Bearer <your-jwt-token>`).

### Terminal (`curl`)

```bash
curl -X POST "https://api.printprice.pro/api/preflight/jobs" \
  -H "Authorization: Bearer YOUR_PARTNER_TOKEN" \
  -F "file=@/path/to/manuscrito_interior.pdf"
```

### Expected Response (`200 OK`)

```json
{
  "ok": true,
  "jobId": "pf_job_8a7d6e5c-1234",
  "status": "QUEUED",
  "filename": "manuscrito_interior.pdf",
  "sizeBytes": 15420310
}
```

---

## 4. Poll Preflight Job Results

Using the returned `jobId`, query the status and technical report:

```bash
curl -X GET "https://api.printprice.pro/api/preflight/jobs/pf_job_8a7d6e5c-1234" \
  -H "Authorization: Bearer YOUR_PARTNER_TOKEN"
```

### Expected Response

```json
{
  "ok": true,
  "job": {
    "id": "pf_job_8a7d6e5c-1234",
    "status": "COMPLETED",
    "outcome": "PASSED_WITH_WARNINGS",
    "filename": "manuscrito_interior.pdf",
    "report": {
      "pageCount": 192,
      "trimBox": { "widthMm": 148, "heightMm": 210 },
      "bleedBox": { "widthMm": 154, "heightMm": 216, "bleedMm": 3 },
      "colorProfile": "FOGRA39 (ISO 12647-2)",
      "lowestImageDpi": 240,
      "findings": [
        {
          "code": "IMAGE_DPI_SUBOPTIMAL",
          "severity": "warning",
          "page": 45,
          "message": "Imagen en página 45 cuenta con 240 DPI (mínimo recomendado: 300 DPI)."
        }
      ]
    },
    "artifacts": [
      { "id": "art_rep_01", "type": "report_json", "name": "report.json" },
      { "id": "art_norm_pdf", "type": "normalized_pdf", "name": "normalized.pdf" }
    ]
  }
}
```

---

## Next Steps

- **[Authentication & Security Models](/docs/api/authentication):** Learn how M2M tokens, API keys, and ephemeral links operate.
- **[Order Intake & File Governance](/docs/api/integration-contracts):** Understand how to formalize orders and bind uploaded files.
- **[Event Webhooks](/docs/api/webhooks):** Receive automated push notifications for order readiness and preflight completion.
- **[Errors & Rate Limits](/docs/api/errors-and-limits):** Review standard error payloads and throttling boundaries.
