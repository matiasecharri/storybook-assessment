import { useCallback, useLayoutEffect, useRef, useState } from 'react';

const PIN_THRESHOLD_PX = 200;

/** Follows resizing while near the bottom; scrollToBottom resumes following and respects reduced motion. */
export function useAutoScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isPinnedRef = useRef(true);
  const hasSettledRef = useRef(false);
  const [isPinned, setIsPinned] = useState(true);

  const scrollToBottom = useCallback((behavior?: ScrollBehavior) => {
    const element = ref.current;
    if (!element) return;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    element.scrollTo?.({ top: element.scrollHeight, behavior: reduceMotion ? 'instant' : behavior });
    isPinnedRef.current = true;
    setIsPinned(true);
  }, []);

  const onScroll = useCallback(() => {
    const element = ref.current;
    if (!element) return;

    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    const pinned = distanceFromBottom <= PIN_THRESHOLD_PX;
    isPinnedRef.current = pinned;
    setIsPinned(pinned);
  }, []);

  useLayoutEffect(() => {
    const element = ref.current;
    const content = contentRef.current;
    if (!element || !content) return;

    const followSize = () => {
      if (!isPinnedRef.current) {
        onScroll();
        return;
      }
      // Scroll small streaming updates instantly to avoid jitter; animate larger jumps.
      // The first settle is never animated: a thread that opens with history is still measuring
      // itself — the long-question clamp shrinks it — and an animation racing that lands short of
      // the latest turn and leaves the reader at the top of the conversation.
      const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
      const isLargeJump = distanceFromBottom > element.clientHeight / 2;
      scrollToBottom(hasSettledRef.current && isLargeJump ? 'smooth' : 'instant');
      hasSettledRef.current = true;
    };
    followSize();
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(followSize);
    observer.observe(element);
    observer.observe(content);
    return () => observer.disconnect();
  }, [onScroll, scrollToBottom]);

  return { ref, contentRef, isPinned, scrollToBottom, onScroll };
}
