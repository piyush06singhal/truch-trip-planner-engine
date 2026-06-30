import React, { memo, useMemo } from 'react';
import { EldEvent } from '../../types/trip';
import { ShieldCheck, ShieldAlert, Check, X } from 'lucide-react';

interface ELDComplianceAuditorProps {
  events: EldEvent[];
  summary: {
    driving: number;
    on_duty_nd: number;
    off_duty: number;
    sleeper: number;
  };
  cycleRemainingHours: number;
}

const timeToMinutes = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
};

export const ELDComplianceAuditor: React.FC<ELDComplianceAuditorProps> = memo(({
  events, summary, cycleRemainingHours
}) => {
  // 1. Audit rules checks
  const auditResults = useMemo(() => {
    // Check 1: 11-Hour Driving Limit
    const isDrivingExceeded = summary.driving > 11.0;
    
    // Check 2: 14-Hour Shift Window
    let dutyWindowHours = 0;
    const firstDuty = events.find(e => e.status === 'DRIVING' || e.status === 'ON_DUTY_ND');
    const lastDuty = [...events].reverse().find(e => e.status === 'DRIVING' || e.status === 'ON_DUTY_ND');
    if (firstDuty && lastDuty) {
      const startMin = timeToMinutes(firstDuty.start);
      const endMin = timeToMinutes(lastDuty.end);
      dutyWindowHours = (endMin - startMin) / 60;
    }
    const isWindowExceeded = dutyWindowHours > 14.0;

    // Check 3: 30-Minute Rest Break
    // Must rest after 8 hours of cumulative driving without a break of at least 30 mins
    const isBreakViolated = events.some(e => e.status === 'DRIVING' && e.duration_hours > 8.0);

    // Check 4: 70-Hour Cycle Limit
    const isCycleViolated = cycleRemainingHours < 0.0;

    const violationsCount = 
      (isDrivingExceeded ? 1 : 0) +
      (isWindowExceeded ? 1 : 0) +
      (isBreakViolated ? 1 : 0) +
      (isCycleViolated ? 1 : 0);

    return {
      isDrivingExceeded,
      drivingValue: `${summary.driving.toFixed(1)} / 11.0h`,
      isWindowExceeded,
      windowValue: `${dutyWindowHours.toFixed(1)} / 14.0h`,
      isBreakViolated,
      isCycleViolated,
      cycleValue: `${Math.max(0, cycleRemainingHours).toFixed(1)}h remaining`,
      isCompliant: violationsCount === 0,
      violationsCount,
    };
  }, [events, summary, cycleRemainingHours]);

  return (
    <div className="space-y-4 select-none">
      {/* Header Shield Alert/Check Banner */}
      <div className={`p-4 rounded-xl border flex items-center gap-3.5 transition-all duration-300 ${
        auditResults.isCompliant
          ? 'bg-emerald-500/5 border-emerald-500/25 text-emerald-400'
          : 'bg-rose-500/5 border-rose-500/25 text-rose-400'
      }`}>
        <div className={`p-2.5 rounded-lg ${
          auditResults.isCompliant ? 'bg-emerald-500/10' : 'bg-rose-500/10'
        }`}>
          {auditResults.isCompliant ? (
            <ShieldCheck className="h-6 w-6 text-emerald-500" />
          ) : (
            <ShieldAlert className="h-6 w-6 text-rose-500" />
          )}
        </div>
        <div>
          <h4 className="font-bold text-sm text-foreground">
            {auditResults.isCompliant ? 'HOS Compliant Log Day' : 'HOS Audits Alert'}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {auditResults.isCompliant
              ? 'Log sheet fully certified under USA Property rules (49 CFR § 395).'
              : `System identified ${auditResults.violationsCount} HOS violation(s) on this date.`}
          </p>
        </div>
      </div>

      {/* Rules Checklist */}
      <div className="rounded-xl border border-border/40 bg-zinc-950/25 divide-y divide-border/20">
        {/* Rule 1: 11h Driving Limit */}
        <div className="p-3.5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-200">11-Hour Driving Rule</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Capping daily driving shift under the max 11.0 hour limit.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              auditResults.isDrivingExceeded
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'bg-secondary text-zinc-300'
            }`}>
              {auditResults.drivingValue}
            </span>
            <div className={`p-1 rounded-full ${
              auditResults.isDrivingExceeded ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
            }`}>
              {auditResults.isDrivingExceeded ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
            </div>
          </div>
        </div>

        {/* Rule 2: 14h Shift window */}
        <div className="p-3.5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-200">14-Hour Duty Window</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Total elapsed span since starting duty status.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              auditResults.isWindowExceeded
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'bg-secondary text-zinc-300'
            }`}>
              {auditResults.windowValue}
            </span>
            <div className={`p-1 rounded-full ${
              auditResults.isWindowExceeded ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
            }`}>
              {auditResults.isWindowExceeded ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
            </div>
          </div>
        </div>

        {/* Rule 3: 30-min break */}
        <div className="p-3.5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-200">30-Minute Rest Break</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Requires 30m of off-duty rest break after 8h of driving.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              auditResults.isBreakViolated
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              {auditResults.isBreakViolated ? 'Missed Break' : 'Rest Compliant'}
            </span>
            <div className={`p-1 rounded-full ${
              auditResults.isBreakViolated ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
            }`}>
              {auditResults.isBreakViolated ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
            </div>
          </div>
        </div>

        {/* Rule 4: 70-hour cycle */}
        <div className="p-3.5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-200">70h / 8-Day Cycle</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Driver cumulative cycle hours limit checks.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              auditResults.isCycleViolated
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'bg-secondary text-zinc-300'
            }`}>
              {auditResults.cycleValue}
            </span>
            <div className={`p-1 rounded-full ${
              auditResults.isCycleViolated ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
            }`}>
              {auditResults.isCycleViolated ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ELDComplianceAuditor.displayName = 'ELDComplianceAuditor';
export default ELDComplianceAuditor;
