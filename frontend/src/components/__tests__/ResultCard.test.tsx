import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResultCard } from '../ResultCard';
import type { PredictResponse } from '../../api/types';

const mockSarcasticResult: PredictResponse = {
  label: 'sarcastic',
  confidence: 0.94,
  sarcasm_type: 'irony',
  reason: 'Speaker praises an unwanted situation.',
  markers: ['great', 'needed'],
  literal_meaning: 'The speaker literally wanted another Monday.',
  intended_meaning: 'The speaker dreads Mondays and feels frustrated.',
  provider: 'groq/openai/gpt-oss-safeguard-20b',
  source: 'text',
  latency_ms: 120,
};

const mockBertResult: PredictResponse = {
  label: 'sarcastic',
  confidence: 0.82,
  sarcasm_type: 'general',
  reason: 'BERT offline classifier predicted sarcastic tone.',
  markers: [],
  literal_meaning: 'Literal interpretation',
  intended_meaning: 'Intended sarcasm',
  provider: 'local/bert_fallback',
  source: 'text',
  latency_ms: 45,
};

describe('ResultCard', () => {
  it('renders all key components of the analysis result', () => {
    render(
      <ResultCard
        originalText="Oh great, another Monday. Just what I needed."
        result={mockSarcasticResult}
      />,
    );

    expect(screen.getByTestId('verdict-badge')).toHaveTextContent('Sarcastic');
    expect(screen.getByTestId('sarcasm-type-chip')).toHaveTextContent('irony');
    expect(screen.getByTestId('confidence-value')).toHaveTextContent('94%');
    expect(screen.getByTestId('literal-meaning')).toHaveTextContent(
      'The speaker literally wanted another Monday.',
    );
    expect(screen.getByTestId('intended-meaning')).toHaveTextContent(
      'The speaker dreads Mondays and feels frustrated.',
    );
    expect(screen.getByTestId('result-reason')).toHaveTextContent(
      'Speaker praises an unwanted situation.',
    );
  });

  it('renders signal word markers as highlight elements', () => {
    render(
      <ResultCard
        originalText="Oh great, another Monday. Just what I needed."
        result={mockSarcasticResult}
      />,
    );

    const markers = screen.getAllByTestId('highlight-marker');
    expect(markers.length).toBe(2);
    expect(markers[0]).toHaveTextContent('great');
    expect(markers[1]).toHaveTextContent('needed');
  });

  it('renders BERT fallback warning when provider is bert_fallback', () => {
    render(
      <ResultCard
        originalText="Testing fallback mechanism."
        result={mockBertResult}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/Offline Fallback active/i);
  });

  it('does not render fallback warning when primary provider is used', () => {
    render(
      <ResultCard
        originalText="Normal groq execution."
        result={mockSarcasticResult}
      />,
    );

    expect(screen.queryByRole('alert')).toBeNull();
  });
});
