import React, { memo } from 'react';
import { Polyline } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';

interface RoutePolylineProps {
  geometry: [number, number][];
}

const RoutePolyline: React.FC<RoutePolylineProps> = memo(({ geometry }) => {
  if (!geometry || geometry.length < 2) return null;

  const positions = geometry as LatLngExpression[];

  return (
    <>
      {/* Glow shadow layer for premium look */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: '#3b82f6',
          weight: 10,
          opacity: 0.2,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
      {/* Main driving route line */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: '#3b82f6',
          weight: 4,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
          dashArray: undefined,
        }}
      />
    </>
  );
});

RoutePolyline.displayName = 'RoutePolyline';
export default RoutePolyline;
