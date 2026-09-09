import { Card, Text } from '@/primitives';
import {
  denseThread,
  errorMessage,
  sampleMessages,
  sampleSuggestions,
} from '@/fixtures';
import { AssistantPanel, type AssistantPanelProps } from '../assistant-panel/AssistantPanel';
import type { Citation, Message } from '../types';
import { MOCK_ANSWER, sourcedCitations, useMockAssistant } from './useMockAssistant';

export const LONG_QUESTION = [
  'A few things about this sample case, in one go.',
  ...sampleSuggestions.map((prompt) => (/[.?!]$/.test(prompt) ? prompt : `${prompt}.`)),
  'And for each of those, say which section of the report you leaned on, whether the',
  'referral letter adds anything, and what you would leave out of the impression.',
  'Take the sample battery as given; I am not asking for a clinical opinion.',
].join(' ');

export type ThreadPreset = 'empty' | 'question' | 'answered' | 'sourced' | 'failed' | 'dense';

export const THREAD_PRESETS: Record<ThreadPreset, Message[]> = {
  empty: [],
  question: [sampleMessages[0]],
  answered: sampleMessages,
  sourced: [sampleMessages[0], { ...sampleMessages[1], citations: sourcedCitations }],
  failed: [sampleMessages[0], errorMessage],
  dense: denseThread.map((message, index) => {
    if (index === 0) {
      return { ...message, content: LONG_QUESTION };
    }
    if (index === 3) {
      return { ...message, content: `${sampleMessages[1].content}\n\n${MOCK_ANSWER}`, citations: sourcedCitations };
    }
    if (index === 7) {
      return { ...message, content: sampleMessages[1].content, citations: sourcedCitations.slice(0, 2) };
    }
    return message;
  }),
};

export type MockAssistantPanelProps = Partial<AssistantPanelProps> & {
  /** Changing this preset remounts the harness. */
  thread?: ThreadPreset;
  /** Milliseconds between batches of up to 12 words. */
  streamSpeedMs?: number;
  /** Delay in milliseconds before streaming starts. */
  thinkingMs?: number;
  showSourceInspector?: boolean;
};

/** Story harness that supplies controlled panel state and restarts when seed options change. */
export function MockAssistantPanel({
  thread = 'empty',
  status = 'idle',
  streamSpeedMs = 240,
  thinkingMs = 1500,
  ...rest
}: MockAssistantPanelProps) {
  return (
    <MockAssistantPanelInner
      // Reset simulated state for seed changes; keep presentation props live.
      key={`${thread}:${status}:${streamSpeedMs}:${thinkingMs}`}
      thread={thread}
      status={status}
      streamSpeedMs={streamSpeedMs}
      thinkingMs={thinkingMs}
      {...rest}
    />
  );
}

function MockAssistantPanelInner({
  thread = 'empty',
  status = 'idle',
  streamSpeedMs = 240,
  thinkingMs = 1500,
  showSourceInspector = false,
  onSubmit,
  onStop,
  onRetry,
  onSuggestionSelect,
  onCitationClick,
  onValueChange,
  ...panelProps
}: MockAssistantPanelProps) {
  const mock = useMockAssistant({
    initialMessages: THREAD_PRESETS[thread],
    initialStatus: thread === 'failed' ? 'error' : 'idle',
    answerCitations: thread === 'sourced' ? sourcedCitations : undefined,
    intervalMs: streamSpeedMs,
    thinkingMs,
    autoStart: status === 'streaming',
  });

  function withStoryCallback<Args extends unknown[]>(
    callback: ((...args: Args) => void) | undefined,
    action: (...args: Args) => void,
  ) {
    return (...args: Args) => {
      callback?.(...args);
      action(...args);
    };
  }

  return (
    // 640px when the window allows it; never taller than the viewport minus the preview's padding.
    <div className="flex h-[640px] max-h-[calc(100dvh-4rem)] flex-col gap-3">
      <AssistantPanel
        {...panelProps}
        messages={mock.messages}
        status={mock.status}
        value={mock.value}
        onValueChange={withStoryCallback(onValueChange, mock.onValueChange)}
        onSubmit={withStoryCallback(onSubmit, mock.onSubmit)}
        onStop={withStoryCallback(onStop, mock.onStop)}
        onRetry={withStoryCallback(onRetry, mock.onRetry)}
        onSuggestionSelect={withStoryCallback(onSuggestionSelect, mock.onSuggestionSelect)}
        onCitationClick={withStoryCallback(onCitationClick, mock.onCitationClick)}
        className="h-auto min-h-0 flex-1"
      />
      {showSourceInspector ? <SourceInspector citation={mock.lastCitation} /> : null}
    </div>
  );
}

function SourceInspector({ citation }: { citation: Citation | null }) {
  return (
    <aside aria-label="Host" className="shrink-0">
      <Card className="p-3">
        <Text as="span" tone="tertiary" size="caption" className="block">
          Host — onCitationClick
        </Text>
        <Text className="mt-0.5">
          {citation
            ? `Opening ${citation.kind}: ${citation.title}`
            : 'Choose a source above. The product scrolls the report to it; the panel only reports the click.'}
        </Text>
      </Card>
    </aside>
  );
}
