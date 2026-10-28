'use client';

import React from 'react';

/**
 * Splits text into individual bullet items if multiple items exist.
 * Supports:
 * - Text with bullet symbols (•, -, *, ■, ▪, ◆, ✦)
 * - Numbered items (1., 2., 1), etc.)
 * - Plain newlines (\n) separating distinct points
 * - Single-line text containing multiple '•' characters
 */
export function parseBulletItems(text) {
  if (!text || typeof text !== 'string') return [];
  const clean = text.trim();
  if (!clean) return [];

  // 1. If text contains '•' (bullet symbols)
  if (clean.includes('•')) {
    // Split on bullet symbol with preceding whitespace/newline or start of string
    const parts = clean
      .split(/(?:^|\n|\s+)•\s*/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 1) {
      return parts;
    }
  }

  // 2. If text contains newlines
  if (clean.includes('\n')) {
    const lines = clean
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length > 1) {
      const isMarkedList = lines.some((l) => /^([•\-\*■▪◆✦]\s*|\d+[\.\)]\s*)/.test(l));

      if (isMarkedList) {
        const grouped = [];
        let current = '';
        for (const line of lines) {
          const hasMarker = /^([•\-\*■▪◆✦]\s*|\d+[\.\)]\s*)/.test(line);
          const stripped = line.replace(/^([•\-\*■▪◆✦]\s*|\d+[\.\)]\s*)/, '').trim();
          if (hasMarker) {
            if (current) grouped.push(current);
            current = stripped;
          } else {
            current = current ? `${current} ${line}` : line;
          }
        }
        if (current) grouped.push(current);
        if (grouped.length > 0) return grouped;
      }

      // If plain lines without markers, treat each non-empty line as a bullet point
      return lines;
    }
  }

  // 3. Single paragraph / single bullet
  return [clean];
}

/**
 * Reusable Component to render Evidence or Potential Impact as a styled bullet list
 */
export default function TqaBulletList({
  text,
  bulletColor = '#0284C7',
  bulletBg = '#E0F2FE',
  textColor = '#334155',
  fontSize = '0.875rem',
  lineHeight = 1.6,
  emptyFallback = '-',
}) {
  if (!text || !text.trim()) {
    return <span style={{ color: '#94A3B8' }}>{emptyFallback}</span>;
  }

  const items = parseBulletItems(text);

  // If only 1 item and no bullet formatting needed, render as clean paragraph
  if (items.length <= 1) {
    return (
      <div
        style={{
          color: textColor,
          fontSize,
          lineHeight,
          whiteSpace: 'pre-line',
        }}
      >
        {items[0] || text}
      </div>
    );
  }

  // If multiple items, render as an elegant bulleted list
  return (
    <ul
      style={{
        margin: '6px 0 0 0',
        paddingLeft: 0,
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {items.map((item, idx) => (
        <li
          key={idx}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            color: textColor,
            fontSize,
            lineHeight,
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: bulletBg,
              color: bulletColor,
              fontSize: '0.7rem',
              fontWeight: 800,
              flexShrink: 0,
              marginTop: '2px',
            }}
            aria-hidden="true"
          >
            {idx + 1}
          </span>
          <span style={{ flex: 1, whiteSpace: 'pre-line' }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}
