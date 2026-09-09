import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { errorMessage, sampleCitations, sampleMessages } from '@/fixtures';
import { LONG_QUESTION } from '../mocks/MockAssistantPanel';
import { AssistantMessage } from './AssistantMessage';

const meta = {
  title: 'Assistant/Message',
  component: AssistantMessage,
  tags: ['autodocs'],
  args: {
    message: sampleMessages[1],
    onRetry: fn(),
    onCitationClick: fn(),
  },
  argTypes: {
    density: { control: 'inline-radio', options: ['comfortable', 'compact'] },
  },
  parameters: {
    // Standalone stories have no page landmark; AssistantPanel provides it in the app.
    a11y: { config: { rules: [{ id: 'region', enabled: false }] } },
    docs: {
      description: {
        component: [
          'One turn. Role is carried by two signals — the `<article>` accessible name',
          '("User message" / "Assistant message"), and the layout (user turns are right-aligned bubbles,',
          'assistant turns full-width prose) — so it survives colour blindness, forced-colours mode and a',
          'screen reader. The article is never focusable: only the controls inside a turn are.',
          '',
          'The turn also owns its own failure: a broken turn renders in place with its retry, instead of a global',
          'banner that would break the reading order of the thread.',
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
} satisfies Meta<typeof AssistantMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UserTurn: Story = {
  args: { message: sampleMessages[0] },
  parameters: {
    docs: { description: { story: 'What the clinician asked. A right-aligned bubble capped at 85% width — no caption.' } },
  },
};

export const AssistantTurn: Story = {
  args: { message: sampleMessages[1] },
  parameters: {
    docs: { description: { story: 'A settled answer with the sources it leaned on.' } },
  },
};

export const Streaming: Story = {
  args: {
    message: {
      id: 'msg-streaming',
      role: 'assistant',
      content: 'Working memory and CPT omission scores are the main',
      status: 'streaming',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Mid-answer. New text appears in batches without a typing cursor. The article is `aria-busy`; the panel announces turn state through one polite live region.',
      },
    },
  },
};

export const StreamingEmpty: Story = {
  args: {
    message: { id: 'msg-thinking', role: 'assistant', content: '', status: 'streaming' },
  },
  parameters: {
    docs: {
      description: {
        story: 'The gap between send and first token. The turn is already in the thread, so nothing jumps when text arrives.',
      },
    },
  },
};

export const WithCitations: Story = {
  args: { message: { ...sampleMessages[1], citations: sampleCitations } },
  parameters: {
    docs: {
      description: {
        story:
          'All three source kinds. A chip’s accessible name names the kind ("Document: Referral letter — sample.pdf") unless the title already does.',
      },
    },
  },
};

export const Failed: Story = {
  args: { message: errorMessage },
  parameters: {
    docs: {
      description: {
        story: 'A failed turn. `onRetry` gets the message id, so a thread with several failures retries the right one.',
      },
    },
  },
};

export const FailedWithoutRetry: Story = {
  args: { message: errorMessage, onRetry: undefined },
  parameters: {
    docs: {
      description: {
        story: 'No `onRetry`, no retry button — the component never renders an affordance the host cannot honour.',
      },
    },
  },
};

export const LongQuestion: Story = {
  args: {
    message: {
      id: 'msg-long',
      role: 'user',
      content: LONG_QUESTION,
      status: 'done',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'A pasted, multi-part question. The bubble clamps at eight lines, fades the last one, and offers **Show more** — otherwise one long question pushes the answer it is about off the screen. The full text stays in the DOM, so a screen reader is never given the clipped version.',
      },
    },
  },
};
