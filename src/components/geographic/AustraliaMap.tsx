'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function MapResizer() {
  const map = useMap();
  useEffect(() => { setTimeout(() => map.invalidateSize(), 100); }, [map]);
  return null;
}

function densityColor(advisersPerCapita: number): string {
  if (advisersPerCapita < 2) return '#e0e9ff';
  if (advisersPerCapita < 4) return '#8fa8ff';
  if (advisersPerCapita < 7) return '#2e52e9';
  if (advisersPerCapita < 12) return '#1a35cc';
  return '#0a1140';
}

function whitespaceColor(score: number): string {
  if (score > 70) return '#16a34a';
  if (score > 50) return '#65a30d';
  if (score > 30) return '#ca8a04';
  if (score > 10) return '#dc2626';
  return '#7f1d1d';
}

interface Props {
  regions: any[];
  view: 'density' | 'whitespace';
  onSelect: (r: any) => void;
}

export default function AustraliaMap({ regions, view, onSelect }: Props) {
  return (
    <MapContainer center={[-27, 134]} zoom={4} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
      <MapResizer />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {regions.map(r => {
        const [lat, lng] = r.coordinates;
        if (!lat || !lng) return null;
        const radius = Math.max(6, Math.min(28, Math.sqrt(r.adviserCount) * 1.5));
        const color = view === 'density' ? densityColor(r.advisersPerCapita) : whitespaceColor(r.whiteSpaceScore);
        return (
          <CircleMarker key={r.regionCode} center={[lat, lng]} radius={radius}
            pathOptions={{ fillColor: color, color: '#fff', weight: 1, fillOpacity: 0.75 }}
            eventHandlers={{ click: () => onSelect(r) }}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-semibold">{r.regionName}</p>
                <p>Advisers: {r.adviserCount}</p>
                <p>Per 10K: {r.advisersPerCapita}</p>
                <p>White-space: {r.whiteSpaceScore}/100</p>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
