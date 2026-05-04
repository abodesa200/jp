# Users Module

هذا الموديول مسؤول عن إدارة المستخدمين في لوحة التحكم.

## البنية

```
users/
├── components/          # المكونات القابلة لإعادة الاستخدام
│   ├── UsersTable.tsx      # جدول عرض المستخدمين
│   ├── UsersFilters.tsx    # فلاتر البحث والتصفية
│   ├── UsersPagination.tsx # التنقل بين الصفحات
│   ├── RoleBadge.tsx       # عرض دور المستخدم
│   └── index.ts            # تصدير جميع المكونات
├── hooks/               # Custom Hooks للمنطق
│   ├── useGetUsers.ts      # جلب قائمة المستخدمين
│   ├── useDeleteUser.ts    # حذف مستخدم
│   ├── useUpdateUser.ts    # تحديث بيانات مستخدم
│   └── index.ts            # تصدير جميع الـ hooks
├── types/               # TypeScript Types
│   └── index.ts            # جميع الأنواع المستخدمة
├── schemas/             # Zod Validation Schemas
│   └── index.ts            # جميع schemas للتحقق
└── README.md            # هذا الملف
```

## الاستخدام

### 1. جلب المستخدمين

```tsx
import { useGetUsers } from "@/modules/users/hooks";

function MyComponent() {
  const { data, isLoading } = useGetUsers({
    page: 1,
    limit: 20,
    role: "CLIENT",
  });

  return <div>{/* استخدم data.users */}</div>;
}
```

### 2. حذف مستخدم

```tsx
import { useDeleteUser } from "@/modules/users/hooks";

function MyComponent() {
  const { mutate: deleteUser, isPending } = useDeleteUser();

  const handleDelete = (id: number) => {
    const token = localStorage.getItem("token");
    deleteUser(
      { id, token },
      {
        onSuccess: () => alert("تم الحذف"),
        onError: (error) => alert(error.message),
      }
    );
  };

  return <button onClick={() => handleDelete(1)}>حذف</button>;
}
```

### 3. تحديث مستخدم

```tsx
import { useUpdateUser } from "@/modules/users/hooks";

function MyComponent() {
  const { mutate: updateUser } = useUpdateUser();

  const handleUpdate = (id: number) => {
    const token = localStorage.getItem("token");
    updateUser({
      id,
      data: { name: "اسم جديد", role: "ADMIN" },
      token,
    });
  };

  return <button onClick={() => handleUpdate(1)}>تحديث</button>;
}
```

### 4. استخدام المكونات

```tsx
import {
  UsersTable,
  UsersFilters,
  UsersPagination,
  RoleBadge,
} from "@/modules/users/components";

function UsersPage() {
  return (
    <div>
      <UsersFilters
        roleFilter={roleFilter}
        onRoleChange={setRoleFilter}
        total={100}
      />
      <UsersTable
        users={users}
        isLoading={false}
        onDelete={handleDelete}
      />
      <UsersPagination
        currentPage={1}
        totalPages={5}
        onPageChange={setPage}
      />
    </div>
  );
}
```

## Types

### User
```typescript
interface User {
  id: number;
  phone: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
}
```

### UserRole
```typescript
type UserRole = "CLIENT" | "ADMIN" | "CUSTOMER_SUPPORT" | "DRIVER";
```

### UsersFilters
```typescript
interface UsersFilters {
  page?: number;
  limit?: number;
  role?: UserRole | "";
  search?: string;
}
```

## Schemas

جميع الـ schemas موجودة في `schemas/index.ts` وتستخدم مكتبة Zod للتحقق:

- `userSchema` - التحقق من بيانات المستخدم
- `usersFiltersSchema` - التحقق من فلاتر البحث
- `updateUserSchema` - التحقق من بيانات التحديث
- `createUserSchema` - التحقق من بيانات إنشاء مستخدم جديد

## ملاحظات

- جميع الـ hooks تستخدم React Query للـ caching والـ state management
- المكونات مصممة لتكون قابلة لإعادة الاستخدام في أي مكان
- التحقق من البيانات يتم باستخدام Zod schemas
- جميع الأنواع مكتوبة بـ TypeScript بشكل كامل
