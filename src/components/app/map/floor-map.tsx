"use client";

import type {
  LatLngBounds,
  LatLngExpression,
  LeafletKeyboardEvent,
  LeafletMouseEvent,
} from "leaflet";
import L, { CRS } from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import {
  ImageOverlay,
  MapContainer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { cn } from "@/lib/utils";
import type { ItemStatus, RelativePoint } from "@/types/app";

const STATUS_COLORS: Record<ItemStatus, { fill: string; stroke: string }> = {
  issue: { fill: "#f97316", stroke: "#c2410c" },
  moving: { fill: "#facc15", stroke: "#b45309" },
  placed: { fill: "#22c55e", stroke: "#15803d" },
  unplaced: { fill: "#ef4444", stroke: "#b91c1c" },
};

const STATUS_LABEL: Record<ItemStatus, string> = {
  issue: "問題あり",
  moving: "移動中",
  placed: "配置済み",
  unplaced: "未配置",
};

const MAP_PADDING_PX = 80;
const PIN_SIZE_DEFAULT = 16;
const PIN_SIZE_FOCUSED = 24;
const PIN_RING_DEFAULT = 3;
const PIN_RING_FOCUSED = 6;

export type FloorDescriptor = {
  id: string;
  imageUrl: string;
  width: number;
  height: number;
};

export type FloorMapPin = {
  id: string;
  itemId: string;
  label: string;
  x: number;
  y: number;
  kind: "source" | "target";
  status: ItemStatus;
  isFocused?: boolean;
};

type FloorMapProps = {
  floor: FloorDescriptor | null;
  pins: FloorMapPin[];
  onPlace?: (point: RelativePoint) => void;
  onPinSelect?: (pin: FloorMapPin) => void;
  mapLabel?: string;
  descriptionId?: string;
  className?: string;
  focusedPinId?: string | null;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function createPinIcon(pin: FloorMapPin): L.DivIcon {
  const palette = STATUS_COLORS[pin.status];
  const size = pin.isFocused ? PIN_SIZE_FOCUSED : PIN_SIZE_DEFAULT;
  const background = pin.kind === "target" ? palette.fill : "#ffffff";
  const html = `
    <span
      style="
        display:block;
        width:${size}px;
        height:${size}px;
        border-radius:9999px;
        border:2px solid ${palette.stroke};
        background:${background};
        box-shadow:0 0 0 ${pin.isFocused ? PIN_RING_FOCUSED : PIN_RING_DEFAULT}px rgba(255,255,255,0.85);
      "
    />
  `;

  return L.divIcon({
    className: "",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function MapClickHandler({
  onPlace,
  floor,
}: {
  onPlace: (point: RelativePoint) => void;
  floor: FloorDescriptor;
}) {
  useMapEvents({
    click(event: LeafletMouseEvent) {
      const { lat, lng } = event.latlng;
      const x = clamp(lng / floor.width, 0, 1);
      const y = clamp(lat / floor.height, 0, 1);
      onPlace({ x, y });
    },
  });
  return null;
}

function MapPinFocusHandler({
  pins,
  focusedPinId,
  floor,
}: {
  pins: FloorMapPin[];
  focusedPinId: string | null;
  floor: FloorDescriptor;
}) {
  const map = useMap();

  useEffect(() => {
    if (!focusedPinId) {
      return;
    }

    const pin = pins.find((p) => p.id === focusedPinId);
    if (!pin) {
      return;
    }

    const position: LatLngExpression = [
      floor.height * pin.y,
      floor.width * pin.x,
    ];

    map.flyTo(position, 1, {
      duration: 0.8,
      easeLinearity: 0.25,
    });
  }, [focusedPinId, pins, floor.height, floor.width, map]);

  return null;
}

type InteractiveMarkerProps = {
  pin: FloorMapPin;
  position: LatLngExpression;
  onSelect?: (pin: FloorMapPin) => void;
};

function InteractiveMarker({
  pin,
  position,
  onSelect,
}: InteractiveMarkerProps) {
  const markerRef = useRef<L.Marker | null>(null);
  const isInteractive = typeof onSelect === "function";
  const canSelect = Boolean(isInteractive && onSelect);

  useEffect(() => {
    const element = markerRef.current?.getElement();
    if (!element) {
      return;
    }

    const pointLabel = pin.kind === "source" ? "借用元" : "移動先";
    const baseLabel = `${pin.label}（${pointLabel}）`;
    const statusLabel = STATUS_LABEL[pin.status];
    const ariaLabel = statusLabel
      ? `${baseLabel} - 状態: ${statusLabel}`
      : baseLabel;

    element.setAttribute("aria-label", ariaLabel);
    element.setAttribute("data-map-pin", pin.id);

    if (canSelect) {
      element.setAttribute("role", "button");
      element.setAttribute("tabindex", "0");
    } else {
      element.setAttribute("role", "img");
      element.setAttribute("tabindex", "-1");
    }
  }, [canSelect, pin.id, pin.kind, pin.label, pin.status]);

  const eventHandlers = useMemo(() => {
    if (!canSelect) {
      return;
    }

    const handler = onSelect;
    if (!handler) {
      return;
    }

    return {
      click: () => {
        handler(pin);
      },
      keydown: (event: LeafletKeyboardEvent) => {
        const key = event.originalEvent.key;
        if (key === "Enter" || key === " ") {
          event.originalEvent.preventDefault();
          handler(pin);
        }
      },
    };
  }, [canSelect, onSelect, pin]);

  const markerTitle = `${pin.label} (${pin.kind === "source" ? "借用元" : "移動先"})`;

  return (
    <Marker
      eventHandlers={eventHandlers}
      icon={createPinIcon(pin)}
      keyboard={canSelect}
      position={position}
      ref={markerRef}
      title={markerTitle}
    />
  );
}

export function FloorMap({
  floor,
  pins,
  onPlace,
  onPinSelect,
  mapLabel,
  descriptionId,
  className,
  focusedPinId,
}: FloorMapProps) {
  const bounds = useMemo<LatLngBounds | null>(() => {
    if (!floor) {
      return null;
    }

    return L.latLngBounds(
      [0, 0] as unknown as LatLngExpression,
      [floor.height, floor.width] as unknown as LatLngExpression
    );
  }, [floor]);

  if (!floor) {
    return (
      <div
        className={cn(
          "grid h-[28rem] w-full place-items-center rounded-lg border border-dashed text-muted-foreground",
          className
        )}
      >
        表示する図面を選択してください
      </div>
    );
  }

  if (!bounds) {
    return null;
  }

  return (
    <section
      aria-describedby={descriptionId}
      aria-label={mapLabel ?? "構内図面"}
      className={cn("h-[28rem] w-full", className)}
    >
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: L.point(MAP_PADDING_PX, MAP_PADDING_PX) }}
        className="z-0 h-full w-full rounded-lg border"
        crs={CRS.Simple}
        key={floor.id}
        maxZoom={2}
        minZoom={-2}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <ImageOverlay bounds={bounds} url={floor.imageUrl} />
        {pins.map((pin) => {
          const position: LatLngExpression = [
            floor.height * pin.y,
            floor.width * pin.x,
          ];
          return (
            <InteractiveMarker
              key={pin.id}
              onSelect={onPinSelect}
              pin={pin}
              position={position}
            />
          );
        })}
        {onPlace ? <MapClickHandler floor={floor} onPlace={onPlace} /> : null}
        {focusedPinId ? (
          <MapPinFocusHandler
            floor={floor}
            focusedPinId={focusedPinId}
            pins={pins}
          />
        ) : null}
      </MapContainer>
    </section>
  );
}
