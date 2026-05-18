import React from 'react';
import Layout from '@theme/Layout';

export default function Home(): JSX.Element {
  return (
    <Layout title="PrintPrice OS Docs">

      <main style={{padding: "60px", maxWidth: "900px", margin: "auto"}}>

        <div style={{textAlign: "center", marginBottom: "40px", borderBottom: "1px solid #eaecef", paddingBottom: "30px"}}>
          <h1 style={{fontSize: "3rem", color: "#1a1a1a", marginBottom: "10px"}}>PrintPrice OS</h1>
          <p style={{fontSize: "1.5rem", fontWeight: "bold", letterSpacing: "1px", color: "#e28743", margin: "10px 0"}}>
            PRICE IT. FIX IT. PRINT IT.
          </p>
          <div style={{
            display: "inline-block", 
            backgroundColor: "#e8f5e9", 
            color: "#2e7d32", 
            padding: "8px 16px", 
            borderRadius: "20px", 
            fontWeight: "bold",
            fontSize: "0.95rem",
            border: "1px solid #a5d6a7",
            marginTop: "10px"
          }}>
            ✓ Phase 10/35 Production Validation Certified
          </div>
        </div>

        <div style={{backgroundColor: "#f8f9fa", borderLeft: "5px solid #0056b3", padding: "20px", borderRadius: "4px", marginBottom: "40px"}}>
          <h3 style={{marginTop: 0}}>Production Truth Gateways</h3>
          <p>
            The system operates on the core platform decoupling promise: 
            <strong> Engine produces truth. Service preserves truth. Worker executes and persists truth. BFF displays truth. ControlPlane governs truth.</strong>
          </p>
          <div style={{display: "flex", gap: "20px", flexWrap: "wrap", marginTop: "15px"}}>
            <a href="/docs/architecture/preflight-diagnostic-contract" style={{
              backgroundColor: "#0056b3",
              color: "#fff",
              padding: "10px 18px",
              borderRadius: "4px",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "0.9rem"
            }}>Read Preflight Diagnostic Contract ➔</a>
            <a href="/docs/phases/phase-36-order-intake-file-governance" style={{
              backgroundColor: "#28a745",
              color: "#fff",
              padding: "10px 18px",
              borderRadius: "4px",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "0.9rem"
            }}>View Phase 36 Roadmap ➔</a>
          </div>
        </div>

        <h2>Platform & Architecture</h2>

        <ul>
          <li><a href="/docs/platform/overview">Platform Overview</a></li>
          <li><a href="/docs/architecture/platform-architecture">High-Level Architecture</a></li>
          <li><a href="/docs/architecture/state-of-the-art">State of the Art Mechanics</a></li>
          <li><a href="/docs/architecture/preflight-diagnostic-contract">Preflight Diagnostic Contract</a></li>
          <li><a href="/docs/architecture/preflight-status-contract">Preflight Status Contract</a></li>
          <li><a href="/docs/architecture/preflight-artifact-contract">Preflight Artifact Contract</a></li>
          <li><a href="/docs/architecture/preflight-auth-contract">Preflight Auth Contract</a></li>
          <li><a href="/docs/architecture/production-validation-checklist">Production Validation Checklist</a></li>
        </ul>

        <h2>Product Repositories</h2>

        <ul>
          <li><a href="/docs/repositories/ppos-preflight-engine">Preflight Engine</a></li>
          <li><a href="/docs/repositories/ppos-preflight-service">Preflight Service</a></li>
          <li><a href="/docs/repositories/ppos-preflight-worker">Preflight Worker</a></li>
          <li><a href="/docs/repositories/preflight-app-bff">Preflight App & BFF</a></li>
          <li><a href="/docs/repositories/ppos-control-plane">Control Plane</a></li>
        </ul>

        <h2>Release Phases</h2>

        <ul>
          <li><a href="/docs/phases/phase-35-5-production-freeze">Phase 35.5: Production Freeze</a></li>
          <li><a href="/docs/phases/phase-36-order-intake-file-governance">Phase 36: Order Intake & Governance</a></li>
        </ul>

        <h2>Core Engines</h2>

        <ul>
          <li><a href="/docs/engines/book-pricing-engine">Book Pricing Engine</a></li>
          <li><a href="/docs/engines/preflight-engine">Preflight Engine Details</a></li>
          <li><a href="/docs/engines/production-intelligence">Production Intelligence</a></li>
          <li><a href="/docs/engines/matchmaker">Matchmaker Engine</a></li>
        </ul>

        <h2>API</h2>

        <ul>
          <li><a href="/docs/api/overview">API Overview</a></li>
          <li><a href="/docs/api/integration-contracts">Integration Contracts</a></li>
        </ul>

        <h2>Infrastructure</h2>

        <ul>
          <li><a href="/docs/infrastructure/deployment-blueprint">Deployment Blueprint</a></li>
        </ul>

      </main>

    </Layout>
  );
}
