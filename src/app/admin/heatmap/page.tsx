"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

const BusyHeatMap = dynamic(() => import("@/components/BusyHeatMap"), {
    ssr: false,
});

const DAYS_OF_WEEK = [
    { label: "Monday", value: 0 },
    { label: "Tuesday", value: 1 },
    { label: "Wednesday", value: 2 },
    { label: "Thursday", value: 3 },
    { label: "Friday", value: 4 },
    { label: "Saturday", value: 5 },
    { label: "Sunday", value: 6 },
];

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

export default function HeatmapPage() {
    const now = new Date();

    const [hour, setHour] = useState(8);
    const [day, setDay] = useState(now.getDate());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [weekday, setWeekday] = useState(now.getDay() === 0 ? 6 : now.getDay() - 1);

    // Days in selected month (approximate)
    const daysInMonth = useMemo(() => new Date(now.getFullYear(), month, 0).getDate(), [month]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Activity className="h-7 w-7 text-primary" />
                    Busy Zones Heatmap
                </h1>
                <p className="text-muted-foreground mt-1">
                    Visualize predicted demand hotspots across the city for any time and day.
                </p>
            </div>

            {/* Controls */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Time & Date Parameters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {/* Hour */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Hour</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="range"
                                    min={0}
                                    max={23}
                                    value={hour}
                                    onChange={(e) => setHour(Number(e.target.value))}
                                    className="flex-1 accent-primary"
                                />
                                <span className="text-sm font-semibold w-10 text-right">
                                    {String(hour).padStart(2, "0")}:00
                                </span>
                            </div>
                        </div>

                        {/* Day of month */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Day of Month</label>
                            <select
                                value={day}
                                onChange={(e) => setDay(Number(e.target.value))}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>

                        {/* Month */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Month</label>
                            <select
                                value={month}
                                onChange={(e) => setMonth(Number(e.target.value))}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                {MONTHS.map((m, i) => (
                                    <option key={m} value={i + 1}>{m}</option>
                                ))}
                            </select>
                        </div>

                        {/* Weekday */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Day of Week</label>
                            <select
                                value={weekday}
                                onChange={(e) => setWeekday(Number(e.target.value))}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                {DAYS_OF_WEEK.map((d) => (
                                    <option key={d.value} value={d.value}>{d.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Summary badge */}
                    <div className="mt-4 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
                            🕐 {String(hour).padStart(2, "0")}:00
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
                            📅 {MONTHS[month - 1]} {day}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
                            📆 {DAYS_OF_WEEK[weekday]?.label}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Map */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <span>🗺️</span> City Demand Map
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-hidden rounded-b-xl">
                    <div className="h-[600px]">
                        <BusyHeatMap
                            hour={hour}
                            day={day}
                            month={month}
                            weekday={weekday}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
