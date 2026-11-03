---
title: Errors, Rate Limits & Spend Caps
---

# Errors, Rate Limits & Spend Caps

This reference describes the standard error payload structures, machine-readable error codes, distributed trace correlation, sliding-window rate-limit headers, and `HTTP 402` Spend Cap protections enforced across the PrintPrice OS API Gateway.

---

## 1. Standard Error Envelope

When an API request fails, the gateway and microservices return a consistent JSON payload:

```json
{
  "ok": false,
  "error": {
    "code": "INVALID_PAYLOAD",
    "message": "Missing required parameters: copies and interior_pages are mandatory."
  },
  "correlationId": "trc_9a8b7c6d5e",
  "timestamp": "2026-11-03T02:00:00.000Z"
}
```

:::info Production Security Invariant
In production environments, unhandled internal server exceptions (`HTTP 500`) never expose raw stack traces, database schema paths, or internal server IPs. Instead, a generic message is returned alongside a unique `correlationId` that can be quoted to engineering support:

```json
{
  "ok": false,
  "error": "INTERNAL_SERVER_ERROR",
  "code": "INTERNAL_SERVER_ERROR",
  "message": "An unexpected internal error occurred. Please contact support quoting the correlation ID.",
  "correlationId": "trc_err_88291a9b"
}
```
:::

---

## 2. Standard HTTP Status Codes

| Status Code | Meaning | Typical Scenario |
| :---: | :--- | :--- |
| **`200 OK`** | Request succeeded | Offer calculated, BPE estimate returned, preflight inspected, API key ping verified. |
| **`201 Created`** | Resource initialized | Order created in `DRAFT` status, API key provisioned, file metadata registered. |
| **`400 Bad Request`** | Invalid input format | Missing mandatory payload fields, SSRF violation on webhook URL, or API key passed in URL query string. |
| **`401 Unauthorized`** | Authentication missing or invalid | Missing `Authorization: Bearer pp_...` or `X-API-Key`. |
| **`402 Payment Required`** | Spend cap reached or paywall active | Monthly metered spend cap (`monthly_spend_cap_eur`) reached (`SPEND_CAP_EXCEEDED_PAUSED`) or `PRODUCTION_SCALE` subscription required (`PAYWALL_REQUIRED`). |
| **`403 Forbidden`** | Scope or tenant authorization failure | Valid token but insufficient permissions (`INSUFFICIENT_SCOPE_OR_REVOKED`) for the requested route or tenant. |
| **`404 Not Found`** | Resource does not exist | `orderId` or `jobId` does not match any record for the tenant. |
| **`409 Conflict`** | Resource state conflict | Triggering autofix on a preflight job that is still in `ANALYZING` state. |
| **`410 Gone`** | Expired resource | Customer remediation link has passed its expiration timestamp. |
| **`413 Payload Too Large`** | Upload exceeds size limit | PDF file submitted to `/api/preflight/inspect` or `/api/preflight/jobs` exceeds the 2 GB limit. |
| **`429 Too Many Requests`** | Rate limit exceeded | Sliding-window rate limit exceeded; inspect `Retry-After` header. |
| **`500 Internal Error`** | Server-side exception | Contact support with the returned `correlationId`. |

---

## 3. Catalog of Error Codes

| Error Code | HTTP Status | Description & Recommended Client Action |
| :--- | :---: | :--- |
| `INVALID_PAYLOAD` | 400 | Required fields (such as `copies` or `interior_pages`) are missing. Check payload against schema. |
| `API_KEY_QUERY_PARAMETER_FORBIDDEN` | 400 | An API key was detected in the URL query string. Transmit keys exclusively via `X-API-Key` or `Authorization: Bearer`. |
| `SSRF_SECURITY_VIOLATION` | 400 | Webhook destination URL points to a loopback, cloud metadata (`169.254.169.254`), or RFC 1918 private IP address. |
| `INVALID_OFFER` | 400 | The offer identifier provided during order creation or offer selection is empty or invalid. |
| `DUPLICATE_ROLE` | 400 | A file slot (e.g., `INTERIOR_PDF`) has already been registered for the order. |
| `UNAUTHORIZED` / `API_KEY_REQUIRED` | 401 | Credential token is missing, expired, or invalid. |
| `PAYWALL_REQUIRED` | 402 | Attempting to provision or invoke a Production (`pp_live_*`) endpoint without an active Stripe Hybrid (`PRODUCTION_SCALE`) subscription or verified Partner Printhouse status. |
| `SPEND_CAP_EXCEEDED_PAUSED` | 402 | Tenant's accrued monthly metered spend (€49/mo base + €0.10/preflight + €0.005/BPE quote) reached 100% of `monthly_spend_cap_eur`. Increase the spend cap in the [Developer Hub](https://control.printprice.pro/developers) to immediately resume `pp_live_*` traffic. |
| `INSUFFICIENT_SCOPE_OR_REVOKED` | 403 | The API key lacks the required granular scope (`pricing:read`, `preflight:write`, `orders:create`, `webhooks:manage`) or has been revoked. |
| `ORDER_NOT_FOUND` | 404 | The requested `orderId` does not exist or does not belong to your tenant. |
| `JOB_NOT_FOUND` | 404 | The preflight `jobId` was not found. |
| `ARTIFACT_NOT_FOUND` | 404 | The requested artifact ID was not generated for this preflight run. |
| `SNAPSHOT_NOT_FOUND` | 400* | The snapshot for the preflight report is missing (currently returns 400 in controller; 404 in future version). |
| `JOB_NOT_READY` | 409 | The preflight job must complete analysis before triggering fixes. |
| `TOKEN_EXPIRED` | 410 | The customer remediation link has expired. Request a new link. |
| `PAYLOAD_TOO_LARGE_MAX_2GB` | 413 | The uploaded PDF exceeds 2,147,483,648 bytes (2 GB). Optimize or downsample high-res assets. |
| `BPE_UNAVAILABLE` | 200 (fallback) | The Book Pricing Engine is temporarily unreachable. Handle gracefully and retry. |
| `RATE_LIMIT_EXCEEDED` | 429 | Sliding-window rate limit exceeded for the API key. Wait `Retry-After` seconds before retrying. |

---

## 4. Distributed Tracing & Request Correlation

To correlate client requests with internal logs and outbox events across Control Plane, BPE, and Preflight:

1. **Include `x-trace-id` in Request Headers:**
   ```http
   POST /api/pricing/book-estimate HTTP/1.1
   Host: control.printprice.pro
   Content-Type: application/json
   X-API-Key: pp_live_9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d
   x-trace-id: trace_myplatform_20261103_001
   ```
2. **Automatic Trace Propagation:** If omitted, PrintPrice OS automatically assigns a UUID v4 prefixed with `trace_` and returns it in the response payload (`trace_id`).
3. **Quoting Correlation IDs in Support Inquiries:** If an unexpected error occurs, provide the `trace_id` or `correlationId` for instant forensic log retrieval.

---

## 5. Rate Limits, Sliding-Window Headers & Tier Quotas

Every response authenticated with a Developer API Key (`pp_test_*` or `pp_live_*`) returns standard sliding-window rate-limit headers:

| Response Header | Example | Description |
| :--- | :--- | :--- |
| `X-RateLimit-Limit` | `600` | Maximum requests permitted per 60-second sliding window (`60` for `SANDBOX_FREE`, `600` for `PRODUCTION_SCALE`, `1200` for `ENTERPRISE_TENANT`). |
| `X-RateLimit-Remaining` | `598` | Remaining requests available in the current 60-second window. |
| `Retry-After` | `18` | Seconds to wait before retrying when `HTTP 429 Too Many Requests` is returned. |

- **Sandbox Free (`pp_test_*`):** 60 requests / minute (`1,000` calls / month quota).
- **Production Scale (`pp_live_*`):** 600 requests / minute (€49/mo base + €0.10/preflight + €0.005/BPE quote, governed by `monthly_spend_cap_eur`).
- **Enterprise Partner (`pp_live_*`):** 1,200 requests / minute (`1,000,000` calls / month quota).
- **Throttling Responses:** When throttled, the gateway returns `HTTP 429 Too Many Requests` with a `Retry-After: <seconds>` header indicating when requests can resume.
