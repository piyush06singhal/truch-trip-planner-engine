import React, { memo, useCallback } from 'react';
import { Marker, Popup, Tooltip } from 'react-leaflet';
import { divIcon, LatLngExpression } from 'leaflet';
import { Stop } from '../../types/trip';
import { StopType, MARKER_CONFIGS, createMarkerHtml } from '../../constants/mapMarkers';

export interface StopWithCoords extends Stop {
  lat: number;
  lng: number;
}

interface StopMarkersProps {
  stops: StopWithCoords[];
  selectedIdx: number | null;
  onSelectStop: (idx: number) => void;
}

function formatArrival(isoStr: string): string {
  try {
    return new Date(isoStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch {
    return isoStr;
  }
}

const StopMarkers: React.FC<StopMarkersProps> = memo(({ stops, selectedIdx, onSelectStop }) => {
  const handleClick = useCallback((idx: number) => {
    onSelectStop(idx);
  }, [onSelectStop]);

  return (
    <>
      {stops.map((stop, idx) => {
        const type = stop.type as StopType;
        const config = MARKER_CONFIGS[type] ?? MARKER_CONFIGS.REST_STOP;
        const isSelected = selectedIdx === idx;
        const iconSize: [number, number] = isSelected ? [44, 54] : [36, 46];
        const iconAnchor: [number, number] = [iconSize[0] / 2, iconSize[1]];

        const icon = divIcon({
          html: createMarkerHtml(type, isSelected),
          className: '',
          iconSize,
          iconAnchor,
          popupAnchor: [0, -iconSize[1]],
        });

        const position: LatLngExpression = [stop.lat, stop.lng];

        return (
          <Marker
            key={`stop-${idx}`}
            position={position}
            icon={icon}
            zIndexOffset={isSelected ? 1200 : config.zIndex}
            eventHandlers={{ click: () => handleClick(idx) }}
          >
            <Tooltip
              direction="top"
              offset={[0, -iconSize[1] + 8]}
              opacity={1}
              permanent={false}
              className="map-tooltip"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs" style={{ color: config.color }}>
                  {config.label}
                </span>
                <span className="text-[10px] text-zinc-400">
                  {formatArrival(stop.arrival_time)}
                </span>
              </div>
            </Tooltip>

            <Popup
              offset={[0, -iconSize[1] + 4]}
              closeButton
              className="map-popup"
            >
              <div className="min-w-[200px] space-y-2 p-1">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{ background: config.color + '22', color: config.color }}
                  >
                    {config.label}
                  </span>
                </div>
                <p className="text-xs font-semibold text-zinc-200 leading-snug">
                  {stop.location.split(',').slice(0, 3).join(', ')}
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                  <span className="text-zinc-500">Arrival</span>
                  <span className="text-zinc-200 font-medium">{formatArrival(stop.arrival_time)}</span>
                  <span className="text-zinc-500">Duration</span>
                  <span className="text-zinc-200 font-medium">
                    {stop.duration_hours > 0 ? `${stop.duration_hours}h` : 'Transit'}
                  </span>
                  <span className="text-zinc-500">Mile Mark</span>
                  <span className="text-zinc-200 font-medium">{stop.miles_traveled.toFixed(1)} mi</span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
});

StopMarkers.displayName = 'StopMarkers';
export default StopMarkers;
