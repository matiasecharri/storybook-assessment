import { useState } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { denseThread, errorMessage, sampleMessages, sampleSuggestions } from '@/fixtures';
import { AssistantPanel, type AssistantPanelProps } from './AssistantPanel';

function ControlledPanel({ messages = [], ...props }: Partial<AssistantPanelProps>) {
  const [value, setValue] = useState('');
  return (
    <AssistantPanel
      messages={messages}
      value={value}
      onValueChange={setValue}
      onSubmit={props.onSubmit ?? (() => {})}
      suggestions={sampleSuggestions}
      {...props}
    />
  );
}

const FIELD = { name: 'Message the assistant' };

describe('AssistantPanel', () => {
  it('animates new user bubbles without replaying the initial history', () => {
    const existing = { id: 'existing', role: 'user' as const, content: 'Previous question' };
    const sent = { id: 'sent', role: 'user' as const, content: 'New question' };
    const { rerender } = render(<ControlledPanel messages={[existing]} />);
    expect(screen.getByRole('article', { name: 'User message' }).className).not.toContain('animate-[');

    rerender(<ControlledPanel messages={[existing, sent]} />);
    const bubbles = screen.getAllByRole('article', { name: 'User message' });
    expect(bubbles[0].className).not.toContain('animate-[');
    expect(bubbles[1].className).toContain('assistant-surface-in_180ms');
    expect(bubbles[1].className).toContain('motion-reduce:animate-none');

    rerender(<ControlledPanel messages={[existing, sent]} status="streaming" />);
    expect(screen.getAllByRole('article', { name: 'User message' })[1]).toBe(bubbles[1]);
  });

  it('offers suggested prompts only while the thread is empty, and submits the chosen one', async () => {
    const user = userEvent.setup();
    const onSuggestionSelect = vi.fn();
    const { rerender } = render(<ControlledPanel onSuggestionSelect={onSuggestionSelect} />);

    await user.click(screen.getByRole('button', { name: sampleSuggestions[0] }));
    expect(onSuggestionSelect).toHaveBeenCalledExactlyOnceWith(sampleSuggestions[0]);
    expect(screen.getByRole('textbox', FIELD)).toHaveFocus();

    rerender(<ControlledPanel messages={sampleMessages} onSuggestionSelect={onSuggestionSelect} />);
    expect(screen.queryByRole('list', { name: 'Suggested prompts' })).not.toBeInTheDocument();
  });

  it('retries the failed turn from inside the thread and keeps the composer usable', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <ControlledPanel messages={[sampleMessages[0], errorMessage]} status="error" onRetry={onRetry} />,
    );

    await user.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledExactlyOnceWith(errorMessage.id);
    expect(screen.getByRole('textbox', FIELD)).toHaveFocus();

    const field = screen.getByRole('textbox', FIELD);
    expect(field).toBeEnabled();
    await user.type(field, 'Try the impression instead');
    expect(screen.getByRole('button', { name: /send/i })).toBeEnabled();
  });

  it('swaps send for stop while streaming and refuses to start a second turn', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onStop = vi.fn();
    const onRetry = vi.fn();
    render(
      <ControlledPanel
        messages={[
          sampleMessages[0],
          errorMessage,
          { id: 'msg-3', role: 'assistant', content: 'Working', status: 'streaming' },
        ]}
        status="streaming"
        onSubmit={onSubmit}
        onStop={onStop}
        onRetry={onRetry}
      />,
    );

    await user.type(screen.getByRole('textbox', FIELD), 'next question{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
    const retry = screen.getByRole('button', { name: /retry/i });
    expect(retry).toBeDisabled();
    await user.click(retry);
    expect(onRetry).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /stop/i }));
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('keeps every turn in one scrollable log, with both roles distinguishable', () => {
    render(<ControlledPanel messages={denseThread} density="compact" />);

    const log = screen.getByRole('log', { name: 'Conversation' });
    expect(log).toHaveAttribute('tabindex', '0');
    expect(within(log).getAllByRole('article')).toHaveLength(denseThread.length);
    expect(within(log).getAllByRole('article', { name: 'User message' })).toHaveLength(5);
    expect(within(log).getAllByRole('article', { name: 'Assistant message' })).toHaveLength(5);
  });

  describe('the live region announces the turn, not the stream', () => {
    const streamingThread = [
      sampleMessages[0],
      { id: 'msg-3', role: 'assistant' as const, content: 'Working', status: 'streaming' as const },
    ];

    it('keeps the log silent and announces that a turn is arriving', () => {
      render(<ControlledPanel messages={streamingThread} status="streaming" />);

      expect(screen.getByRole('log', { name: 'Conversation' })).toHaveAttribute('aria-live', 'off');

      const region = screen.getByRole('status');
      expect(region).toHaveAttribute('aria-atomic', 'true');
      expect(region).toHaveTextContent('Assistant is responding.');
    });

    it('reports a finished turn', () => {
      const { rerender } = render(
        <ControlledPanel messages={streamingThread} status="streaming" />,
      );

      rerender(<ControlledPanel messages={sampleMessages} status="idle" />);

      expect(screen.getByRole('status')).toHaveTextContent('Assistant response complete.');
    });

    it('tells a stopped turn apart from a finished one', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <ControlledPanel messages={streamingThread} status="streaming" onStop={vi.fn()} />,
      );

      await user.click(screen.getByRole('button', { name: /stop/i }));
      rerender(<ControlledPanel messages={sampleMessages} status="idle" onStop={vi.fn()} />);

      expect(screen.getByRole('status')).toHaveTextContent('Response stopped.');
    });

    it('reports a failed turn and points at the way out', () => {
      render(
        <ControlledPanel messages={[sampleMessages[0], errorMessage]} status="error" onRetry={vi.fn()} />,
      );

      expect(screen.getByRole('status')).toHaveTextContent(
        'Assistant response failed. Retry is available.',
      );
    });

    it('does not promise retry without a handler and a failed turn', () => {
      const { rerender } = render(
        <ControlledPanel messages={[errorMessage]} status="error" />,
      );
      expect(screen.getByRole('status')).toHaveTextContent(/^Assistant response failed\.$/);
      rerender(<ControlledPanel messages={[]} status="error" onRetry={vi.fn()} />);
      expect(screen.getByRole('status')).toHaveTextContent(/^Assistant response failed\.$/);
    });

    it('says nothing on first paint', () => {
      render(<ControlledPanel messages={sampleMessages} status="idle" />);

      expect(screen.getByRole('status')).toBeEmptyDOMElement();
    });
  });
});

/** Supplies scroll geometry missing from jsdom and records scroll destinations. */
function measurable(element: HTMLElement, viewport: number, content: number) {
  const tops: number[] = [];
  Object.defineProperties(element, {
    clientHeight: { get: () => viewport, configurable: true },
    scrollHeight: { get: () => content, configurable: true },
    scrollTo: {
      value: ({ top }: ScrollToOptions) => {
        element.scrollTop = Math.min(top ?? 0, content - viewport);
        tops.push(element.scrollTop);
      },
      configurable: true,
    },
  });
  return tops;
}

describe('reading position', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('re-pins the thread when the reader sends, even after scrolling up', async () => {
    let resize = () => {};
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: () => void) { resize = callback; }
      observe() {}
      disconnect() {}
    });
    const user = userEvent.setup();

    render(<ControlledPanel messages={denseThread} />);
    const log = screen.getByRole('log', { name: 'Conversation' });
    const tops = measurable(log, 400, 1400);

    log.scrollTop = 0;
    fireEvent.scroll(log);
    expect(screen.getByRole('button', { name: 'Jump to present' })).toBeInTheDocument();

    tops.length = 0;
    await user.type(screen.getByRole('textbox', FIELD), 'Otra pregunta{Enter}');

    expect(tops.at(-1)).toBe(1000);
    expect(screen.queryByRole('button', { name: 'Jump to present' })).not.toBeInTheDocument();

    act(() => resize());
    expect(log.scrollTop).toBe(1000);
  });
});
