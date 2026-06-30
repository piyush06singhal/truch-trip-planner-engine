import React, { memo, useMemo } from 'react';
import { EldEvent } from '../../types/trip';

interface ELDSvgGridProps {
  events: EldEvent[];
  hoveredIdx: number | null;
  onHoverEvent: (idx: number | null) => void;
}

const timeToMinutes = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
};

const getX = (timeStr: string): number => {
  const minutes = timeToMinutes(timeStr);
  const left = 100;
  const width = 680;
  return left + (minutes / 1440) * width;
};

const getY = (status: string): number => {
  const top = 30;
  const rowHeight = 35;
  switch (status) {
    case 'OFF_DUTY':
      return top + rowHeight * 0.5;
    case 'SLEEPER':
      return top + rowHeight * 1.5;
    case 'DRIVING':
      return top + rowHeight * 2.5;
    case 'ON_DUTY_ND':
      return top + rowHeight * 3.5;
    default:
      return top + rowHeight * 0.5;
  }
};

const STATUS_COLORS: Record<string, string> = {
  OFF_DUTY: '#71717a',   // zinc-500
  SLEEPER: '#10b981',    // emerald-500
  DRIVING: '#3b82f6',    // blue-500
  ON_DUTY_ND: '#f59e0b', // amber-500
};

const STATUS_LABELS = [
  { key: 'OFF_DUTY', label: 'OFF DUTY' },
  { key: 'SLEEPER', label: 'SLEEPER' },
  { key: 'DRIVING', label: 'DRIVING' },
  { key: 'ON_DUTY_ND', label: 'ON DUTY (ND)' },
];

export const ELDSvgGrid: React.FC<ELDSvgGridProps> = memo(({
  events, hoveredIdx, onHoverEvent
}) => {
  // 1. Grid ticks (24 hours)
  const hourTicks = useMemo(() => {
    const ticks = [];
    for (let i = 0; i <= 24; i++) {
      const x = 100 + (i / 24) * 680;
      let label = `${i % 12 === 0 ? 12 : i % 12}`;
      if (i === 0 || i === 24) label = 'M';
      if (i === 12) label = 'N';
      ticks.push({ x, hour: i, label });
    }
    return ticks;
  }, []);

  // 2. Compute path lines & connector links
  const segments = useMemo(() => {
    if (!events || events.length === 0) return [];
    
    return events.map((event, idx) => {
      const x1 = getX(event.start);
      const x2 = getX(event.end);
      const y = getY(event.status);
      
      // Connection vertical line to the next event if there is one
      let verticalLine = null;
      const nextEvent = events[idx + 1];
      if (nextEvent) {
        const nextY = getY(nextEvent.status);
        if (nextY !== y) {
          verticalLine = {
            x: x2,
            y1: y,
            y2: nextY,
          };
        }
      }
      
      return {
        idx,
        event,
        x1,
        x2,
        y,
        color: STATUS_COLORS[event.status] || '#71717a',
        verticalLine,
      };
    });
  }, [events]);

  return (
    <div className="w-full overflow-x-auto scrollbar-none bg-zinc-950/40 p-4 rounded-xl border border-border/40 select-none">
      <svg
        viewBox="0 0 800 200"
        className="w-full min-w-[700px] h-auto overflow-visible font-sans text-[10px] font-bold text-zinc-400 fill-zinc-400 stroke-zinc-700"
      >
        {/* Draw status bounds grid box rows */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={`row-border-${i}`}
            x1="100"
            y1={30 + i * 35}
            x2="780"
            y2={30 + i * 35}
            strokeWidth="1"
            className="stroke-zinc-800/80"
          />
        ))}

        {/* Labels for Rows */}
        {STATUS_LABELS.map((item, idx) => (
          <text
            key={`row-label-${item.key}`}
            x="85"
            y={30 + idx * 35 + 21}
            textAnchor="end"
            className="fill-zinc-400 font-bold tracking-wide"
          >
            {item.label}
          </text>
        ))}

        {/* Hourly vertical grid ticks and half-hour sub-ticks */}
        {hourTicks.map((tick) => (
          <g key={`tick-col-${tick.hour}`}>
            {/* Hour vertical line */}
            <line
              x1={tick.x}
              y1="30"
              x2={tick.x}
              y2="170"
              strokeWidth={tick.hour % 6 === 0 ? '1' : '0.5'}
              className={tick.hour % 6 === 0 ? 'stroke-zinc-800' : 'stroke-zinc-900/60'}
            />
            {/* Time ticks header text */}
            <text
              x={tick.x}
              y="18"
              textAnchor="middle"
              className="fill-zinc-400 font-bold"
            >
              {tick.label}
            </text>
            {/* Sub-tick markings (15m, 30m, 45m ticks) */}
            {tick.hour < 24 && (
              <>
                <line
                  x1={tick.x + 680 / 48}
                  y1="166"
                  x2={tick.x + 680 / 48}
                  y2="170"
                  strokeWidth="0.5"
                  className="stroke-zinc-800"
                />
                <line
                  x1={tick.x + 680 / 96}
                  y1="168"
                  x2={tick.x + 680 / 96}
                  y2="170"
                  strokeWidth="0.5"
                  className="stroke-zinc-800/50"
                />
                <line
                  x1={tick.x + (680 / 96) * 3}
                  y1="168"
                  x2={tick.x + (680 / 96) * 3}
                  y2="170"
                  strokeWidth="0.5"
                  className="stroke-zinc-800/50"
                />
              </>
            )}
          </g>
        ))}

        {/* Compliance graph segments (underlay thickness line) */}
        {segments.map((seg) => {
          const isHovered = hoveredIdx === seg.idx;
          return (
            <g
              key={`seg-group-${seg.idx}`}
              onMouseEnter={() => onHoverEvent(seg.idx)}
              onMouseLeave={() => onHoverEvent(null)}
              className="cursor-pointer"
            >
              {/* Highlight background glow on hover */}
              {isHovered && (
                <line
                  x1={seg.x1}
                  y1={seg.y}
                  x2={seg.x2}
                  y2={seg.y}
                  stroke={seg.color}
                  strokeWidth="10"
                  strokeLinecap="round"
                  opacity="0.25"
                  className="transition-all duration-150"
                />
              )}
              {/* Horizontal line for active status duration */}
              <line
                x1={seg.x1}
                y1={seg.y}
                x2={seg.x2}
                y2={seg.y}
                stroke={seg.color}
                strokeWidth={isHovered ? '4' : '2.5'}
                strokeLinecap="round"
                className="transition-all duration-150"
              />
              {/* Connection vertical line */}
              {seg.verticalLine && (
                <line
                  x1={seg.verticalLine.x}
                  y1={seg.verticalLine.y1}
                  x2={seg.verticalLine.x}
                  y2={seg.verticalLine.y2}
                  stroke={seg.color}
                  strokeWidth={isHovered ? '3.5' : '2.5'}
                  strokeLinecap="round"
                  opacity="0.85"
                />
              )}
              {/* Thick transparent cover to make hover target wide and easily clickable */}
              <line
                x1={seg.x1}
                y1={seg.y}
                x2={seg.x2}
                y2={seg.y}
                stroke="transparent"
                strokeWidth="14"
                className="cursor-pointer"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
});

ELDSvgGrid.displayName = 'ELDSvgGrid';
export default ELDSvgGrid;
