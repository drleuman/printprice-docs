---
title: Outgoing Event Webhooks
---

# Outgoing Event Webhooks

PrintPrice OS provides a secure, push-based webhook delivery engine to notify partner systems when manufacturing, pricing, or preflight events occur in real time.

:::info Implementation Traceability
Event dispatch is managed by the central outbox engine implemented in `src/api/services/outgoingWebhookService.js` (`ppos-control-plane`).
:::

---

## 1. Webhook Security & Signatures

Every webhook notification dispatched by PrintPrice OS includes cryptographic headers to verify authenticity, integrity, and protect against replay attacks.

### HTTP Headers Sent by PrintPrice OS

| Header | Example | Description |
| :--- | :--- | :--- |
| `X-PPOS-Signature` | `sha256=d58d...` | HMAC-SHA256 signature calculated over the raw JSON payload using your webhook secret. |
| `X-PPOS-Timestamp` | `2026-10-27T02:00:00.000Z` | ISO 8601 UTC timestamp of dispatch. |
| `X-PPOS-Event-Id` | `evt_8a7d6e5c-1234` | Unique UUID v4 identifying the event instance for idempotent processing. |
| `X-PPOS-Tenant-Id` | `tenant_minerva_prod` | Identifier of the tenant owning the resource. |
| `Content-Type` | `application/json` | JSON serialization format. |

---

## 2. Verifying Webhook Signatures

Receiving servers must compute the HMAC-SHA256 of the raw request body using their shared webhook secret and compare it to `X-PPOS-Signature`.

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

## 3. Supported Event Types & Payloads

### `order.ready`
Dispatched when an order has all required files uploaded and verified by preflight without blocking findings, transitioning to `READY` for factory scheduling.

```json
{
  "event": "order.ready",
  "eventId": "evt_8a7d6e5c-1234",
  "timestamp": "2026-10-27T02:00:00.000Z",
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

### `order.blocked`
Dispatched when an order recomputation detects blocking technical issues requiring file re-upload.

```json
{
  "event": "order.blocked",
  "eventId": "evt_9b8c7d6e-5678",
  "timestamp": "2026-10-27T02:05:00.000Z",
  "tenantId": "tenant_minerva_prod",
  "data": {
    "orderId": "ord_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "status": "BLOCKED",
    "customerActionRequired": true,
    "customerActionUrl": "https://api.printprice.pro/api/marketplace/orders/ord_9b1deb4d/customer-action/token_abc123",
    "readiness": {
      "ready": false,
      "blockers": ["LOW_IMAGE_DPI_PAGE_45"]
    }
  }
}
```

### `preflight.completed`
Dispatched when asynchronous PDF analysis finishes.

```json
{
  "event": "preflight.completed",
  "eventId": "evt_11223344-9988",
  "timestamp": "2026-10-27T02:10:00.000Z",
  "tenantId": "tenant_minerva_prod",
  "data": {
    "jobId": "pf_job_8a7d6e5c-1234",
    "status": "COMPLETED",
    "outcome": "PASSED_WITH_WARNINGS",
    "pageCount": 192,
    "artifacts": [
      { "type": "normalized_pdf", "id": "art_norm_pdf" },
      { "type": "report_json", "id": "art_rep_01" }
    ]
  }
}
```

---

## 4. Delivery Rules & Failure Recovery

1. **Timeout:** Partner endpoints must respond with an HTTP status code in the range `200–299` within **5,000 milliseconds**.
2. **Retry Strategy:** If delivery times out or returns HTTP 4xx/5xx, PrintPrice OS automatically schedules **3 retry attempts** with exponential backoff:
   - **Attempt 1:** Immediate initial delivery.
   - **Attempt 2:** +1 minute.
   - **Attempt 3:** +5 minutes.
   - **Attempt 4 (Final):** +15 minutes.
3. **SSRF Guardrails:** In production, webhook destinations targeting RFC 1918 private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`) or loopback domains are strictly blocked.
4. **Idempotency:** Receivers should track `X-PPOS-Event-Id` to deduplicate events in the rare case of network-level retry overlap.
