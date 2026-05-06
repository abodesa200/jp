"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Bell, Car, CheckCircle2, Headphones, Send, Users } from "lucide-react";
import { useState } from "react";
import { NotificationsService } from "../services/notifications.service";
import { SendNotificationData, UserRole } from "../types";

type TargetType = "all" | "role" | "specific";

const roleConfig: Record<UserRole, { label: string; icon: React.ReactNode; color: string }> = {
    CLIENT: {
        label: "Clients",
        icon: <Users className="h-4 w-4" />,
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    },
    DRIVER: {
        label: "Drivers",
        icon: <Car className="h-4 w-4" />,
        color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
    ADMIN: {
        label: "Admins",
        icon: <Bell className="h-4 w-4" />,
        color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    },
    CUSTOMER_SUPPORT: {
        label: "Support Team",
        icon: <Headphones className="h-4 w-4" />,
        color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    },
};

interface SentRecord {
    id: number;
    title: string;
    message: string;
    target: string;
    sentTo: number;
    sentAt: Date;
}

export function NotificationsView() {
    const [targetType, setTargetType] = useState<TargetType>("all");
    const [selectedRole, setSelectedRole] = useState<UserRole>("CLIENT");
    const [userIdsInput, setUserIdsInput] = useState("");
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [history, setHistory] = useState<SentRecord[]>([]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!title.trim()) {
            setError("Title is required");
            return;
        }
        if (!message.trim()) {
            setError("Message is required");
            return;
        }

        const payload: SendNotificationData = { title: title.trim(), message: message.trim() };

        if (targetType === "role") {
            payload.role = selectedRole;
        } else if (targetType === "specific") {
            const ids = userIdsInput
                .split(",")
                .map((s) => parseInt(s.trim()))
                .filter((n) => !isNaN(n) && n > 0);

            if (ids.length === 0) {
                setError("Please enter valid user IDs");
                return;
            }
            payload.userIds = ids;
        }

        try {
            setSending(true);
            const result = await NotificationsService.sendNotification(payload);
            setSuccess(`Successfully sent to ${result.sentTo} user${result.sentTo !== 1 ? "s" : ""}`);

            // Add to history
            const targetLabel =
                targetType === "all"
                    ? "All Users"
                    : targetType === "role"
                        ? roleConfig[selectedRole].label
                        : `${payload.userIds?.length} specific users`;

            setHistory((prev) => [
                {
                    id: Date.now(),
                    title: title.trim(),
                    message: message.trim(),
                    target: targetLabel,
                    sentTo: result.sentTo,
                    sentAt: new Date(),
                },
                ...prev.slice(0, 9), // keep last 10
            ]);

            // Reset form
            setTitle("");
            setMessage("");
            setUserIdsInput("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to send notification");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Notifications"
                description="Send push notifications to platform users"
            />

            <div className="grid gap-6 lg:grid-cols-5">
                {/* Compose Form */}
                <div className="lg:col-span-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Compose Notification
                            </CardTitle>
                            <CardDescription>
                                Send a notification to all users, a specific role, or individual users.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSend} className="space-y-5">
                                {/* Target */}
                                <div className="space-y-3">
                                    <Label>Target Audience</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(["all", "role", "specific"] as TargetType[]).map((t) => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setTargetType(t)}
                                                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${targetType === t
                                                        ? "border-primary bg-primary text-primary-foreground"
                                                        : "border-border bg-background hover:bg-muted"
                                                    }`}
                                            >
                                                {t === "all" ? "All Users" : t === "role" ? "By Role" : "Specific IDs"}
                                            </button>
                                        ))}
                                    </div>

                                    {targetType === "role" && (
                                        <Select
                                            value={selectedRole}
                                            onValueChange={(v) => setSelectedRole(v as UserRole)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(Object.keys(roleConfig) as UserRole[]).map((role) => (
                                                    <SelectItem key={role} value={role}>
                                                        <div className="flex items-center gap-2">
                                                            {roleConfig[role].icon}
                                                            {roleConfig[role].label}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}

                                    {targetType === "specific" && (
                                        <div className="space-y-1">
                                            <Input
                                                placeholder="e.g. 1, 5, 23, 47"
                                                value={userIdsInput}
                                                onChange={(e) => setUserIdsInput(e.target.value)}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Enter comma-separated user IDs
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {/* Content */}
                                <div className="space-y-2">
                                    <Label htmlFor="notif-title">Title *</Label>
                                    <Input
                                        id="notif-title"
                                        placeholder="Notification title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        maxLength={200}
                                    />
                                    <p className="text-xs text-muted-foreground text-right">
                                        {title.length}/200
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notif-message">Message *</Label>
                                    <Textarea
                                        id="notif-message"
                                        placeholder="Write your notification message..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        rows={4}
                                        maxLength={1000}
                                    />
                                    <p className="text-xs text-muted-foreground text-right">
                                        {message.length}/1000
                                    </p>
                                </div>

                                {error && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                {success && (
                                    <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <AlertTitle>Sent!</AlertTitle>
                                        <AlertDescription>{success}</AlertDescription>
                                    </Alert>
                                )}

                                <Button type="submit" disabled={sending} className="w-full">
                                    <Send className="h-4 w-4 mr-2" />
                                    {sending ? "Sending..." : "Send Notification"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Preview + History */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Preview */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-xl border bg-muted/40 p-4 space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Bell className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate">
                                            {title || "Notification Title"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {targetType === "all"
                                                ? "All Users"
                                                : targetType === "role"
                                                    ? roleConfig[selectedRole].label
                                                    : "Specific Users"}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                    {message || "Your notification message will appear here..."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* History */}
                    {history.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Recent Sends</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {history.map((record) => (
                                    <div key={record.id} className="space-y-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-medium truncate">{record.title}</p>
                                            <Badge variant="secondary" className="text-xs shrink-0">
                                                {record.sentTo} sent
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {record.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            → {record.target} ·{" "}
                                            {record.sentAt.toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                        <Separator />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
