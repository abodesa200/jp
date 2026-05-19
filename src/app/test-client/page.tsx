"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRideTracking } from "../hooks/useRideTracking";
import { useSocket } from "../hooks/useSocket";
import AdminRideMap from "@/components/AdminRideMap";

// 

interface Ride {
    id: number;
    status: string;
    pickup: { lat: number; lng: number; address?: string };
    dropoff: { lat: number; lng: number; address?: string };
    systemFare?: number;
    fare?: number;
    distance?: number;
    driver?: {
        id: number;
        user: { name: string; phone: string };
        carModel: string;
        carPlate: string;
    };
    negotiation?: {
        status: string;
        clientOffer?: number;
        driverCounter?: number;
        agreedFare?: number;
    };
}

export default function TestClientPage() {
    const [token, setToken] = useState("");
    const [userId, setUserId] = useState("");
    const [rides, setRides] = useState<Ride[]>([]);
    const [currentRide, setCurrentRide] = useState<Ride | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Form states
    const [pickupLat, setPickupLat] = useState(33.5138);
    const [pickupLng, setPickupLng] = useState(36.2765);
    const [dropoffLat, setDropoffLat] = useState(33.5102);
    const [dropoffLng, setDropoffLng] = useState(36.2913);
    const [rideType, setRideType] = useState<"STANDARD" | "CARPOOLING">("STANDARD");
    const [maxPassengers, setMaxPassengers] = useState(1);
    const [negotiationAmount, setNegotiationAmount] = useState("");
    const [negotiationMessage, setNegotiationMessage] = useState("");

    // Socket
    const { socket, isConnected } = useSocket({
        userId,
        role: "CLIENT",
        autoConnect: !!userId,
    });

    const { driverLocation, rideStatus } = useRideTracking({
        socket,
        rideId: currentRide?.id.toString() || "",
    });

    // Listen for ride updates
    useEffect(() => {
        if (!socket) return;

        socket.on("ride:created", (data) => {
            console.log("🆕 New ride created:", data);
            fetchRides();
        });

        socket.on("ride:accepted", (data) => {
            console.log("✅ Ride accepted:", data);
            if (currentRide?.id === data.ride.id) {
                setCurrentRide(data.ride);
            }
            fetchRides();
        });

        socket.on("ride:cancelled", (data) => {
            console.log("❌ Ride cancelled:", data);
            fetchRides();
        });

        socket.on("negotiation:updated", (data) => {
            console.log("💰 Negotiation updated:", data);
            if (currentRide?.id === data.rideId) {
                fetchRideDetails(data.rideId);
            }
        });

        return () => {
            socket.off("ride:created");
            socket.off("ride:accepted");
            socket.off("ride:cancelled");
            socket.off("negotiation:updated");
        };
    }, [socket, currentRide]);

    const fetchRides = async () => {
        if (!token) return;
        try {
            const res = await fetch("/api/rides", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setRides(data.data.rides);
            }
        } catch (err) {
            console.error("Error fetching rides:", err);
        }
    };

    const fetchRideDetails = async (rideId: number) => {
        if (!token) return;
        try {
            const res = await fetch(`/api/rides/${rideId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setCurrentRide(data.data.ride);
            }
        } catch (err) {
            console.error("Error fetching ride details:", err);
        }
    };

    const createRide = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/rides", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    pickupLat,
                    pickupLng,
                    pickupAddress: "Damascus, Syria",
                    dropoffLat,
                    dropoffLng,
                    dropoffAddress: "Destination",
                    type: rideType,
                    maxPassengers,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setCurrentRide(data.data.ride);
                fetchRides();
                alert("✅ Ride created successfully!");
            } else {
                setError(data.error || "Failed to create ride");
            }
        } catch (err) {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    };

    const cancelRide = async (rideId: number) => {
        if (!confirm("Are you sure you want to cancel this ride?")) return;
        try {
            const res = await fetch(`/api/rides/${rideId}/cancel`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reason: "Changed plans" }),
            });
            const data = await res.json();
            if (data.success) {
                alert("✅ Ride cancelled");
                fetchRides();
                if (currentRide?.id === rideId) {
                    setCurrentRide(null);
                }
            }
        } catch (err) {
            alert("Failed to cancel ride");
        }
    };

    const startNegotiation = async () => {
        if (!currentRide || !negotiationAmount) return;
        try {
            const res = await fetch(`/api/rides/${currentRide.id}/negotiate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    amount: parseFloat(negotiationAmount),
                    message: negotiationMessage,
                }),
            });
            const data = await res.json();
            if (data.success) {
                alert("✅ Negotiation started!");
                fetchRideDetails(currentRide.id);
                setNegotiationAmount("");
                setNegotiationMessage("");
            } else {
                alert(data.error || "Failed to start negotiation");
            }
        } catch (err) {
            alert("Network error");
        }
    };

    const acceptNegotiation = async () => {
        if (!currentRide) return;
        try {
            const res = await fetch(`/api/rides/${currentRide.id}/negotiate`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ action: "accept" }),
            });
            const data = await res.json();
            if (data.success) {
                alert("✅ Negotiation accepted!");
                fetchRideDetails(currentRide.id);
            }
        } catch (err) {
            alert("Failed to accept negotiation");
        }
    };

    const rejectNegotiation = async () => {
        if (!currentRide) return;
        try {
            const res = await fetch(`/api/rides/${currentRide.id}/negotiate`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ action: "reject" }),
            });
            const data = await res.json();
            if (data.success) {
                alert("❌ Negotiation rejected");
                fetchRideDetails(currentRide.id);
            }
        } catch (err) {
            alert("Failed to reject negotiation");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">🧪 صفحة اختبار العميل</h1>

                {/* قسم المصادقة */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">المصادقة</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">JWT Token</label>
                            <input
                                type="text"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                placeholder="الصق التوكن هنا"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">معرف المستخدم</label>
                            <input
                                type="text"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                placeholder="معرف المستخدم"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                        <button
                            onClick={fetchRides}
                            disabled={!token}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
                        >
                            تحميل رحلاتي
                        </button>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
                            <span className="text-sm">{isConnected ? "متصل" : "غير متصل"}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    {/* العمود الأيمن: الخريطة وإنشاء رحلة */}
                    <div>
                        {/* الخريطة */}
                        <div className="bg-white rounded-lg shadow p-6 mb-6">
                            <h2 className="text-xl font-semibold mb-4">📍 اختر المواقع</h2>
                            <div className="h-[500px] w-full rounded-lg overflow-hidden">
                                <AdminRideMap
                                    pickup={{ lat: pickupLat, lng: pickupLng }}
                                    dropoff={{ lat: dropoffLat, lng: dropoffLng }}
                                    driverLocation={driverLocation}
                                    onPickupChange={(lat, lng) => {
                                        setPickupLat(lat);
                                        setPickupLng(lng);
                                    }}
                                    onDropoffChange={(lat, lng) => {
                                        setDropoffLat(lat);
                                        setDropoffLng(lng);
                                    }}
                                    editable={true}
                                />
                            </div>
                        </div>

                        {/* نموذج إنشاء رحلة */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">🚗 إنشاء رحلة جديدة</h2>
                            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">خط العرض (الانطلاق)</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={pickupLat}
                                            onChange={(e) => {
                                                setPickupLat(parseFloat(e.target.value));
                                            }}
                                            className="w-full border rounded px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">خط الطول (الانطلاق)</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={pickupLng}
                                            onChange={(e) => {
                                                setPickupLng(parseFloat(e.target.value));
                                            }}
                                            className="w-full border rounded px-3 py-2"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">خط العرض (الوصول)</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={dropoffLat}
                                            onChange={(e) => {
                                                setDropoffLat(parseFloat(e.target.value));
                                            }}
                                            className="w-full border rounded px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">خط الطول (الوصول)</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={dropoffLng}
                                            onChange={(e) => {
                                                setDropoffLng(parseFloat(e.target.value));
                                            }}
                                            className="w-full border rounded px-3 py-2"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">نوع الرحلة</label>
                                        <select
                                            value={rideType}
                                            onChange={(e) => setRideType(e.target.value as "STANDARD" | "CARPOOLING")}
                                            className="w-full border rounded px-3 py-2"
                                        >
                                            <option value="STANDARD">عادية</option>
                                            <option value="CARPOOLING">مشاركة سيارة</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">الحد الأقصى للركاب</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="4"
                                            value={maxPassengers}
                                            onChange={(e) => setMaxPassengers(parseInt(e.target.value))}
                                            className="w-full border rounded px-3 py-2"
                                            disabled={rideType === "STANDARD"}
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={createRide}
                                    disabled={loading || !token}
                                    className="w-full bg-green-500 text-white px-4 py-3 rounded hover:bg-green-600 disabled:bg-gray-300 font-semibold"
                                >
                                    {loading ? "جاري الإنشاء..." : "🚀 إنشاء رحلة"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* العمود الأيسر: قائمة الرحلات والرحلة الحالية */}
                    <div>
                        {/* رحلاتي */}
                        <div className="bg-white rounded-lg shadow p-6 mb-6">
                            <h2 className="text-xl font-semibold mb-4">📋 رحلاتي</h2>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {rides.length === 0 ? (
                                    <p className="text-gray-500">لا توجد رحلات بعد</p>
                                ) : (
                                    rides.map((ride) => (
                                        <div
                                            key={ride.id}
                                            className={`border rounded p-4 cursor-pointer hover:bg-gray-50 ${currentRide?.id === ride.id ? "border-blue-500 bg-blue-50" : ""
                                                }`}
                                            onClick={() => {
                                                setCurrentRide(ride);
                                                fetchRideDetails(ride.id);
                                            }}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-semibold">رحلة #{ride.id}</div>
                                                    <div className="text-sm text-gray-600">الحالة: {ride.status}</div>
                                                    <div className="text-sm text-gray-600">
                                                        السعر: ${ride.fare || ride.systemFare || "غير محدد"}
                                                    </div>
                                                </div>
                                                {ride.status === "REQUESTED" && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            cancelRide(ride.id);
                                                        }}
                                                        className="text-red-500 text-sm hover:underline"
                                                    >
                                                        إلغاء
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* تفاصيل الرحلة الحالية */}
                        {currentRide && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-semibold mb-4">🎯 تفاصيل الرحلة الحالية</h2>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="font-medium">رقم الرحلة:</div>
                                        <div>#{currentRide.id}</div>
                                        <div className="font-medium">الحالة:</div>
                                        <div className="font-semibold">{rideStatus || currentRide.status}</div>
                                        <div className="font-medium">النوع:</div>
                                        <div>{currentRide.status === "CARPOOLING" ? "مشاركة" : "عادية"}</div>
                                        <div className="font-medium">المسافة:</div>
                                        <div>{currentRide.distance?.toFixed(2)} كم</div>
                                        <div className="font-medium">السعر المقترح:</div>
                                        <div>${currentRide.systemFare?.toFixed(2)}</div>
                                        <div className="font-medium">السعر النهائي:</div>
                                        <div className="font-semibold text-green-600">
                                            ${currentRide.fare?.toFixed(2) || "غير محدد"}
                                        </div>
                                    </div>

                                    {currentRide.driver && (
                                        <div className="border-t pt-3">
                                            <div className="font-medium mb-2">معلومات السائق:</div>
                                            <div className="text-sm space-y-1">
                                                <div>الاسم: {currentRide.driver.user.name}</div>
                                                <div>الهاتف: {currentRide.driver.user.phone}</div>
                                                <div>السيارة: {currentRide.driver.carModel}</div>
                                                <div>اللوحة: {currentRide.driver.carPlate}</div>
                                            </div>
                                        </div>
                                    )}

                                    {driverLocation && (
                                        <div className="border-t pt-3">
                                            <div className="font-medium mb-2">موقع السائق:</div>
                                            <div className="text-sm">
                                                خط العرض: {driverLocation.lat.toFixed(4)}، خط الطول: {driverLocation.lng.toFixed(4)}
                                            </div>
                                        </div>
                                    )}

                                    {/* قسم المفاوضة */}
                                    {currentRide.negotiation && (
                                        <div className="border-t pt-3">
                                            <div className="font-medium mb-2">💰 المفاوضة:</div>
                                            <div className="text-sm space-y-1">
                                                <div>الحالة: {currentRide.negotiation.status === "COUNTERED" ? "تم الرد" : "قيد الانتظار"}</div>
                                                <div>عرضك: ${currentRide.negotiation.clientOffer}</div>
                                                {currentRide.negotiation.driverCounter && (
                                                    <div>عرض السائق: ${currentRide.negotiation.driverCounter}</div>
                                                )}
                                                {currentRide.negotiation.agreedFare && (
                                                    <div className="font-semibold text-green-600">
                                                        السعر المتفق عليه: ${currentRide.negotiation.agreedFare}
                                                    </div>
                                                )}
                                            </div>
                                            {currentRide.negotiation.status === "COUNTERED" && (
                                                <div className="flex gap-2 mt-3">
                                                    <button
                                                        onClick={acceptNegotiation}
                                                        className="flex-1 bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600"
                                                    >
                                                        قبول
                                                    </button>
                                                    <button
                                                        onClick={rejectNegotiation}
                                                        className="flex-1 bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600"
                                                    >
                                                        رفض
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* بدء المفاوضة */}
                                    {!currentRide.negotiation && currentRide.status === "REQUESTED" && (
                                        <div className="border-t pt-3">
                                            <div className="font-medium mb-2">💰 بدء المفاوضة:</div>
                                            <div className="space-y-2">
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    value={negotiationAmount}
                                                    onChange={(e) => setNegotiationAmount(e.target.value)}
                                                    placeholder="سعر عرضك"
                                                    className="w-full border rounded px-3 py-2 text-sm"
                                                />
                                                <input
                                                    type="text"
                                                    value={negotiationMessage}
                                                    onChange={(e) => setNegotiationMessage(e.target.value)}
                                                    placeholder="رسالة اختيارية"
                                                    className="w-full border rounded px-3 py-2 text-sm"
                                                />
                                                <button
                                                    onClick={startNegotiation}
                                                    className="w-full bg-yellow-500 text-white px-3 py-2 rounded text-sm hover:bg-yellow-600"
                                                >
                                                    إرسال العرض
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}