"use client";

import {
  GoogleMap,
  Marker,
  Polyline,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useCallback, useEffect, useRef, useState } from "react";

interface AdminRideMapProps {
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number };
  driverLocation?: { lat: number; lng: number } | null;
  onPickupChange?: (lat: number, lng: number) => void;
  onDropoffChange?: (lat: number, lng: number) => void;
  editable?: boolean;
}

const mapContainerStyle = { width: "100%", height: "100%" };

export default function AdminRideMap({
  pickup,
  dropoff,
  driverLocation,
  onPickupChange,
  onDropoffChange,
  editable = true,
}: AdminRideMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectingType, setSelectingType] = useState<
    "pickup" | "dropoff" | null
  >(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Fit bounds whenever relevant locations change
  useEffect(() => {
    if (!mapRef.current) return;

    const points = [pickup, dropoff];
    if (driverLocation) points.push(driverLocation);

    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
    mapRef.current.fitBounds(bounds, 60);
  }, [pickup, dropoff, driverLocation]);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!editable || !e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      if (selectingType === "pickup" && onPickupChange) {
        onPickupChange(lat, lng);
        setSelectingType(null);
      } else if (selectingType === "dropoff" && onDropoffChange) {
        onDropoffChange(lat, lng);
        setSelectingType(null);
      }
    },
    [editable, selectingType, onPickupChange, onDropoffChange],
  );

  if (!apiKey) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg bg-gray-100 text-center text-gray-500">
        <div>
          <div className="text-4xl mb-2">🗺️</div>
          <div className="font-semibold">Google Maps API key not configured</div>
          <div className="text-sm mt-1">
            Add <code className="bg-gray-200 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your .env file
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg bg-red-50 text-red-600">
        Failed to load Google Maps
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        Loading map...
      </div>
    );
  }

  // Route line points: driver → pickup → dropoff
  const routePoints = [
    ...(driverLocation ? [{ lat: driverLocation.lat, lng: driverLocation.lng }] : []),
    { lat: pickup.lat, lng: pickup.lng },
    { lat: dropoff.lat, lng: dropoff.lng },
  ];

  return (
    <div className="relative h-full w-full">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={13}
        center={pickup}
        onLoad={onMapLoad}
        onClick={handleMapClick}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {/* Pickup marker — green */}
        <Marker
          position={pickup}
          draggable={editable}
          onDragEnd={(e) => {
            if (e.latLng && onPickupChange)
              onPickupChange(e.latLng.lat(), e.latLng.lng());
          }}
          icon={{
            url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
            scaledSize: new google.maps.Size(40, 40),
          }}
          title="Pickup"
        />

        {/* Dropoff marker — red */}
        <Marker
          position={dropoff}
          draggable={editable}
          onDragEnd={(e) => {
            if (e.latLng && onDropoffChange)
              onDropoffChange(e.latLng.lat(), e.latLng.lng());
          }}
          icon={{
            url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
            scaledSize: new google.maps.Size(40, 40),
          }}
          title="Dropoff"
        />

        {/* Driver marker — blue */}
        {driverLocation && (
          <Marker
            position={driverLocation}
            icon={{
              url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              scaledSize: new google.maps.Size(40, 40),
            }}
            title="Driver"
          />
        )}

        {/* Route line */}
        <Polyline
          path={routePoints}
          options={{
            strokeColor: "#3b82f6",
            strokeWeight: 3,
            strokeOpacity: 0.7,
            icons: [
              {
                icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 4 },
                offset: "0",
                repeat: "20px",
              },
            ],
          }}
        />
      </GoogleMap>

      {/* Editable controls */}
      {editable && (
        <div className="absolute top-4 right-4 z-10 space-y-2">
          <button
            onClick={() =>
              setSelectingType((prev) => (prev === "pickup" ? null : "pickup"))
            }
            className={`block w-full px-4 py-2 rounded-lg font-semibold shadow-lg ${selectingType === "pickup"
                ? "bg-green-600 text-white"
                : "bg-white text-green-600 hover:bg-green-50"
              }`}
          >
            📍 Set Pickup
          </button>
          <button
            onClick={() =>
              setSelectingType((prev) =>
                prev === "dropoff" ? null : "dropoff",
              )
            }
            className={`block w-full px-4 py-2 rounded-lg font-semibold shadow-lg ${selectingType === "dropoff"
                ? "bg-red-600 text-white"
                : "bg-white text-red-600 hover:bg-red-50"
              }`}
          >
            🎯 Set Dropoff
          </button>
        </div>
      )}

      {selectingType && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg">
          Click on the map to set {selectingType} location
        </div>
      )}
    </div>
  );
}
