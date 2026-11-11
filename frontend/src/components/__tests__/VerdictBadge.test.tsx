import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VerdictBadge } from '../VerdictBadge';

describe('VerdictBadge', () => {
  it('renders sarcastic label with appropriate text and accessibility label', () => {
    render(<VerdictBadge label="sarcastic" />);
    const badge = screen.getByTestId('verdict-badge');
    expect(badge).toHaveTextContent('Sarcastic');
    expect(badge).toHaveAttribute('aria-label', 'Verdict: Sarcastic');
    expect(badge).toHaveClass('verdict-sarcastic');
  });

  it('renders sincere / not_sarcastic label correctly', () => {
    render(<VerdictBadge label="not_sarcastic" />);
    const badge = screen.getByTestId('verdict-badge');
    expect(badge).toHaveTextContent(/Sincere/i);
    expect(badge).toHaveAttribute('aria-label', 'Verdict: Sincere (Not Sarcastic)');
    expect(badge).toHaveClass('verdict-not_sarcastic');
  });

  it('renders uncertain label correctly for unknown or uncertain inputs', () => {
    render(<VerdictBadge label="uncertain" />);
    const badge = screen.getByTestId('verdict-badge');
    expect(badge).toHaveTextContent('Uncertain');
    expect(badge).toHaveAttribute('aria-label', 'Verdict: Uncertain');
    expect(badge).toHaveClass('verdict-uncertain');
  });
});
