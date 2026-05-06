"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { EditDriverDialog } from "@/modules/drivers/components/EditDriverDialog";
import {
  AlertCircle,
  ArrowLeft,
  Car,
  CheckCircle2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Shield,
  Star,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Driver {
  id: string;
  licenseNumber: string;
  carModel: string;
  carPlate: string;
  carColor: string | null;
  carYear: number | null;
  isApproved: boolean;
  isOnline: boolean;
  rating: number;
  totalRides: number;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  user: {
    id: number;
    phone: string;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
    isVerified: boolean;
    createdAt: string;
  };
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

export default function DriverDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchDriver();
  }, []);

  const fetchDriver = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/drivers/${params.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch driver");
      setDriver(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load driver");
    } finally {
      setLoading(false);
    }
  };

  const toggleApproval = async () => {
    if (!driver) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/drivers/${driver.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ isApproved: !driver.isApproved }),
      });
      if (!res.ok) throw new Error("Failed to update driver");
      await fetchDriver();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update driver");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteDriver = async () => {
    if (!confirm("Are you sure you want to delete this driver? This action cannot be undone.")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/drivers/${params.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete driver");
      }
      router.push("/admin/drivers");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete driver");
      setActionLoading(false);
    }
  };

  if (loading) return <PageSkeleton />;

  if (error && !driver) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" asChild>
          <Link href="/admin/drivers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Drivers
          </Link>
        </Button>
      </div>
    );
  }

  if (!driver) return null;

  const initials = driver.user.name
    ? driver.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "DR";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/drivers">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">{driver.user.name ?? "Unknown Driver"}</h1>
              <p className="text-sm text-muted-foreground">Driver #{driver.id}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditDialogOpen(true)}
            disabled={actionLoading}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant={driver.isApproved ? "outline" : "default"}
            onClick={toggleApproval}
            disabled={actionLoading}
            size="sm"
          >
            {driver.isApproved ? (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Revoke Approval
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve Driver
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={deleteDriver}
            disabled={actionLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">Approval</p>
            {driver.isApproved ? (
              <div className="flex items-center gap-1.5 text-green-600 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                Approved
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-yellow-600 font-semibold">
                <AlertCircle className="h-4 w-4" />
                Pending
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">Online Status</p>
            <div className="flex items-center gap-1.5 font-semibold">
              <span
                className={`h-2.5 w-2.5 rounded-full ${driver.isOnline ? "bg-green-500" : "bg-gray-300"}`}
              />
              {driver.isOnline ? "Online" : "Offline"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">Rating</p>
            <div className="flex items-center gap-1.5 font-semibold">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              {driver.rating.toFixed(1)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">Total Rides</p>
            <p className="font-bold text-lg">{driver.totalRides}</p>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <InfoRow label="Full Name" value={driver.user.name} />
            <InfoRow
              label="Phone"
              value={
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  {driver.user.phone}
                </div>
              }
            />
            <InfoRow
              label="Email"
              value={
                driver.user.email ? (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {driver.user.email}
                  </div>
                ) : null
              }
            />
            <InfoRow
              label="Verified"
              value={
                driver.user.isVerified ? (
                  <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Not Verified
                  </Badge>
                )
              }
            />
            <InfoRow
              label="Member Since"
              value={new Date(driver.user.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
          </CardContent>
        </Card>

        {/* Vehicle Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Car className="h-4 w-4" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <InfoRow label="Car Model" value={driver.carModel} />
            <InfoRow
              label="License Plate"
              value={
                <span className="font-mono font-semibold tracking-wider">
                  {driver.carPlate}
                </span>
              }
            />
            <InfoRow label="Color" value={driver.carColor} />
            <InfoRow label="Year" value={driver.carYear} />
            <InfoRow
              label="License Number"
              value={
                <span className="font-mono text-xs">{driver.licenseNumber}</span>
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* Location */}
      {driver.latitude && driver.longitude && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              Last Known Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground mb-1">Latitude</p>
                <p className="font-mono font-semibold">{driver.latitude.toFixed(6)}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground mb-1">Longitude</p>
                <p className="font-mono font-semibold">{driver.longitude.toFixed(6)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <EditDriverDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        driver={driver}
        onSuccess={fetchDriver}
      />
    </div>
  );
}
