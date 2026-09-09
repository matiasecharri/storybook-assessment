import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useFakeStream } from './useFakeStream';

afterEach(() => {
  vi.useRealTimers();
});

describe('useFakeStream', () => {
  it('delivers whole-word batches, preserves whitespace, and restarts after stopping', async () => {
    vi.useFakeTimers();
    const text = '  First sample\n\nsecond\tpart, last 👋';
    const { result } = renderHook(() => useFakeStream({ text, intervalMs: 240, wordsPerChunk: 3 }));
    act(() => result.current.start());
    await act(async () => { await vi.advanceTimersByTimeAsync(240); });
    expect(result.current.content).toBe('  First sample\n\n');
    expect(result.current.status).toBe('streaming');

    act(() => result.current.stop());
    await act(async () => { await vi.runAllTimersAsync(); });
    expect(result.current.content).toBe('  First sample\n\n');

    act(() => result.current.start());
    await act(async () => { await vi.runAllTimersAsync(); });
    expect(result.current.content).toBe(text);
    expect(result.current.status).toBe('done');
  });

  it('moves to streaming then done and concatenates tokens', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useFakeStream({ text: 'Hi', intervalMs: 10 }));

    expect(result.current.status).toBe('idle');
    expect(result.current.content).toBe('');

    act(() => {
      result.current.start();
    });
    expect(result.current.status).toBe('streaming');

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.status).toBe('done');
    expect(result.current.content).toBe('Hi');
  });

  it('stop freezes content', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useFakeStream({ text: 'Hello world', intervalMs: 10 }),
    );

    act(() => {
      result.current.start();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30);
    });

    const frozen = result.current.content;
    expect(frozen.length).toBeGreaterThan(0);
    expect(frozen.length).toBeLessThan('Hello world'.length);

    act(() => {
      result.current.stop();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    expect(result.current.content).toBe(frozen);
  });
});
