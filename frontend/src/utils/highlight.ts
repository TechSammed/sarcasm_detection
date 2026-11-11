export interface TextSegment {
  text: string;
  isHighlighted: boolean;
}

interface Interval {
  start: number;
  end: number;
}

/**
 * Safely segments text into highlighted and plain segments based on markers.
 * - Case-insensitive matching
 * - Handles overlapping or adjacent markers
 * - Preserves original casing
 * - Safe from regex injection
 * - No HTML/dangerouslySetInnerHTML needed
 */
export function getHighlightedSegments(
  text: string,
  markers: string[] = [],
): TextSegment[] {
  if (!text) return [];
  if (!markers || markers.length === 0) {
    return [{ text, isHighlighted: false }];
  }

  const lowerText = text.toLowerCase();
  const rawIntervals: Interval[] = [];

  for (const marker of markers) {
    if (!marker || typeof marker !== 'string') continue;
    const lowerMarker = marker.trim().toLowerCase();
    if (!lowerMarker) continue;

    let searchStart = 0;
    while (searchStart < lowerText.length) {
      const idx = lowerText.indexOf(lowerMarker, searchStart);
      if (idx === -1) break;
      rawIntervals.push({
        start: idx,
        end: idx + lowerMarker.length,
      });
      searchStart = idx + 1;
    }
  }

  if (rawIntervals.length === 0) {
    return [{ text, isHighlighted: false }];
  }

  // Sort intervals by start index, then longest first
  rawIntervals.sort((a, b) => a.start - b.start || b.end - a.end);

  // Merge overlapping and consecutive intervals
  const merged: Interval[] = [];
  for (const iv of rawIntervals) {
    if (merged.length === 0) {
      merged.push({ ...iv });
    } else {
      const prev = merged[merged.length - 1];
      if (iv.start <= prev.end) {
        prev.end = Math.max(prev.end, iv.end);
      } else {
        merged.push({ ...iv });
      }
    }
  }

  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const iv of merged) {
    if (iv.start > cursor) {
      segments.push({
        text: text.slice(cursor, iv.start),
        isHighlighted: false,
      });
    }
    segments.push({
      text: text.slice(iv.start, iv.end),
      isHighlighted: true,
    });
    cursor = iv.end;
  }

  if (cursor < text.length) {
    segments.push({
      text: text.slice(cursor),
      isHighlighted: false,
    });
  }

  return segments;
}
