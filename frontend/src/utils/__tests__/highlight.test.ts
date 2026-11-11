import { describe, it, expect } from 'vitest';
import { getHighlightedSegments } from '../highlight';

describe('getHighlightedSegments', () => {
  it('returns empty array when text is empty', () => {
    expect(getHighlightedSegments('')).toEqual([]);
  });

  it('returns single unhighlighted segment when markers array is empty', () => {
    const result = getHighlightedSegments('Hello world', []);
    expect(result).toEqual([{ text: 'Hello world', isHighlighted: false }]);
  });

  it('highlights a single matching marker', () => {
    const result = getHighlightedSegments('Oh great, another meeting', ['great']);
    expect(result).toEqual([
      { text: 'Oh ', isHighlighted: false },
      { text: 'great', isHighlighted: true },
      { text: ', another meeting', isHighlighted: false },
    ]);
  });

  it('matches markers case-insensitively while preserving original text casing', () => {
    const result = getHighlightedSegments('BRILLIANT job on this', ['brilliant']);
    expect(result).toEqual([
      { text: 'BRILLIANT', isHighlighted: true },
      { text: ' job on this', isHighlighted: false },
    ]);
  });

  it('safely handles multiple non-overlapping markers', () => {
    const result = getHighlightedSegments('Oh wonderful, totally what I wanted', [
      'wonderful',
      'totally',
    ]);
    expect(result).toEqual([
      { text: 'Oh ', isHighlighted: false },
      { text: 'wonderful', isHighlighted: true },
      { text: ', ', isHighlighted: false },
      { text: 'totally', isHighlighted: true },
      { text: ' what I wanted', isHighlighted: false },
    ]);
  });

  it('safely merges overlapping markers without duplicate segments', () => {
    const result = getHighlightedSegments('Oh great day', ['great', 'great day']);
    expect(result).toEqual([
      { text: 'Oh ', isHighlighted: false },
      { text: 'great day', isHighlighted: true },
    ]);
  });

  it('safely ignores markers that do not exist in the text', () => {
    const result = getHighlightedSegments('A simple statement', ['nonexistent', 'missing']);
    expect(result).toEqual([{ text: 'A simple statement', isHighlighted: false }]);
  });
});
