import React, { useState, useRef, useEffect } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

interface SearchItem {
  title: string;
  path: string;
  category: 'API' | 'Contracts' | 'Guide' | 'Security' | 'Platform';
  desc: string;
  badge?: string;
}

const SEARCH_SUGGESTIONS: SearchItem[] = [
  {
    title: 'Pricing & Offers API',
    path: '/docs/api/pricing-api',
    category: 'API',
    desc: 'Algorithmic book pricing in milliseconds with the Book Pricing Engine (BPE)',
    badge: 'POST /api/marketplace/offers',
  },
  {
    title: 'Preflight PDF Diagnostics',
    path: '/docs/api/preflight-api',
    category: 'API',
    desc: 'Asynchronous technical inspection of PDF files up to 2GB and automated normalization',
    badge: 'POST /api/preflight/jobs',
  },
  {
    title: 'Marketplace & Order Intake',
    path: '/docs/api/integration-contracts',
    category: 'API',
    desc: 'Formal order ingestion, file asset binding, and workshop readiness computation',
    badge: 'POST /api/marketplace/orders',
  },
  {
    title: 'Outgoing Event Webhooks',
    path: '/docs/api/webhooks',
    category: 'API',
    desc: 'Push notifications with HMAC-SHA256 cryptographic signature and retry engine',
    badge: 'HMAC-SHA256 PUSH',
  },
  {
    title: 'API Overview & Architecture',
    path: '/docs/api/overview',
    category: 'Contracts',
    desc: 'Public surfaces, comprehensive endpoint inventory, and OpenAPI 3.1 contracts',
    badge: 'OpenAPI 3.1',
  },
  {
    title: 'Quickstart: Quote in 3 Lines',
    path: '/docs/api/quickstart',
    category: 'Guide',
    desc: 'Quick start guide for book publishers and print house software integrators',
    badge: 'REST JSON',
  },
  {
    title: 'Authentication & Security',
    path: '/docs/api/authentication',
    category: 'Security',
    desc: 'M2M intake tokens, partner JWT credentials, and ephemeral customer report tokens',
    badge: 'Bearer JWT',
  },
  {
    title: 'Error Codes & Rate Limits',
    path: '/docs/api/errors-and-limits',
    category: 'Contracts',
    desc: 'Exhaustive catalog of RFC 7807 HTTP problem details and rate limit headers',
    badge: 'RFC 7807',
  },
  {
    title: 'Control Plane Architecture',
    path: '/docs/repositories/ppos-control-plane',
    category: 'Platform',
    desc: 'Operational cockpit, multi-tenancy governance, RBAC, and workshop digital twins',
    badge: 'Control Plane',
  },
  {
    title: 'Paper Supplier Hub',
    path: '/docs/platform/paper-supplier-hub',
    category: 'Platform',
    desc: 'Substrate master ecosystem, multilingual partner onboarding, and paper catalog',
    badge: 'Substrate Hub',
  },
];

export default function Home(): React.ReactNode {
  const [activeTab, setActiveTab] = useState<'curl' | 'js'>('curl');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedSearchIdx, setSelectedSearchIdx] = useState(0);

  const searchBoxRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const curlCode = `curl -X POST "https://api.printprice.pro/api/marketplace/offers" \\
  -H "Content-Type: application/json" \\
  -H "x-trace-id: trace_demo_1001" \\
  -d '{
    "copies": 500,
    "interior_pages": 192,
    "format": "148x210",
    "binding_method": "SEWN_HARDCOVER",
    "delivery_postal_code": "28001"
  }'`;

  const jsCode = `const response = await fetch("https://api.printprice.pro/api/marketplace/offers", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-trace-id": "trace_demo_1001"
  },
  body: JSON.stringify({
    copies: 500,
    interior_pages: 192,
    format: "148x210",
    binding_method: "SEWN_HARDCOVER",
    delivery_postal_code: "28001"
  })
});

const data = await response.json();
console.log("Retrieved offers:", data.offers.length, "Total:", data.offers[0].total_price);`;

  const handleCopyCode = async () => {
    const codeToCopy = activeTab === 'curl' ? curlCode : jsCode;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(codeToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error('Clipboard API not available');
      }
    } catch {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = codeToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Silently handle if clipboard completely unavailable
      }
    }
  };

  // Filter search suggestions
  const filteredSuggestions = SEARCH_SUGGESTIONS.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      (item.badge && item.badge.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q)
    );
  });

  // Global Ctrl+K handler to focus hero search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isSearchOpen]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSearchIdx((prev) => (prev + 1) % Math.max(1, filteredSuggestions.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSearchIdx((prev) => (prev - 1 + filteredSuggestions.length) % Math.max(1, filteredSuggestions.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSuggestions.length > 0 && selectedSearchIdx < filteredSuggestions.length) {
        window.location.href = filteredSuggestions[selectedSearchIdx].path;
      } else if (searchQuery.trim()) {
        window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  return (
    <Layout
      title="PrintPrice OS — Production Intelligence Platform"
      description="Official API documentation and technical architecture for PrintPrice OS: deterministic quoting, preflight PDF diagnostics, and order governance."
    >
      <main className="portal-hero">
        {/* Technical Status Badge */}
        <div className="portal-badge">
          <span className="portal-badge-dot"></span>
          <span>PrintPrice OS · Developer &amp; Integration Platform</span>
        </div>

        {/* Hero Title & Subtitle */}
        <h1 className="portal-title">
          API Documentation &amp;{' '}
          <span className="portal-title-highlight">Print Intelligence</span>
        </h1>

        <p className="portal-subtitle">
          Deterministic API platform for commercial and book printing. Algorithmic quotes in milliseconds with the Book Pricing Engine, asynchronous PDF diagnostics with Preflight, governed order intake, and HMAC-signed webhooks.
        </p>

        {/* Interactive Direct Search Bar with Live Panel */}
        <div className="portal-search-container" ref={searchBoxRef}>
          <div
            className={`portal-search-bar ${isSearchOpen ? 'portal-search-bar--active' : ''}`}
            onClick={() => {
              searchInputRef.current?.focus();
              setIsSearchOpen(true);
            }}
          >
            <span className="portal-search-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input
              ref={searchInputRef}
              type="text"
              className="portal-search-input"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
                setSelectedSearchIdx(0);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search endpoints, OpenAPI schemas, guides, and playbooks..."
              aria-label="Search PrintPrice OS documentation"
              aria-autocomplete="list"
              aria-expanded={isSearchOpen}
            />
            {searchQuery && (
              <button
                type="button"
                className="portal-search-clear"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                aria-label="Clear search query"
              >
                ✕
              </button>
            )}
            <span className="portal-search-kbd" title="Press Ctrl+K to search">
              <kbd>Ctrl</kbd> <kbd>K</kbd>
            </span>
          </div>

          {/* Live Search Suggestions Dropdown Panel */}
          {isSearchOpen && (
            <div className="portal-search-dropdown" role="listbox" aria-label="Search suggestions">
              <div className="portal-search-dropdown-header">
                <span>{searchQuery ? `Suggested results for "${searchQuery}"` : 'Recommended quick links'}</span>
                <span className="portal-search-dropdown-hint"><kbd>↑</kbd> <kbd>↓</kbd> navigate · <kbd>Enter</kbd> open</span>
              </div>

              <div className="portal-search-dropdown-list">
                {filteredSuggestions.length > 0 ? (
                  filteredSuggestions.map((item, idx) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`portal-search-item ${idx === selectedSearchIdx ? 'portal-search-item--selected' : ''}`}
                      onClick={() => setIsSearchOpen(false)}
                      role="option"
                      aria-selected={idx === selectedSearchIdx}
                    >
                      <div className="portal-search-item-main">
                        <span className="portal-search-item-title">{item.title}</span>
                        <span className="portal-search-item-desc">{item.desc}</span>
                      </div>
                      <div className="portal-search-item-meta">
                        {item.badge && <span className="portal-search-item-badge">{item.badge}</span>}
                        <span className="portal-search-item-cat">{item.category}</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="portal-search-empty">
                    <p>No direct results found for &ldquo;{searchQuery}&rdquo;</p>
                    <Link
                      to={`/search?q=${encodeURIComponent(searchQuery)}`}
                      className="portal-search-empty-link"
                      onClick={() => setIsSearchOpen(false)}
                    >
                      Search &ldquo;{searchQuery}&rdquo; in global documentation index ➔
                    </Link>
                  </div>
                )}
              </div>

              {searchQuery && filteredSuggestions.length > 0 && (
                <div className="portal-search-dropdown-footer">
                  <Link
                    to={`/search?q=${encodeURIComponent(searchQuery)}`}
                    onClick={() => setIsSearchOpen(false)}
                  >
                    View all results for &ldquo;{searchQuery}&rdquo; in global search ➔
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Primary CTA Buttons */}
        <div className="portal-cta-group">
          <Link to="/docs/api/quickstart" className="portal-btn-primary">
            Start Integrating ➔
          </Link>
          <Link to="/docs/api/overview" className="portal-btn-secondary">
            View OpenAPI Contracts
          </Link>
          <Link to="/docs/repositories/ppos-control-plane" className="portal-btn-secondary">
            Control Plane Architecture
          </Link>
        </div>

        {/* ================================================================= */}
        {/* 4 Main Pillar Cards */}
        {/* ================================================================= */}
        <div className="portal-section-header">
          <span className="portal-section-tag">Integration Surfaces</span>
          <h2 className="portal-section-title">Core Contracts &amp; Processing Engines</h2>
          <p className="portal-section-desc">
            Four decoupled modules featuring modular OpenAPI 3.1 specifications with deterministic calculation and validation guarantees.
          </p>
        </div>

        <div className="portal-pillars-grid">
          {/* Card 1: Pricing */}
          <Link to="/docs/api/pricing-api" className="pillar-card">
            <div className="pillar-header">
              <span className="pillar-badge badge-http-post">POST /api/marketplace/offers</span>
              <span className="pillar-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </span>
            </div>
            <h3 className="pillar-title">Pricing &amp; BPE Engine</h3>
            <p className="pillar-desc">
              Algorithmic manufacturing cost calculations in milliseconds via the Book Pricing Engine (BPE). Evaluates signatures, binding, run-length waste, and machine profiles.
            </p>
            <div className="pillar-footer">
              <span>Explore Pricing API &amp; BPE</span>
              <span>➔</span>
            </div>
          </Link>

          {/* Card 2: Preflight */}
          <Link to="/docs/api/preflight-api" className="pillar-card">
            <div className="pillar-header">
              <span className="pillar-badge badge-http-post">POST /api/preflight/jobs</span>
              <span className="pillar-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </span>
            </div>
            <h3 className="pillar-title">Preflight PDF Diagnostics</h3>
            <p className="pillar-desc">
              Asynchronous technical inspection for PDF files up to 2GB. Geometric validation of TrimBox/BleedBox, TAC ink limits, embedded fonts, and automated normalization.
            </p>
            <div className="pillar-footer">
              <span>Explore Preflight &amp; Autofix</span>
              <span>➔</span>
            </div>
          </Link>

          {/* Card 3: Marketplace & Orders */}
          <Link to="/docs/api/integration-contracts" className="pillar-card">
            <div className="pillar-header">
              <span className="pillar-badge badge-http-post">POST /api/marketplace/orders</span>
              <span className="pillar-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              </span>
            </div>
            <h3 className="pillar-title">Marketplace &amp; Orders</h3>
            <p className="pillar-desc">
              Structured manufacturing order ingestion, token-gated asset binding, immutable audit traceability, and deterministic workshop readiness evaluation.
            </p>
            <div className="pillar-footer">
              <span>Explore Order Lifecycle</span>
              <span>➔</span>
            </div>
          </Link>

          {/* Card 4: Webhooks */}
          <Link to="/docs/api/webhooks" className="pillar-card">
            <div className="pillar-header">
              <span className="pillar-badge" style={{ background: 'rgba(229, 57, 53, 0.12)', color: '#FF5252', border: '1px solid rgba(229, 57, 53, 0.3)' }}>
                HMAC-SHA256 PUSH
              </span>
              <span className="pillar-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </span>
            </div>
            <h3 className="pillar-title">Event Outbox Webhooks</h3>
            <p className="pillar-desc">
              Asynchronous push notifications with cryptographic verification via the <code>X-PPOS-Signature</code> header. Guaranteed delivery with retries for <code>order.ready</code> and <code>preflight.completed</code>.
            </p>
            <div className="pillar-footer">
              <span>Explore Webhooks &amp; Events</span>
              <span>➔</span>
            </div>
          </Link>
        </div>

        {/* ================================================================= */}
        {/* Visual Quickstart Section */}
        {/* ================================================================= */}
        <section className="quickstart-section">
          <div className="quickstart-header">
            <div className="quickstart-title-wrap">
              <span className="portal-section-tag">Quickstart</span>
              <h3>Quote your first book in 3 lines of code</h3>
              <p>No proprietary SDKs or complex dependencies. Standard REST with native JSON payloads.</p>
            </div>
            <Link to="/docs/api/quickstart" className="quickstart-cta-link">
              View Full Quickstart Guide ➔
            </Link>
          </div>

          <div className="terminal-box" role="region" aria-label="Interactive quick quoting code console">
            <div className="terminal-header">
              <div className="terminal-dots" aria-hidden="true">
                <span className="terminal-dot terminal-dot-red"></span>
                <span className="terminal-dot terminal-dot-yellow"></span>
                <span className="terminal-dot terminal-dot-green"></span>
              </div>
              <div className="terminal-tabs" role="tablist" aria-label="Example code languages">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'curl'}
                  className={`terminal-tab ${activeTab === 'curl' ? 'active' : ''}`}
                  onClick={() => setActiveTab('curl')}
                >
                  cURL
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'js'}
                  className={`terminal-tab ${activeTab === 'js' ? 'active' : ''}`}
                  onClick={() => setActiveTab('js')}
                >
                  JavaScript (Node.js)
                </button>
              </div>

              <button
                type="button"
                className="terminal-copy-btn"
                onClick={handleCopyCode}
                aria-label={copied ? 'Code copied to clipboard' : 'Copy code to clipboard'}
                title="Copy code"
              >
                {copied ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span style={{ color: '#10b981' }}>Copied</span>
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="terminal-body" tabIndex={0} aria-label={`Code example in ${activeTab === 'curl' ? 'cURL' : 'JavaScript'}`}>
              <code>{activeTab === 'curl' ? curlCode : jsCode}</code>
            </pre>
          </div>
        </section>

        {/* ================================================================= */}
        {/* Deep Systems & Architecture Grid */}
        {/* ================================================================= */}
        <div className="portal-section-header">
          <span className="portal-section-tag">Technical Ecosystem</span>
          <h2 className="portal-section-title">Architectural Pillars</h2>
          <p className="portal-section-desc">
            Decoupled subsystems operating with authoritative production truth and deterministic computation.
          </p>
        </div>

        <div className="portal-pillars-grid">
          <Link to="/docs/repositories/ppos-control-plane" className="pillar-card">
            <div className="pillar-header">
              <span className="pillar-badge">Operational Cockpit</span>
              <span className="pillar-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </span>
            </div>
            <h3 className="pillar-title">Control Plane</h3>
            <p className="pillar-desc">
              Multi-tenant governance hub, strict RBAC authorization, workshop digital twin configurations, raw materials, and margin multipliers.
            </p>
            <div className="pillar-footer">
              <span>View Control Plane Specs</span>
              <span>➔</span>
            </div>
          </Link>

          <Link to="/docs/platform/paper-supplier-hub" className="pillar-card">
            <div className="pillar-header">
              <span className="pillar-badge">Substrate Ecosystem</span>
              <span className="pillar-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </span>
            </div>
            <h3 className="pillar-title">Paper Supplier Hub</h3>
            <p className="pillar-desc">
              Master substrate database, multilingual onboarding (EN, ES, DE), automated fiscal verification, and real-time print shop paper binding.
            </p>
            <div className="pillar-footer">
              <span>Explore Paper Supplier Hub</span>
              <span>➔</span>
            </div>
          </Link>

          <Link to="/docs/engines/matchmaker" className="pillar-card">
            <div className="pillar-header">
              <span className="pillar-badge">Intelligent Routing</span>
              <span className="pillar-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                </svg>
              </span>
            </div>
            <h3 className="pillar-title">Matchmaker Engine</h3>
            <p className="pillar-desc">
              Intelligent routing evaluating physical book dimensions against print house capacity graphs, geographical zones, SLAs, and shop floor load.
            </p>
            <div className="pillar-footer">
              <span>Discover Matchmaker</span>
              <span>➔</span>
            </div>
          </Link>

          <Link to="/docs/architecture/platform-architecture" className="pillar-card">
            <div className="pillar-header">
              <span className="pillar-badge">Traceability &amp; Law</span>
              <span className="pillar-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  <polyline points="9 14 11 16 15 12"></polyline>
                </svg>
              </span>
            </div>
            <h3 className="pillar-title">Evidence Traceability</h3>
            <p className="pillar-desc">
              Immutable traceability of <code>evidenceId</code> and <code>selectedVariantId</code> across every quote and order, ensuring reproducibility and legal validity.
            </p>
            <div className="pillar-footer">
              <span>Explore Architecture Contracts</span>
              <span>➔</span>
            </div>
          </Link>
        </div>

        {/* ================================================================= */}
        {/* Knowledge Base & Documentation Map Matrix */}
        {/* ================================================================= */}
        <div className="portal-section-header">
          <span className="portal-section-tag">Navigation Map</span>
          <h2 className="portal-section-title">Complete Documentation Directory</h2>
          <p className="portal-section-desc">
            Direct access to all systems, contracts, operational playbooks, and infrastructure guides.
          </p>
        </div>

        <div className="portal-matrix">
          <div className="portal-matrix-col">
            <h4>API &amp; Integration</h4>
            <ul>
              <li><Link to="/docs/api/overview">Overview &amp; Architecture</Link></li>
              <li><Link to="/docs/api/quickstart">Quickstart Guide</Link></li>
              <li><Link to="/docs/api/authentication">Authentication &amp; Security</Link></li>
              <li><Link to="/docs/api/pricing-api">Book Pricing Engine (BPE)</Link></li>
              <li><Link to="/docs/api/integration-contracts">Order Lifecycle &amp; Files</Link></li>
              <li><Link to="/docs/api/preflight-api">Preflight PDF &amp; Autofix</Link></li>
              <li><Link to="/docs/api/webhooks">HMAC Signed Webhooks</Link></li>
              <li><Link to="/docs/api/errors-and-limits">Error Codes &amp; Limits</Link></li>
            </ul>
          </div>

          <div className="portal-matrix-col">
            <h4>Architecture</h4>
            <ul>
              <li><Link to="/docs/architecture/platform-architecture">Platform Architecture</Link></li>
              <li><Link to="/docs/architecture/state-of-the-art">State of the Art Mechanics</Link></li>
              <li><Link to="/docs/architecture/preflight-diagnostic-contract">Diagnostic Contract</Link></li>
              <li><Link to="/docs/architecture/preflight-auth-contract">Auth &amp; Token Isolation</Link></li>
              <li><Link to="/docs/architecture/production-validation-checklist">Validation Checklist</Link></li>
            </ul>
          </div>

          <div className="portal-matrix-col">
            <h4>Control &amp; Engines</h4>
            <ul>
              <li><Link to="/docs/platform/overview">Platform Overview</Link></li>
              <li><Link to="/docs/platform/paper-supplier-hub">Paper Supplier Hub</Link></li>
              <li><Link to="/docs/engines/book-pricing-engine">Book Pricing Engine</Link></li>
              <li><Link to="/docs/engines/preflight-engine">Preflight Engine</Link></li>
              <li><Link to="/docs/engines/matchmaker">Matchmaker Engine</Link></li>
              <li><Link to="/docs/platform/production-pipeline">Production Pipeline</Link></li>
            </ul>
          </div>

          <div className="portal-matrix-col">
            <h4>Operations &amp; DevOps</h4>
            <ul>
              <li><Link to="/docs/infrastructure/deployment-blueprint">Deployment Blueprint</Link></li>
              <li><Link to="/docs/infrastructure/production-deployment-playbook">Production Playbook</Link></li>
              <li><Link to="/docs/infrastructure/security">Security Guidelines</Link></li>
              <li><Link to="/docs/infrastructure/observability">Observability &amp; Health</Link></li>
              <li><Link to="/docs/engineering/coding-standards">Coding Standards</Link></li>
            </ul>
          </div>
        </div>
      </main>
    </Layout>
  );
}
