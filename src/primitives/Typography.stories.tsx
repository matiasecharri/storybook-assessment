import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heading } from './Heading';
import { Text } from './Text';

const meta = {
  title: 'Primitives/Typography',
  tags: ['autodocs'],
  parameters: {
    a11y: { config: { rules: [{ id: 'region', enabled: false }] } },
    docs: {
      description: {
        component: [
          'One family — `Source Sans 3`, falling back to the system sans — and four steps.',
          '',
          'The token set ships a family but no type scale, so Tailwind’s ramp is the scale, with one',
          'addition: `--text-caption` (11 / 16) for the step below `text-xs`. It is set in `rem` like every',
          'other step, so it follows a reader who has enlarged their default font size, and it carries its',
          'own line height — a `--text-*` step without one emits no `line-height` at all and inherits the',
          'parent’s.',
          '',
          '**Nothing in the assistant panel is set in uppercase.** Uppercase destroys word shape, and it costs',
          'the most at exactly the sizes that can least afford it, so the panel carries emphasis with weight and',
          'tone instead. The shipped `h3` disagrees, and it keeps its default here — see Headings below.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const ROWS = [
  { size: 'body', role: 'Assistant turn, user question', api: '<Text size="body">', spec: '16 / 28 · 400' },
  { size: 'default', role: 'Default body', api: '<Text>', spec: '14 / 24 · 400' },
  { size: 'label', role: 'Composer hint, header subtitle', api: '<Text size="label">', spec: '12 / 16 · 400' },
  { size: 'caption', role: 'Source chips, counts, footnotes', api: '<Text size="caption">', spec: '11 / 16 · 400' },
] as const;

const SAMPLE = 'Digit span sits below the rest of the profile. Sample text, not a clinical opinion.';

export const Scale: Story = {
  render: () => (
    <div className="flex max-w-[52ch] flex-col gap-6">
      {ROWS.map((row) => (
        <div key={row.api} className="flex flex-col gap-1 border-b border-border-subtle pb-5 last:border-0">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <Text size="caption" tone="tertiary">{row.role}</Text>
            <Text size="caption" tone="tertiary">
              <code>{row.api}</code> · {row.spec}
            </Text>
          </div>
          <Text size={row.size}>{SAMPLE}</Text>
        </div>
      ))}
    </div>
  ),
};

export const Headings: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      <Heading as="h1">Report assistant</Heading>
      <Heading as="h2">Assistant</Heading>
      <Heading as="h3">Suggested prompts</Heading>
      <Heading as="h3" className="normal-case tracking-normal">
        Suggested prompts — as the panel sets it
      </Heading>
      <Text size="caption" tone="tertiary">
        `h3` ships `uppercase tracking-wide` and keeps it. The assistant panel disagrees at its one
        call site and opts out with `normal-case tracking-normal`, rather than changing a default
        every other consumer shares.
      </Text>
    </div>
  ),
};
