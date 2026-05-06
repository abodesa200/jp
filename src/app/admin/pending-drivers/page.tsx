"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  Hash,
  Mail,
  Phone,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Driver {
  id: number;
  licenseNumber: string;
  carModel: string;
  carPlate: string;
  carColor: string | null;
  carYear: number | null;
  createdAt: string;
  user: {
    id: number;
    phone: string;
    name: string | null;
    email: string | null;
  };
}

function DriverCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </CardContent>
      <CardFooter className="gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </CardFooter>
    </Card>
  );
}

export default function PendingDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchPendingDrivers();
  }, []);

  const fetchPendingDrivers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/drivers?isApproved=false&limit=100", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");
      setDrivers(data.data?.drivers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pending drivers");
    } finally {
      setLoading(false);
    }
  };

  const approveDriver = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/drivers/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ isApproved: true }),
      });
      if (!res.ok) throw new Error("Failed to approve");
      setDrivers((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve driver");
    } finally {
      setActionLoading(null);
    }
  };

  const rejectDriver = async (id: number) => {
    if (!confirm("Are you sure you want to reject and delete this driver application?")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/drivers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to reject");
      setDrivers((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject driver");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pending Drivers</h1>
          <p className="text-muted-foreground mt-1">Review and approve driver applications</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPendingDrivers} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Banner */}
      {!loading && !error && (
        <div className="flex items-center gap-3 rounded-lg border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-100">
              {drivers.length} Application{drivers.length !== 1 ? "s" : ""} Pending
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {drivers.length === 0
                ? "All caught up! No pending applications."
                : "Review each application carefully before approving."}
            </p>
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <DriverCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && drivers.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
          <p className="text-muted-foreground max-w-sm">
            No pending driver applications at the moment. New applications will appear here.
          </p>
        </div>
      )}

      {/* Drivers Grid */}
      {!loading && drivers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {drivers.map((driver) => (
            <Card key={driver.id} className="flex flex-col overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {driver.user.name?.charAt(0)?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold leading-tight">
                        {driver.user.name || "Unknown Driver"}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Calendar className="h-3 w-3" />
                        <span>Applied {new Date(driver.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
                    Pending
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                {/* Contact */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{driver.user.phone}</span>
                  </div>
                  {driver.user.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{driver.user.email}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Vehicle Info */}
                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Car className="h-3.5 w-3.5" />
                    Vehicle
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Model</p>
                      <p className="font-medium">{driver.carModel}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Plate</p>
                      <p className="font-medium font-mono">{driver.carPlate}</p>
                    </div>
                    {driver.carColor && (
                      <div>
                        <p className="text-xs text-muted-foreground">Color</p>
                        <p className="font-medium">{driver.carColor}</p>
                      </div>
                    )}
                    {driver.carYear && (
                      <div>
                        <p className="text-xs text-muted-foreground">Year</p>
                        <p className="font-medium">{driver.carYear}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* License */}
                <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                  <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">License Number</p>
                    <p className="font-mono font-semibold text-sm">{driver.licenseNumber}</p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="gap-3 pt-4">
                <Button
                  className="flex-1"
                  onClick={() => approveDriver(driver.id)}
                  disabled={actionLoading === driver.id}
                >
                  {actionLoading === driver.id ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => rejectDriver(driver.id)}
                  disabled={actionLoading === driver.id}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
