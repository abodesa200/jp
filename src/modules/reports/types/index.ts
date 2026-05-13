export interface RideStats {
    total: number;
    requested: number;
    accepted: number;
    inProgress: number;
    completed: number;
    cancelled: number;
}

export interface RevenueStats {
    total: number;
    daily: number;
    weekly: number;
    monthly: number;
}

export interface DriverStats {
    total: number;
    approved: number;
    pending: number;
    online: number;
    offline: number;
}

export interface UserStats {
    total: number;
    verified: number;
    unverified: number;
    recentGrowth: number;
}

export interface ReportFilters {
    startDate?: string;
    endDate?: string;
}
