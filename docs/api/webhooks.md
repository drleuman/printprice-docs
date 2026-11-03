---
title: Outgoing Event Webhooks
---

# Outgoing Event Webhooks

PrintPrice OS provides a secure, push-based webhook delivery engine to notify partner systems when manufacturing, pricing, or preflight events occur in real time.

:::info Implementation Traceability
Event dispatch is managed by the central outbox engine implemented in `src/api/services/outgoingWebhookService.js` (`ppos-control-plane`) and exposed for self-service configuration in the **[Developer Hub Webhooks Console](https://control.printprice.pro/developers)**.
:::

---

## 1. Webhook Security & Signatures

Every webhook notification dispatched by PrintPrice OS includes cryptographic headers to verify authenticity, integrity, and protect against replay attacks. You can register your destination HTTPS URL, select event topics, and atomically rotate your `whsec_<48hex>` signing secret in the Developer Hub.

### HTTP Headers Sent by PrintPrice OS

| Header | Example | Description |
| :--- | :--- | :--- |
| `X-PPOS-Signature` | `sha256=d58d...` | Primary HMAC-SHA256 signature calculated over the raw JSON payload using your `whsec_*` secret. |
| `X-PrintPrice-Signature` | `sha256=d58d...` | Alias header carrying the identical `sha256=<hex>` HMAC-SHA256 signature for backward compatibility. |
| `X-PPOS-Timestamp` | `2026-11-03T02:00:00.000Z` | ISO 8601 UTC timestamp of dispatch. |
| `X-PPOS-Event-Id` | `evt_live_8a7d6e5c-1234` | Unique UUID v4 identifying the event instance for idempotent processing. |
| `X-PPOS-Tenant-Id` | `tenant_minerva_prod` | Identifier of the tenant owning the resource. |
| `Content-Type` | `application/json` | JSON serialization format. |

---

## 2. Verifying Webhook Signatures

Receiving servers must compute the HMAC-SHA256 of the raw request body using their shared webhook secret (`whsec_...`) and compare it to `X-PPOS-Signature` (or `X-PrintPrice-Signature`).

### Node.js Example (Express / Fastify)

```javascript
import crypto from 'crypto';

export function verifyPrintPriceWebhook(rawBodyBuffer, signatureHeader, secret) {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
    return false;
  }
  
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(rawBodyBuffer)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  const signatureBuffer = Buffer.from(signatureHeader, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}
```

### Python Example (FastAPI / Flask)

```python
import hmac
import hashlib

def verify_printprice_webhook(raw_body_bytes: bytes, signature_header: str, secret: str) -> bool:
    if not signature_header or not signature_header.startswith("sha256="):
        return False
    
    expected_hex = hmac.new(
        secret.encode("utf-8"),
        raw_body_bytes,
        hashlib.sha256
    ).hexdigest()
    
    expected_signature = f"sha256={expected_hex}"
    return hmac.compare_digest(signature_header, expected_signature)
```

---

## 3. Canonical 12-Topic Industrial Webhook Catalog

PrintPrice OS standardizes outbound notifications across **4 industrial domains** and **12 canonical event topics** (formally specified in [`/openapi/printprice-partner-api.bundle.yaml`](/openapi/printprice-partner-api.bundle.yaml)):

| Domain | Topic Identifier (`event`) | Trigger Condition |
| :--- | :--- | :--- |
| **Preflight & Geometry** | `preflight.certified` | 6-axis PDF/X-4 inspection passes TrimBox, +3.0 mm BleedBox, CMYK FOGRA39, and spine width tolerances. |
| **Preflight & Geometry** | `preflight.failed` | Preflight inspection detects blocking geometric or resolution errors requiring remediation. |
| **Preflight & Geometry** | `preflight.autofix_ready` | Automated FIX IT Engine completes +3.0 mm bleed synthesis, CMYK GCR conversion, and spine normalization. |
| **5-Axis Routing** | `routing.assigned_optimal` | 5-axis routing engine assigns the optimal print plant based on crossover `qStarCopies`, capacity, and freight. |
| **5-Axis Routing** | `routing.forced_manual` | Authorized operator applies a governed manual plant override. |
| **5-Axis Routing** | `routing.queue_saturated` | Plant capacity utilization exceeds 85% threshold. |
| **Shopfloor & Lifecycle** | `order.created` | New manufacturing order ingested and bound to a BPE pricing session. |
| **Shopfloor & Lifecycle** | `order.status_changed` | Order transitions across lifecycle states (`DRAFT` -> `READY` -> `IN_PRODUCTION` -> `DELIVERED`). |
| **Shopfloor & Lifecycle** | `press.completed` | Offset/Inkjet press run and PUR/casebinding completed on the shopfloor. |
| **Fintech & Logistics** | `escrow.released` | Commercial MoR Escrow funds released upon signed Stage 05 POD confirmation. |
| **Fintech & Logistics** | `einvoice.issued` | EN 16931 electronic invoice (`FACTURAE_3_2_2` or `XRECHNUNG_3_0`) issued and signed. |
| **Fintech & Logistics** | `shipping.dispatched` | EPAL pallet consignment and GS1-128 `SSCC-18` labels dispatched from factory dock. |

---

## 4. Sample Payloads

### `preflight.certified`
Dispatched when a 6-axis PDF inspection passes all geometric and colorimetric tolerances:

```json
{
  "id": "evt_live_101a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "event": "preflight.certified",
  "tenantId": "tenant_minerva_prod",
  "subscriptionId": "whsub_4f8b9c21-9e12-4a11-8f2a-112233445566",
  "timestamp": "2026-11-03T02:20:00.000Z",
  "data": {
    "preflightJobId": "pf_job_2gb_8821",
    "orderId": "ord_ppos_demo_9941",
    "status": "CERTIFIED_READY",
    "spineWidthMm": 14.54,
    "bleedMarginMm": 3.0,
    "colorProfile": "FOGRA39 (ISO 12647-2)"
  }
}
```

### `order.status_changed` / `order.ready`
Dispatched when an order has all required files uploaded and verified by preflight without blocking findings, transitioning to `READY` for factory scheduling.

```json
{
  "id": "evt_8a7d6e5c-1234",
  "event": "order.status_changed",
  "timestamp": "2026-11-03T02:25:00.000Z",
  "tenantId": "tenant_minerva_prod",
  "data": {
    "orderId": "ord_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "status": "READY",
    "selectedOfferId": "off_01j7b9e84k2",
    "printHouseId": "ph_valencia_01",
    "files": [
      { "role": "INTERIOR_PDF", "status": "CERTIFIED", "preflightJobId": "pf_job_111" },
      { "role": "COVER_PDF", "status": "CERTIFIED", "preflightJobId": "pf_job_222" }
    ],
    "readiness": {
      "ready": true,
      "blockers": []
    }
  }
}
```

### `einvoice.issued`
Dispatched when an EN 16931 electronic invoice (`FACTURAE_3_2_2` or `XRECHNUNG_3_0`) is generated upon order settlement:

```json
{
  "id": "evt_live_einv_778899",
  "event": "einvoice.issued",
  "timestamp": "2026-11-03T02:30:00.000Z",
  "tenantId": "tenant_minerva_prod",
  "data": {
    "orderId": "ord_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "invoiceFormat": "FACTURAE_3_2_2",
    "grossTotalEur": 1650.00,
    "downloadUrl": "https://control.printprice.pro/api/financials/escrow/ord_9b1deb4d/e-invoice.xml?format=FACTURAE_3_2_2&raw=true"
  }
}
```

---

## 5. Delivery Rules, Forensic Replay & SSRF Guardrails

1. **Timeout:** Partner endpoints must respond with an HTTP status code in the range `200–299` within **5,000 milliseconds**.
2. **Retry Strategy:** If delivery times out or returns HTTP 4xx/5xx, PrintPrice OS automatically schedules **3 retry attempts** with exponential backoff (`1m -> 5m -> 15m`):
   - **Attempt 1:** Immediate initial delivery.
   - **Attempt 2:** +1 minute.
   - **Attempt 3:** +5 minutes.
   - **Attempt 4 (Final):** +15 minutes.
3. **Manual Forensic Replay:** Failed or historical deliveries can be inspected and re-dispatched on demand via `POST /api/developer/webhooks/deliveries/:deliveryId/replay` or from the **Developer Hub Webhooks Console**.
4. **SSRF Guardrails:** Webhook destinations targeting RFC 1918 private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`), cloud metadata (`169.254.169.254`), or loopback domains are strictly rejected (`SSRF_SECURITY_VIOLATION`).
5. **Idempotency:** Receivers should track `X-PPOS-Event-Id` to deduplicate events in the rare case of network-level retry overlap.
