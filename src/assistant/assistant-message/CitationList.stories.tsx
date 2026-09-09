import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { sampleCitations } from '@/fixtures';
import { sourcedCitations } from '../mocks/useMockAssistant';
import { CitationList } from './CitationList';

const meta = {
  title: 'Assistant/CitationList',
  component: CitationList,
  tags: ['autodocs'],
  args: {
    citations: sampleCitations,
    onCitationClick: fn(),
  },
  parameters: {
    // Standalone stories have no page landmark; AssistantPanel provides it in the app.
    a11y: { config: { rules: [{ id: 'region', enabled: false }] } },
    docs: {
      description: {
        component: [
          'Sources under an assistant turn. Helper component — `AssistantMessage` renders it for you when a message',
          'carries `citations`.',
          '',
          'The kind (`document` / `section` / `note`) is carried by the icon **and** by the accessible name, never by',
          'colour alone. Long titles truncate visually but stay whole for assistive tech.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[420px] max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CitationList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ReadOnly: Story = {
  args: { onCitationClick: undefined },
  parameters: {
    docs: {
      description: {
        story: 'No handler, no buttons — the chips render as plain text rather than as controls that do nothing.',
      },
    },
  },
};

export const LongTitle: Story = {
  args: {
    citations: [
      {
        id: 'cit-long',
        title: 'Referral letter — sample neuropsychological assessment background, attention and working memory observations, school history and supporting intake documents — September 2024.pdf',
        kind: 'document',
        excerpt: sourcedCitations[0].excerpt,
      },
      ...sampleCitations.slice(1),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Chips are capped at 260px or the available width, whichever is smaller. The first title ends in a CSS ellipsis before filling the panel. Hover or focus it to read the full title in its preview; the accessible name also preserves the complete title.',
      },
    },
  },
};

export const WithPreview: Story = {
  args: { citations: sourcedCitations },
  parameters: {
    docs: {
      description: {
        story:
          'Hover or **tab to** the first two chips to preview the passage they point at. The preview answers *is this the right source*; clicking still answers *take me there*. Escape dismisses it, and the pointer can travel onto the card without it vanishing (WCAG 2.1 SC 1.4.13). The third source carries no `excerpt`, so it previews nothing — a chip never offers what its data cannot back. The passage also reaches a screen reader as the chip’s description, so it never depends on a hover a keyboard user cannot produce.',
      },
    },
  },
};
