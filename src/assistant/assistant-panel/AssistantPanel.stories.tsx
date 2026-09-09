import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { X } from 'lucide-react';
import { IconButton } from '@/primitives';
import { clinician, sampleReport, sampleSuggestions } from '@/fixtures';
import { AssistantPanel, type AssistantPanelProps } from './AssistantPanel';
import {
  MockAssistantPanel,
  type MockAssistantPanelProps,
  type ThreadPreset,
} from '../mocks/MockAssistantPanel';

type PanelStoryArgs = AssistantPanelProps &
  Pick<MockAssistantPanelProps, 'thread' | 'streamSpeedMs' | 'thinkingMs' | 'showSourceInspector'>;

const THREAD_OPTIONS: ThreadPreset[] = [
  'empty',
  'question',
  'answered',
  'sourced',
  'failed',
  'dense',
];

// Document the real panel API; the harness supplies interactive story state.
const meta: Meta<PanelStoryArgs> = {
  title: 'Assistant/Panel',
  component: AssistantPanel,
  tags: ['autodocs'],
  render: (args) => <MockAssistantPanel {...args} />,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'The assistant rail a clinician works next to while writing a report: header, scrollable thread, composer.',
          '',
          '`AssistantPanel` is **controlled** — `messages`, `status` and `value` come from the host, and every',
          'interaction leaves through a callback. It fills its container; the product mounts it in a ~420px rail,',
          'which is the frame these stories use.',
          '',
          '**Talking to it:** `onSubmit` / `onStop` for the stream, `onRetry(messageId)` for a failed turn,',
          '`onSuggestionSelect(prompt)` for empty-state chips (a submit path, not a prefill), `onCitationClick(citation)`',
          'to open a source in the report.',
        ].join('\n'),
      },
    },
  },
  args: {
    messages: [],
    value: '',
    onValueChange: fn(),
    thread: 'empty',
    status: 'idle',
    density: 'comfortable',
    streamSpeedMs: 240,
    thinkingMs: 1500,
    suggestions: sampleSuggestions,
    title: 'Assistant',
    subtitle: `${sampleReport.title} · ${clinician.firstName} ${clinician.lastName}`,
    maxLength: 2000,
    showSourceInspector: false,
    onSubmit: fn(),
    onStop: fn(),
    onRetry: fn(),
    onSuggestionSelect: fn(),
    onCitationClick: fn(),
    headerActions: (
      <IconButton aria-label="Close assistant" onClick={fn()} className="-mr-1 shrink-0">
        <X aria-hidden="true" className="size-4" />
      </IconButton>
    ),
  },
  argTypes: {
    thread: {
      control: 'select',
      options: THREAD_OPTIONS,
      description: 'Story-only: which PHI-safe fixture thread to seed. Changing it remounts the harness.',
      table: { category: 'Story harness' },
    },
    thinkingMs: {
      control: { type: 'range', min: 0, max: 4000, step: 250 },
      description: 'Story-only: simulated wait before streaming starts. Set to 0 to skip the thinking phase.',
      table: { category: 'Story harness' },
    },
    streamSpeedMs: {
      control: { type: 'range', min: 80, max: 800, step: 40 },
      description: 'Story-only: milliseconds between batches of up to 12 words. Changing it restarts the simulation.',
      table: { category: 'Story harness' },
    },
    showSourceInspector: {
      control: 'boolean',
      description: 'Story-only: print what `onCitationClick` handed the host.',
      table: { category: 'Story harness' },
    },
    status: { control: false, description: 'The harness owns the current status. Use the failed thread preset for an error; the Streaming story starts a response on mount.' },
    density: { control: 'inline-radio', options: ['comfortable', 'compact'] },
    title: { control: 'text' },
    subtitle: { control: 'text' },
    maxLength: { control: { type: 'number' } },
    headerActions: { control: false },
    suggestions: { table: { type: { summary: 'readonly string[]' } } },
    messages: { control: false, table: { type: { summary: 'Message[]' } } },
    value: { control: false },
    onValueChange: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="w-[420px] max-w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<PanelStoryArgs>;

export const Empty: Story = {
  args: { thread: 'empty', status: 'idle' },
  parameters: {
    docs: {
      description: {
        story:
          'First run, or a fresh conversation. Use it to check that the panel offers a way in: what the assistant is grounded in, three suggested prompts, and an enabled composer. Chips submit straight away — they are not a prefill.',
      },
    },
  },
};

export const Streaming: Story = {
  args: { thread: 'question', status: 'streaming' },
  parameters: {
    docs: {
      description: {
        story:
          'An answer arriving. Stop keeps the partial text; the field stays editable, but Enter and Retry cannot start another turn. Changing `streamSpeedMs` restarts the simulation at the selected speed.',
      },
    },
  },
};

export const Error: Story = {
  args: { thread: 'failed', status: 'error' },
  parameters: {
    docs: {
      description: {
        story:
          'A turn that failed. The failure is attached to the turn that broke, not to a global banner, so the thread still reads in order. **Retry** calls `onRetry(messageId)`; the composer stays usable so the clinician can rephrase instead of retrying. Here retry streams a fresh answer.',
      },
    },
  },
};

export const WithCitations: Story = {
  name: 'WithCitations',
  args: { thread: 'sourced', status: 'idle', showSourceInspector: true },
  parameters: {
    docs: {
      description: {
        story:
          'An answer with its sources — a `document`, a report `section` and a session `note`. Kind is carried by the icon *and* the accessible name ("Session note: …"), never by colour alone. Clicking a chip only reports `onCitationClick`; scrolling the report to it is the host’s job, shown here in the strip below the panel.',
      },
    },
  },
};

export const DenseThread: Story = {
  name: 'DenseThread',
  args: { thread: 'dense', status: 'idle', density: 'compact' },
  parameters: {
    docs: {
      description: {
        story:
          'Ten turns with mixed lengths, paragraphs and sources. Scroll up to read older answers, use **Jump to present** to return, and expand the composer to check that the thread follows its changing height. Switch `density` to compare spacing.',
      },
    },
  },
};
