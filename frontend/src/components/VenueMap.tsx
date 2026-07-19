import React from 'react';

interface VenueMapProps {
  route?: string[];
}

// Simple coordinate mapping for our mock zones and gates
const LOCATIONS: Record<string, { x: number; y: number }> = {
  "Gate A": { x: 50, y: 50 },
  "Zone 1": { x: 150, y: 150 },
  "Zone 5": { x: 250, y: 150 },
  "Gate B": { x: 350, y: 50 },
  "Concourse Zone 2": { x: 150, y: 250 },
  "Concourse Zone 5": { x: 250, y: 250 },
};

export default function VenueMap({ route = [] }: VenueMapProps) {
  // Find valid points from the route
  const points = route
    .map((loc) => LOCATIONS[loc])
    .filter(Boolean);

  return (
    <div className="w-full h-64 bg-slate-100 rounded-lg overflow-hidden border border-slate-300 relative shadow-inner">
      <svg viewBox="0 0 400 300" className="w-full h-full">
        {/* Draw all locations as nodes */}
        {Object.entries(LOCATIONS).map(([name, { x, y }]) => (
          <g key={name}>
            <circle cx={x} cy={y} r={6} className="fill-slate-400" />
            <text x={x} y={y - 12} className="text-[10px] fill-slate-600 font-medium" textAnchor="middle">
              {name}
            </text>
          </g>
        ))}

        {/* Draw the route path */}
        {points.length > 1 && (
          <path
            d={`M ${points.map((p) => `${p.x} ${p.y}`).join(' L ')}`}
            fill="none"
            stroke="#3b82f6" // blue-500
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-pulse"
          />
        )}
        
        {/* Highlight route points */}
        {points.map((p, i) => (
          <circle key={`p-${i}`} cx={p.x} cy={p.y} r={8} className="fill-blue-600" />
        ))}
      </svg>
      {route.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium bg-white/50 backdrop-blur-sm">
          No active route
        </div>
      )}
    </div>
  );
}
