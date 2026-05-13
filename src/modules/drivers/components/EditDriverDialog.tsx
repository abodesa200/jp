"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface Driver {
    id: number;
    licenseNumber: string;
    carModel: string;
    carPlate: string;
    carColor: string | null;
    carYear: number | null;
    isApproved: boolean;
    isOnline: boolean;
}

interface EditDriverDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    driver: Driver | null;
    onSuccess?: () => void;
}

interface FormData {
    licenseNumber: string;
    carModel: string;
    carPlate: string;
    carColor: string;
    carYear: string;
    isApproved: boolean;
    isOnline: boolean;
}

export function EditDriverDialog({ open, onOpenChange, driver, onSuccess }: EditDriverDialogProps) {
    const [form, setForm] = useState<FormData>({
        licenseNumber: "",
        carModel: "",
        carPlate: "",
        carColor: "",
        carYear: "",
        isApproved: false,
        isOnline: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Populate form when driver changes
    useEffect(() => {
        if (driver) {
            setForm({
                licenseNumber: driver.licenseNumber,
                carModel: driver.carModel,
                carPlate: driver.carPlate,
                carColor: driver.carColor ?? "",
                carYear: driver.carYear?.toString() ?? "",
                isApproved: driver.isApproved,
                isOnline: driver.isOnline,
            });
            setError(null);
        }
    }, [driver]);

    const handleChange = (field: keyof FormData, value: string | boolean) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!driver) return;
        setError(null);

        if (!form.licenseNumber.trim()) return setError("License number is required");
        if (!form.carModel.trim()) return setError("Car model is required");
        if (!form.carPlate.trim()) return setError("Car plate is required");

        const body: Record<string, unknown> = {
            licenseNumber: form.licenseNumber.trim(),
            carModel: form.carModel.trim(),
            carPlate: form.carPlate.trim(),
            isApproved: form.isApproved,
            isOnline: form.isOnline,
        };

        if (form.carColor.trim()) body.carColor = form.carColor.trim();
        if (form.carYear.trim()) {
            const year = parseInt(form.carYear);
            if (isNaN(year) || year < 1900 || year > 2100) {
                setError("Car year must be between 1900 and 2100");
                return;
            }
            body.carYear = year;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/admin/drivers/${driver.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update driver");

            onOpenChange(false);
            onSuccess?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update driver");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        setError(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Driver</DialogTitle>
                    <DialogDescription>
                        Update driver and vehicle information.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 py-2">
                    {/* Vehicle Info */}
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Vehicle Information
                        </p>
                        <div className="grid gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-licenseNumber">License Number *</Label>
                                <Input
                                    id="edit-licenseNumber"
                                    placeholder="DL-123456"
                                    value={form.licenseNumber}
                                    onChange={(e) => handleChange("licenseNumber", e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit-carModel">Car Model *</Label>
                                    <Input
                                        id="edit-carModel"
                                        placeholder="Toyota Camry"
                                        value={form.carModel}
                                        onChange={(e) => handleChange("carModel", e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit-carPlate">Car Plate *</Label>
                                    <Input
                                        id="edit-carPlate"
                                        placeholder="ABC-1234"
                                        value={form.carPlate}
                                        onChange={(e) => handleChange("carPlate", e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit-carColor">Car Color</Label>
                                    <Input
                                        id="edit-carColor"
                                        placeholder="White"
                                        value={form.carColor}
                                        onChange={(e) => handleChange("carColor", e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit-carYear">Car Year</Label>
                                    <Input
                                        id="edit-carYear"
                                        type="number"
                                        placeholder="2022"
                                        min={1900}
                                        max={2100}
                                        value={form.carYear}
                                        onChange={(e) => handleChange("carYear", e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Status
                        </p>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                                <div>
                                    <p className="text-sm font-medium">Approved</p>
                                    <p className="text-xs text-muted-foreground">
                                        Allow driver to accept rides
                                    </p>
                                </div>
                                <Switch
                                    checked={form.isApproved}
                                    onCheckedChange={(v) => handleChange("isApproved", v)}
                                    disabled={loading}
                                />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                                <div>
                                    <p className="text-sm font-medium">Online</p>
                                    <p className="text-xs text-muted-foreground">
                                        Driver is currently available
                                    </p>
                                </div>
                                <Switch
                                    checked={form.isOnline}
                                    onCheckedChange={(v) => handleChange("isOnline", v)}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2.5">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
