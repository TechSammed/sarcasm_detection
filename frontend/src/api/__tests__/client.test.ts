import { describe, it, expect } from 'vitest';
import { ApiRequestError, friendlyError } from '../client';

describe('friendlyError', () => {
  it('formats status 429 with retry seconds', () => {
    const error = new ApiRequestError(429, 'Too many requests', 45);
    expect(friendlyError(error)).toBe('Too many requests. Please wait 45 seconds.');
  });

  it('formats status 422 with validation detail', () => {
    const error = new ApiRequestError(422, 'Text must be at least 1 character');
    expect(friendlyError(error)).toBe('Text must be at least 1 character');
  });

  it('formats status 502 with service unavailable message', () => {
    const error = new ApiRequestError(502, 'Bad gateway');
    expect(friendlyError(error)).toBe(
      'The analysis service is temporarily unavailable. Please retry.',
    );
  });

  it('formats status 504 with timeout message', () => {
    const error = new ApiRequestError(504, 'Gateway timeout');
    expect(friendlyError(error)).toBe(
      'The request timed out. Please try a shorter text or retry.',
    );
  });

  it('formats status 0 network / timeout error with original detail', () => {
    const error = new ApiRequestError(0, 'Network error. Check your connection.');
    expect(friendlyError(error)).toBe('Network error. Check your connection.');
  });

  it('handles unknown generic error with fallback message', () => {
    expect(friendlyError(new Error('Random failure'))).toBe(
      'Something went wrong. Please try again.',
    );
  });
});
