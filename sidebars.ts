import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'API & Integration Contracts',
      collapsed: false,
      items: [
        'api/overview',
        'api/quickstart',
        'api/authentication',
        'api/pricing-api',
        'api/integration-contracts',
        'api/preflight-api',
        'api/webhooks',
        'api/errors-and-limits',
      ],
    },
    {
      type: 'category',
      label: 'Platform & Engines',
      collapsed: true,
      items: [
        'platform/overview',
        'platform/paper-supplier-hub',
        'platform/architecture',
        'platform/production-pipeline',
        'platform/system-data-model',
        'platform/print-network',
        'engines/book-pricing-engine',
        'engines/preflight-engine',
        'engines/production-intelligence',
        'engines/compatibility-engine',
        'engines/matchmaker',
      ],
    },
    {
      type: 'category',
      label: 'Architecture & Contracts',
      collapsed: true,
      items: [
        'architecture/platform-architecture',
        'architecture/state-of-the-art',
        'architecture/preflight-diagnostic-contract',
        'architecture/preflight-status-contract',
        'architecture/preflight-artifact-contract',
        'architecture/preflight-auth-contract',
        'architecture/production-validation-checklist',
      ],
    },
    {
      type: 'category',
      label: 'Repositories & Systems',
      collapsed: true,
      items: [
        'repositories/ppos-control-plane',
        'repositories/ppos-preflight-engine',
        'repositories/ppos-preflight-service',
        'repositories/ppos-preflight-worker',
        'repositories/preflight-app-bff',
      ],
    },
    {
      type: 'category',
      label: 'Production Pipeline',
      collapsed: true,
      items: [
        'pipeline/pdf-analysis',
        'pipeline/production-routing',
        'pipeline/cost-optimization',
      ],
    },
    {
      type: 'category',
      label: 'Infrastructure & DevOps',
      collapsed: true,
      items: [
        'infrastructure/deployment-blueprint',
        'infrastructure/production-deployment-playbook',
        'infrastructure/cloud-architecture',
        'infrastructure/security',
        'infrastructure/observability',
      ],
    },
    {
      type: 'category',
      label: 'Phases & Milestones',
      collapsed: true,
      items: [
        'phases/phase-35-5-production-freeze',
        'phases/phase-36-order-intake-file-governance',
      ],
    },
    {
      type: 'category',
      label: 'Engineering Standards',
      collapsed: true,
      items: [
        'engineering/coding-standards',
        'engineering/repository-structure',
        'engineering/development-workflow',
        'engineering/technical-debt',
        'engineering/refactoring-map',
      ],
    },
    {
      type: 'category',
      label: 'Strategy & Roadmap',
      collapsed: true,
      items: [
        'roadmap/product-roadmap',
        'roadmap/future-vision',
        'strategy/strategic-moat',
        'strategy/future-vision',
      ],
    },
  ],
};

export default sidebars;
