import { useCallback, useEffect, useRef, useState } from 'react';
import type { AssistantStatus } from '../types';

const TURN_ANNOUNCEMENTS = {
  responding: 'Assistant is responding.',
  complete: 'Assistant response complete.',
  stopped: 'Response stopped.',
  failed: 'Assistant response failed.',
} as const;

/** Announces turn transitions instead of streamed text. Record stop requests to distinguish them from completion. */
export function useTurnAnnouncement(status: AssistantStatus, canRetry: boolean) {
  const previousStatus = useRef<AssistantStatus>(status);
  const stopRequested = useRef(false);
  const [announcement, setAnnouncement] = useState('');

  /** Call before notifying the host so the next idle transition announces a stop. */
  const noteStopRequest = useCallback(() => {
    stopRequested.current = true;
  }, []);

  useEffect(() => {
    const previous = previousStatus.current;
    previousStatus.current = status;

    if (status === 'streaming') {
      stopRequested.current = false;
      setAnnouncement(TURN_ANNOUNCEMENTS.responding);
      return;
    }

    if (status === 'error') {
      setAnnouncement(`${TURN_ANNOUNCEMENTS.failed}${canRetry ? ' Retry is available.' : ''}`);
      return;
    }

    if (previous !== 'streaming') {
      setAnnouncement('');
      return;
    }

    setAnnouncement(
      stopRequested.current ? TURN_ANNOUNCEMENTS.stopped : TURN_ANNOUNCEMENTS.complete,
    );
    stopRequested.current = false;
  }, [status, canRetry]);

  return { announcement, noteStopRequest };
}
