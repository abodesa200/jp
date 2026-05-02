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

interface DriversFiltersProps {
    approvedFilter: string;
    searchQuery: string;
    totalCount: number;
    onApprovedFilterChange: (value: string) => void;
    onSearchChange: (value: string) => void;
}

export function DriversFilters({
    approvedFilter,
    searchQuery,
    totalCount,
    onApprovedFilterChange,
    onSearchChange,
}: DriversFiltersProps) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-1 gap-4">
                        <div className="w-full max-w-xs">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search drivers..."
                                    value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                        <Select value={approvedFilter} onValueChange={onApprovedFilterChange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Drivers</SelectItem>
                                <SelectItem value="true">Approved</SelectItem>
                                <SelectItem value="false">Pending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Total: <span className="font-semibold text-foreground">{totalCount}</span>{" "}
                        drivers
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
