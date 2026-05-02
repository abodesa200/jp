"use client";

import RideMap from "@/components/RideMap";
import { useState } from "react";

export default function TestMapPage() {
  const [pickup, setPickup] = useState<
    { lat: number; lng: number } | undefined
  >();
  const [dropoff, setDropoff] = useState<
    { lat: number; lng: number } | undefined
  >();
  const [mode, setMode] = useState<"select-pickup" | "select-dropoff" | "view">(
    "view",
  );

  // Simulate driver location (moving)
  const [driverLocation] = useState({ lat: 33.5138, lng: 36.2765 });

  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🗺️ اختبار الخريطة</h1>

        {/* Controls */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">التحكم</h2>

          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setMode("select-pickup")}
              className={`px-4 py-2 rounded ${
                mode === "select-pickup"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              اختر نقطة الانطلاق
            </button>
            <button
              onClick={() => setMode("select-dropoff")}
              className={`px-4 py-2 rounded ${
                mode === "select-dropoff"
                  ? "bg-red-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              اختر الوجهة
            </button>
            <button
              onClick={() => setMode("view")}
              className={`px-4 py-2 rounded ${
                mode === "view" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              عرض فقط
            </button>
          </div>

          <div className="space-y-2 text-sm">
            {pickup && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span>
                  نقطة الانطلاق: {pickup.lat.toFixed(4)},{" "}
                  {pickup.lng.toFixed(4)}
                </span>
              </div>
            )}
            {dropoff && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span>
                  الوجهة: {dropoff.lat.toFixed(4)}, {dropoff.lng.toFixed(4)}
                </span>
              </div>
            )}
            {driverLocation && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                <span>
                  موقع السائق: {driverLocation.lat.toFixed(4)},{" "}
                  {driverLocation.lng.toFixed(4)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="bg-white p-6 rounded-lg shadow">
          <RideMap
            pickup={pickup}
            dropoff={dropoff}
            driverLocation={driverLocation}
            mode={mode}
            onPickupSelect={(lat, lng) => {
              setPickup({ lat, lng });
              setMode("view");
            }}
            onDropoffSelect={(lat, lng) => {
              setDropoff({ lat, lng });
              setMode("view");
            }}
            className="h-[500px]"
          />
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">💡 كيف تستخدم الخريطة:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>اضغط "اختر نقطة الانطلاق" ثم اضغط على الخريطة</li>
            <li>اضغط "اختر الوجهة" ثم اضغط على الخريطة</li>
            <li>النقطة الخضراء = نقطة الانطلاق 🟢</li>
            <li>النقطة الحمراء = الوجهة 🔴</li>
            <li>النقطة الزرقاء = موقع السائق 🔵</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
