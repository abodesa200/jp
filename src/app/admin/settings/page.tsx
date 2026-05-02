"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    baseFare: 5,
    perKmRate: 2,
    minFare: 5,
    cancellationFee: 2,
    driverCommission: 20,
    maxWaitTime: 5,
  });

  const handleSave = () => {
    // TODO: Implement save settings API
    alert("Settings saved! (Not implemented yet)");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Configure platform settings and pricing
        </p>
      </div>

      {/* Pricing Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">💰 Pricing Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Base Fare ($)
            </label>
            <input
              type="number"
              value={settings.baseFare}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  baseFare: parseFloat(e.target.value),
                })
              }
              className="w-full px-4 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Starting price for every ride
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Per Kilometer Rate ($)
            </label>
            <input
              type="number"
              value={settings.perKmRate}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  perKmRate: parseFloat(e.target.value),
                })
              }
              className="w-full px-4 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Price per kilometer traveled
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Minimum Fare ($)
            </label>
            <input
              type="number"
              value={settings.minFare}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  minFare: parseFloat(e.target.value),
                })
              }
              className="w-full px-4 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum charge for any ride
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Cancellation Fee ($)
            </label>
            <input
              type="number"
              value={settings.cancellationFee}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  cancellationFee: parseFloat(e.target.value),
                })
              }
              className="w-full px-4 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Fee charged for cancellations
            </p>
          </div>
        </div>
      </div>

      {/* Commission Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">📊 Commission Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Driver Commission (%)
            </label>
            <input
              type="number"
              value={settings.driverCommission}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  driverCommission: parseFloat(e.target.value),
                })
              }
              className="w-full px-4 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Platform commission from driver earnings
            </p>
          </div>
        </div>
      </div>

      {/* Ride Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">🚗 Ride Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Max Wait Time (minutes)
            </label>
            <input
              type="number"
              value={settings.maxWaitTime}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxWaitTime: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum time to wait for driver acceptance
            </p>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">ℹ️ System Information</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Platform Version</span>
            <span className="font-semibold">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Database</span>
            <span className="font-semibold">PostgreSQL</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Socket Server</span>
            <span className="font-semibold">Running on port 3001</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Environment</span>
            <span className="font-semibold">Development</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
        >
          💾 Save Settings
        </button>
      </div>
    </div>
  );
}
