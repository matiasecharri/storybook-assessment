import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useAutoScroll } from './useAutoScroll';

afterEach(() => vi.unstubAllGlobals());

it('honours reduced motion even for an explicit smooth jump and preference changes', () => {
  let reduced = false;
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: reduced })));
  function Thread() {
    const { ref, contentRef, scrollToBottom } = useAutoScroll<HTMLDivElement>();
    return <>
      <div ref={ref} data-testid="thread"><div ref={contentRef}>Sample answer</div></div>
      <button onClick={() => scrollToBottom('smooth')}>Jump</button>
    </>;
  }
  render(<Thread />);
  const scrollTo = vi.fn();
  Object.defineProperty(screen.getByTestId('thread'), 'scrollTo', { value: scrollTo });
  fireEvent.click(screen.getByRole('button', { name: 'Jump' }));
  expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'smooth' });
  reduced = true;
  fireEvent.click(screen.getByRole('button', { name: 'Jump' }));
  expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'instant' });
});

it('follows viewport and content resizing while preserving a reader who scrolled up', () => {
  let resize = () => {};
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) { resize = callback; }
    observe() {}
    disconnect() {}
  });

  function Thread() {
    const { ref, contentRef, onScroll, isPinned } = useAutoScroll<HTMLDivElement>();
    return <>
      <div ref={ref} onScroll={onScroll} data-testid="thread"><div ref={contentRef}>Sample answer</div></div>
      {!isPinned && <span>Jump to present</span>}
    </>;
  }

  render(<Thread />);
  const thread = screen.getByTestId('thread');
  let height = 400;
  let contentHeight = 1000;
  Object.defineProperties(thread, {
    clientHeight: { get: () => height },
    scrollHeight: { get: () => contentHeight },
    scrollTo: { value: ({ top }: ScrollToOptions) => { thread.scrollTop = Math.min(top ?? 0, contentHeight - height); } },
  });

  act(() => resize());
  expect(thread.scrollTop).toBe(600);
  height = 280; // Composer grows.
  act(() => resize());
  expect(thread.scrollTop).toBe(720);
  contentHeight = 1300; // A streamed answer wraps onto more lines.
  act(() => resize());
  expect(thread.scrollTop).toBe(1020);

  thread.scrollTop = 200;
  fireEvent.scroll(thread);
  height = 400;
  contentHeight = 1500;
  act(() => resize());
  expect(thread.scrollTop).toBe(200);
  expect(screen.getByText('Jump to present')).toBeInTheDocument();
});

it('settles a thread that opens with history without animating, then animates later jumps', () => {
  const behaviors: (ScrollBehavior | undefined)[] = [];
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
  let resize = () => {};
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) { resize = callback; }
    observe() {}
    disconnect() {}
  });

  function Thread() {
    const { ref, contentRef, onScroll } = useAutoScroll<HTMLDivElement>();
    return <div ref={ref} onScroll={onScroll}><div ref={contentRef}>Sample thread</div></div>;
  }

  // The sizes have to be in place before mount: the first settle happens in a layout effect.
  const proto = HTMLDivElement.prototype;
  Object.defineProperties(proto, {
    clientHeight: { configurable: true, get: () => 400 },
    scrollHeight: { configurable: true, get: () => 1400 },
    scrollTo: { configurable: true, value: ({ behavior }: ScrollToOptions) => behaviors.push(behavior) },
  });

  try {
    render(<Thread />);
    // A jump of 1000px would animate, but not on the first paint.
    expect(behaviors).toEqual(['instant']);
    act(() => resize());
    expect(behaviors[1]).toBe('smooth');
  } finally {
    for (const property of ['clientHeight', 'scrollHeight', 'scrollTo']) {
      Reflect.deleteProperty(proto, property);
    }
  }
});
