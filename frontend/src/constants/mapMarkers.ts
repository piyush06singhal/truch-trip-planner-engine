// Centralized marker configuration for all stop types
// Each entry defines: color hex, Tailwind class, label, and SVG path

export type StopType = 'ORIGIN' | 'PICKUP' | 'DROPOFF' | 'REST_STOP' | 'FUEL_STOP' | 'SLEEP_STOP';

export interface MarkerConfig {
  color: string;        // hex color for SVG fill
  glowColor: string;    // rgba for drop shadow glow
  label: string;        // display label
  emoji: string;        // fallback emoji icon inside pin
  legendColor: string;  // Tailwind bg class for legend dot
  zIndex: number;       // Leaflet z-index priority
}

export const MARKER_CONFIGS: Record<StopType, MarkerConfig> = {
  ORIGIN: {
    color: '#3b82f6',
    glowColor: 'rgba(59,130,246,0.5)',
    label: 'Origin',
    emoji: '🚛',
    legendColor: 'bg-blue-500',
    zIndex: 1000,
  },
  PICKUP: {
    color: '#a855f7',
    glowColor: 'rgba(168,85,247,0.5)',
    label: 'Pickup',
    emoji: '📦',
    legendColor: 'bg-purple-500',
    zIndex: 900,
  },
  DROPOFF: {
    color: '#22c55e',
    glowColor: 'rgba(34,197,94,0.5)',
    label: 'Dropoff',
    emoji: '✅',
    legendColor: 'bg-green-500',
    zIndex: 900,
  },
  REST_STOP: {
    color: '#f59e0b',
    glowColor: 'rgba(245,158,11,0.5)',
    label: 'Rest Break',
    emoji: '☕',
    legendColor: 'bg-amber-500',
    zIndex: 800,
  },
  SLEEP_STOP: {
    color: '#06b6d4',
    glowColor: 'rgba(6,182,212,0.5)',
    label: 'Sleep Layover',
    emoji: '🌙',
    legendColor: 'bg-cyan-500',
    zIndex: 800,
  },
  FUEL_STOP: {
    color: '#ec4899',
    glowColor: 'rgba(236,72,153,0.5)',
    label: 'Fuel Stop',
    emoji: '⛽',
    legendColor: 'bg-pink-500',
    zIndex: 800,
  },
};

// Create a Leaflet-compatible divIcon HTML string for a given stop type
export function createMarkerHtml(type: StopType, isSelected: boolean): string {
  const config = MARKER_CONFIGS[type];
  const size = isSelected ? 44 : 36;
  const fontSize = isSelected ? '18px' : '15px';
  const shadow = isSelected
    ? `filter: drop-shadow(0 0 10px ${config.glowColor}) drop-shadow(0 0 4px ${config.glowColor});`
    : `filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));`;

  return `
    <div style="
      position: relative;
      width: ${size}px;
      height: ${size + 10}px;
      display: flex;
      flex-direction: column;
      align-items: center;
      ${shadow}
      transition: all 0.2s ease;
    ">
      <svg width="${size}" height="${size}" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="19" fill="${config.color}" stroke="white" stroke-width="2.5"/>
        <text x="20" y="26" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle">${config.emoji}</text>
      </svg>
      <div style="
        width: 2px;
        height: 10px;
        background: ${config.color};
        border-radius: 0 0 2px 2px;
      "></div>
    </div>
  `;
}

// Tile layer URLs
export const TILE_LAYERS = {
  light: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
  },
} as const;
