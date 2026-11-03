import React, { useState, useEffect, useMemo } from 'react';

export type PlaygroundEndpointId = 'test-ping' | 'book-estimate' | 'preflight-inspect';

export interface ApiPlaygroundProps {
  defaultEndpoint?: PlaygroundEndpointId;
  compact?: boolean;
}

interface EndpointPreset {
  id: PlaygroundEndpointId;
  method: 'GET' | 'POST';
  path: string;
  label: string;
  badge: string;
  requiredScope: string;
  description: string;
  defaultQuery: string;
  defaultBody: string;
}

const ENDPOINT_PRESETS: Record<PlaygroundEndpointId, EndpointPreset> = {
  'test-ping': {
    id: 'test-ping',
    method: 'GET',
    path: '/api/developer/keys/test-ping',
    label: 'GET /api/developer/keys/test-ping',
    badge: 'AUTH & RATE-LIMIT HANDSHAKE',
    requiredScope: 'pricing:read',
    description:
      'Verifies your API key signature, returns your active billing tier (SANDBOX_FREE, PRODUCTION_SCALE, or ENTERPRISE_TENANT), granted scopes, and real-time sliding-window rate-limit headers.',
    defaultQuery: 'env=docs-playground',
    defaultBody: '',
  },
  'book-estimate': {
    id: 'book-estimate',
    method: 'POST',
    path: '/api/pricing/book-estimate',
    label: 'POST /api/pricing/book-estimate',
    badge: 'BPE 5-AXIS & Q* CROSSOVER',
    requiredScope: 'pricing:read',
    description:
      'Calculates deterministic book manufacturing cost curves across 5 industrial axes (Substrate, Press & Ink, CTP & Plates, Binding & Finishing, Waste & Logistics) and resolves the exact Q* digital-to-offset crossover point.',
    defaultQuery: '',
    defaultBody: JSON.stringify(
      {
        trimWidthMm: 148,
        trimHeightMm: 210,
        pageCount: 256,
        printRunCopies: 1250,
        interiorPaperGsm: 90,
        coverPaperGsm: 250,
        paperBulkFactor: 1.3,
        colorMode: 'CMYK_4_4',
        bindingType: 'SOFTCOVER_PUR',
        coverLamination: 'MATTE_SCRATCH_RESISTANT',
        deliveryCountryIso: 'DE',
      },
      null,
      2
    ),
  },
  'preflight-inspect': {
    id: 'preflight-inspect',
    method: 'POST',
    path: '/api/preflight/inspect',
    label: 'POST /api/preflight/inspect',
    badge: 'PDF/X-4 GEOMETRY & SPINE AUDIT',
    requiredScope: 'preflight:write',
    description:
      'Audits PDF geometry, physical spine caliper (pages / 2 × gsm × bulk), 3.0mm outer bleed compliance, and PUR hinge safety zones. Returns deterministic diagnostics and Magic-Fix remediation coordinates.',
    defaultQuery: '',
    defaultBody: JSON.stringify(
      {
        jobId: 'pf_demo_playground_001',
        pageCount: 240,
        paperGrammage: 90,
        paperBulk: 1.3,
        bindingType: 'SOFTCOVER_PUR',
        innerBleedMm: 1.5,
        outerBleedMm: 3.0,
        declaredSpineMm: 12.0,
        workflowMode: 'MAGIC_FIX',
      },
      null,
      2
    ),
  },
};

const STORAGE_KEY = 'ppos_docs_playground_api_key';

export default function ApiPlayground({
  defaultEndpoint = 'book-estimate',
  compact = false,
}: ApiPlaygroundProps): React.ReactElement {
  const [selectedEndpoint, setSelectedEndpoint] = useState<PlaygroundEndpointId>(defaultEndpoint);
  const [apiKey, setApiKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'bearer' | 'x-api-key'>('bearer');
  const [targetEnv, setTargetEnv] = useState<'sandbox' | 'local'>('sandbox');
  const [queryString, setQueryString] = useState<string>(ENDPOINT_PRESETS[defaultEndpoint].defaultQuery);
  const [requestBody, setRequestBody] = useState<string>(ENDPOINT_PRESETS[defaultEndpoint].defaultBody);
  const [activeTab, setActiveTab] = useState<'body' | 'curl'>('body');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [rateLimitMax, setRateLimitMax] = useState<string | null>(null);
  const [rateLimitRemaining, setRateLimitRemaining] = useState<string | null>(null);
  const [responseBody, setResponseBody] = useState<string>('');
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [copiedResponse, setCopiedResponse] = useState<boolean>(false);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);

  const preset = ENDPOINT_PRESETS[selectedEndpoint] || ENDPOINT_PRESETS['book-estimate'];
  const baseUrl =
    targetEnv === 'sandbox' ? 'https://control.printprice.pro' : 'http://localhost:8080';

  // Load persisted API key from localStorage on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setApiKey(saved);
        }
      } catch {
        // Ignore storage errors in restricted iframes
      }
    }
  }, []);

  const handleApiKeyChange = (value: string) => {
    const trimmed = value.trim();
    setApiKey(trimmed);
    if (typeof window !== 'undefined') {
      try {
        if (trimmed) {
          window.localStorage.setItem(STORAGE_KEY, trimmed);
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        // Ignore storage errors
      }
    }
  };

  const handleSelectEndpoint = (id: PlaygroundEndpointId) => {
    setSelectedEndpoint(id);
    setQueryString(ENDPOINT_PRESETS[id].defaultQuery);
    setRequestBody(ENDPOINT_PRESETS[id].defaultBody);
    setStatusCode(null);
    setLatencyMs(null);
    setResponseBody('');
    setNetworkError(null);
  };

  const fullUrl = useMemo(() => {
    const qs = queryString.trim().replace(/^\?/, '');
    return `${baseUrl}${preset.path}${qs ? `?${qs}` : ''}`;
  }, [baseUrl, preset.path, queryString]);

  const curlSnippet = useMemo(() => {
    const displayKey = apiKey || 'pp_test_your_sandbox_key_here';
    const authHeader =
      authMode === 'bearer'
        ? `-H "Authorization: Bearer ${displayKey}"`
        : `-H "X-API-Key: ${displayKey}"`;
    if (preset.method === 'GET') {
      return `curl -X GET "${fullUrl}" \\\n  ${authHeader} \\\n  -H "Accept: application/json"`;
    }
    const escapedBody = requestBody.replace(/'/g, "'\\''");
    return `curl -X POST "${fullUrl}" \\\n  ${authHeader} \\\n  -H "Content-Type: application/json" \\\n  -d '${escapedBody}'`;
  }, [apiKey, authMode, preset.method, fullUrl, requestBody]);

  const executeRequest = async () => {
    setIsLoading(true);
    setNetworkError(null);
    setStatusCode(null);

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (apiKey) {
      if (authMode === 'bearer') {
        headers['Authorization'] = `Bearer ${apiKey}`;
      } else {
        headers['X-API-Key'] = apiKey;
      }
    }

    let parsedBody: string | undefined;
    if (preset.method === 'POST') {
      headers['Content-Type'] = 'application/json';
      try {
        JSON.parse(requestBody);
        parsedBody = requestBody;
      } catch (err: any) {
        setIsLoading(false);
        setNetworkError(`Invalid JSON in request body: ${err?.message || 'Syntax error'}`);
        return;
      }
    }

    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    try {
      const response = await fetch(fullUrl, {
        method: preset.method,
        headers,
        body: preset.method === 'POST' ? parsedBody : undefined,
      });

      const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
      setLatencyMs(Math.round(endTime - startTime));
      setStatusCode(response.status);

      const rlLimit = response.headers.get('X-RateLimit-Limit');
      const rlRemaining = response.headers.get('X-RateLimit-Remaining');
      setRateLimitMax(rlLimit);
      setRateLimitRemaining(rlRemaining);

      const rawText = await response.text();
      try {
        const json = JSON.parse(rawText);
        setResponseBody(JSON.stringify(json, null, 2));
      } catch {
        setResponseBody(rawText || '(Empty response body)');
      }
    } catch (err: any) {
      const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
      setLatencyMs(Math.round(endTime - startTime));
      setNetworkError(
        err?.message ||
          'Network request failed. Ensure target environment is reachable and CORS is permitted.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResponse = () => {
    if (!responseBody || typeof navigator === 'undefined') return;
    navigator.clipboard.writeText(responseBody);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 1800);
  };

  const handleCopyCurl = () => {
    if (typeof navigator === 'undefined') return;
    navigator.clipboard.writeText(curlSnippet);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 1800);
  };

  const keyTypeBadge = useMemo(() => {
    if (!apiKey) return { text: 'NO KEY SET', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.12)' };
    if (apiKey.startsWith('pp_test_'))
      return { text: 'SANDBOX KEY (pp_test_*)', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.14)' };
    if (apiKey.startsWith('pp_live_'))
      return { text: 'PRODUCTION KEY (pp_live_*)', color: '#10B981', bg: 'rgba(16, 185, 129, 0.14)' };
    return { text: 'CUSTOM TOKEN', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.14)' };
  }, [apiKey]);

  const statusBadgeStyle = useMemo(() => {
    if (statusCode === null) return null;
    if (statusCode >= 200 && statusCode < 300) {
      return {
        label: `${statusCode} OK`,
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.14)',
        border: 'rgba(16, 185, 129, 0.35)',
      };
    }
    if (statusCode === 401 || statusCode === 403) {
      return {
        label: `${statusCode} UNAUTHORIZED`,
        color: '#F59E0B',
        bg: 'rgba(245, 158, 11, 0.14)',
        border: 'rgba(245, 158, 11, 0.35)',
      };
    }
    if (statusCode === 402) {
      return {
        label: `402 PAYMENT / SPEND CAP`,
        color: '#EF4444',
        bg: 'rgba(239, 68, 68, 0.14)',
        border: 'rgba(239, 68, 68, 0.4)',
      };
    }
    if (statusCode === 429) {
      return {
        label: `429 RATE LIMIT EXCEEDED`,
        color: '#F97316',
        bg: 'rgba(249, 115, 22, 0.14)',
        border: 'rgba(249, 115, 22, 0.4)',
      };
    }
    return {
      label: `HTTP ${statusCode}`,
      color: '#EF4444',
      bg: 'rgba(239, 68, 68, 0.14)',
      border: 'rgba(239, 68, 68, 0.35)',
    };
  }, [statusCode]);

  return (
    <div className="ppos-playground-shell" id="interactive-api-playground">
      {/* Top Sticky Header / Persistent API Key Bar */}
      <div className="ppos-pg-header">
        <div className="ppos-pg-title-row">
          <div className="ppos-pg-brand">
            <span className="ppos-pg-pulse" />
            <span className="ppos-pg-title">INTERACTIVE API CONSOLE</span>
            <span
              className="ppos-pg-key-pill"
              style={{ color: keyTypeBadge.color, backgroundColor: keyTypeBadge.bg }}
            >
              {keyTypeBadge.text}
            </span>
          </div>

          <div className="ppos-pg-header-actions">
            <a
              href="https://control.printprice.pro/developers"
              target="_blank"
              rel="noopener noreferrer"
              className="ppos-pg-get-key-btn"
            >
              ⚡ Get Free Sandbox Key (1-Click) ↗
            </a>
          </div>
        </div>

        {/* Sticky API Key & Environment Controls */}
        <div className="ppos-pg-keybar">
          <div className="ppos-pg-key-input-wrap">
            <label htmlFor="ppos-pg-api-key-input" className="ppos-pg-field-label">
              API KEY
            </label>
            <input
              id="ppos-pg-api-key-input"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder="Paste pp_test_... or pp_live_... key (saved in browser localStorage)"
              className="ppos-pg-key-input"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => setShowKey((prev) => !prev)}
              className="ppos-pg-inline-btn"
              title={showKey ? 'Hide API Key' : 'Reveal API Key'}
            >
              {showKey ? 'HIDE' : 'SHOW'}
            </button>
          </div>

          <div className="ppos-pg-select-group">
            <label htmlFor="ppos-pg-auth-mode" className="ppos-pg-field-label">
              HEADER
            </label>
            <select
              id="ppos-pg-auth-mode"
              value={authMode}
              onChange={(e) => setAuthMode(e.target.value as 'bearer' | 'x-api-key')}
              className="ppos-pg-select"
            >
              <option value="bearer">Authorization: Bearer</option>
              <option value="x-api-key">X-API-Key</option>
            </select>
          </div>

          <div className="ppos-pg-select-group">
            <label htmlFor="ppos-pg-env-select" className="ppos-pg-field-label">
              GATEWAY
            </label>
            <select
              id="ppos-pg-env-select"
              value={targetEnv}
              onChange={(e) => setTargetEnv(e.target.value as 'sandbox' | 'local')}
              className="ppos-pg-select"
            >
              <option value="sandbox">Gateway (control.printprice.pro)</option>
              <option value="local">Localhost (localhost:8080)</option>
            </select>
          </div>
        </div>

        {/* Endpoint Selector Pills */}
        {!compact && (
          <div className="ppos-pg-endpoint-tabs" role="tablist" aria-label="API Endpoints">
            {(Object.keys(ENDPOINT_PRESETS) as PlaygroundEndpointId[]).map((id) => {
              const ep = ENDPOINT_PRESETS[id];
              const isActive = selectedEndpoint === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleSelectEndpoint(id)}
                  className={`ppos-pg-ep-tab ${isActive ? 'active' : ''}`}
                >
                  <span className={`ppos-pg-method-badge ${ep.method.toLowerCase()}`}>
                    {ep.method}
                  </span>
                  <span className="ppos-pg-ep-path">{ep.path}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Endpoint Summary Bar */}
      <div className="ppos-pg-summary-bar">
        <div className="ppos-pg-summary-info">
          <span className={`ppos-pg-method-badge ${preset.method.toLowerCase()}`}>
            {preset.method}
          </span>
          <code className="ppos-pg-full-url">{fullUrl}</code>
          <span className="ppos-pg-scope-tag">scope: {preset.requiredScope}</span>
        </div>
        <button
          type="button"
          onClick={executeRequest}
          disabled={isLoading}
          className="ppos-pg-send-btn"
        >
          {isLoading ? 'EXECUTING...' : 'SEND REQUEST ▶'}
        </button>
      </div>

      <p className="ppos-pg-description">{preset.description}</p>

      {/* Dual Pane Workspace: Request Builder (Left) & Response Inspector (Right) */}
      <div className="ppos-pg-workspace">
        {/* Left Pane: Request Builder */}
        <div className="ppos-pg-pane">
          <div className="ppos-pg-pane-header">
            <div className="ppos-pg-pane-tabs">
              <button
                type="button"
                className={`ppos-pg-subtab ${activeTab === 'body' ? 'active' : ''}`}
                onClick={() => setActiveTab('body')}
              >
                {preset.method === 'POST' ? 'JSON Payload & Params' : 'Query Parameters'}
              </button>
              <button
                type="button"
                className={`ppos-pg-subtab ${activeTab === 'curl' ? 'active' : ''}`}
                onClick={() => setActiveTab('curl')}
              >
                cURL Snippet
              </button>
            </div>
            {activeTab === 'body' && preset.method === 'POST' && (
              <button
                type="button"
                className="ppos-pg-mini-btn"
                onClick={() => setRequestBody(preset.defaultBody)}
              >
                Reset Default JSON
              </button>
            )}
            {activeTab === 'curl' && (
              <button type="button" className="ppos-pg-mini-btn" onClick={handleCopyCurl}>
                {copiedCurl ? '✓ Copied cURL' : 'Copy cURL'}
              </button>
            )}
          </div>

          <div className="ppos-pg-pane-body">
            {activeTab === 'body' ? (
              <>
                <div className="ppos-pg-query-row">
                  <label htmlFor="ppos-pg-query-input" className="ppos-pg-field-label">
                    QUERY PARAMS
                  </label>
                  <input
                    id="ppos-pg-query-input"
                    type="text"
                    value={queryString}
                    onChange={(e) => setQueryString(e.target.value)}
                    placeholder="e.g. env=sandbox&verbose=true"
                    className="ppos-pg-query-input"
                  />
                </div>

                {preset.method === 'POST' ? (
                  <textarea
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    className="ppos-pg-json-editor"
                    rows={13}
                    spellCheck={false}
                    aria-label="JSON Request Payload"
                  />
                ) : (
                  <div className="ppos-pg-get-notice">
                    <code>GET {preset.path}</code> does not require a JSON request body. Click{' '}
                    <strong>SEND REQUEST ▶</strong> to verify your authentication header and inspect
                    real-time rate-limit headers.
                  </div>
                )}
              </>
            ) : (
              <pre className="ppos-pg-curl-box">
                <code>{curlSnippet}</code>
              </pre>
            )}
          </div>
        </div>

        {/* Right Pane: Live Response & Telemetry Inspector */}
        <div className="ppos-pg-pane">
          <div className="ppos-pg-pane-header">
            <div className="ppos-pg-telemetry-bar">
              <span className="ppos-pg-pane-title">LIVE RESPONSE</span>
              {statusBadgeStyle && (
                <span
                  className="ppos-pg-status-badge"
                  style={{
                    color: statusBadgeStyle.color,
                    backgroundColor: statusBadgeStyle.bg,
                    borderColor: statusBadgeStyle.border,
                  }}
                >
                  {statusBadgeStyle.label}
                </span>
              )}
              {latencyMs !== null && (
                <span className="ppos-pg-metric-pill" title="Round-trip execution latency">
                  ⏱ {latencyMs} ms
                </span>
              )}
              {rateLimitRemaining !== null && (
                <span
                  className="ppos-pg-metric-pill"
                  title="Sliding-window requests remaining in current minute"
                >
                  ⚡ Quota: {rateLimitRemaining}
                  {rateLimitMax ? `/${rateLimitMax}` : ''}
                </span>
              )}
            </div>

            {responseBody && (
              <button type="button" className="ppos-pg-mini-btn" onClick={handleCopyResponse}>
                {copiedResponse ? '✓ Copied JSON' : 'Copy JSON'}
              </button>
            )}
          </div>

          <div className="ppos-pg-pane-body">
            {/* Contextual Handshake & Error Guidance Banners */}
            {statusCode === 401 && (
              <div className="ppos-pg-guidance-banner warning">
                <strong>401 Unauthorized — Invalid or Missing API Key:</strong> Generate a free
                Sandbox key (<code>pp_test_*</code>) in one click at{' '}
                <a
                  href="https://control.printprice.pro/developers"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  control.printprice.pro/developers ↗
                </a>{' '}
                and paste it into the API Key bar above.
              </div>
            )}

            {statusCode === 403 && (
              <div className="ppos-pg-guidance-banner warning">
                <strong>403 Forbidden — Insufficient Scope or Suspended Key:</strong> Ensure your API
                key includes the <code>{preset.requiredScope}</code> scope at{' '}
                <a
                  href="https://control.printprice.pro/developers"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  control.printprice.pro/developers ↗
                </a>
                .
              </div>
            )}

            {statusCode === 402 && (
              <div className="ppos-pg-guidance-banner danger">
                <strong>402 Payment Required — Spend Cap (100%) or Tier Upgrade Required:</strong>{' '}
                Monthly Spend Cap reached or Production Scale activation (€49/mo base + €0.10/preflight
                &amp; €0.005/quote) required for <code>pp_live_*</code> keys. Manage billing or raise
                your spend cap at{' '}
                <a
                  href="https://control.printprice.pro/developers"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  control.printprice.pro/developers ↗
                </a>
                .
              </div>
            )}

            {statusCode === 429 && (
              <div className="ppos-pg-guidance-banner orange">
                <strong>429 Too Many Requests — Sliding-Window Rate Limit Exceeded:</strong> Rate
                limit exceeded for your current tier (<code>60 req/min</code> on Sandbox). Check{' '}
                <code>X-RateLimit-Remaining</code> or upgrade to Production Scale (
                <code>600 req/min</code>) at{' '}
                <a
                  href="https://control.printprice.pro/developers"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  control.printprice.pro/developers ↗
                </a>
                .
              </div>
            )}

            {networkError && (
              <div className="ppos-pg-guidance-banner danger">
                <strong>Execution Error:</strong> {networkError}
              </div>
            )}

            {responseBody ? (
              <pre className="ppos-pg-response-viewer">
                <code>{responseBody}</code>
              </pre>
            ) : (
              <div className="ppos-pg-empty-response">
                <div className="ppos-pg-empty-title">Ready to Execute Live Call</div>
                <p>
                  1. Paste your <code>pp_test_*</code> or <code>pp_live_*</code> key above (or test
                  without a key to inspect the <code>401</code> handshake).
                  <br />
                  2. Click <strong>SEND REQUEST ▶</strong> to inspect the live response payload,
                  latency, and rate-limit headers.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
