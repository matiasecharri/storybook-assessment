import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Composer, type ComposerProps } from './Composer';

function ControlledComposer({ initialValue = '', ...props }: Partial<ComposerProps> & { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  return <Composer value={value} onValueChange={setValue} onSubmit={vi.fn()} {...props} />;
}

describe('Composer', () => {
  it('submits trimmed text on Enter', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ControlledComposer onSubmit={onSubmit} />);
    await user.type(screen.getByRole('textbox'), '  Summarize this  {Enter}');
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('Summarize this');
  });

  it('allows newlines and preserves IME composition', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ControlledComposer onSubmit={onSubmit} />);
    const field = screen.getByRole('textbox');
    await user.type(field, 'First{Shift>}{Enter}{/Shift}Second');
    expect(field).toHaveValue('First\nSecond');
    fireEvent.keyDown(field, { key: 'Enter', isComposing: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects whitespace-only and disabled submissions', () => {
    const onSubmit = vi.fn();
    const { rerender } = render(<ControlledComposer initialValue="   " onSubmit={onSubmit} />);
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    rerender(<ControlledComposer value="Draft" disabled onSubmit={onSubmit} />);
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('returns focus to the field after clicking Send', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ControlledComposer initialValue="Draft" onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('Draft');
    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  it('keeps streaming editable, blocks Enter, and stops without submitting', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onStop = vi.fn();
    render(<ControlledComposer status="streaming" onSubmit={onSubmit} onStop={onStop} />);
    await user.type(screen.getByRole('textbox'), 'Next question{Enter}');
    await user.click(screen.getByRole('button', { name: 'Stop' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('textbox')).toHaveFocus();
    expect(screen.getByRole('textbox')).toHaveValue('Next question');
  });

  it('disables Stop when no callback is supplied', () => {
    render(<ControlledComposer status="streaming" />);
    expect(screen.getByRole('button', { name: 'Stop' })).toBeDisabled();
    expect(screen.getByRole('textbox')).toBeEnabled();
  });

  it('keeps its accessible description and native character limit', async () => {
    const user = userEvent.setup();
    render(<ControlledComposer maxLength={4} />);
    const field = screen.getByRole('textbox', { name: 'Message the assistant' });
    expect(field).toHaveAccessibleDescription('Enter to send · Shift + Enter for a new line');
    await user.type(field, '123456');
    expect(field).toHaveValue('1234');
  });
});
