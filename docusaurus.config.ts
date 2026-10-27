import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'PrintPrice OS Documentation',
  tagline: 'Production Intelligence Platform & Control Plane for the Print Industry',
  favicon: 'img/logo.svg',

  future: {
    v4: true,
  },

  url: 'https://docs.printprice.pro',
  baseUrl: '/',

  organizationName: 'drleuman',
  projectName: 'printprice-docs',

  onBrokenLinks: 'throw',
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  themes: ['@docusaurus/theme-mermaid'],

  plugins: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        indexDocs: true,
        indexBlog: false,
        docsRouteBasePath: 'docs',
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    mermaid: {
      theme: {light: 'neutral', dark: 'dark'},
      options: {
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontSize: 14,
      },
    },
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'PrintPrice OS',
      logo: {
        alt: 'PrintPrice OS Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          to: '/docs/repositories/ppos-control-plane',
          label: 'Control Plane',
          position: 'left',
        },
        {
          to: '/docs/platform/paper-supplier-hub',
          label: 'Paper Hub',
          position: 'left',
        },
        {
          to: '/docs/api/overview',
          label: 'API & Contracts',
          position: 'left',
        },
        {
          href: 'https://control.printprice.pro',
          label: 'Control Plane App ↗',
          position: 'right',
        },
        {
          href: 'https://github.com/drleuman/printprice-docs',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Core Systems',
          items: [
            {
              label: 'Control Plane',
              to: '/docs/repositories/ppos-control-plane',
            },
            {
              label: 'Paper Supplier Hub',
              to: '/docs/platform/paper-supplier-hub',
            },
            {
              label: 'Book Pricing Engine',
              to: '/docs/engines/book-pricing-engine',
            },
            {
              label: 'Preflight Engine',
              to: '/docs/engines/preflight-engine',
            },
          ],
        },
        {
          title: 'Architecture & APIs',
          items: [
            {
              label: 'Platform Architecture',
              to: '/docs/architecture/platform-architecture',
            },
            {
              label: 'API Contracts',
              to: '/docs/api/overview',
            },
            {
              label: 'Preflight Diagnostic Contract',
              to: '/docs/architecture/preflight-diagnostic-contract',
            },
            {
              label: 'Production Pipeline',
              to: '/docs/platform/production-pipeline',
            },
          ],
        },
        {
          title: 'Ecosystem',
          items: [
            {
              label: 'Control Plane Portal',
              href: 'https://control.printprice.pro',
            },
            {
              label: 'PrintPrice Official',
              href: 'https://printprice.pro',
            },
            {
              label: 'Documentation Repository',
              href: 'https://github.com/drleuman/printprice-docs',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} PrintPrice OS. Production Intelligence Platform for the Print Industry.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
