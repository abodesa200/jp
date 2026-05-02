"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, XCircle } from "lucide-react";

interface ErrorAlertProps {
    title?: string;
    message: string;
    onRetry?: () => void;
    onDismiss?: () => void;
}

export function ErrorAlert({
    title = "Error",
    message,
    onRetry,
    onDismiss,
}: ErrorAlertProps) {
    return (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="flex items-center justify-between">
                <span>{title}</span>
                {onDismiss && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDismiss}
                        className="h-auto p-0 hover:bg-transparent"
                    >
                        <XCircle className="h-4 w-4" />
                    </Button>
                )}
            </AlertTitle>
            <AlertDescription className="mt-2">
                {message}
                {onRetry && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRetry}
                        className="mt-3"
                    >
                        Try Again
                    </Button>
                )}
            </AlertDescription>
        </Alert>
    );
}
