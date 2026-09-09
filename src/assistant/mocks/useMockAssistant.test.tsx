import { StrictMode } from 'react';
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { errorMessage, sampleMessages, sampleSuggestions } from '@/fixtures';
import { MockAssistantPanel } from './MockAssistantPanel';
import { MOCK_ANSWER, useMockAssistant } from './useMockAssistant';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('the story controller', () => {
  it('protects an active answer and retries an older failure in place', async () => {
    const { result } = renderHook(() => useMockAssistant({
      initialMessages: [sampleMessages[0], errorMessage],
      intervalMs: 100,
      thinkingMs: 0,
    }));

    act(() => {
      result.current.onSubmit('Sample follow-up');
      result.current.onSubmit('A second submit in the same event');
      result.current.onRetry(errorMessage.id);
    });
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    const activeAnswer = result.current.messages.at(-1)!;
    expect(result.current.messages).toHaveLength(4);
    expect(activeAnswer.content).toBe('Sustained attention shows up in two places in this sample battery: the ');
    expect(activeAnswer.status).toBe('streaming');

    act(() => result.current.onRetry(errorMessage.id));
    expect(result.current.messages.at(-1)).toEqual(activeAnswer);
    expect(result.current.messages[1]).toEqual(errorMessage);
    await act(async () => { await vi.runAllTimersAsync(); });
    const ids = result.current.messages.map(message => message.id);
    const laterAnswer = result.current.messages.at(-1);

    act(() => result.current.onRetry(errorMessage.id));
    expect(result.current.messages.map(message => message.id)).toEqual(ids);
    expect(result.current.messages[1].status).toBe('streaming');
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    act(() => result.current.onStop());
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(result.current.messages[1]).toMatchObject({
      id: errorMessage.id, status: 'done', content: activeAnswer.content.trim(),
    });
    expect(result.current.messages.at(-1)).toEqual(laterAnswer);
    expect(result.current.messages.map(message => message.id)).toEqual(ids);
  });

  it('preserves a failed turn when stopped before its first token and can retry it again', async () => {
    const { result } = renderHook(() => useMockAssistant({ initialMessages: [errorMessage], thinkingMs: 0 }));
    act(() => result.current.onRetry('missing-message'));
    expect(result.current.messages).toEqual([errorMessage]);
    act(() => result.current.onRetry(errorMessage.id));
    act(() => result.current.onStop());
    expect(result.current.messages).toEqual([errorMessage]);

    act(() => result.current.onRetry(errorMessage.id));
    await act(async () => { await vi.runAllTimersAsync(); });
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toMatchObject({ id: errorMessage.id, content: MOCK_ANSWER, status: 'done' });
  });

  it('starts and completes exactly one automatic turn in StrictMode', async () => {
    const { result } = renderHook(() => useMockAssistant({
      initialMessages: [sampleMessages[0]], autoStart: true, intervalMs: 1, thinkingMs: 0,
    }), { wrapper: StrictMode });
    await act(async () => { await vi.runAllTimersAsync(); });
    expect(result.current.status).toBe('idle');
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].content).toBe(MOCK_ANSWER);
  });

  it('composes before it answers, and stopping mid-thought abandons the turn', async () => {
    const { result } = renderHook(() => useMockAssistant({ intervalMs: 5, thinkingMs: 1500 }));

    act(() => result.current.onSubmit('Sample question'));

    await act(async () => { await vi.advanceTimersByTimeAsync(900); });
    expect(result.current.status).toBe('streaming');
    expect(result.current.messages.at(-1)).toMatchObject({ role: 'assistant', content: '', status: 'streaming' });

    act(() => result.current.onStop());
    expect(result.current.status).toBe('idle');
    expect(result.current.messages.map(message => message.role)).toEqual(['user']);

    await act(async () => { await vi.runAllTimersAsync(); });
    expect(result.current.messages.map(message => message.role)).toEqual(['user']);
  });

  it('does not show the previous answer while the next one is still composing', async () => {
    const { result } = renderHook(() => useMockAssistant({ intervalMs: 1, thinkingMs: 1000 }));

    act(() => result.current.onSubmit('First question'));
    await act(async () => { await vi.runAllTimersAsync(); });
    expect(result.current.messages.at(-1)!.content).toBe(MOCK_ANSWER);

    act(() => result.current.onSubmit('Second question'));
    expect(result.current.messages.at(-1)).toMatchObject({
      role: 'assistant', content: '', status: 'streaming',
    });

    await act(async () => { await vi.advanceTimersByTimeAsync(900); });
    expect(result.current.messages.at(-1)!.content).toBe('');

    await act(async () => { await vi.runAllTimersAsync(); });
    expect(result.current.messages.at(-1)!.content).toBe(MOCK_ANSWER);
  });

  it.each(['failed', 'empty'] as const)('keeps keyboard focus after submitting from %s', async thread => {
    vi.useRealTimers();
    const user = userEvent.setup();
    render(<MockAssistantPanel thread={thread} suggestions={sampleSuggestions} />);
    const trigger = screen.getByRole('button', {
      name: thread === 'failed' ? 'Retry' : sampleSuggestions[0],
    });
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(trigger).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Stop' })).toBeEnabled();
  });
});
