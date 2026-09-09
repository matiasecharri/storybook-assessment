import { Sparkles } from 'lucide-react';
import { Button, Heading } from '@/primitives';
import { cn } from '@/lib/cn';

export type SuggestionChipsProps = {
  suggestions: readonly string[];
  /** Receives the selected prompt for submission. Omit to disable suggestions. */
  onSelect?: (prompt: string) => void;
  /** Visible heading and accessible list name. */
  label?: string;
  disabled?: boolean;
  className?: string;
};

export function SuggestionChips({
  suggestions,
  onSelect,
  label = 'Suggested prompts',
  disabled = false,
  className,
}: SuggestionChipsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Heading as="h3" className="text-caption normal-case tracking-normal text-text-tertiary">
        {label}
      </Heading>
      <ul aria-label={label} className="flex flex-col gap-2">
        {suggestions.map((prompt, index) => (
          <li
            key={prompt}
            className="animate-[assistant-surface-in_200ms_var(--ease-smooth-out)_backwards] focus-within:animate-none motion-reduce:animate-none"
            style={{ animationDelay: `${Math.min(index * 35, 120)}ms` }}
          >
            <Button
              variant="ghost"
              disabled={disabled || !onSelect}
              onClick={() => onSelect?.(prompt)}
              className={cn(
                'flex h-auto w-full items-start justify-start text-left font-normal',
                'border border-border-subtle bg-bg-surface hover:border-border-default',
                'focus-visible:ring-offset-0',
              )}
            >
              <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent" />
              <span className="min-w-0 flex-1 leading-5">{prompt}</span>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
