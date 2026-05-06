"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, DollarSign, Info, Percent, Settings, Sliders } from "lucide-react";
import { useState } from "react";

interface PlatformSettings {
  baseFare: number;
  perKmRate: number;
  minFare: number;
  cancellationFee: number;
  driverCommission: number;
  maxWaitTime: number;
}

const defaultSettings: PlatformSettings = {
  baseFare: 5,
  perKmRate: 2,
  minFare: 5,
  cancellationFee: 2,
  driverCommission: 20,
  maxWaitTime: 5,
};

function SettingField({
  label,
  description,
  id,
  value,
  onChange,
  prefix,
  suffix,
  min,
  max,
  step = 0.01,
}: {
  label: string;
  description: string;
  id: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-sm text-muted-foreground font-medium">
            {prefix}
          </span>
        )}
        <Input
          id={id}
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={prefix ? "pl-7" : suffix ? "pr-10" : ""}
        />
        {suffix && (
          <span className="absolute right-3 text-sm text-muted-foreground font-medium">
            {suffix}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const update = (key: keyof PlatformSettings) => (value: number) => {
    setSaved(false);
    setSettings((s) => ({ ...s, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate save — replace with real API call when endpoint is available
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setSaved(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Settings"
        description="Configure platform pricing and operational parameters"
      />

      {saved && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Saved</AlertTitle>
          <AlertDescription>Settings have been updated successfully.</AlertDescription>
        </Alert>
      )}

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-4 w-4" />
            Pricing
          </CardTitle>
          <CardDescription>Configure fare calculation parameters</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <SettingField
            id="baseFare"
            label="Base Fare"
            description="Starting price for every ride"
            value={settings.baseFare}
            onChange={update("baseFare")}
            prefix="$"
            min={0}
          />
          <SettingField
            id="perKmRate"
            label="Per Kilometer Rate"
            description="Price charged per kilometer traveled"
            value={settings.perKmRate}
            onChange={update("perKmRate")}
            prefix="$"
            min={0}
          />
          <SettingField
            id="minFare"
            label="Minimum Fare"
            description="Minimum charge for any ride"
            value={settings.minFare}
            onChange={update("minFare")}
            prefix="$"
            min={0}
          />
          <SettingField
            id="cancellationFee"
            label="Cancellation Fee"
            description="Fee charged when a ride is cancelled"
            value={settings.cancellationFee}
            onChange={update("cancellationFee")}
            prefix="$"
            min={0}
          />
        </CardContent>
      </Card>

      {/* Commission */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Percent className="h-4 w-4" />
            Commission
          </CardTitle>
          <CardDescription>Platform revenue sharing configuration</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <SettingField
            id="driverCommission"
            label="Platform Commission"
            description="Percentage taken from driver earnings per ride"
            value={settings.driverCommission}
            onChange={update("driverCommission")}
            suffix="%"
            min={0}
            max={100}
            step={1}
          />
        </CardContent>
      </Card>

      {/* Ride Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sliders className="h-4 w-4" />
            Ride Settings
          </CardTitle>
          <CardDescription>Operational parameters for ride management</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <SettingField
            id="maxWaitTime"
            label="Max Wait Time"
            description="Maximum minutes to wait for driver acceptance"
            value={settings.maxWaitTime}
            onChange={update("maxWaitTime")}
            suffix="min"
            min={1}
            max={60}
            step={1}
          />
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: "Platform Version", value: "1.0.0" },
              { label: "Database", value: "PostgreSQL" },
              { label: "Socket Server", value: "Port 3001" },
              { label: "Environment", value: process.env.NODE_ENV ?? "development" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Badge variant="secondary" className="font-mono text-xs">
                  {value}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleReset} size="sm">
          Reset to Defaults
        </Button>
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Settings className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
