# 📚 أمثلة الاستخدام - Users Module

## 1️⃣ مثال كامل: صفحة إدارة المستخدمين

```typescript
"use client";

import { useState } from "react";
import { useGetUsers, useDeleteUser } from "@/modules/users/hooks";
import {
  UsersTable,
  UsersFilters,
  UsersPagination,
} from "@/modules/users/components";

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>("");

  // جلب المستخدمين
  const { data, isLoading } = useGetUsers({
    page,
    limit: 20,
    role: roleFilter || undefined,
  });

  // حذف مستخدم
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();

  const handleDelete = (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("يجب تسجيل الدخول أولاً");
      return;
    }

    deleteUser(
      { id, token },
      {
        onSuccess: () => {
          alert("تم حذف المستخدم بنجاح");
        },
        onError: (error) => {
          alert(`فشل الحذف: ${error.message}`);
        },
      }
    );
  };

  const handleRoleChange = (role: string) => {
    setRoleFilter(role);
    setPage(1); // إعادة تعيين الصفحة عند تغيير الفلتر
  };

  const users = data?.users || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">المستخدمون</h1>
          <p className="text-gray-600 mt-1">إدارة جميع مستخدمي المنصة</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + إضافة مستخدم
        </button>
      </div>

      {/* Filters */}
      <UsersFilters
        roleFilter={roleFilter}
        onRoleChange={handleRoleChange}
        total={total}
      />

      {/* Table */}
      <UsersTable
        users={users}
        isLoading={isLoading}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <UsersPagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
```

## 2️⃣ مثال: إنشاء مستخدم جديد

```typescript
"use client";

import { useState } from "react";
import { useCreateUser } from "@/modules/users/hooks";
import { createUserSchema } from "@/modules/users/schemas";

export default function CreateUserForm() {
  const [formData, setFormData] = useState({
    phone: "",
    name: "",
    email: "",
    role: "CLIENT" as const,
  });

  const { mutate: createUser, isPending } = useCreateUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // التحقق من البيانات
    const validation = createUserSchema.safeParse(formData);
    if (!validation.success) {
      alert("البيانات غير صحيحة");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("يجب تسجيل الدخول");
      return;
    }

    createUser(
      { data: formData, token },
      {
        onSuccess: () => {
          alert("تم إنشاء المستخدم بنجاح");
          setFormData({ phone: "", name: "", email: "", role: "CLIENT" });
        },
        onError: (error) => {
          alert(`فشل الإنشاء: ${error.message}`);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">رقم الهاتف</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">الاسم</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">البريد الإلكتروني</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">الدور</label>
        <select
          value={formData.role}
          onChange={(e) =>
            setFormData({ ...formData, role: e.target.value as any })
          }
          className="w-full px-4 py-2 border rounded-lg"
        >
          <option value="CLIENT">عميل</option>
          <option value="DRIVER">سائق</option>
          <option value="ADMIN">مدير</option>
          <option value="CUSTOMER_SUPPORT">دعم فني</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "جاري الإنشاء..." : "إنشاء مستخدم"}
      </button>
    </form>
  );
}
```

## 3️⃣ مثال: تحديث بيانات مستخدم

```typescript
"use client";

import { useState } from "react";
import { useUpdateUser } from "@/modules/users/hooks";
import type { User } from "@/modules/users/types";

interface EditUserFormProps {
  user: User;
  onSuccess?: () => void;
}

export default function EditUserForm({ user, onSuccess }: EditUserFormProps) {
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    role: user.role,
    isVerified: user.isVerified,
  });

  const { mutate: updateUser, isPending } = useUpdateUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) return;

    updateUser(
      {
        id: user.id,
        data: formData,
        token,
      },
      {
        onSuccess: () => {
          alert("تم التحديث بنجاح");
          onSuccess?.();
        },
        onError: (error) => {
          alert(`فشل التحديث: ${error.message}`);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">الاسم</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">البريد الإلكتروني</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">الدور</label>
        <select
          value={formData.role}
          onChange={(e) =>
            setFormData({ ...formData, role: e.target.value as any })
          }
          className="w-full px-4 py-2 border rounded-lg"
        >
          <option value="CLIENT">عميل</option>
          <option value="DRIVER">سائق</option>
          <option value="ADMIN">مدير</option>
          <option value="CUSTOMER_SUPPORT">دعم فني</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData.isVerified}
          onChange={(e) =>
            setFormData({ ...formData, isVerified: e.target.checked })
          }
          id="verified"
        />
        <label htmlFor="verified" className="text-sm">
          مستخدم موثق
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "جاري التحديث..." : "تحديث البيانات"}
      </button>
    </form>
  );
}
```

## 4️⃣ مثال: استخدام RoleBadge

```typescript
import { RoleBadge } from "@/modules/users/components";

export default function UserCard({ user }) {
  return (
    <div className="p-4 border rounded-lg">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <RoleBadge role={user.role} />
    </div>
  );
}
```

## 5️⃣ مثال: التحقق من البيانات

```typescript
import { validateCreateUser, getValidationErrors } from "@/modules/users/utils/validation";

function handleFormSubmit(data: unknown) {
  const validation = validateCreateUser(data);

  if (!validation.success) {
    const errors = getValidationErrors(validation.error);
    console.log("أخطاء التحقق:", errors);
    // [{ field: "phone", message: "Phone must be at least 10 characters" }]
    return;
  }

  // البيانات صحيحة
  console.log("البيانات الصحيحة:", validation.data);
}
```

## 6️⃣ مثال: استخدام Constants

```typescript
import { USER_ROLES, USER_ROLE_OPTIONS, DEFAULT_LIMIT } from "@/modules/users/constants";

// عرض جميع الأدوار في dropdown
export default function RoleSelector() {
  return (
    <select>
      {USER_ROLE_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label} - {option.description}
        </option>
      ))}
    </select>
  );
}

// استخدام الإعدادات الافتراضية
const { data } = useGetUsers({
  page: 1,
  limit: DEFAULT_LIMIT, // 20
});
```

## 7️⃣ مثال: React Query Integration

```typescript
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/modules/users/constants";

export default function RefreshButton() {
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    // إعادة تحميل قائمة المستخدمين
    queryClient.invalidateQueries({ 
      queryKey: QUERY_KEYS.users() 
    });
  };

  return (
    <button onClick={handleRefresh}>
      تحديث القائمة
    </button>
  );
}
```

## 8️⃣ مثال: Error Handling

```typescript
import { useGetUsers } from "@/modules/users/hooks";

export default function UsersPageWithError() {
  const { data, isLoading, error } = useGetUsers({ page: 1, limit: 20 });

  if (isLoading) {
    return <div>جاري التحميل...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        حدث خطأ: {error.message}
      </div>
    );
  }

  return <div>{/* عرض البيانات */}</div>;
}
```

---

**جميع الأمثلة جاهزة للاستخدام مباشرة! 🚀**
