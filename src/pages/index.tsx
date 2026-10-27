import React, { useState } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

export default function Home(): React.ReactNode {
  const [activeTab, setActiveTab] = useState<'curl' | 'js'>('curl');

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

  const handleSearchClick = () => {
    // Trigger native Docusaurus search modal if present
    const searchInput = document.querySelector('.navbar__search-input') as HTMLInputElement | null;
    if (searchInput) {
      searchInput.focus();
      searchInput.click();
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

        {/* Interactive Search Bar Trigger */}
        <div 
          className="portal-search-bar" 
          onClick={handleSearchClick}
          role="button"
          tabIndex={0}
          aria-label="Abrir buscador de documentación"
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearchClick(); }}
        >
          <span className="portal-search-icon">🔍</span>
          <span className="portal-search-placeholder">
            Buscar endpoints, esquemas OpenAPI, guías y playbooks...
          </span>
          <span className="portal-search-kbd">
            <kbd>Ctrl</kbd> <kbd>K</kbd>
          </span>
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
              <span className="pillar-icon">⚡</span>
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
              <span className="pillar-icon">🛡️</span>
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
              <span className="pillar-icon">📦</span>
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
              <span className="pillar-icon">🔔</span>
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

          <div className="terminal-box">
            <div className="terminal-header">
              <div className="terminal-dots">
                <span className="terminal-dot terminal-dot-red"></span>
                <span className="terminal-dot terminal-dot-yellow"></span>
                <span className="terminal-dot terminal-dot-green"></span>
              </div>
              <div className="terminal-tabs">
                <button
                  type="button"
                  className={`terminal-tab ${activeTab === 'curl' ? 'active' : ''}`}
                  onClick={() => setActiveTab('curl')}
                >
                  cURL
                </button>
                <button
                  type="button"
                  className={`terminal-tab ${activeTab === 'js' ? 'active' : ''}`}
                  onClick={() => setActiveTab('js')}
                >
                  JavaScript (Node.js)
                </button>
              </div>
            </div>
            <pre className="terminal-body">
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
              <span className="pillar-icon">⚙️</span>
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
              <span className="pillar-icon">📄</span>
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
              <span className="pillar-icon">🧭</span>
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
              <span className="pillar-icon">📋</span>
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
