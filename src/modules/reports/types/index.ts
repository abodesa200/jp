export interface RideStats {
    summary: {
        totalRides: number;
        completedRides: number;
        cancelledRides: number;
        activeRides: number;
    };
    byStatus: { status: string; count: number }[];
    byType: { type: string; count: number }[];
    metrics: {
        averageFare: number;
        averageDistance: number;
        averageDuration: number;
        totalRevenue: number;
        totalDistance: number;
    };
}

export interface RevenueStats {
    summary: {
        totalRevenue: number;
        averageTransaction: number;
        totalTransactions: number;
    };
    byMethod: { method: string; revenue: number; count: number }[];
    byStatus: { status: string; revenue: number; count: number }[];
}

export interface DriverStats {
    summary: {
        totalDrivers: number;
        approvedDrivers: number;
        pendingDrivers: number;
        onlineDrivers: number;
        averageRating: number;
        averageRidesPerDriver: number;
    };
    topDrivers: {
        id: number;
        name: string | null;
        avatarUrl: string | null;
        rating: number;
        totalRides: number;
        carModel: string;
    }[];
    byStatus: { isApproved: boolean; count: number }[];
}

export interface UserStats {
    summary: {
        totalUsers: number;
        newUsers: number;
        verifiedUsers: number;
        activeClients: number;
        activeDrivers: number;
    };
    byRole: { role: string; count: number }[];
}

export interface ReportFilters {
    startDate?: string;
    endDate?: string;
}
