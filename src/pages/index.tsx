import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

export default function Home(): React.ReactNode {
  return (
    <Layout
      title="PrintPrice OS — Production Intelligence Platform"
      description="Production Intelligence Operating System for the commercial print industry, book manufacturing, preflight diagnostics, and control plane governance."
    >
      <main className="portal-hero">
        <div className="portal-badge">
          <span>●</span>
          <span>PrintPrice OS · Intelligence Layer &amp; Control Plane</span>
        </div>

        <h1 className="portal-title">
          PRICE IT. FIX IT. PRINT IT.
        </h1>

        <p className="portal-subtitle">
          The Production Intelligence Operating System powering multi-tenant commercial print governance,
          autonomous PDF preflight diagnostics, dynamic book pricing matrices, and intelligent
          printer-substrate matchmaking.
        </p>

        <div className="portal-cta-group">
          <Link to="/docs" className="portal-btn-primary">
            Explore Documentation ➔
          </Link>
          <Link to="/docs/repositories/ppos-control-plane" className="portal-btn-secondary">
            Control Plane Architecture
          </Link>
          <Link to="/docs/platform/paper-supplier-hub" className="portal-btn-secondary">
            Paper Supplier Hub
          </Link>
          <Link to="/docs/api/overview" className="portal-btn-secondary">
            API &amp; Contracts
          </Link>
        </div>

        <div className="portal-section-header">
          <h2 className="portal-section-title">Architectural Pillars</h2>
          <p className="portal-section-desc">
            Decoupled subsystems operating on authoritative production truth and deterministic calculation.
          </p>
        </div>

        <div className="portal-grid">
          <Link to="/docs/repositories/ppos-control-plane" className="portal-card">
            <span className="portal-card-tag">Operational Cockpit</span>
            <h3 className="portal-card-title">Control Plane</h3>
            <p className="portal-card-body">
              Multi-tenant governance hub, strict RBAC authorization, Printhouse digital twin configuration,
              materials setup, margin multipliers, and authoritative server-side pricing resolution.
            </p>
            <div className="portal-card-footer">
              <span>View Control Plane Specifications</span>
              <span>➔</span>
            </div>
          </Link>

          <Link to="/docs/platform/paper-supplier-hub" className="portal-card">
            <span className="portal-card-tag">Substrate Ecosystem</span>
            <h3 className="portal-card-title">Paper Supplier Hub</h3>
            <p className="portal-card-body">
              Federated paper catalog master database, self-service multilingual onboarding
              (ES, EN, DE), automated VAT/tax verification, and real-time printhouse substrate linking.
            </p>
            <div className="portal-card-footer">
              <span>Explore Paper Supplier Hub</span>
              <span>➔</span>
            </div>
          </Link>

          <Link to="/docs/engines/book-pricing-engine" className="portal-card">
            <span className="portal-card-tag">Dynamic Cost Solver</span>
            <h3 className="portal-card-title">Book Pricing Engine (BPE)</h3>
            <p className="portal-card-body">
              Deterministic print cost calculation matrix covering offset sheetfed, digital toner,
              web offset, finishing, bindings, waste curves, and press format boundaries.
            </p>
            <div className="portal-card-footer">
              <span>Inspect Pricing Engine</span>
              <span>➔</span>
            </div>
          </Link>

          <Link to="/docs/engines/preflight-engine" className="portal-card">
            <span className="portal-card-tag">Diagnostic Truth</span>
            <h3 className="portal-card-title">Preflight Engine &amp; Service</h3>
            <p className="portal-card-body">
              High-performance deterministic PDF inspection pipeline. Preserves immutable diagnostic
              findings (canonicalPayload), geometry compliance, TAC bounds, and print-ready artifacts.
            </p>
            <div className="portal-card-footer">
              <span>Review Preflight Engine</span>
              <span>➔</span>
            </div>
          </Link>

          <Link to="/docs/engines/matchmaker" className="portal-card">
            <span className="portal-card-tag">Intelligent Routing</span>
            <h3 className="portal-card-title">Matchmaker Engine</h3>
            <p className="portal-card-body">
              Graph-based routing evaluating physical book dimensions against press capability graphs,
              geographic zones, turnaround SLAs, and live operational load.
            </p>
            <div className="portal-card-footer">
              <span>Discover Matchmaker</span>
              <span>➔</span>
            </div>
          </Link>

          <Link to="/docs/architecture/platform-architecture" className="portal-card">
            <span className="portal-card-tag">Commercial Governance</span>
            <h3 className="portal-card-title">Evidence &amp; Audit Trail</h3>
            <p className="portal-card-body">
              Authoritative evidenceId and selectedVariantId traceability across all transactions,
              guaranteeing legally binding quotes and complete calculation reproducibility.
            </p>
            <div className="portal-card-footer">
              <span>Explore Architecture Contracts</span>
              <span>➔</span>
            </div>
          </Link>
        </div>

        <div className="portal-section-header">
          <h2 className="portal-section-title">Knowledge Base &amp; Documentation Map</h2>
          <p className="portal-section-desc">
            Direct navigation across all systems, contracts, and operational playbooks.
          </p>
        </div>

        <div className="portal-matrix">
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
            <h4>Control &amp; Platform</h4>
            <ul>
              <li><Link to="/docs/repositories/ppos-control-plane">Control Plane Specifications</Link></li>
              <li><Link to="/docs/platform/paper-supplier-hub">Paper Supplier Hub</Link></li>
              <li><Link to="/docs/platform/overview">Platform Overview</Link></li>
              <li><Link to="/docs/platform/production-pipeline">Production Pipeline</Link></li>
              <li><Link to="/docs/platform/printer-capability-graph">Printer Capability Graph</Link></li>
            </ul>
          </div>

          <div className="portal-matrix-col">
            <h4>Core Engines</h4>
            <ul>
              <li><Link to="/docs/engines/book-pricing-engine">Book Pricing Engine (BPE)</Link></li>
              <li><Link to="/docs/engines/preflight-engine">Preflight Engine</Link></li>
              <li><Link to="/docs/engines/production-intelligence">Production Intelligence</Link></li>
              <li><Link to="/docs/engines/compatibility-engine">Compatibility Engine</Link></li>
              <li><Link to="/docs/engines/matchmaker">Matchmaker Engine</Link></li>
            </ul>
          </div>

          <div className="portal-matrix-col">
            <h4>API &amp; Operations</h4>
            <ul>
              <li><Link to="/docs/api/overview">API Overview</Link></li>
              <li><Link to="/docs/api/pricing-api">Pricing API</Link></li>
              <li><Link to="/docs/api/preflight-api">Preflight API</Link></li>
              <li><Link to="/docs/api/webhooks">Webhooks</Link></li>
              <li><Link to="/docs/infrastructure/production-deployment-playbook">Deployment Playbook</Link></li>
            </ul>
          </div>
        </div>
      </main>
    </Layout>
  );
}
