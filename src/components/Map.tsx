"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

// Fix for default marker icons in Next.js
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

interface MapProps {
  center: [number, number];
  zoom?: number;
  markers?: Array<{
    position: [number, number];
    popup?: string;
    icon?: "pickup" | "dropoff" | "driver";
  }>;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
}

// Custom icons
const createIcon = (color: string) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      ">
        <div style="
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
};

const icons = {
  pickup: createIcon("#4CAF50"), // أخضر
  dropoff: createIcon("#F44336"), // أحمر
  driver: createIcon("#2196F3"), // أزرق
};

// Component to handle map events
function MapEvents({
  onMapClick,
}: {
  onMapClick?: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (onMapClick) {
      const handleClick = (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      };

      map.on("click", handleClick);

      return () => {
        map.off("click", handleClick);
      };
    }
  }, [map, onMapClick]);

  return null;
}

// Component to update map center
function ChangeView({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  const prevCenter = useRef(center);

  useEffect(() => {
    // Only update if center actually changed
    if (
      prevCenter.current[0] !== center[0] ||
      prevCenter.current[1] !== center[1]
    ) {
      map.setView(center, zoom);
      prevCenter.current = center;
    }
  }, [center, zoom, map]);

  return null;
}

export default function Map({
  center,
  zoom = 13,
  markers = [],
  onMapClick,
  className = "h-96 w-full",
}: MapProps) {
  // Use a stable key to prevent re-initialization

  return (
    <MapContainer
   
      center={center}
      zoom={zoom}
      className={className}
      style={{ height: "100%", width: "100%", zIndex: 0 }}
      scrollWheelZoom={true}
    >
      <ChangeView center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((marker, idx) => (
        <Marker
          // key={`marker-${idx}-${marker.position[0]}-${marker.position[1]}`}
          position={marker.position}
          icon={marker.icon ? icons[marker.icon] : undefined}
        >
          {marker.popup && <Popup>{marker.popup}</Popup>}
        </Marker>
      ))}
      {onMapClick && <MapEvents onMapClick={onMapClick} />}
    </MapContainer>
  );
}
