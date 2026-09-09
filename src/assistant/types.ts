
export type CitationKind = 'document' | 'section' | 'note';

export type Citation = {
  id: string;
  title: string;
  kind: CitationKind;
  /** Optional excerpt: interactive chips preview it on hover/focus and expose it as an accessible description. */
  excerpt?: string;
};

export type MessageStatus = 'done' | 'streaming' | 'error';

export type MessageRole = 'user' | 'assistant';

export type Message = {
  id: string;
  role: MessageRole;
  content: string;
  citations?: Citation[];
  /** Omit for a completed message. */
  status?: MessageStatus;
};

/** Panel state: streaming replaces Send with Stop; error leaves the composer usable. */
export type AssistantStatus = 'idle' | 'streaming' | 'error';

/** Controls thread spacing without changing font sizes. */
export type Density = 'comfortable' | 'compact';
