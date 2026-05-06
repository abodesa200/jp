"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { CreatePromoCodeData } from "../types";

interface CreatePromoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: CreatePromoCodeData) => Promise<void>;
}

const defaultForm: CreatePromoCodeData = {
    code: "",
    discountType: "PERCENTAGE",
    discountValue: 10,
    isActive: true,
    expiresAt: "",
    maxUses: undefined,
};

export function CreatePromoDialog({ open, onOpenChange, onSubmit }: CreatePromoDialogProps) {
    const [form, setForm] = useState<CreatePromoCodeData>(defaultForm);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!form.code.trim()) {
            setError("Code is required");
            return;
        }
        if (form.discountValue <= 0) {
            setError("Discount value must be positive");
            return;
        }
        if (form.discountType === "PERCENTAGE" && form.discountValue > 100) {
            setError("Percentage discount cannot exceed 100%");
            return;
        }

        try {
            setSubmitting(true);
            const payload: CreatePromoCodeData = {
                ...form,
                code: form.code.toUpperCase(),
                expiresAt: form.expiresAt || undefined,
                maxUses: form.maxUses || undefined,
            };
            await onSubmit(payload);
            setForm(defaultForm);
            onOpenChange(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create promo code");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create Promo Code</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="code">Code *</Label>
                        <Input
                            id="code"
                            placeholder="e.g. SUMMER20"
                            value={form.code}
                            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                            className="font-mono uppercase"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label>Discount Type *</Label>
                            <Select
                                value={form.discountType}
                                onValueChange={(v) => setForm((f) => ({ ...f, discountType: v as any }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                                    <SelectItem value="FIXED">Fixed Amount ($)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="discountValue">
                                Value {form.discountType === "PERCENTAGE" ? "(%)" : "($)"} *
                            </Label>
                            <Input
                                id="discountValue"
                                type="number"
                                min={0.01}
                                max={form.discountType === "PERCENTAGE" ? 100 : undefined}
                                step={0.01}
                                value={form.discountValue}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, discountValue: parseFloat(e.target.value) || 0 }))
                                }
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="expiresAt">Expires At</Label>
                            <Input
                                id="expiresAt"
                                type="datetime-local"
                                value={form.expiresAt}
                                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maxUses">Max Uses</Label>
                            <Input
                                id="maxUses"
                                type="number"
                                min={1}
                                placeholder="Unlimited"
                                value={form.maxUses ?? ""}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        maxUses: e.target.value ? parseInt(e.target.value) : undefined,
                                    }))
                                }
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Switch
                            id="isActive"
                            checked={form.isActive}
                            onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                        />
                        <Label htmlFor="isActive">Active immediately</Label>
                    </div>

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? "Creating..." : "Create Code"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
