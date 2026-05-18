import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Architecture',
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
      label: 'Repositories',
      items: [
        'repositories/ppos-preflight-engine',
        'repositories/ppos-preflight-service',
        'repositories/ppos-preflight-worker',
        'repositories/preflight-app-bff',
        'repositories/ppos-control-plane',
      ],
    },
    {
      type: 'category',
      label: 'Phases',
      items: [
        'phases/phase-35-5-production-freeze',
        'phases/phase-36-order-intake-file-governance',
      ],
    },
    {
      type: 'category',
      label: 'Platform',
      items: [
        'platform/overview',
        'platform/architecture',
        'platform/production-pipeline',
        'platform/system-data-model',
        'platform/print-network',
      ],
    },
    {
      type: 'category',
      label: 'Engines',
      items: [
        'engines/book-pricing-engine',
        'engines/preflight-engine',
        'engines/production-intelligence',
        'engines/compatibility-engine',
        'engines/matchmaker',
      ],
    },
    {
      type: 'category',
      label: 'API',
      items: [
        'api/overview',
        'api/integration-contracts',
        'api/authentication',
        'api/pricing-api',
        'api/preflight-api',
        'api/webhooks',
      ],
    },
    {
      type: 'category',
      label: 'Infrastructure',
      items: [
        'infrastructure/deployment-blueprint',
        'infrastructure/cloud-architecture',
        'infrastructure/security',
        'infrastructure/observability',
      ],
    },
    {
      type: 'category',
      label: 'Pipeline',
      items: [
        'pipeline/pdf-analysis',
        'pipeline/production-routing',
        'pipeline/cost-optimization',
      ],
    },
    {
      type: 'category',
      label: 'Engineering',
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
      label: 'Roadmap',
      items: [
        'roadmap/product-roadmap',
        'roadmap/future-vision',
      ],
    },
    {
      type: 'category',
      label: 'Strategy',
      items: [
        'strategy/strategic-moat',
        'strategy/future-vision',
      ],
    },
  ],
};

export default sidebars;
