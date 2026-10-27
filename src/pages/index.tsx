import React, { useState, useRef, useEffect } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

interface SearchItem {
  title: string;
  path: string;
  category: 'API' | 'Contratos' | 'Guía' | 'Seguridad' | 'Plataforma';
  desc: string;
  badge?: string;
}

const SEARCH_SUGGESTIONS: SearchItem[] = [
  {
    title: 'Pricing & Offers API',
    path: '/docs/api/pricing-api',
    category: 'API',
    desc: 'Cotización algorítmica de libros en milisegundos con Book Pricing Engine (BPE)',
    badge: 'POST /api/marketplace/offers',
  },
  {
    title: 'Preflight PDF Diagnostics',
    path: '/docs/api/preflight-api',
    category: 'API',
    desc: 'Inspección técnica asíncrona de archivos PDF hasta 2GB y normalización',
    badge: 'POST /api/preflight/jobs',
  },
  {
    title: 'Marketplace & Order Intake',
    path: '/docs/api/integration-contracts',
    category: 'API',
    desc: 'Ingesta formal de pedidos, vinculación de archivos y cálculo de readiness',
    badge: 'POST /api/marketplace/orders',
  },
  {
    title: 'Outgoing Event Webhooks',
    path: '/docs/api/webhooks',
    category: 'API',
    desc: 'Notificaciones push con firma criptográfica HMAC-SHA256 y reintentos',
    badge: 'HMAC-SHA256 PUSH',
  },
  {
    title: 'API Overview & Architecture',
    path: '/docs/api/overview',
    category: 'Contratos',
    desc: 'Superficies públicas, inventario de endpoints y contratos OpenAPI 3.1',
    badge: 'OpenAPI 3.1',
  },
  {
    title: 'Quickstart: Cotiza en 3 Líneas',
    path: '/docs/api/quickstart',
    category: 'Guía',
    desc: 'Guía rápida de inicio para desarrolladores e integradores de imprenta',
    badge: 'REST JSON',
  },
  {
    title: 'Autenticación & Seguridad',
    path: '/docs/api/authentication',
    category: 'Seguridad',
    desc: 'Tokens de ingesta M2M, JWT para partners y tokens efímeros de reporte',
    badge: 'Bearer JWT',
  },
  {
    title: 'Códigos de Error & Rate Limits',
    path: '/docs/api/errors-and-limits',
    category: 'Contratos',
    desc: 'Catálogo exhaustivo de errores HTTP RFC 7807 y límites de peticiones',
    badge: 'RFC 7807',
  },
  {
    title: 'Control Plane Architecture',
    path: '/docs/repositories/ppos-control-plane',
    category: 'Plataforma',
    desc: 'Cockpit operacional, multi-tenancy, RBAC y gemelos digitales de taller',
    badge: 'Control Plane',
  },
  {
    title: 'Paper Supplier Hub',
    path: '/docs/platform/paper-supplier-hub',
    category: 'Plataforma',
    desc: 'Ecosistema de sustratos, onboarding multilingüe y catálogo de papel',
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
console.log("Ofertas obtenidas:", data.offers.length, "Total:", data.offers[0].total_price);`;

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
      description="Documentación oficial de APIs y arquitectura de PrintPrice OS: cotización determinista, diagnóstico PDF de preflight y gobernanza de pedidos."
    >
      <main className="portal-hero">
        {/* Technical Status Badge */}
        <div className="portal-badge">
          <span className="portal-badge-dot"></span>
          <span>PrintPrice OS · Developer &amp; Integration Platform</span>
        </div>

        {/* Hero Title & Subtitle */}
        <h1 className="portal-title">
          Documentación de APIs &amp;{' '}
          <span className="portal-title-highlight">Inteligencia Gráfica</span>
        </h1>

        <p className="portal-subtitle">
          Plataforma de APIs deterministas para la industria editorial y comercial. Cotización algorítmica de libros en milisegundos, diagnóstico asíncrono de PDFs con Preflight, ingesta gobernada de pedidos y webhooks con firma HMAC.
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
              placeholder="Buscar endpoints, esquemas OpenAPI, guías y playbooks..."
              aria-label="Buscar en la documentación de PrintPrice OS"
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
                aria-label="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
            <span className="portal-search-kbd" title="Presiona Ctrl+K para buscar">
              <kbd>Ctrl</kbd> <kbd>K</kbd>
            </span>
          </div>

          {/* Live Search Suggestions Dropdown Panel */}
          {isSearchOpen && (
            <div className="portal-search-dropdown" role="listbox" aria-label="Sugerencias de búsqueda">
              <div className="portal-search-dropdown-header">
                <span>{searchQuery ? `Resultados sugeridos para "${searchQuery}"` : 'Accesos directos recomendados'}</span>
                <span className="portal-search-dropdown-hint"><kbd>↑</kbd> <kbd>↓</kbd> navegar · <kbd>Enter</kbd> abrir</span>
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
                    <p>No se encontraron resultados directos para &ldquo;{searchQuery}&rdquo;</p>
                    <Link
                      to={`/search?q=${encodeURIComponent(searchQuery)}`}
                      className="portal-search-empty-link"
                      onClick={() => setIsSearchOpen(false)}
                    >
                      Buscar &ldquo;{searchQuery}&rdquo; en todo el índice de documentación ➔
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
                    Ver todos los resultados para &ldquo;{searchQuery}&rdquo; en el buscador global ➔
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Primary CTA Buttons */}
        <div className="portal-cta-group">
          <Link to="/docs/api/quickstart" className="portal-btn-primary">
            Empezar a integrar ➔
          </Link>
          <Link to="/docs/api/overview" className="portal-btn-secondary">
            Ver Contratos OpenAPI
          </Link>
          <Link to="/docs/repositories/ppos-control-plane" className="portal-btn-secondary">
            Control Plane Architecture
          </Link>
        </div>

        {/* ================================================================= */}
        {/* 4 Main Pillar Cards */}
        {/* ================================================================= */}
        <div className="portal-section-header">
          <span className="portal-section-tag">Superficies de Integración</span>
          <h2 className="portal-section-title">Contratos y Motores Principales</h2>
          <p className="portal-section-desc">
            Cuatro módulos desacoplados con especificaciones OpenAPI 3.1 modulares y garantías deterministas de cálculo y validación.
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
              Cálculo algorítmico de costes de fabricación en milisegundos mediante el Book Pricing Engine (BPE). Evalúa pliegos, encuadernación, mermas por tirada y perfiles de máquina.
            </p>
            <div className="pillar-footer">
              <span>Explorar Pricing API &amp; BPE</span>
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
              Inspección técnica asíncrona de archivos PDF de hasta 2GB. Verificación geométrica de TrimBox/BleedBox, cobertura de tinta TAC, fuentes incrustadas y normalización asistida.
            </p>
            <div className="pillar-footer">
              <span>Explorar Preflight &amp; Autofix</span>
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
              Ingesta estructurada de pedidos de fabricación, vinculación de archivos mediante tokens, trazabilidad inmutable y evaluación determinista de viabilidad de taller (Readiness).
            </p>
            <div className="pillar-footer">
              <span>Explorar Ciclo de Pedidos</span>
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
              Notificaciones push asíncronas con firma criptográfica en cabecera <code>X-PPOS-Signature</code>. Entrega garantizada con reintentos para eventos <code>order.ready</code> y <code>preflight.completed</code>.
            </p>
            <div className="pillar-footer">
              <span>Explorar Webhooks &amp; Eventos</span>
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
              <span className="portal-section-tag">Activación Rápida</span>
              <h3>Cotiza tu primer libro en 3 líneas de código</h3>
              <p>Sin SDKs propietarios ni dependencias complejas. REST estándar con payloads JSON nativos.</p>
            </div>
            <Link to="/docs/api/quickstart" className="quickstart-cta-link">
              Ver Guía Quickstart Completa ➔
            </Link>
          </div>

          <div className="terminal-box" role="region" aria-label="Consola interactiva de código de cotización rápida">
            <div className="terminal-header">
              <div className="terminal-dots" aria-hidden="true">
                <span className="terminal-dot terminal-dot-red"></span>
                <span className="terminal-dot terminal-dot-yellow"></span>
                <span className="terminal-dot terminal-dot-green"></span>
              </div>
              <div className="terminal-tabs" role="tablist" aria-label="Lenguajes de ejemplo">
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
                aria-label={copied ? 'Código copiado al portapapeles' : 'Copiar código al portapapeles'}
                title="Copiar código"
              >
                {copied ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span style={{ color: '#10b981' }}>Copiado</span>
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
            <pre className="terminal-body" tabIndex={0} aria-label={`Ejemplo de código en ${activeTab === 'curl' ? 'cURL' : 'JavaScript'}`}>
              <code>{activeTab === 'curl' ? curlCode : jsCode}</code>
            </pre>
          </div>
        </section>

        {/* ================================================================= */}
        {/* Deep Systems & Architecture Grid */}
        {/* ================================================================= */}
        <div className="portal-section-header">
          <span className="portal-section-tag">Ecosistema Técnico</span>
          <h2 className="portal-section-title">Pilares Arquitectónicos</h2>
          <p className="portal-section-desc">
            Subsistemas desacoplados que operan con verdad productiva autoritativa y cálculo determinista.
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
              Hub de gobernanza multi-tenant, autorización RBAC estricta, configuración de talleres gemelos digitales, materias primas y multiplicadores de margen.
            </p>
            <div className="pillar-footer">
              <span>Ver Especificaciones Control Plane</span>
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
              Base de datos maestra de sustratos, onboarding multilingüe (ES, EN, DE), verificación fiscal automática y vinculación en tiempo real con talleres de imprenta.
            </p>
            <div className="pillar-footer">
              <span>Explorar Paper Supplier Hub</span>
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
              Enrutamiento inteligente evaluando dimensiones físicas del libro contra grafos de capacidad de imprenta, zonas geográficas, SLAs y carga operativa.
            </p>
            <div className="pillar-footer">
              <span>Descubrir Matchmaker</span>
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
            <h3 className="pillar-title">Trazabilidad de Evidencias</h3>
            <p className="pillar-desc">
              Trazabilidad inmutable de <code>evidenceId</code> y <code>selectedVariantId</code> en cada cotización y orden, garantizando reproducibilidad y validez legal.
            </p>
            <div className="pillar-footer">
              <span>Explorar Contratos de Arquitectura</span>
              <span>➔</span>
            </div>
          </Link>
        </div>

        {/* ================================================================= */}
        {/* Knowledge Base & Documentation Map Matrix */}
        {/* ================================================================= */}
        <div className="portal-section-header">
          <span className="portal-section-tag">Mapa de Navegación</span>
          <h2 className="portal-section-title">Directorio Completo de Documentación</h2>
          <p className="portal-section-desc">
            Acceso directo a todos los sistemas, contratos, playbooks operativos y guías de infraestructura.
          </p>
        </div>

        <div className="portal-matrix">
          <div className="portal-matrix-col">
            <h4>API &amp; Integración</h4>
            <ul>
              <li><Link to="/docs/api/overview">Visión General &amp; Arquitectura</Link></li>
              <li><Link to="/docs/api/quickstart">Guía de Inicio Rápido</Link></li>
              <li><Link to="/docs/api/authentication">Autenticación &amp; Seguridad</Link></li>
              <li><Link to="/docs/api/pricing-api">Book Pricing Engine (BPE)</Link></li>
              <li><Link to="/docs/api/integration-contracts">Ciclo de Pedidos &amp; Archivos</Link></li>
              <li><Link to="/docs/api/preflight-api">Preflight PDF &amp; Autofix</Link></li>
              <li><Link to="/docs/api/webhooks">Webhooks con Firma HMAC</Link></li>
              <li><Link to="/docs/api/errors-and-limits">Códigos de Error &amp; Límites</Link></li>
            </ul>
          </div>

          <div className="portal-matrix-col">
            <h4>Arquitectura</h4>
            <ul>
              <li><Link to="/docs/architecture/platform-architecture">Platform Architecture</Link></li>
              <li><Link to="/docs/architecture/state-of-the-art">State of the Art Mechanics</Link></li>
              <li><Link to="/docs/architecture/preflight-diagnostic-contract">Diagnostic Contract</Link></li>
              <li><Link to="/docs/architecture/preflight-auth-contract">Auth &amp; Token Isolation</Link></li>
              <li><Link to="/docs/architecture/production-validation-checklist">Validation Checklist</Link></li>
            </ul>
          </div>

          <div className="portal-matrix-col">
            <h4>Control &amp; Motores</h4>
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
            <h4>Operaciones &amp; DevOps</h4>
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
