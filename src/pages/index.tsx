import React from 'react';
import Layout from '@theme/Layout';

export default function Home(): JSX.Element {
  return (
    <Layout title="PrintPrice Docs">

      <main style={{padding: "60px", maxWidth: "900px", margin: "auto"}}>

        <h1>PrintPrice Documentation</h1>

        <p>
        Technical documentation for the PrintPrice platform —
        a production intelligence system for print manufacturing.
        </p>

        <h2>Platform</h2>

        <ul>
          <li><a href="/platform/overview">Platform Overview</a></li>
          <li><a href="/architecture/platform-architecture">Architecture</a></li>
          <li><a href="/platform/production-pipeline">Production Pipeline</a></li>
          <li><a href="/platform/system-data-model">System Data Model</a></li>
        </ul>

        <h2>Core Engines</h2>

        <ul>
          <li><a href="/engines/book-pricing-engine">Book Pricing Engine</a></li>
          <li><a href="/engines/preflight-engine">Preflight Engine</a></li>
          <li><a href="/engines/production-intelligence">Production Intelligence</a></li>
          <li><a href="/engines/matchmaker">Matchmaker Engine</a></li>
        </ul>

        <h2>API</h2>

        <ul>
          <li><a href="/api/overview">API Overview</a></li>
          <li><a href="/api/integration-contracts">Integration Contracts</a></li>
        </ul>

        <h2>Infrastructure</h2>

        <ul>
          <li><a href="/infrastructure/deployment-blueprint">Deployment Blueprint</a></li>
        </ul>

      </main>

    </Layout>
  );
}
