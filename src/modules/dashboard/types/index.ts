export interface DashboardStats {
    overview: {
        totalUsers: number;
        totalDrivers: number;
        totalRides: number;
        activeRides: number;
        completedRides: number;
        cancelledRides: number;
        pendingDrivers: number;
        onlineDrivers: number;
        totalRevenue: number;
    };
    recent: {
        rides: number;
        users: number;
        drivers: number;
    };
    topDrivers: TopDriver[];
    recentRides: RecentRide[];
}

export interface TopDriver {
    id: number;
    totalRides: number;
    rating: number;
    user: {
        id: number;
        name: string | null;
        phone: string;
    };
}

export interface RecentRide {
    id: number;
    status: string;
    fare: number | null;
    createdAt: string;
    client: {
        id: number;
        name: string | null;
        phone: string;
    };
}
