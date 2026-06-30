import React, { memo } from 'react';
import { MARKER_CONFIGS, StopType } from '../../constants/mapMarkers';

const LEGEND_ITEMS: { type: StopType; label: string }[] = [
  { type: 'ORIGIN', label: 'Origin' },
  { type: 'PICKUP', label: 'Pickup' },
  { type: 'DROPOFF', label: 'Dropoff' },
  { type: 'REST_STOP', label: 'Rest Break' },
  { type: 'SLEEP_STOP', label: 'Sleep Stop' },
  { type: 'FUEL_STOP', label: 'Fuel Stop' },
];

const MapLegend: React.FC = memo(() => {
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '32px',
    left: '12px',
    zIndex: 1000,
    background: 'rgba(12,12,18,0.90)',
    backdropFilter: 'blur(14px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '12px 14px',
    minWidth: '150px',
  };

  return (
    <div style={containerStyle}>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
        Map Legend
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Route line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '22px', height: '3px', background: '#3b82f6', borderRadius: '2px', flexShrink: 0 }} />
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>Driving Route</span>
        </div>
        {LEGEND_ITEMS.map(({ type, label }) => {
          const config = MARKER_CONFIGS[type];
          return (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '12px', height: '12px', borderRadius: '50%',
                background: config.color, flexShrink: 0,
                border: '2px solid rgba(255,255,255,0.2)',
              }} />
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

MapLegend.displayName = 'MapLegend';
export default MapLegend;
