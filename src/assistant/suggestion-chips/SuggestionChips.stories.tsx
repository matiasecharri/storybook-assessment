import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { sampleSuggestions } from '@/fixtures';
import { SuggestionChips } from './SuggestionChips';

const meta = {
  title: 'Assistant/SuggestionChips',
  component: SuggestionChips,
  tags: ['autodocs'],
  args: {
    suggestions: sampleSuggestions,
    onSelect: fn(),
  },
  parameters: {
    // Standalone stories have no page landmark; AssistantPanel provides it in the app.
    a11y: { config: { rules: [{ id: 'region', enabled: false }] } },
    docs: {
      description: {
        component: [
          'Empty-state prompts. Choosing one **submits** it — it does not drop the text in the composer for the',
          'clinician to press send a second time.',
          '',
          'Chips are full-width and stacked: clinical prompts are sentences, and truncating them would hide the',
          'thing being chosen. They are ordinary buttons in a list, so Tab reaches every one of them.',
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
} satisfies Meta<typeof SuggestionChips>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
  parameters: {
    docs: {
      description: {
        story: 'While a turn streams. The chips stay visible so the reader keeps their bearings, but cannot start a second turn.',
      },
    },
  },
};

export const CustomLabel: Story = {
  args: { label: 'Try one of these', suggestions: sampleSuggestions.slice(0, 2) },
  parameters: {
    docs: { description: { story: 'The label is the list’s accessible name as well as its heading.' } },
  },
};
