import React from 'react';
import { getHighlightedSegments } from '../utils/highlight';

interface HighlightedTextProps {
  text: string;
  markers: string[];
  className?: string;
}

export const HighlightedText: React.FC<HighlightedTextProps> = React.memo(
  ({ text, markers, className = '' }) => {
    const segments = getHighlightedSegments(text, markers);

    return (
      <span className={className}>
        {segments.map((seg, i) =>
          seg.isHighlighted ? (
            <mark
              key={i}
              className="marker-highlight"
              data-testid="highlight-marker"
            >
              {seg.text}
            </mark>
          ) : (
            <React.Fragment key={i}>{seg.text}</React.Fragment>
          ),
        )}
      </span>
    );
  },
);

HighlightedText.displayName = 'HighlightedText';
