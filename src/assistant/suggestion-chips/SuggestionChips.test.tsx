import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { sampleSuggestions } from '@/fixtures';
import { SuggestionChips } from './SuggestionChips';

describe('SuggestionChips', () => {
  it('disables suggestions when the host has no selection handler', () => {
    render(<SuggestionChips suggestions={sampleSuggestions} />);
    for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled();
  });

  it('sends the chosen prompt straight to onSelect', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SuggestionChips suggestions={sampleSuggestions} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: sampleSuggestions[1] }));

    expect(onSelect).toHaveBeenCalledExactlyOnceWith(sampleSuggestions[1]);
  });

  it('is reachable and activatable from the keyboard', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SuggestionChips suggestions={sampleSuggestions} onSelect={onSelect} />);

    await user.tab();
    expect(screen.getByRole('button', { name: sampleSuggestions[0] })).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(sampleSuggestions[0]);
  });

  it('exposes the group through a labelled list', () => {
    render(<SuggestionChips suggestions={sampleSuggestions} onSelect={vi.fn()} />);

    const list = screen.getByRole('list', { name: 'Suggested prompts' });
    expect(list).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(sampleSuggestions.length);
  });

  it('cannot start a second turn while disabled', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SuggestionChips suggestions={sampleSuggestions} onSelect={onSelect} disabled />);

    await user.click(screen.getByRole('button', { name: sampleSuggestions[0] }));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
