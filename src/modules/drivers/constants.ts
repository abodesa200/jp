export const SERVICE_TYPE_OPTIONS = [
  { value: "STANDARD", label: "عادي" },
  { value: "VIP", label: "VIP" },
  { value: "VAN", label: "فان" },
] as const;

export type ServiceTypeValue = (typeof SERVICE_TYPE_OPTIONS)[number]["value"];

export function getServiceTypeLabel(value: string | null | undefined): string {
  return SERVICE_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value ?? "—";
}
