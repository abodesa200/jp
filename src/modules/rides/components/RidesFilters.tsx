"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface RidesFiltersProps {
    statusFilter: string;
    typeFilter: string;
    searchQuery: string;
    totalCount: number;
    onStatusFilterChange: (value: string) => void;
    onTypeFilterChange: (value: string) => void;
    onSearchChange: (value: string) => void;
}

export function RidesFilters({
    statusFilter,
    typeFilter,
    searchQuery,
    totalCount,
    onStatusFilterChange,
    onTypeFilterChange,
    onSearchChange,
}: RidesFiltersProps) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-1 gap-4">
                        <div className="w-full max-w-xs">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search rides..."
                                    value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="REQUESTED">Requested</SelectItem>
                                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                                <SelectItem value="DRIVER_ARRIVED">Driver Arrived</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={typeFilter} onValueChange={onTypeFilterChange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="STANDARD">Standard</SelectItem>
                                <SelectItem value="CARPOOLING">Carpooling</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Total: <span className="font-semibold text-foreground">{totalCount}</span>{" "}
                        rides
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
