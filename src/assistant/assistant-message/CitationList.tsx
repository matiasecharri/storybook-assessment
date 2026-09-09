import { useEffect, useId, useRef, useState } from 'react';
import { FileText, ListTree, StickyNote, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Citation, CitationKind } from '../types';

export type CitationListProps = {
  citations: Citation[];
  /** Omit to render sources as non-interactive chips. */
  onCitationClick?: (citation: Citation) => void;
  /** Visible heading and accessible list name; defaults to the source count. */
  label?: string;
  className?: string;
};

const KIND_META: Record<CitationKind, { icon: LucideIcon; label: string }> = {
  document: { icon: FileText, label: 'Document' },
  section: { icon: ListTree, label: 'Report section' },
  note: { icon: StickyNote, label: 'Session note' },
};

const CHIP_CLASSES =
  'inline-flex min-h-6 max-w-[min(260px,100%)] items-center gap-1.5 rounded-full border border-border-subtle bg-bg-subtle py-1 px-1.5 text-caption text-text-primary';
const ICON_CLASSES = 'size-3 shrink-0 text-text-tertiary';
const FOCUS_CLASSES = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus';
// Estimated preview height, including its heading, excerpt and padding.
const PREVIEW_SPACE_PX = 148;

function accessibleNameFor(citation: Citation) {
  const kindLabel = KIND_META[citation.kind].label;
  const titleIncludesKind = citation.title.toLowerCase().includes(citation.kind);
  return titleIncludesKind ? citation.title : `${kindLabel}: ${citation.title}`;
}

/** Returns 0 for an initial preview, 1 for a later source, or -1 for an earlier source. */
function slideDirection(previousIndex: number, index: number) {
  if (previousIndex < 0) return 0;
  if (index > previousIndex) return 1;
  return -1;
}

/** Opens upward when space below is insufficient and the scroll container has more room above. */
function opensUpward(anchor: HTMLElement | null) {
  if (!anchor) return false;

  let scroller = anchor.parentElement;
  while (scroller) {
    const overflow = getComputedStyle(scroller).overflowY;
    if (overflow === 'auto' || overflow === 'scroll') break;
    scroller = scroller.parentElement;
  }

  const bounds = scroller
    ? scroller.getBoundingClientRect()
    : { top: 0, bottom: window.innerHeight };
  const rect = anchor.getBoundingClientRect();
  const below = bounds.bottom - rect.bottom;
  const above = rect.top - bounds.top;

  return below < PREVIEW_SPACE_PX && above > below;
}

/** Displays sources with excerpt previews on hover or focus when onCitationClick is provided. */
export function CitationList({
  citations,
  onCitationClick,
  label,
  className,
}: CitationListProps) {
  const baseId = useId();
  const anchorRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [upward, setUpward] = useState(false);
  const [direction, setDirection] = useState(0);
  const [previewHeight, setPreviewHeight] = useState(0);

  // Listen on document so Escape also dismisses a hover preview without focus.
  useEffect(() => {
    if (!previewing) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setPreviewing(null);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [previewing]);

  if (citations.length === 0) return null;

  const groupLabel = label ?? `${citations.length} ${citations.length === 1 ? 'source' : 'sources'}`;
  const preview = citations.find((citation) => citation.id === previewing && citation.excerpt);
  const PreviewIcon = preview ? KIND_META[preview.kind].icon : null;

  function revealPreview(citation: Citation, index: number) {
    if (!citation.excerpt) {
      setPreviewing(null);
      return;
    }
    if (previewing === citation.id) return;

    const previousIndex = citations.findIndex((source) => source.id === previewing);
    setDirection(slideDirection(previousIndex, index));
    setPreviewHeight(previewRef.current?.offsetHeight ?? 0);
    if (!previewRef.current) setUpward(opensUpward(anchorRef.current));
    setPreviewing(citation.id);
  }

  return (
    <div className={cn('mt-2.5', className)}>
      <p className="mb-1.5 text-caption font-semibold text-text-tertiary">{groupLabel}</p>

      {/* A shared hover region lets the pointer move from a chip onto its preview. */}
      <div
        ref={anchorRef}
        className="relative"
        onMouseLeave={() => setPreviewing(null)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setPreviewing(null);
        }}
      >
        <ul
          aria-label={groupLabel}
          className="flex flex-wrap gap-1.5"
        >
          {citations.map((citation, index) => {
            const { icon: Icon } = KIND_META[citation.kind];
            const name = accessibleNameFor(citation);
            const excerptId = `${baseId}-${citation.id}`;

            return (
              <li
                key={citation.id}
                className="min-w-0 max-w-full animate-[assistant-surface-in_250ms_ease-out_backwards] [--surface-enter-y:0px] focus-within:animate-none motion-reduce:animate-none"
                style={{ animationDelay: `${Math.min(index * 30, 150)}ms` }}
              >
                {onCitationClick ? (
                  <button
                    type="button"
                    onClick={() => onCitationClick(citation)}
                    onMouseEnter={() => revealPreview(citation, index)}
                    onFocus={() => revealPreview(citation, index)}
                    aria-label={name}
                    aria-describedby={citation.excerpt ? excerptId : undefined}
                    className={cn(
                      CHIP_CLASSES,
                      'transition-colors hover:border-border-default hover:bg-bg-muted',
                      FOCUS_CLASSES,
                    )}
                  >
                    <Icon aria-hidden="true" className={ICON_CLASSES} />
                    <span className="truncate">{citation.title}</span>
                  </button>
                ) : (
                  <span className={CHIP_CLASSES}>
                    <span className="sr-only">{name}</span>
                    <Icon aria-hidden="true" className={ICON_CLASSES} />
                    <span aria-hidden="true" className="truncate">
                      {citation.title}
                    </span>
                  </span>
                )}
                {/* Keep excerpts accessible when previews are closed; the visual copy is aria-hidden. */}
                {citation.excerpt ? (
                  <span id={excerptId} className="sr-only">
                    {citation.excerpt}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>

        {preview ? (
          <div
            ref={previewRef}
            aria-hidden="true"
            style={{ minHeight: previewHeight || undefined }}
            data-placement={upward ? 'above' : 'below'}
            className={cn(
              'assistant-surface-in absolute inset-x-0 z-10 overflow-hidden rounded-[var(--radius-md)]',
              'border border-border-default bg-bg-surface p-2.5 shadow-md',
              upward ? 'bottom-full mb-1.5' : 'top-full mt-1.5 [--surface-enter-y:-4px]',
            )}
          >
            <div
              key={preview.id}
              className={cn(
                direction !== 0 && 'assistant-source-swap',
                direction < 0 && '[--source-enter-x:-6px]',
              )}
            >
              <p className="flex items-center gap-1 text-caption font-semibold text-text-tertiary">
                {PreviewIcon ? <PreviewIcon aria-hidden="true" className="size-3 shrink-0" /> : null}
                {KIND_META[preview.kind].label}
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-text-primary">
                {preview.title}
              </p>
              <p className="mt-1 line-clamp-4 text-xs leading-5 text-text-secondary">
                {preview.excerpt}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
