import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type FakeStreamStatus = 'idle' | 'streaming' | 'done';

export type UseFakeStreamOptions = {
  text: string;
  intervalMs?: number;
  /** Words per batch; omit to emit one Unicode code point per tick. */
  wordsPerChunk?: number;
};

export function useFakeStream({ text, intervalMs = 30, wordsPerChunk }: UseFakeStreamOptions) {
  const units = useMemo(
    () => (
      wordsPerChunk === undefined ? Array.from(text) : text.match(/\S+\s*|\s+/gu) ?? []
    ),
    [text, wordsPerChunk],
  );
  const chunkSize = wordsPerChunk === undefined || !Number.isFinite(wordsPerChunk)
    ? 1
    : Math.max(1, Math.floor(wordsPerChunk));
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<FakeStreamStatus>('idle');
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearTimer();
    setStatus((current) => (current === 'streaming' ? 'done' : current));
  }, [clearTimer]);

  const start = useCallback(() => {
    clearTimer();
    indexRef.current = 0;
    setContent('');
    setStatus('streaming');
    timerRef.current = setInterval(() => {
      indexRef.current += chunkSize;
      const next = units.slice(0, indexRef.current).join('');
      setContent(next);
      if (indexRef.current >= units.length) {
        clearTimer();
        setStatus('done');
      }
    }, intervalMs);
  }, [chunkSize, clearTimer, intervalMs, units]);

  useEffect(() => clearTimer, [clearTimer]);

  return { content, status, start, stop };
}
