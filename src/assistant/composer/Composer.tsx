import { useId, type FormEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton, Text, Textarea } from '@/primitives';
import type { AssistantStatus } from '../types';

export type ComposerProps = {
  value: string;
  onValueChange: (value: string) => void;
  /** Called with trimmed, non-empty text; never while streaming. */
  onSubmit: (value: string) => void;
  /** Omit to disable Stop while streaming. */
  onStop?: () => void;
  status?: AssistantStatus;
  placeholder?: string;
  /** Streaming alone does not disable the field. */
  disabled?: boolean;
  maxLength?: number;
  className?: string;
};

const FIELD_LABEL = 'Message the assistant';
const KEYBOARD_HINT = 'Enter to send · Shift + Enter for a new line';
const STREAMING_HINT = 'Wait or stop to send · Shift + Enter for a new line';
const ACTION_CLASSES =
  'size-8 shrink-0 rounded-full focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface dark:focus-visible:ring-offset-bg-subtle';

/** Controlled, auto-growing field: Enter sends, Shift + Enter adds a line, IME is preserved. */
export function Composer({
  value,
  onValueChange,
  onSubmit,
  onStop,
  status = 'idle',
  placeholder = 'Ask about this report…',
  disabled = false,
  maxLength,
  className,
}: ComposerProps) {
  const hintId = useId();
  const isStreaming = status === 'streaming';
  const canSubmit = !isStreaming && !disabled && value.trim().length > 0;

  function submit() {
    if (!canSubmit) return;
    onSubmit(value.trim());
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canSubmit) event.currentTarget.querySelector('textarea')?.focus({ preventScroll: true });
    submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey) return;
    if (event.nativeEvent.isComposing) return;
    event.preventDefault();
    submit();
  }

  function handleStop(event: MouseEvent<HTMLButtonElement>) {
    if (!isStreaming) return;

    // Stop can synchronously switch this button back to type="submit".
    event.preventDefault();
    event.currentTarget.form?.querySelector('textarea')?.focus({ preventScroll: true });
    onStop?.();
  }

  return (
    <form onSubmit={handleSubmit} className={cn('group/composer', className)}>
      <div
        className={cn(
          'relative rounded-[var(--radius-md)] border border-border-default bg-bg-surface dark:bg-bg-subtle',
          'shadow-[0_4px_12px] shadow-accent/10 dark:shadow-[0_4px_14px] dark:shadow-black/40',
          'transition-colors has-[textarea:focus-visible]:border-focus',
        )}
      >
        {/* Keep mirror and textarea sizing identical, including borders, for auto-growth. */}
        <div className="grid min-h-14 max-h-44">
          <span
            aria-hidden="true"
            className="invisible col-start-1 row-start-1 max-h-44 overflow-hidden whitespace-pre-wrap break-words border border-transparent px-3 py-3 pr-14 text-base"
          >
            {`${value} `}
          </span>
          {/* text-base, not the primitive's 14px: Safari on iPhone zooms into a focused field
              under 16px and does not zoom back out. The mirror above matches it for auto-growth. */}
          <Textarea
            rows={1}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label={FIELD_LABEL}
            aria-describedby={hintId}
            disabled={disabled}
            maxLength={maxLength}
            className="col-start-1 row-start-1 max-h-44 min-h-0 resize-none overflow-y-auto border-transparent bg-transparent py-3 pr-14 text-base placeholder:text-text-secondary focus-visible:ring-0"
          />
        </div>

        <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-250 ease-[var(--ease-smooth-out)] group-focus-within/composer:grid-rows-[1fr]">
          <div className="min-h-0 overflow-hidden opacity-0 transition-opacity duration-200 group-focus-within/composer:opacity-100">
            <Text as="span" tone="tertiary" size="label" id={hintId} className="block px-3 pb-3 pr-14">
              {isStreaming ? STREAMING_HINT : KEYBOARD_HINT}
            </Text>
          </div>
        </div>

        <IconButton
          type={isStreaming ? 'button' : 'submit'}
          aria-label={isStreaming ? 'Stop' : 'Send'}
          disabled={isStreaming ? !onStop : !canSubmit}
          onClick={handleStop}
          className={cn(
            ACTION_CLASSES,
            'absolute right-3 bottom-3',
            'transition-[background-color,color,box-shadow] duration-250 ease-[var(--ease-smooth-out)]',
            'bg-accent text-text-inverse hover:bg-accent-hover',
            !isStreaming && 'disabled:bg-bg-muted disabled:text-text-secondary disabled:opacity-100',
          )}
        >
          <span aria-hidden="true" className="t-icon-swap size-4 place-items-center" data-state={isStreaming ? 'b' : 'a'}>
            <ArrowUp className="t-icon size-4" data-icon="a" />
            <Square className="t-icon size-3.5 fill-current" data-icon="b" />
          </span>
        </IconButton>
      </div>
    </form>
  );
}
