# 📖 دليل الاستخدام

## كيفية استخدام النظام الجديد

---

## 1️⃣ استخدام Modules الموجودة

### Dashboard
```typescript
import { DashboardView } from "@/modules/dashboard";

export default function Page() {
  return <DashboardView />;
}
```

### Drivers
```typescript
import { DriversView } from "@/modules/drivers";

export default function Page() {
  return <DriversView />;
}
```

### Rides
```typescript
import { RidesView } from "@/modules/rides";

export default function Page() {
  return <RidesView />;
}
```

---

## 2️⃣ استخدام Shared Components

### PageHeader
```typescript
import { PageHeader } from "@/components/shared";
import { Plus } from "lucide-react";

<PageHeader
  title="العنوان"
  description="الوصف"
  action={{
    label: "إضافة جديد",
    onClick: () => console.log("clicked"),
    icon: Plus,
  }}
/>
```

### DataTable
```typescript
import { DataTable } from "@/components/shared";

const columns = [
  {
    key: "name",
    label: "الاسم",
    render: (item) => <span>{item.name}</span>,
  },
  {
    key: "email",
    label: "البريد",
  },
];

<DataTable
  data={users}
  columns={columns}
  loading={loading}
  emptyMessage="لا يوجد مستخدمين"
  pagination={{
    page: 1,
    total: 100,
    pageSize: 20,
    onPageChange: (page) => setPage(page),
  }}
/>
```

### StatCard
```typescript
import { StatCard } from "@/components/shared";
import { Users } from "lucide-react";

<StatCard
  title="إجمالي المستخدمين"
  value={1234}
  icon={Users}
  variant="primary"
  description="المستخدمين النشطين"
  trend={{
    value: 12,
    label: "هذا الأسبوع",
  }}
  href="/users"
/>
```

### StatusBadge
```typescript
import { StatusBadge } from "@/components/shared";

<StatusBadge status="COMPLETED" />
<StatusBadge status="PENDING" />
<StatusBadge status="CANCELLED" />
```

### LoadingSpinner
```typescript
import { LoadingSpinner, LoadingPage } from "@/components/shared";

// Spinner صغير
<LoadingSpinner size="sm" />

// صفحة تحميل كاملة
<LoadingPage />
```

### EmptyState
```typescript
import { EmptyState } from "@/components/shared";
import { Users } from "lucide-react";

<EmptyState
  icon={Users}
  title="لا يوجد مستخدمين"
  description="ابدأ بإضافة مستخدم جديد"
  action={{
    label: "إضافة مستخدم",
    onClick: () => console.log("add user"),
  }}
/>
```

### ErrorAlert
```typescript
import { ErrorAlert } from "@/components/shared";

<ErrorAlert
  title="خطأ"
  message="فشل في تحميل البيانات"
  onRetry={() => refetch()}
  onDismiss={() => setError(null)}
/>
```

### ConfirmDialog
```typescript
import { ConfirmDialog } from "@/components/shared";

const [open, setOpen] = useState(false);

<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  title="تأكيد الحذف"
  description="هل أنت متأكد من حذف هذا العنصر؟"
  confirmText="حذف"
  cancelText="إلغاء"
  variant="destructive"
  onConfirm={() => {
    deleteItem();
    setOpen(false);
  }}
/>
```

---

## 3️⃣ استخدام Custom Hooks

### useDashboardStats
```typescript
import { useDashboardStats } from "@/modules/dashboard";

function Component() {
  const { stats, loading, error, refetch } = useDashboardStats();

  if (loading) return <LoadingPage />;
  if (error) return <ErrorAlert message={error} onRetry={refetch} />;

  return <div>{stats.overview.totalUsers}</div>;
}
```

### useDrivers
```typescript
import { useDrivers } from "@/modules/drivers";

function Component() {
  const {
    drivers,
    loading,
    pagination,
    updateParams,
    toggleApproval,
    deleteDriver,
  } = useDrivers({ page: 1, limit: 20 });

  // تغيير الصفحة
  updateParams({ page: 2 });

  // تغيير الفلتر
  updateParams({ approved: true });

  // تبديل الموافقة
  toggleApproval(driverId, currentStatus);

  // حذف سائق
  deleteDriver(driverId);
}
```

### useRides
```typescript
import { useRides } from "@/modules/rides";

function Component() {
  const {
    rides,
    loading,
    pagination,
    updateParams,
    deleteRide,
  } = useRides({ page: 1, limit: 20 });

  // تصفية حسب الحالة
  updateParams({ status: "COMPLETED" });

  // تصفية حسب النوع
  updateParams({ type: "CARPOOLING" });

  // حذف رحلة
  deleteRide(rideId);
}
```

---

## 4️⃣ استخدام Services

### DriversService
```typescript
import { DriversService } from "@/modules/drivers";

// جلب قائمة السائقين
const data = await DriversService.getDrivers({
  page: 1,
  limit: 20,
  approved: true,
});

// جلب سائق واحد
const driver = await DriversService.getDriver(id);

// تحديث سائق
const updated = await DriversService.updateDriver(id, {
  isApproved: true,
});

// حذف سائق
await DriversService.deleteDriver(id);

// تبديل الموافقة
await DriversService.toggleApproval(id, currentStatus);
```

### RidesService
```typescript
import { RidesService } from "@/modules/rides";

// جلب قائمة الرحلات
const data = await RidesService.getRides({
  page: 1,
  limit: 20,
  status: "COMPLETED",
});

// جلب رحلة واحدة
const ride = await RidesService.getRide(id);

// حذف رحلة
await RidesService.deleteRide(id);

// إلغاء رحلة
await RidesService.cancelRide(id);
```

---

## 5️⃣ استخدام Zod Schemas

### Validation
```typescript
import { driverFilterSchema } from "@/modules/drivers";

// Validate input
const result = driverFilterSchema.safeParse({
  page: 1,
  limit: 20,
  approved: true,
});

if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

### Type Inference
```typescript
import { CreateRideInput } from "@/modules/rides";

const data: CreateRideInput = {
  clientId: 1,
  pickupLat: 33.5,
  pickupLng: 36.3,
  dropoffLat: 33.6,
  dropoffLng: 36.4,
  type: "STANDARD",
};
```

---

## 6️⃣ إنشاء صفحة جديدة

### مثال: صفحة Users

```typescript
// src/app/admin/users/page.tsx
"use client";

import { useState } from "react";
import {
  PageHeader,
  DataTable,
  LoadingPage,
  ErrorAlert,
} from "@/components/shared";
import { Plus } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (user) => <span>{user.name}</span>,
    },
    {
      key: "email",
      label: "Email",
    },
  ];

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage all users"
        action={{
          label: "Add User",
          onClick: () => console.log("add"),
          icon: Plus,
        }}
      />

      <DataTable
        data={users}
        columns={columns}
        loading={loading}
      />
    </div>
  );
}
```

---

## 7️⃣ إنشاء Module جديد

### الخطوات:

1. **إنشاء الهيكل**
```bash
mkdir -p src/modules/users/{components,hooks,services,schemas,types}
```

2. **إضافة Types**
```typescript
// src/modules/users/types/index.ts
export interface User {
  id: number;
  name: string;
  email: string;
}
```

3. **إضافة Service**
```typescript
// src/modules/users/services/users.service.ts
export class UsersService {
  static async getUsers() {
    const response = await fetch("/api/users");
    return response.json();
  }
}
```

4. **إضافة Hook**
```typescript
// src/modules/users/hooks/useUsers.ts
import { useState, useEffect } from "react";
import { UsersService } from "../services/users.service";

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    UsersService.getUsers().then(setUsers).finally(() => setLoading(false));
  }, []);

  return { users, loading };
}
```

5. **إضافة Component**
```typescript
// src/modules/users/components/UsersView.tsx
import { useUsers } from "../hooks/useUsers";
import { DataTable } from "@/components/shared";

export function UsersView() {
  const { users, loading } = useUsers();

  return (
    <DataTable
      data={users}
      columns={[...]}
      loading={loading}
    />
  );
}
```

6. **Export من index.ts**
```typescript
// src/modules/users/index.ts
export { UsersView } from "./components/UsersView";
export { useUsers } from "./hooks/useUsers";
export { UsersService } from "./services/users.service";
export type { User } from "./types";
```

---

## 8️⃣ Best Practices

### ✅ Do
```typescript
// استخدام shared components
import { PageHeader, DataTable } from "@/components/shared";

// استخدام hooks للـ logic
const { data, loading } = useFeature();

// استخدام services للـ API calls
await FeatureService.getData();

// استخدام types
const user: User = { ... };
```

### ❌ Don't
```typescript
// تكرار الكود
<div className="...">
  <h1>Title</h1>
  {/* ... */}
</div>

// Logic في component
const [data, setData] = useState([]);
useEffect(() => {
  fetch(...).then(setData);
}, []);

// استخدام any
const data: any = await fetch(...);
```

---

## 🎨 Styling Guidelines

### استخدام Tailwind Classes
```typescript
// Layout
<div className="space-y-6">
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

// Typography
<h1 className="text-3xl font-bold tracking-tight">
<p className="text-sm text-muted-foreground">

// Colors
<div className="bg-primary text-primary-foreground">
<div className="bg-destructive text-destructive-foreground">
```

### استخدام cn() للـ conditional classes
```typescript
import { cn } from "@/lib/utils";

<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  variant === "primary" && "primary-classes"
)} />
```

---

## 📚 Resources

- [Architecture Guide](./ARCHITECTURE.md)
- [Refactoring Summary](../../REFACTORING_SUMMARY.md)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Next.js Docs](https://nextjs.org/docs)
