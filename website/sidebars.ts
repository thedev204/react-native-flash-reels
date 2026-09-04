import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    'installation',
    'usage',
    {
      type: 'category',
      label: 'API',
      link: {
        type: 'generated-index',
        title: 'API',
        description:
          'Props, hooks, and shared types for react-native-flash-reels.',
      },
      items: ['api/props', 'api/hooks', 'api/types'],
    },
    'performance',
    'example-app',
  ],
};

export default sidebars;
