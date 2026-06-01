"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";

// New York center (model trained on NYC data)
const DEFAULT_CENTER = { lat: 40.75, lng: -73.98 };
const GRID_SIZE = 0.04;

type BusyClass = string;

interface GridCell {
    lat: number;
    lon: number;
    busy_class: BusyClass;
}

const CLASS_COLORS: Record<string, string> = {
    low: "#22c55e",
    medium: "#f59e0b",
    high: "#ef4444",
};

function getColor(busyClass: string): string {
    return CLASS_COLORS[busyClass.toLowerCase()] ?? "#6b7280";
}

function generateGrid(bounds: L.LatLngBounds): { lat: number; lon: number }[] {
    const points: { lat: number; lon: number }[] = [];
    const south = Math.floor(bounds.getSouth() / GRID_SIZE) * GRID_SIZE;
    const west = Math.floor(bounds.getWest() / GRID_SIZE) * GRID_SIZE;

    for (let lat = south; lat <= bounds.getNorth(); lat += GRID_SIZE) {
        for (let lon = west; lon <= bounds.getEast(); lon += GRID_SIZE) {
            points.push({
                lat: parseFloat(lat.toFixed(6)),
                lon: parseFloat(lon.toFixed(6)),
            });
        }
    }
    return points;
}

interface BusyHeatMapProps {
    hour: number;
    day: number;
    month: number;
    weekday: number;
    apiUrl?: string;
}

export default function BusyHeatMap({
    hour,
    day,
    month,
    weekday,
    apiUrl = "http://localhost:5000/busy/batch",
}: BusyHeatMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const rectanglesRef = useRef<L.Rectangle[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<Record<string, number>>({});

    // Init map once
    useEffect(() => {
        if (typeof window === "undefined" || !containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current).setView(
            [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
            12
        );

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
        }).addTo(map);

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
            rectanglesRef.current = [];
        };
    }, []);

    // Fetch + draw whenever params or map viewport changes
    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current;

        const fetchAndDraw = async () => {
            setLoading(true);
            setError(null);

            // Clear old rectangles
            rectanglesRef.current.forEach((r) => r.remove());
            rectanglesRef.current = [];

            const points = generateGrid(map.getBounds());

            try {
                const res = await fetch(apiUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ points, hour, day, month, weekday }),
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({ error: res.statusText }));
                    throw new Error(err.error ?? res.statusText);
                }

                const cells: GridCell[] = await res.json();
                const newStats: Record<string, number> = {};

                cells.forEach((cell) => {
                    if (!mapRef.current) return;

                    const color = getColor(cell.busy_class);
                    const bounds = L.latLngBounds(
                        [cell.lat, cell.lon],
                        [cell.lat + GRID_SIZE, cell.lon + GRID_SIZE]
                    );

                    const rect = L.rectangle(bounds, {
                        color,
                        fillColor: color,
                        fillOpacity: 0.45,
                        weight: 0.5,
                        opacity: 0.6,
                    })
                        .bindPopup(
                            `<b>Busy Level:</b> ${cell.busy_class}<br/>
               <b>Lat:</b> ${cell.lat.toFixed(4)}<br/>
               <b>Lon:</b> ${cell.lon.toFixed(4)}`
                        )
                        .addTo(mapRef.current);

                    rectanglesRef.current.push(rect);
                    const key = cell.busy_class.toLowerCase();
                    newStats[key] = (newStats[key] ?? 0) + 1;
                });

                setStats(newStats);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to fetch busy data");
            } finally {
                setLoading(false);
            }
        };

        void fetchAndDraw();
        map.on("moveend", fetchAndDraw);
        return () => { map.off("moveend", fetchAndDraw); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hour, day, month, weekday, apiUrl]);

    return (
        <div className="relative h-full w-full">
            <div ref={containerRef} className="h-full w-full rounded-lg" />

            {/* Loading */}
            {loading && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-1001 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow text-sm font-medium flex items-center gap-2">
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                    Loading busy zones...
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-1001 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-full shadow text-sm">
                    {error}
                </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-6 right-4 z-1000 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3 space-y-1.5 min-w-[140px]">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Busy Level</p>
                {Object.entries(CLASS_COLORS).map(([label, color]) => (
                    <div key={label} className="flex items-center gap-2">
                        <span
                            className="inline-block w-4 h-4 rounded-sm border border-gray-200"
                            style={{ backgroundColor: color, opacity: 0.8 }}
                        />
                        <span className="text-xs capitalize text-gray-700">{label}</span>
                        {stats[label] !== undefined && (
                            <span className="ml-auto text-xs text-gray-400">{stats[label]}</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
