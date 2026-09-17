'use client';

import React, { useState } from 'react';

/**
 * Responsive Interactive SVG Spider Radar Chart
 * @param {Array} data - Array of { label, shortLabel, value, maxVal, color, areaName }
 * @param {number} size - Chart width/height (default 480)
 * @param {boolean} showBenchmark - Show target level 3 standard overlay
 */
export default function SkillRadarChart({
  data = [],
  size = 480,
  showBenchmark = true,
  themeColor = '#4F46E5',
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!data || data.length < 3) {
    return (
      <div
        style={{
          width: '100%',
          height: '320px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-card-subtle, #F8FAFC)',
          borderRadius: '1rem',
          color: 'var(--text-tertiary, #94A3B8)',
          fontSize: '0.85rem',
        }}
      >
        ต้องการข้อมูลอย่างน้อย 3 มิติเพื่อแสดง Spider Radar Chart
      </div>
    );
  }

  const center = size / 2;
  const radius = size * 0.36; // leave space for labels
  const levels = [1, 2, 3, 4, 5];
  const numAxes = data.length;
  const angleStep = (Math.PI * 2) / numAxes;

  // Calculate coordinates for a specific value on axis index
  const getCoordinates = (axisIndex, val, maxVal = 5) => {
    const angle = axisIndex * angleStep - Math.PI / 2; // start from 12 o'clock
    const r = (val / maxVal) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Generate User Data Polygon points
  const polygonPoints = data
    .map((item, idx) => {
      const { x, y } = getCoordinates(idx, Math.max(0, Math.min(5, item.value || 0)));
      return `${x},${y}`;
    })
    .join(' ');

  // Generate Benchmark Level 3 Standard points
  const benchmarkPoints = data
    .map((_, idx) => {
      const { x, y } = getCoordinates(idx, 3);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: `${size}px`, margin: '0 auto' }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      >
        <defs>
          <radialGradient id="radarAreaGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={themeColor} stopOpacity="0.5" />
            <stop offset="100%" stopColor={themeColor} stopOpacity="0.15" />
          </radialGradient>
          <filter id="radarShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor={themeColor} floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Concentric Polygons for Rating Levels (1 - 5) */}
        {levels.map((lvl) => {
          const levelPoints = Array.from({ length: numAxes })
            .map((_, idx) => {
              const { x, y } = getCoordinates(idx, lvl);
              return `${x},${y}`;
            })
            .join(' ');

          return (
            <g key={`level-grid-${lvl}`}>
              <polygon
                points={levelPoints}
                fill={lvl % 2 === 0 ? 'rgba(241, 245, 249, 0.4)' : 'rgba(248, 250, 252, 0.2)'}
                stroke={lvl === 3 ? '#94A3B8' : '#CBD5E1'}
                strokeWidth={lvl === 3 ? 1.5 : 0.75}
                strokeDasharray={lvl === 3 ? '4 3' : 'none'}
              />
              {/* Level indicator text along vertical axis */}
              <text
                x={center + 5}
                y={center - (lvl / 5) * radius + 3}
                fill="#94A3B8"
                fontSize="9"
                fontWeight="600"
              >
                {lvl}
              </text>
            </g>
          );
        })}

        {/* Radial Axis Lines */}
        {data.map((item, idx) => {
          const { x, y } = getCoordinates(idx, 5);
          return (
            <line
              key={`axis-line-${idx}`}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#E2E8F0"
              strokeWidth="1"
            />
          );
        })}

        {/* Benchmark Overlay (Level 3 Standard) */}
        {showBenchmark && (
          <polygon
            points={benchmarkPoints}
            fill="none"
            stroke="#10B981"
            strokeWidth="1.75"
            strokeDasharray="5 4"
            opacity="0.8"
          />
        )}

        {/* User Data Polygon */}
        <polygon
          points={polygonPoints}
          fill="url(#radarAreaGradient)"
          stroke={themeColor}
          strokeWidth="2.5"
          filter="url(#radarShadow)"
        />

        {/* Data Point Dots with Hover */}
        {data.map((item, idx) => {
          const val = Math.max(0, Math.min(5, item.value || 0));
          const { x, y } = getCoordinates(idx, val);
          const isHovered = hoveredPoint === idx;

          return (
            <g key={`data-dot-${idx}`}>
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 7 : 4.5}
                fill="#FFFFFF"
                stroke={themeColor}
                strokeWidth={isHovered ? 3 : 2}
                style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                onMouseEnter={() => setHoveredPoint(idx)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </g>
          );
        })}

        {/* Axis Labels (Positioned slightly outside maximum radius) */}
        {data.map((item, idx) => {
          const angle = idx * angleStep - Math.PI / 2;
          const labelDist = radius + 24;
          const lx = center + labelDist * Math.cos(angle);
          const ly = center + labelDist * Math.sin(angle);

          // Determine text anchor based on angle
          let anchor = 'middle';
          if (Math.cos(angle) > 0.3) anchor = 'start';
          else if (Math.cos(angle) < -0.3) anchor = 'end';

          const isHovered = hoveredPoint === idx;

          return (
            <g key={`axis-label-${idx}`} style={{ cursor: 'pointer' }} onMouseEnter={() => setHoveredPoint(idx)} onMouseLeave={() => setHoveredPoint(null)}>
              <text
                x={lx}
                y={ly}
                textAnchor={anchor}
                dominantBaseline="central"
                fill={isHovered ? themeColor : '#334155'}
                fontSize={isHovered ? '11' : '10'}
                fontWeight={isHovered ? '800' : '600'}
                style={{ transition: 'all 0.15s ease' }}
              >
                {item.shortLabel || item.label}
              </text>
              <text
                x={lx}
                y={ly + 12}
                textAnchor={anchor}
                dominantBaseline="central"
                fill={item.value >= 4 ? '#059669' : item.value >= 3 ? '#2563EB' : '#EA580C'}
                fontSize="9"
                fontWeight="700"
              >
                {item.value ? `${item.value.toFixed(1)}/5` : '0/5'}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {hoveredPoint !== null && data[hoveredPoint] && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(4px)',
            color: '#FFFFFF',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            textAlign: 'center',
            boxShadow: '0 10px 20px rgba(0,0,0,0.25)',
            pointerEvents: 'none',
            zIndex: 10,
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ fontWeight: 700, color: '#93C5FD', marginBottom: '2px' }}>
            {data[hoveredPoint].label}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#E2E8F0' }}>
            คะแนนเฉลี่ย: <strong style={{ color: '#FCD34D' }}>{data[hoveredPoint].value?.toFixed(2) || 0} / 5.00</strong>
            {data[hoveredPoint].areaName && ` (${data[hoveredPoint].areaName})`}
          </div>
        </div>
      )}

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          marginTop: '0.5rem',
          fontSize: '0.78rem',
          color: 'var(--text-secondary, #64748B)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: themeColor, display: 'inline-block' }} />
          <span>ระดับทักษะของตนเอง</span>
        </div>
        {showBenchmark && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '16px', height: '2px', borderTop: '2px dashed #10B981', display: 'inline-block' }} />
            <span>เกณฑ์มาตรฐานระดับ 3 (Standard)</span>
          </div>
        )}
      </div>
    </div>
  );
}
