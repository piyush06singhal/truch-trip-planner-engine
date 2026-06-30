import React, { memo, useEffect, useMemo, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, ScaleControl, useMap } from 'react-leaflet';
import { LatLngBounds, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { TripResponse, Stop } from '../../types/trip';
import { MapTheme } from '../../context/UIContext';
import { TILE_LAYERS } from '../../constants/mapMarkers';
import RoutePolyline from './RoutePolyline';
import StopMarkers, { StopWithCoords } from './StopMarkers';
import MapControls from './MapControls';
import MapLegend from './MapLegend';

// Sub-component that flies to selected stop (must live inside MapContainer)
const FlyToStop: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 13, { animate: true, duration: 1.2 });
  }, [map, lat, lng]);
  return null;
};

// Resolve stop coordinates from route_geometry by interpolating positions
function resolveStopCoords(
  stops: Stop[],
  geometry: [number, number][],
): { lat: number; lng: number }[] {
  if (!geometry || geometry.length === 0) return stops.map(() => ({ lat: 39.5, lng: -98.35 }));

  // Distribute stops across geometry proportionally by miles_traveled
  const totalMiles = stops[stops.length - 1]?.miles_traveled || 1;
  const totalPoints = geometry.length - 1;

  return stops.map(stop => {
    const fraction = totalMiles > 0 ? stop.miles_traveled / totalMiles : 0;
    const idx = Math.min(Math.round(fraction * totalPoints), totalPoints);
    const pt = geometry[idx] ?? geometry[0];
    return { lat: pt[0], lng: pt[1] };
  });
}

interface MapCanvasProps {
  trip: TripResponse;
  selectedStopIdx: number | null;
  onSelectStop: (idx: number | null) => void;
  mapTheme: MapTheme;
  onToggleTheme: () => void;
}

const MapCanvas: React.FC<MapCanvasProps> = memo(({
  trip, selectedStopIdx, onSelectStop, mapTheme, onToggleTheme
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Resolve stop coords from geometry
  const coordsPerStop = useMemo(
    () => resolveStopCoords(trip.stops, trip.route_geometry),
    [trip.stops, trip.route_geometry]
  );

  // Build StopWithCoords array
  const stopsWithCoords = useMemo<StopWithCoords[]>(
    () => trip.stops.map((stop, i) => ({
      ...stop,
      lat: coordsPerStop[i]?.lat ?? 39.5,
      lng: coordsPerStop[i]?.lng ?? -98.35,
    })),
    [trip.stops, coordsPerStop]
  );

  // Compute bounding box for the full route
  const bounds = useMemo<LatLngBounds | null>(() => {
    if (!trip.route_geometry || trip.route_geometry.length === 0) return null;
    const lats = trip.route_geometry.map(p => p[0]);
    const lngs = trip.route_geometry.map(p => p[1]);
    return new LatLngBounds(
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    );
  }, [trip.route_geometry]);

  // Map center = centroid of geometry
  const defaultCenter = useMemo<LatLngExpression>(() => {
    if (!bounds) return [39.5, -98.35];
    return bounds.getCenter();
  }, [bounds]);

  const tileLayer = TILE_LAYERS[mapTheme as keyof typeof TILE_LAYERS];

  const handleSelectStop = useCallback((idx: number) => {
    onSelectStop(idx);
  }, [onSelectStop]);

  const selectedStop = selectedStopIdx !== null ? stopsWithCoords[selectedStopIdx] : null;

  return (
    <div ref={containerRef} style={{ height: '100%', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer
        center={defaultCenter}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
        preferCanvas
      >
        {/* Tile Layer — switches between light/dark */}
        <TileLayer
          key={mapTheme}
          url={tileLayer.url}
          attribution={tileLayer.attribution}
          maxZoom={tileLayer.maxZoom}
        />

        {/* Route polyline */}
        <RoutePolyline geometry={trip.route_geometry} />

        {/* Stop markers */}
        <StopMarkers
          stops={stopsWithCoords}
          selectedIdx={selectedStopIdx}
          onSelectStop={handleSelectStop}
        />

        {/* Fly to selected stop on Timeline click */}
        {selectedStop && (
          <FlyToStop lat={selectedStop.lat} lng={selectedStop.lng} />
        )}

        {/* Controls panel */}
        <MapControls
          bounds={bounds}
          defaultCenter={defaultCenter}
          defaultZoom={5}
          isDark={mapTheme === 'dark'}
          onToggleTheme={onToggleTheme}
        />

        {/* Legend overlay */}
        <MapLegend />

        {/* Scale bar */}
        <ScaleControl position="bottomright" imperial maxWidth={100} />
      </MapContainer>
    </div>
  );
});

MapCanvas.displayName = 'MapCanvas';
export default MapCanvas;
