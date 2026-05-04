# 🚀 دليل البدء السريع - Users Module

## ⚡ البدء في 3 خطوات

### 1️⃣ استيراد ما تحتاجه

```typescript
import {
  useGetUsers,
  useDeleteUser,
  UsersTable,
  UsersFilters,
  UsersPagination,
} from "@/modules/users";
```

### 2️⃣ استخدام الـ Hooks

```typescript
const { data, isLoading } = useGetUsers({ page: 1, limit: 20 });
const { mutate: deleteUser } = useDeleteUser();
```

### 3️⃣ عرض المكونات

```typescript
<UsersTable users={data?.users} onDelete={deleteUser} />
```

---

## 📋 مثال كامل (Copy & Paste)

```typescript
"use client";

import { useState } from "react";
import {
  useGetUsers,
  useDeleteUser,
  UsersTable,
  UsersFilters,
  UsersPagination,
} from "@/modules/users";

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<"" | "CLIENT" | "DRIVER" | "ADMIN" | "CUSTOMER_SUPPORT">("");

  const { data, isLoading } = useGetUsers({
    page,
    limit: 20,
    role: roleFilter || undefined,
  });

  const { mutate: deleteUser, isPending } = useDeleteUser();

  const handleDelete = (id: number) => {
    if (!confirm("هل أنت متأكد؟")) return;
    
    const token = localStorage.getItem("token");
    deleteUser({ id, token }, {
      onSuccess: () => alert("تم الحذف"),
      onError: (e) => alert(e.message),
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">المستخدمون</h1>
      
      <UsersFilters
        roleFilter={roleFilter}
        onRoleChange={setRoleFilter}
        total={data?.total || 0}
      />
      
      <UsersTable
        users={data?.users || []}
        isLoading={isLoading}
        onDelete={handleDelete}
        isDeleting={isPending}
      />
      
      {data && data.totalPages > 1 && (
        <UsersPagination
          currentPage={page}
          totalPages={data.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
```

---

## 🎯 الـ Hooks المتاحة

### 📥 جلب المستخدمين
```typescript
const { data, isLoading, error } = useGetUsers({
  page: 1,
  limit: 20,
  role: "CLIENT", // اختياري
  search: "john", // اختياري
});
```

### ➕ إنشاء مستخدم
```typescript
const { mutate: createUser, isPending } = useCreateUser();

createUser({
  data: {
    phone: "1234567890",
    name: "John Doe",
    email: "john@example.com",
    role: "CLIENT",
  },
  token: "your-token",
});
```

### ✏️ تحديث مستخدم
```typescript
const { mutate: updateUser } = useUpdateUser();

updateUser({
  id: 1,
  data: { name: "New Name" },
  token: "your-token",
});
```

### 🗑️ حذف مستخدم
```typescript
const { mutate: deleteUser, isPending } = useDeleteUser();

deleteUser({
  id: 1,
  token: "your-token",
});
```

---

## 🎨 المكونات المتاحة

### 📊 UsersTable
```typescript
<UsersTable
  users={users}
  isLoading={false}
  onDelete={(id) => console.log(id)}
  isDeleting={false}
/>
```

### 🔍 UsersFilters
```typescript
<UsersFilters
  roleFilter=""
  onRoleChange={(role) => setRole(role)}
  total={100}
/>
```

### 📄 UsersPagination
```typescript
<UsersPagination
  currentPage={1}
  totalPages={5}
  onPageChange={(page) => setPage(page)}
/>
```

### 🏷️ RoleBadge
```typescript
<RoleBadge role="CLIENT" />
<RoleBadge role="DRIVER" />
<RoleBadge role="ADMIN" />
```

---

## 📝 الأنواع (Types)

```typescript
import type { User, UserRole, UsersFilters } from "@/modules/users";

// User
const user: User = {
  id: 1,
  phone: "1234567890",
  name: "John",
  email: "john@example.com",
  role: "CLIENT",
  isVerified: true,
  createdAt: "2024-01-01",
};

// UserRole
const role: UserRole = "CLIENT"; // أو "DRIVER" أو "ADMIN" أو "CUSTOMER_SUPPORT"

// UsersFilters
const filters: UsersFilters = {
  page: 1,
  limit: 20,
  role: "CLIENT",
  search: "john",
};
```

---

## ✅ التحقق من البيانات

```typescript
import { createUserSchema } from "@/modules/users";

const result = createUserSchema.safeParse({
  phone: "1234567890",
  name: "John",
  email: "john@example.com",
  role: "CLIENT",
});

if (result.success) {
  console.log("البيانات صحيحة:", result.data);
} else {
  console.log("أخطاء:", result.error);
}
```

---

## 🔧 الثوابت

```typescript
import { USER_ROLES, DEFAULT_LIMIT } from "@/modules/users/constants";

// استخدام الأدوار
console.log(USER_ROLES.CLIENT); // { label: "Client", color: "blue", ... }

// استخدام الحد الافتراضي
const limit = DEFAULT_LIMIT; // 20
```

---

## 💡 نصائح سريعة

1. **استخدم React Query DevTools** لمراقبة الـ cache
2. **استخدم TypeScript** للحصول على autocomplete
3. **اقرأ EXAMPLES.md** لأمثلة أكثر تفصيلاً
4. **استخدم الـ constants** بدلاً من القيم الثابتة
5. **استخدم الـ schemas** للتحقق من البيانات

---

## 📚 المزيد من التوثيق

- **README.md** - دليل شامل
- **STRUCTURE.md** - شرح البنية
- **EXAMPLES.md** - أمثلة عملية مفصلة
- **SUMMARY.md** - ملخص ما تم إنجازه

---

**🎉 الآن أنت جاهز للبدء!**
