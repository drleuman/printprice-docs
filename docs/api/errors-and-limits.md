---
title: Errors & Rate Limits
---

# Errors & Rate Limits

This reference describes the standard error payload structures, common machine-readable error codes, distributed trace correlation, and rate-limiting boundaries enforced across the PrintPrice OS API Gateway.

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
  "timestamp": "2026-10-27T02:00:00.000Z"
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
| **`200 OK`** | Request succeeded | Offer calculated, job status retrieved, capabilities catalog returned. |
| **`201 Created`** | Resource initialized | Order created in `DRAFT` status, file metadata registered. |
| **`400 Bad Request`** | Invalid input format | Missing mandatory payload fields, invalid offer payload, or API key passed via query parameter. |
| **`401 Unauthorized`** | Authentication missing or invalid | Missing `Authorization: Bearer` or `X-Marketplace-Token`. |
| **`403 Forbidden`** | Scope or tenant authorization failure | Valid token but insufficient permissions for the requested route or tenant. |
| **`404 Not Found`** | Resource does not exist | `orderId` or `jobId` does not match any record for the tenant. |
| **`409 Conflict`** | Resource state conflict | Triggering autofix on a preflight job that is still in `ANALYZING` state. |
| **`410 Gone`** | Expired resource | Customer remediation link has passed its expiration timestamp. |
| **`413 Payload Too Large`** | Upload exceeds size limit | PDF file submitted to `/api/preflight/jobs` exceeds the 2GB limit. |
| **`429 Too Many Requests`** | Rate limit exceeded | Tenant or IP threshold exceeded; check `Retry-After` header. |
| **`500 Internal Error`** | Server-side exception | Contact support with the returned `correlationId`. |

---

## 3. Catalog of Error Codes

| Error Code | HTTP Status | Description & Recommended Client Action |
| :--- | :---: | :--- |
| `INVALID_PAYLOAD` | 400 | Required fields (such as `copies` or `interior_pages`) are missing. Check payload against schema. |
| `API_KEY_QUERY_PARAMETER_FORBIDDEN` | 400 | An API key was detected in the URL query string. Transmit keys exclusively via `X-API-Key` or `Authorization: Bearer`. |
| `INVALID_OFFER` | 400 | The offer identifier provided during order creation or offer selection is empty or invalid. |
| `DUPLICATE_ROLE` | 400 | A file slot (e.g., `INTERIOR_PDF`) has already been registered for the order. |
| `UNAUTHORIZED` | 401 | Credential token is missing, expired, or invalid. |
| `ORDER_NOT_FOUND` | 404 | The requested `orderId` does not exist or does not belong to your tenant. |
| `JOB_NOT_FOUND` | 404 | The preflight `jobId` was not found. |
| `ARTIFACT_NOT_FOUND` | 404 | The requested artifact ID was not generated for this preflight run. |
| `SNAPSHOT_NOT_FOUND` | 400* | The snapshot for the preflight report is missing (currently returns 400 in controller; 404 in future version). |
| `JOB_NOT_READY` | 409 | The preflight job must complete analysis before triggering fixes. |
| `TOKEN_EXPIRED` | 410 | The customer remediation link has expired. Request a new link. |
| `PDF_TOO_LARGE` | 413 | The uploaded PDF exceeds 2,147,483,648 bytes (2GB). Optimize or downsample high-res assets. |
| `BPE_UNAVAILABLE` | 200 (fallback) | The Book Pricing Engine is temporarily unreachable. Handle gracefully and retry. |
| `DEPLOYMENT_CONSTRAINT_BLOCKED` | 429 | System concurrency limit reached for preflight processing. Back off and retry. |

---

## 4. Distributed Tracing & Request Correlation

To correlate client requests with internal logs and outbox events across Control Plane, BPE, and Preflight:

1. **Include `x-trace-id` in Request Headers:**
   ```http
   POST /api/marketplace/offers HTTP/1.1
   Host: api.printprice.pro
   Content-Type: application/json
   x-trace-id: trace_myplatform_20261027_001
   ```
2. **Automatic Trace Propagation:** If omitted, PrintPrice OS automatically assigns a UUID v4 prefixed with `trace_` and returns it in the response payload (`trace_id`).
3. **Quoting Correlation IDs in Support Inquiries:** If an unexpected error occurs, provide the `trace_id` or `correlationId` to [api-support@printprice.pro](mailto:api-support@printprice.pro) for instant forensic log retrieval.

---

## 5. Rate Limits & Concurrency Policies

- **Pricing Endpoint (`/api/marketplace/offers`):** 60 requests per minute per IP.
- **Preflight Job Submission (`/api/preflight/jobs`):** Up to 10 concurrent active analysis jobs per partner tenant.
- **Order Ingestion (`/api/marketplace/orders`):** 120 requests per minute.
- **Throttling Responses:** When throttled, the gateway returns `HTTP 429 Too Many Requests` with a `Retry-After: <seconds>` header indicating when requests can resume.
