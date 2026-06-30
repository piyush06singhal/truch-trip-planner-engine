import React, { memo, useCallback, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Navigation, Loader2, ArrowRight } from 'lucide-react';

import PageHeader from '../components/ui/PageHeader';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useUI } from '../context/UIContext';
import { TripResponse } from '../types/trip';
import { MARKER_CONFIGS, StopType } from '../constants/mapMarkers';

const MapCanvas = lazy(() => import('../components/map/MapCanvas'));

// ─── Stat Item ───────────────────────────────────────────────────────────────

interface StatItemProps { label: string; value: string; sub?: string; color?: string; }
const StatItem: React.FC<StatItemProps> = memo(({ label, value, sub, color }) => (
  <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-secondary/20 border border-border/30">
    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="text-base font-bold" style={color ? { color } : undefined}>{value}</p>
    {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
  </div>
));
StatItem.displayName = 'StatItem';

// ─── Trip Info Panel ─────────────────────────────────────────────────────────

interface TripInfoPanelProps {
  trip: TripResponse;
  selectedStopIdx: number | null;
  onSelectStop: (idx: number) => void;
}

const TripInfoPanel: React.FC<TripInfoPanelProps> = memo(({ trip, selectedStopIdx, onSelectStop }) => {
  const cycleRemaining = Math.max(0, 70.0 - trip.summary.total_driving_hours).toFixed(1);
  const arrivalStop = trip.stops[trip.stops.length - 1];

  const formatArrival = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch { return iso; }
  };

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pr-0.5" style={{ scrollbarWidth: 'none' }}>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-2">
        <StatItem label="Distance" value={`${trip.summary.total_distance_miles.toLocaleString()} mi`} />
        <StatItem label="Duration" value={`${trip.summary.total_duration_hours}h`} />
        <StatItem label="Driving" value={`${trip.summary.total_driving_hours}h`} color="#3b82f6" />
        <StatItem label="Rest Stops" value={`${trip.summary.total_rest_stops}`} color="#f59e0b" />
        <StatItem label="Sleep Stops" value={`${trip.summary.total_sleep_stops}`} color="#06b6d4" />
        <StatItem label="Fuel Stops" value={`${trip.summary.total_fuel_stops}`} color="#ec4899" />
        <StatItem label="ELD Days" value={`${trip.eld_sheets.length}`} />
        <StatItem
          label="Cycle Used"
          value={`${trip.summary.total_driving_hours}h`}
          sub={`${cycleRemaining}h remaining`}
          color="#a855f7"
        />
      </div>

      {arrivalStop && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 text-xs space-y-1">
          <p className="text-[10px] font-bold uppercase text-green-500 tracking-wider">Est. Arrival</p>
          <p className="font-semibold text-foreground">{formatArrival(arrivalStop.arrival_time)}</p>
        </div>
      )}

      {/* Stop List */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
          Route Checkpoints
        </p>
        {trip.stops.map((stop, idx) => {
          const type = stop.type as StopType;
          const config = MARKER_CONFIGS[type] ?? MARKER_CONFIGS.REST_STOP;
          const isSelected = selectedStopIdx === idx;

          return (
            <motion.button
              key={idx}
              layout
              onClick={() => onSelectStop(idx)}
              className={`w-full text-left flex items-center gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? 'border-primary/60 bg-primary/8 shadow-sm'
                  : 'border-border/30 hover:border-border/60 hover:bg-secondary/20'
              }`}
              aria-label={`Focus map on ${config.label} stop`}
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ background: config.color, outline: `2px solid ${config.color}40` }}
              />
              <div className="min-w-0 flex-1">
                <p
                  className="text-xs font-semibold truncate"
                  style={isSelected ? { color: config.color } : undefined}
                >
                  {config.label}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {stop.location.split(',')[0]}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {stop.miles_traveled.toFixed(0)} mi
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
});
TripInfoPanel.displayName = 'TripInfoPanel';

// ─── Empty State ─────────────────────────────────────────────────────────────

const EmptyMapState: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Card className="h-full border-border/50 bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden select-none min-h-[500px]">
      <div className="absolute inset-0 bg-[radial-gradient(rgba(59,130,246,0.06)_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-transparent to-purple-950/20" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="z-10 flex flex-col items-center gap-4 text-center p-8 max-w-sm"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="rounded-2xl bg-primary/10 border border-primary/20 p-5"
        >
          <Navigation className="h-10 w-10 text-primary" />
        </motion.div>
        <div className="space-y-2">
          <h3 className="font-bold text-lg text-zinc-100">No Route Planned</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Plan a trip first to visualize the route, stops, and compliance schedule on the interactive map.
          </p>
        </div>
        <Button onClick={() => navigate('/planner')} className="mt-1 flex items-center gap-2">
          Plan a Trip <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </Card>
  );
};

// ─── Map Skeleton Loader ──────────────────────────────────────────────────────

const MapSkeleton: React.FC = () => (
  <div className="h-full min-h-[500px] rounded-xl bg-zinc-900 border border-border/30 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3 text-zinc-500">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
      <p className="text-sm font-medium">Loading map engine…</p>
    </div>
  </div>
);

// ─── Main RouteMap Page ───────────────────────────────────────────────────────

export const RouteMap: React.FC = () => {
  const { plannedTrip, selectedStopIdx, setSelectedStopIdx, mapTheme, setMapTheme } = useUI();

  const handleSelectStop = useCallback((idx: number | null) => {
    setSelectedStopIdx(idx);
  }, [setSelectedStopIdx]);

  const handleToggleTheme = useCallback(() => {
    setMapTheme(mapTheme === 'dark' ? 'light' : 'dark');
  }, [mapTheme, setMapTheme]);

  return (
    <div className="flex flex-col gap-4 h-full" style={{ minHeight: 'calc(100vh - 120px)' }}>
      <PageHeader
        title="Interactive Route Map"
        description="Geocoded checkpoints, HOS compliance stops, and driving route polyline rendered in real-time."
      />

      <div className="flex flex-col lg:flex-row gap-4 flex-1" style={{ minHeight: 0 }}>
        {/* Left: Info Panel (only when trip exists) */}
        {plannedTrip && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:w-72 xl:w-80 shrink-0"
          >
            <Card className="h-full">
              <div className="px-4 pt-4 pb-2 border-b border-border/30">
                <p className="font-semibold text-sm">Trip Summary</p>
                <p className="text-xs text-muted-foreground mt-0.5">Click a stop to center the map</p>
              </div>
              <CardContent className="p-3 h-[calc(100%-56px)]">
                <TripInfoPanel
                  trip={plannedTrip}
                  selectedStopIdx={selectedStopIdx}
                  onSelectStop={(idx) => handleSelectStop(idx)}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Right: Map Canvas */}
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex-1 min-h-[500px] lg:min-h-0"
        >
          {plannedTrip ? (
            <Suspense fallback={<MapSkeleton />}>
              <MapCanvas
                trip={plannedTrip}
                selectedStopIdx={selectedStopIdx}
                onSelectStop={handleSelectStop}
                mapTheme={mapTheme}
                onToggleTheme={handleToggleTheme}
              />
            </Suspense>
          ) : (
            <EmptyMapState />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default RouteMap;
