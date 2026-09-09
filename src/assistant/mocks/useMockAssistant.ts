import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sampleCitations, useFakeStream } from '@/fixtures';
import type { AssistantStatus, Citation, Message } from '../types';

export const MOCK_ANSWER =
  'Sustained attention shows up in two places in this sample battery: the continuous performance omission score and working memory. Digit span sits below the rest of the profile, which is why the impression leans on the CPT rather than on a single index. This is sample text, not a clinical opinion.';

// The third sample citation has no excerpt to exercise the non-preview state.
export const SOURCE_EXCERPTS: Record<string, string> = {
  'cit-doc-1':
    'Referral asks for clarification of attention difficulties reported at school and at home over the past year. Sample text.',
  'cit-sec-1':
    'CPT omission errors fell in the low range; digit span sat below the rest of the battery. Sample scores, not a clinical opinion.',
};

export const sourcedCitations: Citation[] = sampleCitations.map((citation) => ({
  ...citation,
  excerpt: SOURCE_EXCERPTS[citation.id],
}));

export type UseMockAssistantOptions = {
  initialMessages?: Message[];
  initialStatus?: AssistantStatus;
  /** Attached to the reply once it settles. */
  answerCitations?: Citation[];
  /** Milliseconds between batches of up to 12 words. */
  intervalMs?: number;
  /** Delay in milliseconds before streaming starts. */
  thinkingMs?: number;
  autoStart?: boolean;
};

export type MockAssistant = {
  messages: Message[];
  status: AssistantStatus;
  value: string;
  lastCitation: Citation | null;
  onValueChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onStop: () => void;
  onRetry: (messageId: string) => void;
  onSuggestionSelect: (prompt: string) => void;
  onCitationClick: (citation: Citation) => void;
};

/** Story controller with simulated waiting, streaming, stop and retry behavior. */
export function useMockAssistant({
  initialMessages = [],
  initialStatus = 'idle',
  answerCitations,
  intervalMs = 240,
  thinkingMs = 1500,
  autoStart = false,
}: UseMockAssistantOptions = {}): MockAssistant {
  const [committed, setCommitted] = useState<Message[]>(initialMessages);
  const [status, setStatus] = useState<AssistantStatus>(initialStatus);
  const [value, setValue] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [lastCitation, setLastCitation] = useState<Citation | null>(null);
  // Hide the previous stream content until start() clears it for the new turn.
  const [composing, setComposing] = useState(false);

  const turnCount = useRef(0);
  const turnInFlight = useRef(false);
  const startedTurn = useRef<string | null>(null);
  const thinkingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track start() directly: React may batch streaming and completion into one render.
  const streamingTurn = useRef<string | null>(null);

  const { content, status: streamStatus, start, stop } = useFakeStream({
    text: MOCK_ANSWER,
    intervalMs,
    wordsPerChunk: 12,
  });

  const contentRef = useRef(content);
  contentRef.current = content;

  /** Cancels a pending wait and resets its start guard for retries and StrictMode remounts. */
  const cancelWait = useCallback(() => {
    if (thinkingTimer.current === null) return false;
    clearTimeout(thinkingTimer.current);
    thinkingTimer.current = null;
    startedTurn.current = null;
    return true;
  }, []);

  const beginTurn = useCallback((messageId?: string) => {
    if (turnInFlight.current) return false;
    turnInFlight.current = true;
    turnCount.current += 1;
    startedTurn.current = null;
    setPendingId(messageId ?? `mock-answer-${turnCount.current}`);
    setComposing(true);
    setStatus('streaming');
    return true;
  }, []);

  useEffect(() => {
    if (!pendingId || startedTurn.current === pendingId) return;
    startedTurn.current = pendingId;
    thinkingTimer.current = setTimeout(() => {
      thinkingTimer.current = null;
      streamingTurn.current = pendingId;
      setComposing(false);
      start();
    }, thinkingMs);
    return () => {
      cancelWait();
    };
  }, [cancelWait, pendingId, start, thinkingMs]);

  /** Cancels a waiting turn, or keeps partial text if streaming has started. */
  const onStop = useCallback(() => {
    if (!cancelWait()) {
      stop();
      return;
    }
    turnInFlight.current = false;
    setPendingId(null);
    setComposing(false);
    setStatus('idle');
  }, [cancelWait, stop]);

  useEffect(() => {
    if (!pendingId) return;

    // Ignore the previous stream's done state until this turn has started.
    if (streamStatus !== 'done' || streamingTurn.current !== pendingId) return;
    streamingTurn.current = null;
    turnInFlight.current = false;
    setComposing(false);

    const text = contentRef.current.trim();
    setPendingId(null);
    setStatus('idle');
    if (!text) return; // Stopped before the first token: leave no empty turn behind.

    setCommitted((current) => {
      const answer: Message = {
        id: pendingId,
        role: 'assistant',
        content: text,
        citations: answerCitations,
        status: 'done',
      };
      return current.some((message) => message.id === pendingId)
        ? current.map((message) => (message.id === pendingId ? answer : message))
        : [...current, answer];
    });
  }, [answerCitations, pendingId, streamStatus]);

  useEffect(() => {
    if (autoStart) beginTurn();
    // Seed controls remount the story; autoStart only applies on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = useCallback(
    (next: string) => {
      const prompt = next.trim();
      if (!prompt || !beginTurn()) return;
      setCommitted((current) => [
        ...current,
        { id: `mock-question-${turnCount.current}`, role: 'user', content: prompt, status: 'done' },
      ]);
      setValue('');
    },
    [beginTurn],
  );

  const onRetry = useCallback(
    (messageId: string) => {
      const isFailedTurn = committed.some((message) =>
        message.id === messageId && message.role === 'assistant' && message.status === 'error',
      );
      if (!isFailedTurn) return;

      beginTurn(messageId);
    },
    [beginTurn, committed],
  );

  const messages = useMemo<Message[]>(() => {
    if (!pendingId) return committed;

    const pending: Message = {
      id: pendingId,
      role: 'assistant',
      content: composing ? '' : content,
      status: 'streaming',
    };
    return committed.some((message) => message.id === pendingId)
      ? committed.map((message) => (message.id === pendingId ? pending : message))
      : [...committed, pending];
  }, [committed, composing, content, pendingId]);

  return {
    messages,
    status,
    value,
    lastCitation,
    onValueChange: setValue,
    onSubmit,
    onStop,
    onRetry,
    onSuggestionSelect: onSubmit,
    onCitationClick: setLastCitation,
  };
}
