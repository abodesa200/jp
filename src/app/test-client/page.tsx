"use client";

import { DirectionsRenderer, GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { useEffect, useState } from "react";
import { useRideTracking } from "../hooks/useRideTracking";
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

    // Map states
    const [pickupMarker, setPickupMarker] = useState(damascusCenter);
    const [dropoffMarker, setDropoffMarker] = useState({ lat: 33.5102, lng: 36.2913 });
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

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

    // Update directions when markers change
    useEffect(() => {
        if (window.google) {
            const directionsService = new google.maps.DirectionsService();
            directionsService.route(
                {
                    origin: pickupMarker,
                    destination: dropoffMarker,
                    travelMode: google.maps.TravelMode.DRIVING,
                },
                (result, status) => {
                    if (status === "OK" && result) {
                        setDirections(result);
                    }
                }
            );
        }
    }, [pickupMarker, dropoffMarker]);

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
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">🧪 Client Test Page</h1>

                {/* Auth Section */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Authentication</h2>
                    <div className="grid grid-cols-2 gap-4">
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
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                        <button
                            onClick={fetchRides}
                            disabled={!token}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
                        >
                            Load My Rides
                        </button>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
                            <span className="text-sm">{isConnected ? "Socket Connected" : "Socket Disconnected"}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    {/* Left Column: Map & Create Ride */}
                    <div>
                        {/* Map */}
                        <div className="bg-white rounded-lg shadow p-6 mb-6">
                            <h2 className="text-xl font-semibold mb-4">📍 Select Locations</h2>
                            <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
                                <GoogleMap
                                    mapContainerStyle={mapContainerStyle}
                                    center={damascusCenter}
                                    zoom={13}
                                    onClick={(e) => {
                                        if (e.latLng) {
                                            const lat = e.latLng.lat();
                                            const lng = e.latLng.lng();
                                            if (!pickupMarker.lat || pickupMarker === damascusCenter) {
                                                setPickupMarker({ lat, lng });
                                                setPickupLat(lat);
                                                setPickupLng(lng);
                                            } else {
                                                setDropoffMarker({ lat, lng });
                                                setDropoffLat(lat);
                                                setDropoffLng(lng);
                                            }
                                        }
                                    }}
                                >
                                    <Marker position={pickupMarker} label="A" />
                                    <Marker position={dropoffMarker} label="B" />
                                    {driverLocation && (
                                        <Marker
                                            position={{ lat: driverLocation.lat, lng: driverLocation.lng }}
                                            icon={{
                                                url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                                            }}
                                        />
                                    )}
                                    {directions && <DirectionsRenderer directions={directions} />}
                                </GoogleMap>
                            </LoadScript>
                        </div>

                        {/* Create Ride Form */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">🚗 Create New Ride</h2>
                            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Pickup Lat</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={pickupLat}
                                            onChange={(e) => {
                                                setPickupLat(parseFloat(e.target.value));
                                                setPickupMarker({ lat: parseFloat(e.target.value), lng: pickupLng });
                                            }}
                                            className="w-full border rounded px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Pickup Lng</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={pickupLng}
                                            onChange={(e) => {
                                                setPickupLng(parseFloat(e.target.value));
                                                setPickupMarker({ lat: pickupLat, lng: parseFloat(e.target.value) });
                                            }}
                                            className="w-full border rounded px-3 py-2"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Dropoff Lat</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={dropoffLat}
                                            onChange={(e) => {
                                                setDropoffLat(parseFloat(e.target.value));
                                                setDropoffMarker({ lat: parseFloat(e.target.value), lng: dropoffLng });
                                            }}
                                            className="w-full border rounded px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Dropoff Lng</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={dropoffLng}
                                            onChange={(e) => {
                                                setDropoffLng(parseFloat(e.target.value));
                                                setDropoffMarker({ lat: dropoffLat, lng: parseFloat(e.target.value) });
                                            }}
                                            className="w-full border rounded px-3 py-2"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Ride Type</label>
                                        <select
                                            value={rideType}
                                            onChange={(e) => setRideType(e.target.value as "STANDARD" | "CARPOOLING")}
                                            className="w-full border rounded px-3 py-2"
                                        >
                                            <option value="STANDARD">Standard</option>
                                            <option value="CARPOOLING">Carpooling</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Max Passengers</label>
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
                                    {loading ? "Creating..." : "🚀 Create Ride"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Rides List & Current Ride */}
                    <div>
                        {/* My Rides */}
                        <div className="bg-white rounded-lg shadow p-6 mb-6">
                            <h2 className="text-xl font-semibold mb-4">📋 My Rides</h2>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {rides.length === 0 ? (
                                    <p className="text-gray-500">No rides yet</p>
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
                                                    <div className="font-semibold">Ride #{ride.id}</div>
                                                    <div className="text-sm text-gray-600">Status: {ride.status}</div>
                                                    <div className="text-sm text-gray-600">
                                                        Fare: ${ride.fare || ride.systemFare || "N/A"}
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
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Current Ride Details */}
                        {currentRide && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-semibold mb-4">🎯 Current Ride Details</h2>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="font-medium">Ride ID:</div>
                                        <div>#{currentRide.id}</div>
                                        <div className="font-medium">Status:</div>
                                        <div className="font-semibold">{rideStatus || currentRide.status}</div>
                                        <div className="font-medium">Type:</div>
                                        <div>{currentRide.status}</div>
                                        <div className="font-medium">Distance:</div>
                                        <div>{currentRide.distance?.toFixed(2)} km</div>
                                        <div className="font-medium">System Fare:</div>
                                        <div>${currentRide.systemFare?.toFixed(2)}</div>
                                        <div className="font-medium">Final Fare:</div>
                                        <div className="font-semibold text-green-600">
                                            ${currentRide.fare?.toFixed(2) || "N/A"}
                                        </div>
                                    </div>

                                    {currentRide.driver && (
                                        <div className="border-t pt-3">
                                            <div className="font-medium mb-2">Driver Info:</div>
                                            <div className="text-sm space-y-1">
                                                <div>Name: {currentRide.driver.user.name}</div>
                                                <div>Phone: {currentRide.driver.user.phone}</div>
                                                <div>Car: {currentRide.driver.carModel}</div>
                                                <div>Plate: {currentRide.driver.carPlate}</div>
                                            </div>
                                        </div>
                                    )}

                                    {driverLocation && (
                                        <div className="border-t pt-3">
                                            <div className="font-medium mb-2">Driver Location:</div>
                                            <div className="text-sm">
                                                Lat: {driverLocation.lat.toFixed(4)}, Lng: {driverLocation.lng.toFixed(4)}
                                            </div>
                                        </div>
                                    )}

                                    {/* Negotiation Section */}
                                    {currentRide.negotiation && (
                                        <div className="border-t pt-3">
                                            <div className="font-medium mb-2">💰 Negotiation:</div>
                                            <div className="text-sm space-y-1">
                                                <div>Status: {currentRide.negotiation.status}</div>
                                                <div>Your Offer: ${currentRide.negotiation.clientOffer}</div>
                                                {currentRide.negotiation.driverCounter && (
                                                    <div>Driver Counter: ${currentRide.negotiation.driverCounter}</div>
                                                )}
                                                {currentRide.negotiation.agreedFare && (
                                                    <div className="font-semibold text-green-600">
                                                        Agreed: ${currentRide.negotiation.agreedFare}
                                                    </div>
                                                )}
                                            </div>
                                            {currentRide.negotiation.status === "COUNTERED" && (
                                                <div className="flex gap-2 mt-3">
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
                                            )}
                                        </div>
                                    )}

                                    {/* Start Negotiation */}
                                    {!currentRide.negotiation && currentRide.status === "REQUESTED" && (
                                        <div className="border-t pt-3">
                                            <div className="font-medium mb-2">💰 Start Negotiation:</div>
                                            <div className="space-y-2">
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    value={negotiationAmount}
                                                    onChange={(e) => setNegotiationAmount(e.target.value)}
                                                    placeholder="Your offer amount"
                                                    className="w-full border rounded px-3 py-2 text-sm"
                                                />
                                                <input
                                                    type="text"
                                                    value={negotiationMessage}
                                                    onChange={(e) => setNegotiationMessage(e.target.value)}
                                                    placeholder="Optional message"
                                                    className="w-full border rounded px-3 py-2 text-sm"
                                                />
                                                <button
                                                    onClick={startNegotiation}
                                                    className="w-full bg-yellow-500 text-white px-3 py-2 rounded text-sm hover:bg-yellow-600"
                                                >
                                                    Send Offer
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
