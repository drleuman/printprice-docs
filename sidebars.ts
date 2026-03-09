import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Platform',
      items: [
        'platform/overview',
        'platform/architecture',
        'platform/production-pipeline',
        'platform/system-data-model',
      ],
    },
    {
      type: 'category',
      label: 'Engines',
      items: [
        'engines/book-pricing-engine',
        'engines/preflight-engine',
        'engines/compatibility-engine',
        'engines/matchmaker',
      ],
    },
    {
      type: 'category',
      label: 'API',
      items: [
        'api/overview',
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
        'engineering/technical-debt-map',
      ],
    },
    {
      type: 'category',
      label: 'Roadmap',
      items: [
        'roadmap/product-roadmap',
        'roadmap/strategic-moat',
        'roadmap/future-vision',
      ],
    },
  ],
};

export default sidebars;
