"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import Map from "./Map";

// Import Map dynamically to avoid SSR issues with Leaflet
// const Map = dynamic(() => import("./Map"), {
//   ssr: false,
//   loading: () => (
//     <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
//       <div className="text-gray-500">جاري تحميل الخريطة...</div>
//     </div>
//   ),
// });

interface RideMapProps {
  pickup?: { lat: number; lng: number; address?: string };
  dropoff?: { lat: number; lng: number; address?: string };
  driverLocation?: { lat: number; lng: number };
  onPickupSelect?: (lat: number, lng: number) => void;
  onDropoffSelect?: (lat: number, lng: number) => void;
  mode?: "select-pickup" | "select-dropoff" | "view";
  className?: string;
}

export default function RideMap({
  pickup,
  dropoff,
  driverLocation,
  onPickupSelect,
  onDropoffSelect,
  mode = "view",
  className = "h-96",
}: RideMapProps) {
  const [center, setCenter] = useState<[number, number]>([33.5138, 36.2765]); // Damascus default


  useEffect(() => {
    // Update center based on available locations
    if (driverLocation) {
      setCenter([driverLocation.lat, driverLocation.lng]);
    } else if (pickup) {
      setCenter([pickup.lat, pickup.lng]);
    } else if (dropoff) {
      setCenter([dropoff.lat, dropoff.lng]);
    }
  }, [pickup, dropoff, driverLocation]);

  const markers = useMemo(() => {
    const result = [];

    if (pickup) {
      result.push({
        position: [pickup.lat, pickup.lng] as [number, number],
        popup: pickup.address || "نقطة الانطلاق",
        icon: "pickup" as const,
      });
    }

    if (dropoff) {
      result.push({
        position: [dropoff.lat, dropoff.lng] as [number, number],
        popup: dropoff.address || "الوجهة",
        icon: "dropoff" as const,
      });
    }

    if (driverLocation) {
      result.push({
        position: [driverLocation.lat, driverLocation.lng] as [number, number],
        popup: "موقع السائق",
        icon: "driver" as const,
      });
    }

    return result;
  }, [pickup, dropoff, driverLocation]);

  const handleMapClick = (lat: number, lng: number) => {
    if (mode === "select-pickup" && onPickupSelect) {
      onPickupSelect(lat, lng);
    } else if (mode === "select-dropoff" && onDropoffSelect) {
      onDropoffSelect(lat, lng);
    }
  };

  

  return (
    <div className={className}>
      <Map
        center={center}
        zoom={13}
        markers={markers}
        onMapClick={mode !== "view" ? handleMapClick : undefined}
        className="h-full w-full rounded-lg"
      />
      {mode !== "view" && (
        <div className="mt-2 text-sm text-gray-600">
          💡 اضغط على الخريطة لاختيار{" "}
          {mode === "select-pickup" ? "نقطة الانطلاق" : "الوجهة"}
        </div>
      )}
    </div>
  );
}
