import React, { memo } from 'react';
import Badge from '../ui/Badge';
import { EldEvent } from '../../types/trip';
import { AlertTriangle, Clock } from 'lucide-react';

interface ELDEventTableProps {
  events: EldEvent[];
  hoveredIdx: number | null;
  onHoverEvent: (idx: number | null) => void;
}

const STATUS_BADGE_VARIANTS: Record<string, 'secondary' | 'success' | 'outline' | 'warning'> = {
  OFF_DUTY: 'secondary',
  SLEEPER: 'success',
  DRIVING: 'outline',
  ON_DUTY_ND: 'warning',
};

const STATUS_BADGE_LABELS: Record<string, string> = {
  OFF_DUTY: 'Off Duty',
  SLEEPER: 'Sleeper Berth',
  DRIVING: 'Driving',
  ON_DUTY_ND: 'On Duty (ND)',
};

const STATUS_TEXT_COLORS: Record<string, string> = {
  OFF_DUTY: 'text-zinc-400',
  SLEEPER: 'text-emerald-500',
  DRIVING: 'text-blue-500',
  ON_DUTY_ND: 'text-amber-500',
};

export const ELDEventTable: React.FC<ELDEventTableProps> = memo(({
  events, hoveredIdx, onHoverEvent
}) => {
  if (!events || events.length === 0) {
    return (
      <div className="text-center p-6 text-xs text-muted-foreground font-medium bg-zinc-950/20 rounded-lg border border-border/40">
        No duty status log events recorded for this day.
      </div>
    );
  }

  // Detect simple en-route event HOS violations for highlights
  const annotatedEvents = events.map((e) => {
    const isDrivingExcess = e.status === 'DRIVING' && e.duration_hours > 11.0;
    const isBreakMissed = e.status === 'DRIVING' && e.duration_hours > 8.0;
    const hasInfraction = isDrivingExcess || isBreakMissed;
    
    let infractionText = '';
    if (isDrivingExcess) infractionText = 'Exceeded 11h daily driving limit';
    else if (isBreakMissed) infractionText = 'Exceeded 8h limit without rest break';

    return {
      ...e,
      hasInfraction,
      infractionText,
    };
  });

  return (
    <div className="overflow-hidden rounded-xl border border-border/40 bg-zinc-950/20 select-none">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/80 text-muted-foreground text-[10px] uppercase font-bold tracking-wider bg-zinc-900/40">
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Start</th>
              <th className="py-3 px-4">End</th>
              <th className="py-3 px-4">Duration</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Remarks</th>
              <th className="py-3 px-4">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {annotatedEvents.map((item, idx) => {
              const isHovered = hoveredIdx === idx;
              return (
                <tr
                  key={idx}
                  onMouseEnter={() => onHoverEvent(idx)}
                  onMouseLeave={() => onHoverEvent(null)}
                  className={`transition-colors duration-150 ${
                    item.hasInfraction
                      ? 'bg-rose-500/5 hover:bg-rose-500/10'
                      : isHovered
                      ? 'bg-secondary/40'
                      : 'hover:bg-secondary/15'
                  }`}
                >
                  {/* Status column */}
                  <td className="py-3 px-4 font-semibold">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={STATUS_BADGE_VARIANTS[item.status] || 'secondary'}
                        className={`text-[10px] ${STATUS_TEXT_COLORS[item.status]}`}
                      >
                        {STATUS_BADGE_LABELS[item.status] || item.status}
                      </Badge>
                      {item.hasInfraction && (
                        <span title={item.infractionText}>
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        </span>
                      )}
                    </div>
                  </td>
                  {/* Start time */}
                  <td className="py-3 px-4 text-zinc-300 font-medium">{item.start}</td>
                  {/* End time */}
                  <td className="py-3 px-4 text-zinc-300 font-medium">{item.end}</td>
                  {/* Duration */}
                  <td className="py-3 px-4 text-zinc-400 font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {item.duration_hours.toFixed(2)}h
                  </td>
                  {/* Location */}
                  <td className="py-3 px-4 text-zinc-300 font-medium max-w-[130px] truncate" title={item.location_name}>
                    {item.location_name.split(',')[0]}
                  </td>
                  {/* Remarks */}
                  <td className="py-3 px-4 text-muted-foreground max-w-[160px] truncate" title={item.remarks}>
                    {item.remarks}
                  </td>
                  {/* Source (Auto ELD or Driver Manual) */}
                  <td className="py-3 px-4 text-[10px] text-muted-foreground font-bold">
                    {item.status === 'DRIVING' ? 'ELD (Auto)' : 'Driver (Manual)'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

ELDEventTable.displayName = 'ELDEventTable';
export default ELDEventTable;
