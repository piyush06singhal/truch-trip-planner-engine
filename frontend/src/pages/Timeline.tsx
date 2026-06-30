import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useUI } from '../context/UIContext';
import { MARKER_CONFIGS, StopType } from '../constants/mapMarkers';
import { Clock, Play, MapPin, Coffee, Moon, Fuel } from 'lucide-react';
import { motion } from 'framer-motion';

export const Timeline: React.FC = () => {
  const { plannedTrip, selectedStopIdx, setSelectedStopIdx } = useUI();
  const navigate = useNavigate();
  const stopRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto-scroll to selected stop when changed externally (e.g. from map click)
  useEffect(() => {
    if (selectedStopIdx !== null && stopRefs.current[selectedStopIdx]) {
      stopRefs.current[selectedStopIdx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedStopIdx]);

  const getStopDetails = (type: string) => {
    switch (type) {
      case 'ORIGIN':      return { title: 'Trip Started', icon: Play, color: 'text-primary bg-primary/10' };
      case 'PICKUP':      return { title: 'Cargo Loading (Pickup)', icon: MapPin, color: 'text-purple-500 bg-purple-500/10' };
      case 'DROPOFF':     return { title: 'Cargo Unloading (Dropoff)', icon: MapPin, color: 'text-green-500 bg-green-500/10' };
      case 'REST_STOP':   return { title: 'Mandatory 30-Min Rest Break', icon: Coffee, color: 'text-amber-500 bg-amber-500/10' };
      case 'SLEEP_STOP':  return { title: '10-Hour Daily Sleeper Rest', icon: Moon, color: 'text-cyan-500 bg-cyan-500/10' };
      case 'FUEL_STOP':   return { title: 'Vehicle Fueling Stop', icon: Fuel, color: 'text-pink-500 bg-pink-500/10' };
      default:            return { title: 'Waystation Checkpoint', icon: Clock, color: 'text-muted-foreground bg-secondary/15' };
    }
  };

  const handleStopClick = (idx: number) => {
    setSelectedStopIdx(idx);
    navigate('/map');
  };

  const formatTime = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleString('en-US', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
      });
    } catch { return isoStr; }
  };

  const timelineItems = plannedTrip
    ? plannedTrip.stops.map((stop, idx) => {
        const details = getStopDetails(stop.type);
        const config = MARKER_CONFIGS[stop.type as StopType] ?? MARKER_CONFIGS.REST_STOP;
        return {
          idx,
          type: stop.type,
          time: formatTime(stop.arrival_time),
          duration: `${stop.duration_hours}h`,
          icon: details.icon,
          color: details.color,
          title: details.title,
          location: stop.location,
          remark: `Arrived after ${stop.miles_traveled.toLocaleString()} miles of cumulative driving`,
          markerColor: config.color,
        };
      })
    : [
        { idx: 0, type: 'TRIP_START', time: 'Jun 30, 08:00 AM', duration: '0.0h', icon: Play,    color: 'text-primary bg-primary/10',        title: 'Trip Started',          location: 'New York, NY',    remark: 'Trip planning engine initiated',              markerColor: '#3b82f6' },
        { idx: 1, type: 'REST_STOP',  time: 'Jun 30, 04:00 PM', duration: '0.5h', icon: Coffee,  color: 'text-amber-500 bg-amber-500/10',    title: 'Rest Break',            location: 'Rest Area',       remark: 'Mandatory 30-minute off-duty break',          markerColor: '#f59e0b' },
        { idx: 2, type: 'SLEEP_STOP', time: 'Jun 30, 07:30 PM', duration: '10.0h', icon: Moon,   color: 'text-cyan-500 bg-cyan-500/10',      title: 'Sleeper Berth Rest',    location: 'Truck Stop',      remark: '10 consecutive hours off duty',               markerColor: '#06b6d4' },
        { idx: 3, type: 'PICKUP',     time: 'Jul 01, 05:30 AM', duration: '1.0h', icon: MapPin,  color: 'text-purple-500 bg-purple-500/10',  title: 'Pickup Load',           location: 'Chicago Terminal', remark: 'On Duty Non-Driving cargo loading',          markerColor: '#a855f7' },
      ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chronological Timeline"
        description="Click any stop to center the interactive map on that checkpoint."
      />

      <Card>
        <CardHeader>
          <CardTitle>Itinerary Compliance Log</CardTitle>
          <CardDescription>Step-by-step dispatch summary — click a stop to view it on the map.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="relative border-l-2 border-border/60 pl-6 ml-4 space-y-6 select-none">
            {timelineItems.map((item) => {
              const isSelected = selectedStopIdx === item.idx;
              return (
                <motion.div
                  key={item.idx}
                  ref={(el) => { stopRefs.current[item.idx] = el; }}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: item.idx * 0.04 }}
                  className="relative group"
                >
                  {/* Timeline node */}
                  <div
                    className={`absolute -left-[40px] top-0 rounded-full border-2 p-2 ${item.color} shrink-0 transition-all duration-200 z-10 ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}
                    style={isSelected ? { outline: `2px solid ${item.markerColor}`, outlineOffset: '2px' } : undefined}
                  >
                    <item.icon className="h-4 w-4" />
                  </div>

                  {/* Stop card — clicking opens map */}
                  <button
                    onClick={() => handleStopClick(item.idx)}
                    className={`w-full text-left flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? 'border-primary/50 bg-primary/5 shadow-md'
                        : 'border-border/40 bg-card/40 hover:border-border hover:bg-card/70'
                    }`}
                    aria-label={`Go to ${item.title} on map`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="font-semibold text-sm text-foreground">{item.title}</h5>
                        <Badge variant="outline" className="text-[10px]">{item.duration}</Badge>
                        {isSelected && (
                          <Badge variant="secondary" className="text-[10px] text-primary border-primary/30">
                            ↗ On Map
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.remark}</p>
                      <p className="text-xs font-medium flex items-center gap-1" style={{ color: item.markerColor }}>
                        <MapPin className="h-3 w-3" />
                        {item.location.split(',').slice(0, 2).join(',')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-semibold text-muted-foreground block">{item.time}</span>
                      <Badge variant="secondary" className="mt-1 text-[10px] uppercase font-bold">
                        {item.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Timeline;
