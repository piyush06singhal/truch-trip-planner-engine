import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Award, ShieldCheck, PenTool, ClipboardList, Info } from 'lucide-react';

import PageHeader from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, StatCard } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Tabs from '../components/ui/Tabs';
import Button from '../components/ui/Button';

import { useUI } from '../context/UIContext';
import { EldEvent } from '../types/trip';

import ELDSvgGrid from '../components/eld/ELDSvgGrid';
import ELDEventTable from '../components/eld/ELDEventTable';
import ELDComplianceAuditor from '../components/eld/ELDComplianceAuditor';

// ─── Mock Fallbacks for Empty State ──────────────────────────────────────────
const mockLogSheets = [
  {
    date: '2026-06-30',
    summary: { driving: 11.0, on_duty_nd: 1.5, off_duty: 7.0, sleeper: 4.5 },
    events: [
      { status: 'OFF_DUTY', start: '00:00', end: '04:30', duration_hours: 4.5, remarks: 'Pre-trip rest period', location_name: 'New York, NY' },
      { status: 'SLEEPER', start: '04:30', end: '09:00', duration_hours: 4.5, remarks: 'Sleeper berth rest', location_name: 'New York Rest Stop, NJ' },
      { status: 'DRIVING', start: '09:00', end: '17:00', duration_hours: 8.0, remarks: 'Dispatch leg start', location_name: 'Philadelphia Terminal, PA' },
      { status: 'OFF_DUTY', start: '17:00', end: '17:30', duration_hours: 0.5, remarks: 'Mandatory 30m meal break', location_name: 'Harrisburg Plaza, PA' },
      { status: 'DRIVING', start: '17:30', end: '20:30', duration_hours: 3.0, remarks: 'En-route transit', location_name: 'Pittsburgh Stop, PA' },
      { status: 'OFF_DUTY', start: '20:30', end: '24:00', duration_hours: 3.5, remarks: 'Post-trip vehicle check', location_name: 'Ohio Border, OH' },
    ] as EldEvent[],
  },
  {
    date: '2026-07-01',
    summary: { driving: 11.0, on_duty_nd: 2.0, off_duty: 1.0, sleeper: 10.0 },
    events: [
      { status: 'SLEEPER', start: '00:00', end: '10:00', duration_hours: 10.0, remarks: 'Daily 10h sleeper berth sleep', location_name: 'Cleveland Rest Area, OH' },
      { status: 'ON_DUTY_ND', start: '10:00', end: '11:00', duration_hours: 1.0, remarks: 'Cargo audit inspection', location_name: 'Toledo Terminal, OH' },
      { status: 'DRIVING', start: '11:00', end: '22:00', duration_hours: 11.0, remarks: 'Long distance transit', location_name: 'Indiana Highway, IN' },
      { status: 'OFF_DUTY', start: '22:00', end: '22:30', duration_hours: 0.5, remarks: 'Rest stop refueling', location_name: 'Gary Plaza, IN' },
      { status: 'ON_DUTY_ND', start: '22:30', end: '24:00', duration_hours: 1.5, remarks: 'Yard parking maneuvering', location_name: 'Chicago Terminal, IL' },
    ] as EldEvent[],
  },
  {
    date: '2026-07-02',
    summary: { driving: 4.5, on_duty_nd: 1.0, off_duty: 6.0, sleeper: 12.5 },
    events: [
      { status: 'SLEEPER', start: '00:00', end: '12:30', duration_hours: 12.5, remarks: 'Sleeper berth rest', location_name: 'Chicago Stop, IL' },
      { status: 'ON_DUTY_ND', start: '12:30', end: '13:30', duration_hours: 1.0, remarks: 'Unloading cargo verification', location_name: 'Chicago Terminal, IL' },
      { status: 'DRIVING', start: '13:30', end: '18:00', duration_hours: 4.5, remarks: 'Final delivery leg', location_name: 'Des Plaines Yard, IL' },
      { status: 'OFF_DUTY', start: '18:00', end: '24:00', duration_hours: 6.0, remarks: 'End of active dispatch shift', location_name: 'Chicago, IL' },
    ] as EldEvent[],
  }
];

export const ELDLogs: React.FC = () => {
  const { plannedTrip, activeEldDay, setActiveEldDay } = useUI();
  const [hoveredEventIdx, setHoveredEventIdx] = useState<number | null>(null);

  // 1. Resolve sheets list
  const sheets = useMemo(() => {
    return plannedTrip ? plannedTrip.eld_sheets : mockLogSheets;
  }, [plannedTrip]);

  // Keep index within boundaries
  const activeIdx = Math.min(Math.max(0, activeEldDay), sheets.length - 1);
  const currentSheet = sheets[activeIdx] || sheets[0];

  useEffect(() => {
    if (activeEldDay >= sheets.length) {
      setActiveEldDay(sheets.length - 1);
    }
  }, [sheets, activeEldDay, setActiveEldDay]);

  // 2. Tabs format mapping
  const daysTabs = useMemo(() => {
    return sheets.map((sheet, idx) => ({
      id: idx.toString(),
      label: `Day ${idx + 1} (${sheet.date})`
    }));
  }, [sheets]);

  // 3. Navigation handlers
  const handlePrevDay = useCallback(() => {
    if (activeIdx > 0) setActiveEldDay(activeIdx - 1);
  }, [activeIdx, setActiveEldDay]);

  const handleNextDay = useCallback(() => {
    if (activeIdx < sheets.length - 1) setActiveEldDay(activeIdx + 1);
  }, [activeIdx, sheets.length, setActiveEldDay]);

  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    const foundIdx = sheets.findIndex(s => s.date === selectedDate);
    if (foundIdx !== -1) {
      setActiveEldDay(foundIdx);
    }
  }, [sheets, setActiveEldDay]);

  // 4. Calculate dynamic cycle remaining
  const cycleRemainingHours = useMemo(() => {
    if (plannedTrip) {
      let accumulatedUsed = plannedTrip.start_cycle_used_hours || 0.0;
      for (let i = 0; i <= activeIdx; i++) {
        const s = plannedTrip.eld_sheets[i];
        if (s) {
          accumulatedUsed += s.summary.driving + s.summary.on_duty_nd;
        }
      }
      return Math.max(0.0, 70.0 - accumulatedUsed);
    }
    // Mock fallbacks
    const mockCycle = [54.5, 41.5, 36.0];
    return mockCycle[activeIdx] ?? 50.0;
  }, [plannedTrip, activeIdx]);

  // 5. Calculate shift duty window used
  const dutyWindowHours = useMemo(() => {
    if (!currentSheet || !currentSheet.events || currentSheet.events.length === 0) return 0;
    const firstDuty = currentSheet.events.find(e => e.status === 'DRIVING' || e.status === 'ON_DUTY_ND');
    const lastDuty = [...currentSheet.events].reverse().find(e => e.status === 'DRIVING' || e.status === 'ON_DUTY_ND');
    if (firstDuty && lastDuty) {
      const [h1, m1] = firstDuty.start.split(':').map(Number);
      const [h2, m2] = lastDuty.end.split(':').map(Number);
      return Math.max(0, ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60);
    }
    return 0;
  }, [currentSheet]);

  const handleHoverEvent = useCallback((idx: number | null) => {
    setHoveredEventIdx(idx);
  }, []);

  return (
    <div className="flex flex-col gap-4 h-full" style={{ minHeight: 'calc(100vh - 120px)' }}>
      <PageHeader
        title="Electronic Logging Device (ELD) Sheets"
        description="Verify FMCSA hour-of-service compliance records, log chart visualizers, and digital signatures."
      />

      {/* Navigation and Date Picker Header Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded-xl border border-border/40 bg-zinc-950/20">
        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevDay}
            disabled={activeIdx === 0}
            className="flex items-center gap-1 cursor-pointer"
            aria-label="Previous log day"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <span className="text-xs font-bold text-zinc-300 px-2 select-none">
            Day {activeIdx + 1} of {sheets.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextDay}
            disabled={activeIdx === sheets.length - 1}
            className="flex items-center gap-1 cursor-pointer"
            aria-label="Next log day"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Date picker calendar */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="date"
            value={currentSheet.date}
            onChange={handleDateChange}
            min={sheets[0]?.date}
            max={sheets[sheets.length - 1]?.date}
            className="bg-secondary/40 border border-border/40 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none text-zinc-300 cursor-pointer"
            aria-label="Choose log date"
          />
        </div>
      </div>

      {/* Tabs list index */}
      <Tabs
        items={daysTabs}
        activeId={activeIdx.toString()}
        onChange={(id) => setActiveEldDay(parseInt(id))}
        className="select-none"
      />

      {/* Main Grid Panel */}
      <div className="grid gap-4 lg:grid-cols-3 flex-1" style={{ minHeight: 0 }}>
        {/* Left: Interactive SVG Graph + Events List */}
        <div className="lg:col-span-2 space-y-4 flex flex-col h-full">
          {/* Animated visualizer card */}
          <Card className="flex flex-col shrink-0">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-1.5">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  FMCSA 24-Hour Graph Grid
                </CardTitle>
                <CardDescription>Midnight-to-midnight status transitions for {currentSheet.date}</CardDescription>
              </div>
              <Badge variant={dutyWindowHours > 14.0 || currentSheet.summary.driving > 11.0 ? 'destructive' : 'success'}>
                {dutyWindowHours > 14.0 || currentSheet.summary.driving > 11.0 ? 'HOS AUDIT ALERT' : 'COMPLIANT'}
              </Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <ELDSvgGrid
                    events={currentSheet.events}
                    hoveredIdx={hoveredEventIdx}
                    onHoverEvent={handleHoverEvent}
                  />
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Chronological Event table card */}
          <Card className="flex-1 flex flex-col overflow-hidden min-h-[300px]">
            <CardHeader className="pb-3 shrink-0">
              <CardTitle>Daily Duty Log Chronology</CardTitle>
              <CardDescription>Audited sequence of electronic record entries.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIdx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <ELDEventTable
                    events={currentSheet.events}
                    hoveredIdx={hoveredEventIdx}
                    onHoverEvent={handleHoverEvent}
                  />
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>

        {/* Right: Summary cards, log certification list, compliance panel */}
        <div className="space-y-4 flex flex-col h-full">
          {/* Summary statistic cards */}
          <div className="grid grid-cols-2 gap-2 shrink-0">
            <StatCard title="Total Driving" value={`${currentSheet.summary.driving.toFixed(1)}h`} description="USA Property 11h limit" />
            <StatCard title="On Duty ND" value={`${currentSheet.summary.on_duty_nd.toFixed(1)}h`} description="Inspections & loading" />
            <StatCard title="Off Duty" value={`${currentSheet.summary.off_duty.toFixed(1)}h`} description="Meals & personal rest" />
            <StatCard title="Sleeper Berth" value={`${currentSheet.summary.sleeper.toFixed(1)}h`} description="Daily sleeper berths" />
            <StatCard title="Shift Duty Window" value={`${dutyWindowHours.toFixed(1)}h`} description="Capped under 14h window" />
            <StatCard title="Cycle Remaining" value={`${cycleRemainingHours.toFixed(1)}h`} description="Capped under 70h cycle" />
          </div>

          {/* Compliance checks checklist */}
          <Card className="shrink-0">
            <CardHeader className="pb-3">
              <CardTitle>FMCSA Compliance Auditor</CardTitle>
              <CardDescription>Automated HOS rules validation audits.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIdx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <ELDComplianceAuditor
                    events={currentSheet.events}
                    summary={{
                      driving: currentSheet.summary.driving,
                      on_duty_nd: currentSheet.summary.on_duty_nd,
                      off_duty: currentSheet.summary.off_duty,
                      sleeper: currentSheet.summary.sleeper
                    }}
                    cycleRemainingHours={cycleRemainingHours}
                  />
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Driver & Log certification card */}
          <Card className="flex-1 flex flex-col min-h-[220px]">
            <CardHeader className="pb-2 shrink-0">
              <CardTitle>Log Certification Details</CardTitle>
              <CardDescription>Regulatory signatures & audit stamps.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4 text-xs">
              <div className="space-y-2.5">
                <div className="flex justify-between border-b border-border/30 pb-2">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Award className="h-3.5 w-3.5 text-zinc-500" /> Driver Name
                  </span>
                  <span className="font-bold text-zinc-200">Piyush Kumar</span>
                </div>
                <div className="flex justify-between border-b border-border/30 pb-2">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-zinc-500" /> Carrier
                  </span>
                  <span className="font-bold text-zinc-200">Spotter Carrier Co.</span>
                </div>
                <div className="flex justify-between border-b border-border/30 pb-2">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <PenTool className="h-3.5 w-3.5 text-zinc-500" /> Signature
                  </span>
                  <span className="font-bold text-zinc-300 italic">Signed Digitally</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950/40 border border-emerald-500/10 text-muted-foreground flex gap-2">
                <Info className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="leading-normal text-[10px]">
                  ELD records are automatically logged and certified under FMCSA 49 CFR Part 395 regulations. Audit logs remain immutable once saved.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ELDLogs;
