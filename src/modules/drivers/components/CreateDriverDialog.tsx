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
import { useState } from "react";

interface CreateDriverDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

interface FormData {
    name: string;
    email: string;
    phone: string;
    licenseNumber: string;
    carModel: string;
    carPlate: string;
    carColor: string;
    carYear: string;
    isApproved: boolean;
}

const initialForm: FormData = {
    name: "",
    email: "",
    phone: "",
    licenseNumber: "",
    carModel: "",
    carPlate: "",
    carColor: "",
    carYear: "",
    isApproved: false,
};

export function CreateDriverDialog({ open, onOpenChange, onSuccess }: CreateDriverDialogProps) {
    const [form, setForm] = useState<FormData>(initialForm);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (field: keyof FormData, value: string | boolean) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!form.name.trim()) return setError("Name is required");
        if (!form.email.trim() && !form.phone.trim()) return setError("Either email or phone is required");
        if (!form.licenseNumber.trim()) return setError("License number is required");
        if (!form.carModel.trim()) return setError("Car model is required");
        if (!form.carPlate.trim()) return setError("Car plate is required");

        setLoading(true);
        try {
            const body: Record<string, unknown> = {
                name: form.name.trim(),
                role: "DRIVER",
                driverInfo: {
                    licenseNumber: form.licenseNumber.trim(),
                    carModel: form.carModel.trim(),
                    carPlate: form.carPlate.trim(),
                },
            };
            if (form.email.trim()) body.email = form.email.trim();
            if (form.phone.trim()) body.phone = form.phone.trim();
            if (form.carColor.trim()) (body.driverInfo as Record<string, unknown>).carColor = form.carColor.trim();
            if (form.carYear.trim()) {
                const year = parseInt(form.carYear);
                if (isNaN(year) || year < 1900 || year > 2100) {
                    setError("Car year must be between 1900 and 2100");
                    setLoading(false);
                    return;
                }
                (body.driverInfo as Record<string, unknown>).carYear = year;
            }

            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create driver");

            if (form.isApproved && data.user?.driver?.id) {
                await fetch(`/api/admin/drivers/${data.user.driver.id}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify({ isApproved: true }),
                });
            }

            setForm(initialForm);
            onOpenChange(false);
            onSuccess?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create driver");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        setForm(initialForm);
        setError(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Driver</DialogTitle>
                    <DialogDescription>
                        Create a new driver account. Either email or phone is required.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 py-2">
                    {/* Personal Info */}
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Personal Information
                        </p>
                        <div className="grid gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="name">Full Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="John Doe"
                                    value={form.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        value={form.email}
                                        onChange={(e) => handleChange("email", e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        placeholder="+1234567890"
                                        value={form.phone}
                                        onChange={(e) => handleChange("phone", e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vehicle Info */}
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Vehicle Information
                        </p>
                        <div className="grid gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="licenseNumber">License Number *</Label>
                                <Input
                                    id="licenseNumber"
                                    placeholder="DL-123456"
                                    value={form.licenseNumber}
                                    onChange={(e) => handleChange("licenseNumber", e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="carModel">Car Model *</Label>
                                    <Input
                                        id="carModel"
                                        placeholder="Toyota Camry"
                                        value={form.carModel}
                                        onChange={(e) => handleChange("carModel", e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="carPlate">Car Plate *</Label>
                                    <Input
                                        id="carPlate"
                                        placeholder="ABC-1234"
                                        value={form.carPlate}
                                        onChange={(e) => handleChange("carPlate", e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="carColor">Car Color</Label>
                                    <Input
                                        id="carColor"
                                        placeholder="White"
                                        value={form.carColor}
                                        onChange={(e) => handleChange("carColor", e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="carYear">Car Year</Label>
                                    <Input
                                        id="carYear"
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

                    {/* Approval */}
                    <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                        <div>
                            <p className="text-sm font-medium">Approve Immediately</p>
                            <p className="text-xs text-muted-foreground">
                                Driver will be active right after creation
                            </p>
                        </div>
                        <Switch
                            checked={form.isApproved}
                            onCheckedChange={(v) => handleChange("isApproved", v)}
                            disabled={loading}
                        />
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
                            Create Driver
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
