import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { errorMessage, sampleCitations, sampleMessages } from '@/fixtures';
import { AssistantMessage } from './AssistantMessage';

describe('AssistantMessage', () => {
  it('staggers newly received visual lines without changing their text', () => {
    // jsdom has no line layout: place each group of six characters on the next line.
    const createRange = document.createRange.bind(document);
    const spy = vi.spyOn(document, 'createRange').mockImplementation(() => {
      const range = createRange();
      range.getBoundingClientRect = () => ({ top: Math.floor(range.startOffset / 6) * 28 } as DOMRect);
      return range;
    });
    try {
      const content = 'First Second';
      const { container } = render(<AssistantMessage message={{ id: 'lines', role: 'assistant', status: 'streaming', content }} />);
      const lines = container.querySelectorAll<HTMLElement>('span[class*="psynth-chunk-in"]');
      expect(Array.from(lines, (line) => line.textContent)).toEqual(['First ', 'Second']);
      expect(lines[0].style.animationDelay).toBe('0ms');
      expect(lines[1].style.animationDelay).toBe('50ms');
      expect(screen.getByRole('article').textContent).toBe(content);
    } finally {
      spy.mockRestore();
    }
  });

  it('shows every received fragment immediately and handles replacement and completion', () => {
    const message = { id: 'batch', role: 'assistant' as const, content: 'First sample.\n\n', status: 'streaming' as const };
    const { rerender } = render(<AssistantMessage message={message} />);
    const article = screen.getByRole('article', { name: 'Assistant message' });
    expect(article.textContent).toBe(message.content);
    const firstFragment = article.querySelector('span[class*="psynth-chunk-in"]');

    const appended = `${message.content}A second batch is already readable.`;
    rerender(<AssistantMessage message={{ ...message, content: appended }} />);
    expect(article.textContent).toBe(appended);
    expect(article.querySelector('span[class*="psynth-chunk-in"]')).toBe(firstFragment);
    expect(firstFragment?.textContent).toBe(message.content);

    rerender(<AssistantMessage message={{ ...message, content: 'Replacement text.' }} />);
    expect(article.textContent).toBe('Replacement text.');
    rerender(<AssistantMessage message={{ ...message, content: 'Replacement text.', status: 'done' }} />);
    expect(article.textContent).toBe('Replacement text.');
    expect(article).not.toHaveAttribute('aria-busy');
  });

  describe('role is exposed to assistive tech, not signalled by colour', () => {
    it('names the user turn', () => {
      render(<AssistantMessage message={sampleMessages[0]} />);

      expect(screen.getByRole('article', { name: 'User message' })).toHaveTextContent(
        sampleMessages[0].content,
      );
    });

    it('names the assistant turn', () => {
      render(<AssistantMessage message={sampleMessages[1]} />);

      expect(screen.getByRole('article', { name: 'Assistant message' })).toHaveTextContent(
        sampleMessages[1].content,
      );
    });

    it('carries the role without printing it on screen', () => {
      const { rerender } = render(<AssistantMessage message={sampleMessages[0]} />);

      expect(screen.queryByText(/^(you|assistant)$/i)).not.toBeInTheDocument();
      expect(screen.getByRole('article', { name: 'User message' })).toBeInTheDocument();

      rerender(<AssistantMessage message={sampleMessages[1]} />);

      expect(screen.queryByText(/^(you|assistant)$/i)).not.toBeInTheDocument();
      expect(screen.getByRole('article', { name: 'Assistant message' })).toBeInTheDocument();
    });

    it('marks a streaming turn as busy', () => {
      render(
        <AssistantMessage
          message={{ id: 'm', role: 'assistant', content: 'Working', status: 'streaming' }}
        />,
      );

      expect(screen.getByRole('article', { name: 'Assistant message' })).toHaveAttribute(
        'aria-busy',
        'true',
      );
    });
  });

  describe('failed turn', () => {
    it('retries with the id of the message that failed', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();
      render(<AssistantMessage message={errorMessage} onRetry={onRetry} />);

      await user.click(screen.getByRole('button', { name: /retry/i }));

      expect(onRetry).toHaveBeenCalledExactlyOnceWith(errorMessage.id);
    });

    it('hides retry when the host cannot honour it', () => {
      render(<AssistantMessage message={errorMessage} />);

      expect(screen.getByText(errorMessage.content)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });
  });

  describe('citations', () => {
    it('names the source kind without repeating one the title already states', async () => {
      const user = userEvent.setup();
      const onCitationClick = vi.fn();
      render(
        <AssistantMessage
          message={{ ...sampleMessages[1], citations: sampleCitations }}
          onCitationClick={onCitationClick}
        />,
      );

      expect(
        screen.getByRole('button', { name: `Document: ${sampleCitations[0].title}` }),
      ).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: sampleCitations[2].title }));

      expect(onCitationClick).toHaveBeenCalledExactlyOnceWith(sampleCitations[2]);
    });

    it('renders sources as plain chips when there is nothing to open', () => {
      render(<AssistantMessage message={{ ...sampleMessages[1], citations: sampleCitations }} />);

      expect(screen.getByRole('list', { name: '3 sources' })).toBeInTheDocument();
      expect(screen.queryAllByRole('button')).toHaveLength(0);
    });
  });

  describe('a long question', () => {
    afterEach(() => vi.unstubAllGlobals());

    /** Supplies overflow geometry because jsdom does not lay out text. */
    function clamped(overflowBy: number) {
      vi.stubGlobal('ResizeObserver', class {
        observe() {}
        disconnect() {}
      });
      Object.defineProperty(HTMLDivElement.prototype, 'scrollHeight', {
        get() { return this.className?.includes?.('overflow-hidden') ? 224 + overflowBy : 0; },
        configurable: true,
      });
      Object.defineProperty(HTMLDivElement.prototype, 'clientHeight', {
        get() { return this.className?.includes?.('overflow-hidden') ? 224 : 0; },
        configurable: true,
      });
    }

    it('clamps and opens, without ever hiding the text from assistive tech', async () => {
      clamped(300);
      const user = userEvent.setup();
      const long = { id: 'long', role: 'user' as const, content: 'A very long question.' };

      render(<AssistantMessage message={long} />);

      expect(screen.getByRole('article', { name: 'User message' })).toHaveTextContent(long.content);

      const toggle = screen.getByRole('button', { name: 'Show more' });
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect(toggle).toHaveAttribute('aria-controls');

      await user.click(toggle);

      const open = screen.getByRole('button', { name: 'Show less' });
      expect(open).toHaveAttribute('aria-expanded', 'true');
    });

    it('leaves a question that fits alone', () => {
      clamped(0);
      render(<AssistantMessage message={sampleMessages[0]} />);

      expect(screen.queryByRole('button', { name: /show (more|less)/i })).not.toBeInTheDocument();
    });
  });

  describe('source preview', () => {
    const withExcerpt = {
      id: 'cit-x',
      title: 'Referral letter — sample.pdf',
      kind: 'document' as const,
      excerpt: 'A short sample passage from the source.',
    };
    const withoutExcerpt = { id: 'cit-y', title: 'Section: Test results', kind: 'section' as const };
    const sourced = {
      ...sampleMessages[1],
      citations: [withExcerpt, withoutExcerpt],
    };

    it('reaches assistive tech without needing a hover a keyboard cannot produce', () => {
      render(<AssistantMessage message={sourced} onCitationClick={vi.fn()} />);

      expect(
        screen.getByRole('button', { name: `Document: ${withExcerpt.title}` }),
      ).toHaveAccessibleDescription(withExcerpt.excerpt);
    });

    it('previews on hover and dismisses with Escape', async () => {
      const user = userEvent.setup();
      render(<AssistantMessage message={sourced} onCitationClick={vi.fn()} />);

      const chip = screen.getByRole('button', { name: `Document: ${withExcerpt.title}` });
      expect(screen.queryByText(withExcerpt.excerpt, { ignore: '.sr-only' })).not.toBeInTheDocument();

      await user.hover(chip);
      expect(screen.getByText(withExcerpt.excerpt, { ignore: '.sr-only' })).toBeInTheDocument();

      await user.keyboard('{Escape}');
      expect(screen.queryByText(withExcerpt.excerpt, { ignore: '.sr-only' })).not.toBeInTheDocument();
    });

    it('offers nothing for a source that carries no passage', async () => {
      const user = userEvent.setup();
      render(<AssistantMessage message={sourced} onCitationClick={vi.fn()} />);

      const chip = screen.getByRole('button', { name: withoutExcerpt.title });
      expect(chip).not.toHaveAttribute('aria-describedby');

      await user.hover(chip);

      expect(chip).not.toHaveAccessibleDescription();
      expect(
        screen.queryByText(withExcerpt.excerpt, { ignore: '.sr-only' }),
      ).not.toBeInTheDocument();
    });

    it('closes the open preview when the pointer reaches a source without one', () => {
      render(<AssistantMessage message={sourced} onCitationClick={vi.fn()} />);

      fireEvent.mouseEnter(screen.getByRole('button', { name: `Document: ${withExcerpt.title}` }));
      expect(screen.getByText(withExcerpt.excerpt, { ignore: '.sr-only' })).toBeInTheDocument();

      fireEvent.mouseEnter(screen.getByRole('button', { name: withoutExcerpt.title }));
      expect(
        screen.queryByText(withExcerpt.excerpt, { ignore: '.sr-only' }),
      ).not.toBeInTheDocument();
    });

    it('opens upward when the thread leaves no room below', () => {
      const { container } = render(
        <AssistantMessage message={sourced} onCitationClick={vi.fn()} />,
      );
      const chip = screen.getByRole('button', { name: `Document: ${withExcerpt.title}` });
      const anchor = chip.closest('ul')!.parentElement!;
      const card = () => container.querySelector('[data-placement]');

      // Supply element bounds because jsdom does not calculate layout.
      const near = (top: number, bottom: number) =>
        vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue({
          top, bottom, left: 0, right: 420, width: 420, height: bottom - top, x: 0, y: top,
          toJSON: () => ({}),
        } as DOMRect);

      near(80, 120); // plenty of thread underneath
      fireEvent.mouseEnter(chip);
      expect(card()).toHaveAttribute('data-placement', 'below');

      fireEvent.mouseLeave(anchor);
      near(700, 740); // the chips sit at the bottom edge of the log
      fireEvent.mouseEnter(chip);
      expect(card()).toHaveAttribute('data-placement', 'above');
    });
  });

  describe('while the answer is still being composed', () => {
    const composing = { id: 'm', role: 'assistant' as const, content: '', status: 'streaming' as const };

    it('shows the wait instead of an empty turn, and names it once for assistive tech', () => {
      render(<AssistantMessage message={composing} />);

      const turn = screen.getByRole('article', { name: 'Assistant message' });
      expect(turn).toHaveAttribute('aria-busy', 'true');
      expect(turn).toHaveTextContent('Working on a response.');
      expect(turn).toHaveTextContent('Thinking');
    });

    it('drops the wait the moment there is text to read', () => {
      const { rerender } = render(<AssistantMessage message={composing} />);
      expect(screen.getByText('Thinking')).toBeInTheDocument();

      rerender(<AssistantMessage message={{ ...composing, content: 'Working memory' }} />);

      expect(screen.queryByText('Thinking')).not.toBeInTheDocument();
      expect(screen.queryByText('Working on a response.')).not.toBeInTheDocument();
      expect(screen.getByRole('article', { name: 'Assistant message' })).toHaveTextContent(
        'Working memory',
      );
    });
  });
});
