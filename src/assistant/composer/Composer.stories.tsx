import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';
import { Composer, type ComposerProps } from './Composer';

const meta = {
  title: 'Assistant/Composer',
  component: Composer,
  tags: ['autodocs'],
  args: {
    value: '',
    onValueChange: fn(),
    onSubmit: fn(),
    onStop: fn(),
    status: 'idle',
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs<ComposerProps>();
    return (
      <Composer
        {...args}
        onValueChange={(value) => {
          args.onValueChange(value);
          updateArgs({ value });
        }}
        onSubmit={(value) => {
          args.onSubmit(value);
          updateArgs({ value: '' });
        }}
      />
    );
  },
  parameters: {
    a11y: { config: { rules: [{ id: 'region', enabled: false }] } },
    docs: {
      description: {
        component: 'Controlled input. Enter sends trimmed text; Shift + Enter adds a line. During streaming, Stop replaces Send and the field remains editable. Focus reveals the keyboard hint; Send/Stop stays anchored at the bottom right as the draft grows.',
      },
    },
  },
  decorators: [
    (Story) => <div className="w-[420px] max-w-full"><Story /></div>,
  ],
} satisfies Meta<typeof Composer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const WithText: Story = { args: { value: 'Summarize the findings in this report.' } };
export const Multiline: Story = {
  args: { value: 'Summarize the main findings.\nCompare them with the previous report.\nInclude the supporting sources.\nKeep the impression concise.\nMention any uncertainty.\nSuggest what to review next.\nDo not add unsupported findings.' },
};
export const Streaming: Story = { args: { status: 'streaming', value: 'My next question…' } };
export const Disabled: Story = { args: { disabled: true } };
