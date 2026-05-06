"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";

interface AdminRideMapProps {
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number };
  driverLocation?: { lat: number; lng: number } | null;
  onPickupChange?: (lat: number, lng: number) => void;
  onDropoffChange?: (lat: number, lng: number) => void;
  editable?: boolean;
}

// Damascus center
const DAMASCUS = { lat: 33.5138, lng: 36.2765 };

async function fetchRoute(
  points: { lat: number; lng: number }[]
): Promise<[number, number][]> {
  const coords = points.map((p) => `${p.lng},${p.lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.code === "Ok" && data.routes?.[0]) {
      return data.routes[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
      );
    }
  } catch {
    // fallback to straight line
  }
  return points.map((p) => [p.lat, p.lng]);
}

export default function AdminRideMap({
  pickup,
  dropoff,
  driverLocation,
  onPickupChange,
  onDropoffChange,
  editable = true,
}: AdminRideMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropoffMarkerRef = useRef<L.Marker | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  // Keep latest callbacks in refs so map click handler never goes stale
  const onPickupChangeRef = useRef(onPickupChange);
  const onDropoffChangeRef = useRef(onDropoffChange);
  useEffect(() => { onPickupChangeRef.current = onPickupChange; }, [onPickupChange]);
  useEffect(() => { onDropoffChangeRef.current = onDropoffChange; }, [onDropoffChange]);

  const [selectingType, setSelectingType] = useState<"pickup" | "dropoff" | null>(null);
  const selectingTypeRef = useRef<"pickup" | "dropoff" | null>(null);
  const [locating, setLocating] = useState(false);

  const updateSelectingType = useCallback((val: "pickup" | "dropoff" | null) => {
    selectingTypeRef.current = val;
    setSelectingType(val);
  }, []);

  // Initialize map once
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView(
      [DAMASCUS.lat, DAMASCUS.lng],
      12
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    mapRef.current = map;

    if (editable) {
      map.on("click", (e) => {
        const type = selectingTypeRef.current;
        if (type === "pickup") {
          onPickupChangeRef.current?.(e.latlng.lat, e.latlng.lng);
          selectingTypeRef.current = null;
          setSelectingType(null);
        } else if (type === "dropoff") {
          onDropoffChangeRef.current?.(e.latlng.lat, e.latlng.lng);
          selectingTypeRef.current = null;
          setSelectingType(null);
        }
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
      pickupMarkerRef.current = null;
      dropoffMarkerRef.current = null;
      driverMarkerRef.current = null;
      routeLineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update pickup marker
  useEffect(() => {
    if (!mapRef.current) return;

    const icon = L.icon({
      iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
    });

    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setLatLng([pickup.lat, pickup.lng]);
    } else {
      pickupMarkerRef.current = L.marker([pickup.lat, pickup.lng], { icon, draggable: editable })
        .addTo(mapRef.current)
        .bindPopup("📍 Pickup Location");

      if (editable) {
        pickupMarkerRef.current.on("dragend", (e) => {
          const pos = e.target.getLatLng();
          onPickupChangeRef.current?.(pos.lat, pos.lng);
        });
      }
    }
  }, [pickup, editable]);

  // Update dropoff marker
  useEffect(() => {
    if (!mapRef.current) return;

    const icon = L.icon({
      iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
    });

    if (dropoffMarkerRef.current) {
      dropoffMarkerRef.current.setLatLng([dropoff.lat, dropoff.lng]);
    } else {
      dropoffMarkerRef.current = L.marker([dropoff.lat, dropoff.lng], { icon, draggable: editable })
        .addTo(mapRef.current)
        .bindPopup("🎯 Dropoff Location");

      if (editable) {
        dropoffMarkerRef.current.on("dragend", (e) => {
          const pos = e.target.getLatLng();
          onDropoffChangeRef.current?.(pos.lat, pos.lng);
        });
      }
    }
  }, [dropoff, editable]);

  // Update driver marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (driverLocation) {
      const icon = L.icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
      });

      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLatLng([driverLocation.lat, driverLocation.lng]);
      } else {
        driverMarkerRef.current = L.marker([driverLocation.lat, driverLocation.lng], { icon })
          .addTo(mapRef.current)
          .bindPopup("🚗 Driver Location");
      }
    } else if (driverMarkerRef.current) {
      driverMarkerRef.current.remove();
      driverMarkerRef.current = null;
    }
  }, [driverLocation]);

  // Draw real road route via OSRM
  useEffect(() => {
    if (!mapRef.current) return;

    const routePoints: { lat: number; lng: number }[] = [];
    if (driverLocation) routePoints.push(driverLocation);
    routePoints.push(pickup);
    routePoints.push(dropoff);

    fetchRoute(routePoints).then((latlngs) => {
      if (!mapRef.current) return;

      if (routeLineRef.current) {
        routeLineRef.current.setLatLngs(latlngs);
      } else {
        routeLineRef.current = L.polyline(latlngs, {
          color: "#3b82f6",
          weight: 4,
          opacity: 0.8,
        }).addTo(mapRef.current);
      }

      const bounds = L.latLngBounds([
        [pickup.lat, pickup.lng],
        [dropoff.lat, dropoff.lng],
        ...(driverLocation ? [[driverLocation.lat, driverLocation.lng] as [number, number]] : []),
      ]);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    });
  }, [pickup, dropoff, driverLocation]);

  // Go to current location
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 15);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }, []);

  return (
    <div className="relative h-full w-full">
      {/* Map container — using ref instead of id to avoid conflicts */}
      <div ref={containerRef} className="h-full w-full rounded-lg" />

      {/* Mode indicator banner */}
      {selectingType && (
        <div className="absolute top-0 left-0 right-0 z-[1001] bg-blue-600 text-white text-center py-2 text-sm font-semibold rounded-t-lg pointer-events-none">
          {selectingType === "pickup" ? "📍" : "🎯"} انقر على الخريطة لتحديد موقع{" "}
          {selectingType === "pickup" ? "الانطلاق" : "الوصول"}
          {" "}— أو اسحب العلامة
        </div>
      )}

      {editable && (
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          <button
            onClick={() => updateSelectingType(selectingType === "pickup" ? null : "pickup")}
            className={`px-4 py-2 rounded-lg font-semibold shadow-lg text-sm transition-colors ${selectingType === "pickup"
                ? "bg-green-600 text-white ring-2 ring-green-300"
                : "bg-white text-green-700 hover:bg-green-50 border border-green-200"
              }`}
          >
            📍 تحديد الانطلاق
          </button>
          <button
            onClick={() => updateSelectingType(selectingType === "dropoff" ? null : "dropoff")}
            className={`px-4 py-2 rounded-lg font-semibold shadow-lg text-sm transition-colors ${selectingType === "dropoff"
                ? "bg-red-600 text-white ring-2 ring-red-300"
                : "bg-white text-red-700 hover:bg-red-50 border border-red-200"
              }`}
          >
            🎯 تحديد الوصول
          </button>
          <button
            onClick={handleLocateMe}
            disabled={locating}
            className="px-4 py-2 rounded-lg font-semibold shadow-lg text-sm bg-white text-blue-700 hover:bg-blue-50 border border-blue-200 disabled:opacity-60 transition-colors"
          >
            {locating ? "⏳ جاري التحديد..." : "📡 موقعي الحالي"}
          </button>
        </div>
      )}
    </div>
  );
}
