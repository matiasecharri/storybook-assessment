import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown, RotateCcw, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button, Text } from '@/primitives';
import type { Citation, Density, Message } from '../types';
import { CitationList } from './CitationList';
import { PsynthMark } from './PsynthMark';

export type AssistantMessageProps = {
  message: Message;
  /** Omit to hide retry on failed assistant turns. */
  onRetry?: (messageId: string) => void;
  /** Keeps retry visible but disabled while another turn is in flight. */
  retryDisabled?: boolean;
  /** Omit to render sources as non-interactive chips. */
  onCitationClick?: (citation: Citation) => void;
  density?: Density;
  className?: string;
};

// Eight lines at the body line-height of 28px.
const COLLAPSED_HEIGHT_PX = 224;
const WAITING_WORDS = ['Thinking', 'Reading the report', 'Checking sources', 'Drafting'] as const;
const WORD_HOLD_MS = 1000;
// Keep in sync with the .psynth-word-out duration.
const WORD_LEAVE_MS = 220;

/** Renders a user or assistant turn, including streaming, sources and retry states. */
export function AssistantMessage({
  message,
  onRetry,
  retryDisabled = false,
  onCitationClick,
  density = 'comfortable',
  className,
}: AssistantMessageProps) {
  const isUser = message.role === 'user';

  return (
    <article
      aria-label={isUser ? 'User message' : 'Assistant message'}
      aria-busy={message.status === 'streaming' || undefined}
      data-role={message.role}
      data-status={message.status ?? 'done'}
      className={cn(
        'flex flex-col',
        density === 'compact' ? 'gap-1' : 'gap-1.5',
        isUser ? 'items-end' : 'items-start',
        className,
      )}
    >
      <TurnBody
        message={message}
        onRetry={onRetry}
        retryDisabled={retryDisabled}
        onCitationClick={onCitationClick}
      />
    </article>
  );
}

function TurnBody({
  message,
  onRetry,
  retryDisabled,
  onCitationClick,
}: Pick<AssistantMessageProps, 'message' | 'onRetry' | 'retryDisabled' | 'onCitationClick'>) {
  if (message.role === 'user') return <UserBubble content={message.content} />;

  if (message.status === 'error') {
    return <FailedTurn message={message} onRetry={onRetry} retryDisabled={retryDisabled} />;
  }

  const isStreaming = message.status === 'streaming';
  if (isStreaming && message.content.length === 0) return <ThinkingIndicator />;

  return (
    <div className="w-full min-w-0">
      <Text size="body" className="whitespace-pre-wrap break-words">
        <ResponseText key={message.id} content={message.content} streaming={isStreaming} />
      </Text>
      {message.citations?.length ? (
        <CitationList citations={message.citations} onCitationClick={onCitationClick} />
      ) : null}
    </div>
  );
}

/** Animates new streaming fragments without delaying received text. */
function ResponseText({ content, streaming }: { content: string; streaming: boolean }) {
  const [arrival, setArrival] = useState({ content, chunks: [content], animate: streaming });

  if (arrival.content !== content) {
    setArrival({
      content,
      chunks: content.startsWith(arrival.content)
        ? [...arrival.chunks, content.slice(arrival.content.length)]
        : [content],
      animate: streaming || arrival.animate,
    });
  }

  return (
    <>
      {arrival.chunks.map((chunk, index) =>
        arrival.animate ? (
          <ResponseChunk key={`${index}:${chunk}`} chunk={chunk} />
        ) : (
          <span key={index}>{chunk}</span>
        ),
      )}
    </>
  );
}

/** Measures each incoming chunk once; settled text wraps naturally on resize. */
function ResponseChunk({ chunk }: { chunk: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [lines, setLines] = useState([chunk]);

  useLayoutEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const node = ref.current?.firstChild?.firstChild;
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    const range = document.createRange();
    if (typeof range.getBoundingClientRect !== 'function') return;

    const measuredLines: string[] = [];
    let lineStart = 0;
    let offset = 0;
    let previousTop: number | undefined;

    for (const character of chunk) {
      range.setStart(node, offset);
      range.setEnd(node, offset + character.length);
      const { top } = range.getBoundingClientRect();
      if (previousTop !== undefined && Math.abs(top - previousTop) > 1) {
        measuredLines.push(chunk.slice(lineStart, offset));
        lineStart = offset;
      }
      previousTop = top;
      offset += character.length;
    }
    measuredLines.push(chunk.slice(lineStart));
    if (measuredLines.length > 1) setLines(measuredLines);
  }, [chunk]);

  return (
    <span ref={ref}>
      {lines.map((line, index) => (
        <span
          key={index}
          className="relative animate-[psynth-chunk-in_320ms_var(--ease-smooth-out)_both] motion-reduce:animate-none"
          style={{ animationDelay: `${Math.min(index * 50, 150)}ms` }}
        >
          {line}
        </span>
      ))}
    </span>
  );
}

/** Visually clamps long questions while preserving the full text for screen readers. */
function UserBubble({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const [fullHeight, setFullHeight] = useState(0);
  const textRef = useRef<HTMLDivElement>(null);
  const textId = useId();
  const clampedHeight = expanded ? fullHeight : COLLAPSED_HEIGHT_PX;

  useLayoutEffect(() => {
    const element = textRef.current;
    if (!element) return;

    const measure = () => {
      setFullHeight(element.scrollHeight);
      // Preserve the overflow flag while expanded so Show less remains available.
      if (!expanded) setOverflows(element.scrollHeight > COLLAPSED_HEIGHT_PX + 1);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [content, expanded]);

  return (
    <div
      className={cn(
        'max-w-[85%] rounded-[var(--radius-md)] rounded-tr-[var(--radius-sm)]',
        'border border-border-subtle bg-bg-subtle px-3 py-2',
      )}
    >
      <div className="relative">
        <div
          id={textId}
          ref={textRef}
          style={overflows ? { maxHeight: clampedHeight } : undefined}
          className="overflow-hidden transition-[max-height] duration-300 ease-out"
        >
          <Text size="body" className="whitespace-pre-wrap break-words">
            {content}
          </Text>
        </div>
        {overflows ? (
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-x-0 bottom-0 h-12',
              'bg-gradient-to-t from-bg-subtle to-transparent',
              'transition-opacity duration-200 ease-out',
              expanded && 'opacity-0',
            )}
          />
        ) : null}
      </div>

      {overflows ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={textId}
          onClick={() => setExpanded((open) => !open)}
          className={cn(
            'mt-1 inline-flex min-h-6 items-center gap-1 rounded-[var(--radius-sm)] py-1',
            'text-xs font-semibold text-text-secondary hover:text-text-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
          )}
        >
          {expanded ? 'Show less' : 'Show more'}
          <ChevronDown
            aria-hidden="true"
            className={cn('size-3.5 transition-transform duration-300 ease-out', expanded && 'rotate-180')}
          />
        </button>
      ) : null}
    </div>
  );
}

function ThinkingIndicator() {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = setTimeout(() => setLeaving(true), WORD_HOLD_MS);
    const swapTimer = setTimeout(() => {
      setIndex((current) => (current + 1) % WAITING_WORDS.length);
      setLeaving(false);
    }, WORD_HOLD_MS + WORD_LEAVE_MS);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(swapTimer);
    };
  }, [index]);

  return (
    <p className="flex items-center gap-2">
      {/* Keep the accessible label stable while the visible words rotate. */}
      <span className="sr-only">Working on a response.</span>
      <PsynthMark animated className="size-5 shrink-0 text-accent" />
      <span
        key={index}
        aria-hidden="true"
        className={cn(
          'text-sm text-text-tertiary',
          leaving ? 'psynth-word-out' : 'psynth-word-in',
        )}
      >
        {WAITING_WORDS[index]}
      </span>
    </p>
  );
}

function FailedTurn({
  message,
  onRetry,
  retryDisabled,
}: Pick<AssistantMessageProps, 'message' | 'onRetry' | 'retryDisabled'>) {
  return (
    <div className="w-full rounded-[var(--radius-md)] border border-danger bg-danger-surface p-3">
      <div className="flex items-center gap-2">
        <TriangleAlert aria-hidden="true" className="size-4 shrink-0 text-danger" />
        <Text size="body" className="min-w-0 flex-1">
          {message.content || 'The assistant could not finish this turn.'}
        </Text>
        {onRetry ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onRetry(message.id)}
            disabled={retryDisabled}
            className="shrink-0 border-border-default bg-bg-surface text-text-primary hover:bg-bg-subtle focus-visible:ring-offset-0"
          >
            <RotateCcw aria-hidden="true" className="size-3.5" />
            Retry
          </Button>
        ) : null}
      </div>
    </div>
  );
}
