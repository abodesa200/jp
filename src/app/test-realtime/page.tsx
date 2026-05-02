"use client";

import { ClientRideTracker } from "@/components/ClientRideTracker";
import { DriverRideTracker } from "@/components/DriverRideTracker";
import { useState } from "react";

export default function TestRealtimePage() {
  const [driverUserId, setDriverUserId] = useState("1");
  const [clientUserId, setClientUserId] = useState("2");
  const [rideId, setRideId] = useState("test-ride-123");
  const [isRideActive, setIsRideActive] = useState(false);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          Real-Time Ride Tracking Test
        </h1>

        {/* Configuration */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Driver User ID
              </label>
              <input
                type="text"
                value={driverUserId}
                onChange={(e) => setDriverUserId(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Client User ID
              </label>
              <input
                type="text"
                value={clientUserId}
                onChange={(e) => setClientUserId(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Ride ID</label>
              <input
                type="text"
                value={rideId}
                onChange={(e) => setRideId(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => setIsRideActive(!isRideActive)}
              className={`px-6 py-2 rounded font-semibold ${
                isRideActive
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600"
              } text-white`}
            >
              {isRideActive ? "Stop Ride" : "Start Ride"}
            </button>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Driver Side */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">🚗 Driver Side</h2>
            <DriverRideTracker
              userId={driverUserId}
              rideId={rideId}
              isActive={isRideActive}
            />
          </div>

          {/* Client Side */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">🧑 Client Side</h2>
            <ClientRideTracker userId={clientUserId} rideId={rideId} />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h3 className="font-semibold mb-2">📋 Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Make sure Socket.IO server is running on port 3001</li>
            <li>Click "Go Online" on the driver side</li>
            <li>Click "Start Ride" to activate location tracking</li>
            <li>
              Driver location will be sent every 3 seconds (if browser allows
              geolocation)
            </li>
            <li>Client side will receive real-time location updates</li>
            <li>Open browser console to see socket events</li>
          </ol>
        </div>

        {/* API Test */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-4">🧪 API Test</h3>
          <div className="space-y-2">
            <button
              onClick={async () => {
                const res = await fetch(`/api/rides/${rideId}/accept`, {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer YOUR_TOKEN`,
                  },
                });
                const data = await res.json();
                console.log("Accept response:", data);
                alert(JSON.stringify(data, null, 2));
              }}
              className="px-4 py-2 bg-green-500 text-white rounded mr-2"
            >
              Test Accept Ride
            </button>
            <button
              onClick={async () => {
                const res = await fetch(`/api/rides/${rideId}/cancel`, {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer YOUR_TOKEN`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ reason: "Test cancellation" }),
                });
                const data = await res.json();
                console.log("Cancel response:", data);
                alert(JSON.stringify(data, null, 2));
              }}
              className="px-4 py-2 bg-red-500 text-white rounded"
            >
              Test Cancel Ride
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Note: You need a valid JWT token for these to work
          </p>
        </div>
      </div>
    </div>
  );
}
