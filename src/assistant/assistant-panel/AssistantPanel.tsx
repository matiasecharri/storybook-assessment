import { useRef, useState, type ReactNode } from 'react';
import { ArrowDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Heading, IconButton, Text } from '@/primitives';
import { AssistantMessage } from '../assistant-message/AssistantMessage';
import { Composer } from '../composer/Composer';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { useTurnAnnouncement } from '../hooks/useTurnAnnouncement';
import { SuggestionChips } from '../suggestion-chips/SuggestionChips';
import type { AssistantStatus, Citation, Density, Message } from '../types';

export type AssistantPanelProps = {
  /** Messages in chronological order, oldest first. */
  messages: Message[];
  status?: AssistantStatus;
  value: string;
  onValueChange: (value: string) => void;
  /** Receives trimmed, non-empty composer text. */
  onSubmit: (value: string) => void;
  onStop?: () => void;
  onRetry?: (messageId: string) => void;
  /** Submits the selected prompt directly; does not prefill the composer. */
  onSuggestionSelect?: (prompt: string) => void;
  onCitationClick?: (citation: Citation) => void;
  suggestions?: readonly string[];
  title?: string;
  subtitle?: string;
  density?: Density;
  placeholder?: string;
  maxLength?: number;
  headerActions?: ReactNode;
  footnote?: string | null;
  'aria-label'?: string;
  className?: string;
};

const EMPTY_TITLE = 'Ask about this report';
const EMPTY_BODY =
  'Questions, rewrites and source checks — grounded in the sections, documents and notes attached to this report.';

/** Controlled conversation panel. The host owns messages, status, input value and container dimensions. */
export function AssistantPanel({
  messages,
  status = 'idle',
  value,
  onValueChange,
  onSubmit,
  onStop,
  onRetry,
  onSuggestionSelect,
  onCitationClick,
  suggestions = [],
  title = 'Assistant',
  subtitle,
  density = 'comfortable',
  placeholder,
  maxLength,
  headerActions,
  footnote = null,
  'aria-label': ariaLabel = 'Report assistant',
  className,
}: AssistantPanelProps) {
  // Animate new messages only, not the history present at mount.
  const [initialMessageIds] = useState(() => new Set(messages.map((message) => message.id)));
  const composerRef = useRef<HTMLDivElement>(null);
  const { ref: threadRef, contentRef, isPinned, scrollToBottom, onScroll } =
    useAutoScroll<HTMLDivElement>();

  const isEmpty = messages.length === 0;
  const isStreaming = status === 'streaming';
  const showJump = !isPinned && !isEmpty;
  const canRetry = Boolean(onRetry) && !isStreaming && messages.some(
    (message) => message.role === 'assistant' && message.status === 'error',
  );
  const { announcement, noteStopRequest } = useTurnAnnouncement(status, canRetry);

  function focusComposer() {
    composerRef.current?.querySelector('textarea')?.focus({ preventScroll: true });
  }

  // Resume following the thread even if the reader scrolled up before sending.
  function handleSubmit(next: string) {
    scrollToBottom();
    onSubmit(next);
  }

  function handleSuggestionSelect(prompt: string) {
    if (isStreaming) return;
    scrollToBottom();
    focusComposer();
    onSuggestionSelect?.(prompt);
  }

  function handleRetry(messageId: string) {
    if (isStreaming) return;
    focusComposer();
    onRetry?.(messageId);
  }

  function handleStop() {
    noteStopRequest();
    onStop?.();
  }

  function handleJumpToPresent() {
    threadRef.current?.focus({ preventScroll: true });
    scrollToBottom();
  }

  return (
    <section
      aria-label={ariaLabel}
      className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-[var(--radius-md)]',
        'border border-border-subtle bg-bg-page dark:bg-bg-surface',
        className,
      )}
    >
      <header className="flex items-start gap-2 border-b border-border-subtle bg-bg-surface px-4 py-3">
        <div className="min-w-0 flex-1">
          <Heading as="h2" className="text-base leading-6">
            {title}
          </Heading>
          {subtitle ? (
            <Text as="span" tone="tertiary" size="label" className="block truncate">
              {subtitle}
            </Text>
          ) : null}
        </div>
        {headerActions}
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={threadRef}
          onScroll={onScroll}
          role="log"
          aria-live="off"
          aria-label="Conversation"
          tabIndex={0}
          className="h-full scroll-smooth overflow-y-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
        >
          <div
            ref={contentRef}
            className={density === 'compact' ? 'space-y-3 p-3' : 'space-y-5 p-4'}
          >
            {isEmpty ? (
              <div className="flex flex-col gap-4">
                <div>
                  <Heading as="h2" className="text-base leading-6">
                    {EMPTY_TITLE}
                  </Heading>
                  <Text tone="secondary" className="mt-1">
                    {EMPTY_BODY}
                  </Text>
                </div>
                <SuggestionChips
                  suggestions={suggestions}
                  onSelect={onSuggestionSelect ? handleSuggestionSelect : undefined}
                  disabled={isStreaming}
                />
              </div>
            ) : (
              messages.map((message) => (
                <AssistantMessage
                  key={message.id}
                  message={message}
                  density={density}
                  className={
                    message.role === 'user' && !initialMessageIds.has(message.id)
                      ? 'animate-[assistant-surface-in_180ms_var(--ease-smooth-out)_backwards] [--surface-enter-y:3px] focus-within:animate-none motion-reduce:animate-none'
                      : undefined
                  }
                  onRetry={onRetry ? handleRetry : undefined}
                  retryDisabled={isStreaming}
                  onCitationClick={onCitationClick}
                />
              ))
            )}
          </div>
        </div>

        <div
          aria-hidden={!showJump}
          inert={!showJump}
          className={cn(
            'group absolute bottom-3 left-1/2 -translate-x-1/2',
            'transition-[opacity,translate,visibility] duration-200 ease-in',
            showJump
              ? 'visible translate-y-0 opacity-100 duration-300 ease-[var(--ease-smooth-out)]'
              : 'invisible pointer-events-none translate-y-2 opacity-0',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2',
              'whitespace-nowrap rounded-[var(--radius-sm)] border border-border-default',
              'bg-bg-muted px-2 py-1 text-xs font-medium text-text-primary shadow-sm',
              'translate-y-1 opacity-0 transition-[opacity,translate] duration-75 ease-out',
              'group-hover:translate-y-0 group-hover:opacity-100 group-hover:duration-150 group-hover:delay-[80ms]',
              'group-focus-within:translate-y-0 group-focus-within:opacity-100 group-focus-within:duration-150',
            )}
          >
            Jump to present
          </span>
          <IconButton
            aria-label="Jump to present"
            onClick={handleJumpToPresent}
            className="size-8 rounded-full border border-border-default bg-bg-surface shadow-sm hover:bg-bg-subtle"
          >
            <ArrowDown aria-hidden="true" className="size-4" />
          </IconButton>
        </div>
      </div>

      <div ref={composerRef} className="shrink-0 p-3">
        <Composer
          value={value}
          onValueChange={onValueChange}
          onSubmit={handleSubmit}
          onStop={onStop ? handleStop : undefined}
          status={status}
          placeholder={placeholder}
          maxLength={maxLength}
        />
        {footnote ? (
          <Text as="span" tone="tertiary" size="caption" className="mt-2 block text-center">
            {footnote}
          </Text>
        ) : null}
      </div>

      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </p>
    </section>
  );
}
