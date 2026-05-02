"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";

interface AdminRideMapProps {
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number };
  driverLocation?: { lat: number; lng: number } | null;
  onPickupChange?: (lat: number, lng: number) => void;
  onDropoffChange?: (lat: number, lng: number) => void;
  editable?: boolean;
}

export default function AdminRideMap({
  pickup,
  dropoff,
  driverLocation,
  onPickupChange,
  onDropoffChange,
  editable = true,
}: AdminRideMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropoffMarkerRef = useRef<L.Marker | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const [selectingType, setSelectingType] = useState<
    "pickup" | "dropoff" | null
  >(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initialize map
    if (!mapRef.current) {
      const map = L.map("admin-ride-map").setView([pickup.lat, pickup.lng], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      mapRef.current = map;

      // Add click handler for editable mode
      if (editable) {
        map.on("click", (e) => {
          if (selectingType === "pickup" && onPickupChange) {
            onPickupChange(e.latlng.lat, e.latlng.lng);
            setSelectingType(null);
          } else if (selectingType === "dropoff" && onDropoffChange) {
            onDropoffChange(e.latlng.lat, e.latlng.lng);
            setSelectingType(null);
          }
        });
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update pickup marker
  useEffect(() => {
    if (!mapRef.current) return;

    const pickupIcon = L.icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setLatLng([pickup.lat, pickup.lng]);
    } else {
      pickupMarkerRef.current = L.marker([pickup.lat, pickup.lng], {
        icon: pickupIcon,
        draggable: editable,
      })
        .addTo(mapRef.current)
        .bindPopup("📍 Pickup Location");

      if (editable && onPickupChange) {
        pickupMarkerRef.current.on("dragend", (e) => {
          const pos = e.target.getLatLng();
          onPickupChange(pos.lat, pos.lng);
        });
      }
    }
  }, [pickup, editable, onPickupChange]);

  // Update dropoff marker
  useEffect(() => {
    if (!mapRef.current) return;

    const dropoffIcon = L.icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    if (dropoffMarkerRef.current) {
      dropoffMarkerRef.current.setLatLng([dropoff.lat, dropoff.lng]);
    } else {
      dropoffMarkerRef.current = L.marker([dropoff.lat, dropoff.lng], {
        icon: dropoffIcon,
        draggable: editable,
      })
        .addTo(mapRef.current)
        .bindPopup("🎯 Dropoff Location");

      if (editable && onDropoffChange) {
        dropoffMarkerRef.current.on("dragend", (e) => {
          const pos = e.target.getLatLng();
          onDropoffChange(pos.lat, pos.lng);
        });
      }
    }
  }, [dropoff, editable, onDropoffChange]);

  // Update driver marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (driverLocation) {
      const driverIcon = L.icon({
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLatLng([
          driverLocation.lat,
          driverLocation.lng,
        ]);
      } else {
        driverMarkerRef.current = L.marker(
          [driverLocation.lat, driverLocation.lng],
          { icon: driverIcon },
        )
          .addTo(mapRef.current)
          .bindPopup("🚗 Driver Location");
      }
    } else if (driverMarkerRef.current) {
      driverMarkerRef.current.remove();
      driverMarkerRef.current = null;
    }
  }, [driverLocation]);

  // Draw route line
  useEffect(() => {
    if (!mapRef.current) return;

    const points: [number, number][] = [];

    if (driverLocation) {
      points.push([driverLocation.lat, driverLocation.lng]);
    }
    points.push([pickup.lat, pickup.lng]);
    points.push([dropoff.lat, dropoff.lng]);

    if (routeLineRef.current) {
      routeLineRef.current.setLatLngs(points);
    } else {
      routeLineRef.current = L.polyline(points, {
        color: "#3b82f6",
        weight: 3,
        opacity: 0.7,
        dashArray: "10, 10",
      }).addTo(mapRef.current);
    }

    // Fit bounds to show all markers
    const bounds = L.latLngBounds(points);
    mapRef.current.fitBounds(bounds, { padding: [50, 50] });
  }, [pickup, dropoff, driverLocation]);

  return (
    <div className="relative h-full w-full">
      <div id="admin-ride-map" className="h-full w-full rounded-lg" />

      {editable && (
        <div className="absolute top-4 right-4 z-[1000] space-y-2">
          <button
            onClick={() => setSelectingType("pickup")}
            className={`block w-full px-4 py-2 rounded-lg font-semibold shadow-lg ${
              selectingType === "pickup"
                ? "bg-green-600 text-white"
                : "bg-white text-green-600 hover:bg-green-50"
            }`}
          >
            📍 Set Pickup
          </button>
          <button
            onClick={() => setSelectingType("dropoff")}
            className={`block w-full px-4 py-2 rounded-lg font-semibold shadow-lg ${
              selectingType === "dropoff"
                ? "bg-red-600 text-white"
                : "bg-white text-red-600 hover:bg-red-50"
            }`}
          >
            🎯 Set Dropoff
          </button>
        </div>
      )}

      {selectingType && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg">
          Click on the map to set {selectingType} location
        </div>
      )}
    </div>
  );
}
