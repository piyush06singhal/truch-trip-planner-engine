import React, { memo } from 'react';
import { useMap } from 'react-leaflet';
import { LatLngBounds, LatLngExpression } from 'leaflet';
import { Maximize2, Crosshair, RotateCcw, Sun, Moon, Layers } from 'lucide-react';

interface MapControlsProps {
  bounds: LatLngBounds | null;
  defaultCenter: LatLngExpression;
  defaultZoom: number;
  isDark: boolean;
  onToggleTheme: () => void;
}

// Inner component that uses the map hook (must be child of MapContainer)
const MapControlsInner: React.FC<MapControlsProps> = memo(({
  bounds, defaultCenter, defaultZoom, isDark, onToggleTheme
}) => {
  const map = useMap();

  const handleFitBounds = () => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  };

  const handleLocateMe = () => {
    map.locate({ setView: true, maxZoom: 13 });
  };

  const handleResetView = () => {
    map.setView(defaultCenter, defaultZoom, { animate: true });
  };

  const handleFullscreen = () => {
    const container = map.getContainer();
    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const btnBase = `
    w-9 h-9 flex items-center justify-center rounded-lg border border-white/10
    text-zinc-300 hover:text-white hover:bg-white/15 transition-all duration-150
    backdrop-blur-sm cursor-pointer select-none
  `;

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: '12px',
    right: '12px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  };

  const panelStyle: React.CSSProperties = {
    background: 'rgba(15,15,20,0.85)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };

  return (
    <div style={containerStyle}>
      <div style={panelStyle}>
        <button
          onClick={handleFitBounds}
          className={btnBase}
          title="Fit route to view"
          aria-label="Fit route bounds"
        >
          <Layers className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          className={btnBase}
          title="Reset map view"
          aria-label="Reset view"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={handleLocateMe}
          className={btnBase}
          title="Locate my position"
          aria-label="Locate me"
        >
          <Crosshair className="w-4 h-4" />
        </button>
        <button
          onClick={handleFullscreen}
          className={btnBase}
          title="Toggle fullscreen"
          aria-label="Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Theme toggle */}
      <div style={panelStyle}>
        <button
          onClick={onToggleTheme}
          className={btnBase}
          title={isDark ? 'Switch to light map' : 'Switch to dark map'}
          aria-label="Toggle map theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
        </button>
      </div>
    </div>
  );
});

MapControlsInner.displayName = 'MapControlsInner';
export default MapControlsInner;
