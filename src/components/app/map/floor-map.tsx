'use client';

import { MapContainer, ImageOverlay, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { type Floor, type Item, type RelativeXY } from '@/types/app';
import { useMemo } from 'react';

// Default Leaflet icons are not available out-of-the-box in Next.js
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconRetinaUrl: iconRetinaUrl.src,
  iconUrl: iconUrl.src,
  shadowUrl: shadowUrl.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

export const statusColors: Record<Item['status'], string> = {
  unplaced: 'gray',
  moving: 'blue',
  placed: 'green',
  issue: 'red',
};

export function createColoredIcon(color: string) {
  const markerHtmlStyles = `
    background-color: ${color};
    width: 1.5rem;
    height: 1.5rem;
    display: block;
    left: -0.75rem;
    top: -0.75rem;
    position: relative;
    border-radius: 1.5rem 1.5rem 0;
    transform: rotate(45deg);
    border: 1px solid #FFFFFF;
  `;
  return L.divIcon({
    className: 'my-custom-pin',
    iconAnchor: [0, 24],
    popupAnchor: [0, -36],
    html: `<span style="${markerHtmlStyles}" />`,
  });
}

// --- Click Handler for Place Mode ---
function ClickHandler({
  placeMode,
  floor,
}: {
  placeMode?: FloorMapProps['placeMode'];
  floor: Floor;
}) {
  useMapEvents({
    click(e) {
      if (!placeMode?.enabled) return;
      const { lat, lng } = e.latlng; // lat=Y, lng=X
      const x = Math.min(Math.max(lng / floor.width, 0), 1);
      const y = Math.min(Math.max(lat / floor.height, 0), 1);
      placeMode.onPlace({ x, y });
    },
  });
  return null;
}

// --- Main Component ---
export interface FloorMapProps {
  floor: Floor;
  items?: Item[];
  pins?: { xy: RelativeXY; color: string; message?: string }[];
  placeMode?: {
    enabled: boolean;
    onPlace: (p: RelativeXY) => void;
  };
}

export function FloorMap({ floor, items = [], pins = [], placeMode }: FloorMapProps) {
  const bounds: L.LatLngBoundsExpression = [
    [0, 0],
    [floor.height, floor.width],
  ];

  const itemPins = useMemo(() => {
    return items
      .filter(
        (item) =>
          item.pin &&
          item.pin.areaId === floor.id.split('-')[0] &&
          item.pin.floorId === floor.id,
      )
      .flatMap((item) => {
        const itemPins = [];
        if (item.pin?.source) {
          itemPins.push({
            id: `${item.id}-source`,
            latlng: [floor.height * item.pin.source.y, floor.width * item.pin.source.x] as [number, number],
            color: statusColors[item.status],
            popup: `[借] ${item.name} (${item.status})`,
          });
        }
        if (item.pin?.target) {
          itemPins.push({
            id: `${item.id}-target`,
            latlng: [floor.height * item.pin.target.y, floor.width * item.pin.target.x] as [number, number],
            color: statusColors[item.status],
            popup: `[移] ${item.name} (${item.status})`,
          });
        }
        return itemPins;
      });
  }, [items, floor]);

  const temporaryPins = useMemo(() => {
    return pins.map((pin, index) => ({
      id: `temp-${index}`,
      latlng: [floor.height * pin.xy.y, floor.width * pin.xy.x] as [number, number],
      color: pin.color,
      popup: pin.message,
    }));
  }, [pins, floor]);

  const allPins = [...itemPins, ...temporaryPins];

  return (
    <MapContainer
      crs={L.CRS.Simple}
      bounds={bounds}
      zoom={0}
      minZoom={-2}
      className="h-[calc(100vh-400px)] w-full border rounded-md"
    >
      <ImageOverlay url={floor.imageUrl} bounds={bounds} />

      {allPins.map((pin) => (
        <Marker key={pin.id} position={pin.latlng} icon={createColoredIcon(pin.color)}>
          {pin.popup && (
            <Popup>
              <div className="text-sm">{pin.popup}</div>
            </Popup>
          )}
        </Marker>
      ))}

      <ClickHandler placeMode={placeMode} floor={floor} />
    </MapContainer>
  );
}