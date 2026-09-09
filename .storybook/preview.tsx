import type { Preview } from '@storybook/react-vite';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import '../src/styles/globals.css';

const preview: Preview = {
  parameters: {
    layout: 'padded',
    backgrounds: { disable: true },
    controls: { expanded: true },
    a11y: { test: 'todo' },
    docs: { toc: true },
  },
  tags: ['autodocs'],
  decorators: [
    withThemeByDataAttribute({
      themes: { light: 'light', dark: 'dark' },
      defaultTheme: 'light',
      attributeName: 'data-theme',
    }),
    (Story) => (
      <div className="min-h-screen bg-bg-page p-4 font-sans text-text-primary antialiased">
        <Story />
      </div>
    ),
  ],
};

export default preview;
