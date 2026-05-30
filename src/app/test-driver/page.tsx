"use client";

import { DirectionsRenderer, GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { useEffect, useState } from "react";
import { useDriverLocation } from "../hooks/useDriverLocation";
import { useSocket } from "../hooks/useSocket";

const mapContainerStyle = {
    width: "100%",
    height: "500px",
};

const damascusCenter = {
    lat: 33.5138,
    lng: 36.2765,
};

interface Ride {
    id: number;
    status: string;
    pickup: { lat: number; lng: number; address?: string };
    dropoff: { lat: number; lng: number; address?: string };
    systemFare?: number;
    fare?: number;
    distance?: number;
    distanceFromDriver?: number;
    client: {
        name: string;
        phone: string;
    };
    negotiation?: {
        status: string;
        clientOffer?: number;
        driverCounter?: number;
        agreedFare?: number;
        history?: Array<{
            offeredBy: string;
            amount: number;
            message?: string;
            createdAt: string;
        }>;
    };
}

export default function TestDriverPage() {
    const [token, setToken] = useState("");
    const [userId, setUserId] = useState("");
    const [nearbyRides, setNearbyRides] = useState<Ride[]>([]);
    const [myRides, setMyRides] = useState<Ride[]>([]);
    const [currentRide, setCurrentRide] = useState<Ride | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [maxDistance, setMaxDistance] = useState(10);
    const [isOnline, setIsOnline] = useState(false);
    const [counterOffer, setCounterOffer] = useState("");
    const [counterMessage, setCounterMessage] = useState("");
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationUpdateStatus, setLocationUpdateStatus] = useState("");

    // Get current location on mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCurrentLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                (error) => {
                    console.error("Error getting location:", error);
                }
            );
        }
    }, []);

    // Socket
    const { socket, isConnected } = useSocket({
        userId,
        role: "DRIVER",
        autoConnect: !!userId,
    });

    // Track driver location
    useDriverLocation({
        socket,
        rideId: currentRide?.id.toString() || "",
        enabled: isOnline && !!currentRide && currentRide.status === "IN_PROGRESS",
    });

    // Listen for ride updates
    useEffect(() => {
        if (!socket) return;

        socket.on("ride:created", (data) => {
            console.log("🆕 New ride available:", data);
            fetchNearbyRides();
        });

        socket.on("ride:accepted", (data) => {
            console.log("✅ Ride accepted:", data);
            fetchMyRides();
        });

        socket.on("ride:cancelled", (data) => {
            console.log("❌ Ride cancelled:", data);
            fetchNearbyRides();
            fetchMyRides();
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

    // Update directions when current ride changes
    useEffect(() => {
        if (currentRide && window.google) {
            const directionsService = new google.maps.DirectionsService();
            directionsService.route(
                {
                    origin: currentRide.pickup,
                    destination: currentRide.dropoff,
                    travelMode: google.maps.TravelMode.DRIVING,
                },
                (result, status) => {
                    if (status === "OK" && result) {
                        setDirections(result);
                    }
                }
            );
        }
    }, [currentRide]);

    const fetchNearbyRides = async () => {
        if (!token) return;
        try {
            const res = await fetch(`/api/rides/nearby?maxDistance=${maxDistance}&limit=20`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setNearbyRides(data.data.rides);
            } else {
                // إذا في مشكلة بالموقع، نعرض رسالة
                if (data.error?.includes("location")) {
                    setError("⚠️ Please update your location first");
                }
            }
        } catch (err) {
            console.error("Error fetching nearby rides:", err);
        }
    };

    const fetchMyRides = async () => {
        if (!token) return;
        try {
            const res = await fetch("/api/rides", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setMyRides(data.data.rides);
            }
        } catch (err) {
            console.error("Error fetching my rides:", err);
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

    const acceptRide = async (rideId: number) => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/rides/${rideId}/accept`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (data.success) {
                setCurrentRide(data.data.ride);
                fetchMyRides();
                fetchNearbyRides();
                alert("✅ Ride accepted successfully!");
            } else {
                setError(data.error || "Failed to accept ride");
                alert(data.error || "Failed to accept ride");
            }
        } catch (err) {
            setError("Network error");
            alert("Network error");
        } finally {
            setLoading(false);
        }
    };

    const updateRideStatus = async (rideId: number, status: string) => {
        try {
            const res = await fetch(`/api/rides/${rideId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status }),
            });
            const data = await res.json();
            if (data.success) {
                setCurrentRide(data.data.ride);
                fetchMyRides();
                alert(`✅ Status updated to ${status}`);
            } else {
                alert(data.error || "Failed to update status");
            }
        } catch (err) {
            alert("Network error");
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
                body: JSON.stringify({ reason: "Driver unavailable" }),
            });
            const data = await res.json();
            if (data.success) {
                alert("✅ Ride cancelled");
                fetchMyRides();
                fetchNearbyRides();
                if (currentRide?.id === rideId) {
                    setCurrentRide(null);
                }
            }
        } catch (err) {
            alert("Failed to cancel ride");
        }
    };

    const sendCounterOffer = async () => {
        if (!currentRide || !counterOffer) return;
        try {
            const res = await fetch(`/api/rides/${currentRide.id}/negotiate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    amount: parseFloat(counterOffer),
                    message: counterMessage,
                }),
            });
            const data = await res.json();
            if (data.success) {
                alert("✅ Counter offer sent!");
                fetchRideDetails(currentRide.id);
                setCounterOffer("");
                setCounterMessage("");
            } else {
                alert(data.error || "Failed to send counter offer");
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

    const updateLocation = async () => {
        if (!token || !currentLocation) {
            alert("Please provide token and allow location access");
            return;
        }

        setLocationUpdateStatus("Updating...");
        try {
            const res = await fetch("/api/drivers/location", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    latitude: currentLocation.lat,
                    longitude: currentLocation.lng,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setLocationUpdateStatus("✅ Location updated!");
                setTimeout(() => setLocationUpdateStatus(""), 3000);
                // Refresh nearby rides with new location
                fetchNearbyRides();
            } else {
                setLocationUpdateStatus("❌ Failed to update");
                alert(data.error || "Failed to update location");
            }
        } catch (err) {
            setLocationUpdateStatus("❌ Network error");
            alert("Network error");
        }
    };

    const refreshLocation = () => {
        if (navigator.geolocation) {
            setLocationUpdateStatus("Getting location...");
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCurrentLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                    setLocationUpdateStatus("✅ Location refreshed!");
                    setTimeout(() => setLocationUpdateStatus(""), 2000);
                },
                (error) => {
                    setLocationUpdateStatus("❌ Location error");
                    console.error("Error getting location:", error);
                }
            );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">🚕 Driver Test Page</h1>

                {/* Auth Section */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Authentication</h2>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">JWT Token</label>
                            <input
                                type="text"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                placeholder="Paste your JWT token"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">User ID</label>
                            <input
                                type="text"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                placeholder="Your user ID"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Max Distance (km)</label>
                            <input
                                type="number"
                                min="1"
                                max="50"
                                step="0.1"
                                value={maxDistance}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setMaxDistance(isNaN(val) ? 10 : val);
                                }}
                                className="w-full border rounded px-3 py-2"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                        <button
                            onClick={() => {
                                fetchNearbyRides();
                                fetchMyRides();
                            }}
                            disabled={!token}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
                        >
                            Load Rides
                        </button>
                        <button
                            onClick={() => setIsOnline(!isOnline)}
                            className={`px-4 py-2 rounded font-semibold ${isOnline ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-300 hover:bg-gray-400"
                                }`}
                        >
                            {isOnline ? "🟢 Online" : "⚫ Offline"}
                        </button>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
                            <span className="text-sm">{isConnected ? "Socket Connected" : "Socket Disconnected"}</span>
                        </div>
                    </div>

                    {/* Location Update Section */}
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h3 className="font-semibold mb-2">📍 Current Location</h3>
                        {currentLocation ? (
                            <div className="text-sm space-y-2">
                                <div className="flex gap-4">
                                    <span>Lat: {currentLocation.lat.toFixed(6)}</span>
                                    <span>Lng: {currentLocation.lng.toFixed(6)}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={refreshLocation}
                                        className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                                    >
                                        🔄 Refresh Location
                                    </button>
                                    <button
                                        onClick={updateLocation}
                                        disabled={!token}
                                        className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:bg-gray-300"
                                    >
                                        📤 Update Location on Server
                                    </button>
                                </div>
                                {locationUpdateStatus && (
                                    <div className="text-sm font-medium">{locationUpdateStatus}</div>
                                )}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-600">
                                <p>Getting your location...</p>
                                <p className="text-xs mt-1">Please allow location access in your browser</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    {/* Left Column: Nearby Rides & My Rides */}
                    <div>
                        {/* Nearby Rides */}
                        <div className="bg-white rounded-lg shadow p-6 mb-6">
                            <h2 className="text-xl font-semibold mb-4">📍 Nearby Rides</h2>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {nearbyRides.length === 0 ? (
                                    <p className="text-gray-500">No nearby rides available</p>
                                ) : (
                                    nearbyRides.map((ride) => (
                                        <div
                                            key={ride.id}
                                            className="border rounded p-4 hover:bg-gray-50 cursor-pointer"
                                            onClick={() => {
                                                setCurrentRide(ride);
                                                fetchRideDetails(ride.id);
                                            }}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="font-semibold">Ride #{ride.id}</div>
                                                    <div className="text-sm text-gray-600">
                                                        Distance: {ride.distanceFromDriver?.toFixed(2)} km away
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        Fare: ${ride.fare || ride.systemFare || "N/A"}
                                                    </div>
                                                    <div className="text-sm text-gray-600">Client: {ride.client.name}</div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        acceptRide(ride.id);
                                                    }}
                                                    disabled={loading}
                                                    className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:bg-gray-300"
                                                >
                                                    Accept
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* My Rides */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">🚗 My Active Rides</h2>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {myRides.length === 0 ? (
                                    <p className="text-gray-500">No active rides</p>
                                ) : (
                                    myRides.map((ride) => (
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
                                                    <div className="font-semibold">Ride #{ride.id}</div>
                                                    <div className="text-sm text-gray-600">Status: {ride.status}</div>
                                                    <div className="text-sm text-gray-600">
                                                        Fare: ${ride.fare || ride.systemFare || "N/A"}
                                                    </div>
                                                    <div className="text-sm text-gray-600">Client: {ride.client.name}</div>
                                                </div>
                                                {ride.status !== "COMPLETED" && ride.status !== "CANCELLED" && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            cancelRide(ride.id);
                                                        }}
                                                        className="text-red-500 text-sm hover:underline"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Map & Current Ride Details */}
                    <div>
                        {/* Map */}
                        {currentRide && (
                            <div className="bg-white rounded-lg shadow p-6 mb-6">
                                <h2 className="text-xl font-semibold mb-4">🗺️ Route Map</h2>
                                <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
                                    <GoogleMap
                                        mapContainerStyle={mapContainerStyle}
                                        center={currentRide.pickup}
                                        zoom={13}
                                    >
                                        <Marker position={currentRide.pickup} label="A" />
                                        <Marker position={currentRide.dropoff} label="B" />
                                        {directions && <DirectionsRenderer directions={directions} />}
                                    </GoogleMap>
                                </LoadScript>
                            </div>
                        )}

                        {/* Current Ride Details */}
                        {currentRide && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-semibold mb-4">🎯 Ride Details</h2>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="font-medium">Ride ID:</div>
                                        <div>#{currentRide.id}</div>
                                        <div className="font-medium">Status:</div>
                                        <div className="font-semibold">{currentRide.status}</div>
                                        <div className="font-medium">Distance:</div>
                                        <div>{currentRide.distance?.toFixed(2)} km</div>
                                        <div className="font-medium">System Fare:</div>
                                        <div>${currentRide.systemFare?.toFixed(2)}</div>
                                        <div className="font-medium">Final Fare:</div>
                                        <div className="font-semibold text-green-600">
                                            ${currentRide.fare?.toFixed(2) || "N/A"}
                                        </div>
                                    </div>

                                    <div className="border-t pt-3">
                                        <div className="font-medium mb-2">Client Info:</div>
                                        <div className="text-sm space-y-1">
                                            <div>Name: {currentRide.client.name}</div>
                                            <div>Phone: {currentRide.client.phone}</div>
                                        </div>
                                    </div>

                                    {/* Status Update Buttons */}
                                    {currentRide.status === "ACCEPTED" && (
                                        <div className="border-t pt-3">
                                            <button
                                                onClick={() => updateRideStatus(currentRide.id, "DRIVER_ARRIVED")}
                                                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                            >
                                                📍 I've Arrived
                                            </button>
                                        </div>
                                    )}

                                    {currentRide.status === "DRIVER_ARRIVED" && (
                                        <div className="border-t pt-3">
                                            <button
                                                onClick={() => updateRideStatus(currentRide.id, "IN_PROGRESS")}
                                                className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                                            >
                                                🚗 Start Ride
                                            </button>
                                        </div>
                                    )}

                                    {currentRide.status === "IN_PROGRESS" && (
                                        <div className="border-t pt-3">
                                            <button
                                                onClick={() => updateRideStatus(currentRide.id, "COMPLETED")}
                                                className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                                            >
                                                🏁 Complete Ride
                                            </button>
                                            <div className="mt-2 text-sm text-gray-600 text-center">
                                                {isOnline ? "📡 Broadcasting location..." : "⚠️ Go online to broadcast location"}
                                            </div>
                                        </div>
                                    )}

                                    {/* Negotiation Section */}
                                    {currentRide.negotiation && (
                                        <div className="border-t pt-3">
                                            <div className="font-medium mb-2">💰 Negotiation:</div>
                                            <div className="text-sm space-y-1 mb-3">
                                                <div>Status: {currentRide.negotiation.status}</div>
                                                <div>Client Offer: ${currentRide.negotiation.clientOffer}</div>
                                                {currentRide.negotiation.driverCounter && (
                                                    <div>Your Counter: ${currentRide.negotiation.driverCounter}</div>
                                                )}
                                                {currentRide.negotiation.agreedFare && (
                                                    <div className="font-semibold text-green-600">
                                                        Agreed: ${currentRide.negotiation.agreedFare}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Negotiation History */}
                                            {currentRide.negotiation.history && currentRide.negotiation.history.length > 0 && (
                                                <div className="bg-gray-50 rounded p-3 mb-3 max-h-40 overflow-y-auto">
                                                    <div className="text-xs font-medium mb-2">History:</div>
                                                    {currentRide.negotiation.history.map((offer, idx) => (
                                                        <div key={idx} className="text-xs mb-2">
                                                            <div className="font-semibold">
                                                                {offer.offeredBy}: ${offer.amount}
                                                            </div>
                                                            {offer.message && <div className="text-gray-600">{offer.message}</div>}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {currentRide.negotiation.status === "PENDING" && (
                                                <div className="space-y-2">
                                                    <input
                                                        type="number"
                                                        step="0.5"
                                                        value={counterOffer}
                                                        onChange={(e) => setCounterOffer(e.target.value)}
                                                        placeholder="Your counter offer"
                                                        className="w-full border rounded px-3 py-2 text-sm"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={counterMessage}
                                                        onChange={(e) => setCounterMessage(e.target.value)}
                                                        placeholder="Optional message"
                                                        className="w-full border rounded px-3 py-2 text-sm"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={sendCounterOffer}
                                                            className="flex-1 bg-yellow-500 text-white px-3 py-2 rounded text-sm hover:bg-yellow-600"
                                                        >
                                                            Counter Offer
                                                        </button>
                                                        <button
                                                            onClick={acceptNegotiation}
                                                            className="flex-1 bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={rejectNegotiation}
                                                            className="flex-1 bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {currentRide.negotiation.status === "COUNTERED" && (
                                                <div className="text-sm text-gray-600">
                                                    Waiting for client response...
                                                </div>
                                            )}
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
