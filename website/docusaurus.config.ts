import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Flash Reels',
  tagline:
    'High-performance vertical video feeds for React Native — FlashList v2 + New Architecture',
  favicon: 'img/favicon.png',

  future: {
    v4: true,
  },

  url: 'https://thedev204.github.io',
  baseUrl: '/react-native-flash-reels/',

  organizationName: 'thedev204',
  projectName: 'react-native-flash-reels',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
          editUrl:
            'https://github.com/thedev204/react-native-flash-reels/tree/main/website/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.jpg',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Flash Reels',
      logo: {
        alt: 'Flash Reels',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/docs/category/api',
          label: 'API',
          position: 'left',
        },
        {
          href: 'https://www.npmjs.com/package/react-native-flash-reels',
          label: 'npm',
          position: 'right',
        },
        {
          href: 'https://github.com/thedev204/react-native-flash-reels',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Introduction', to: '/docs/intro' },
            { label: 'Installation', to: '/docs/installation' },
            { label: 'Usage', to: '/docs/usage' },
            { label: 'API', to: '/docs/category/api' },
            { label: 'Performance', to: '/docs/performance' },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/thedev204/react-native-flash-reels',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/react-native-flash-reels',
            },
            {
              label: 'Changelog',
              href: 'https://github.com/thedev204/react-native-flash-reels/blob/main/CHANGELOG.md',
            },
            {
              label: 'Security',
              href: 'https://github.com/thedev204/react-native-flash-reels/blob/main/SECURITY.md',
            },
            {
              label: 'Issues',
              href: 'https://github.com/thedev204/react-native-flash-reels/issues',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} thedev204`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'tsx', 'typescript', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
