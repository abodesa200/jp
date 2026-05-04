# 📁 Users Module - البنية الكاملة

## 🎯 نظرة عامة

هذا الموديول مصمم بشكل احترافي ومنظم لإدارة المستخدمين في لوحة التحكم. تم فصل المنطق والعرض والتحقق بشكل كامل.

## 📂 البنية الكاملة

```
src/modules/users/
│
├── 📁 components/              # المكونات القابلة لإعادة الاستخدام
│   ├── UsersTable.tsx          # جدول عرض المستخدمين مع Loading & Empty states
│   ├── UsersFilters.tsx        # فلاتر البحث والتصفية
│   ├── UsersPagination.tsx     # التنقل بين الصفحات
│   ├── RoleBadge.tsx           # Badge لعرض دور المستخدم
│   └── index.ts                # تصدير جميع المكونات
│
├── 📁 hooks/                   # Custom Hooks للمنطق والـ API calls
│   ├── useGetUsers.ts          # جلب قائمة المستخدمين (GET)
│   ├── useCreateUser.ts        # إنشاء مستخدم جديد (POST)
│   ├── useUpdateUser.ts        # تحديث بيانات مستخدم (PATCH)
│   ├── useDeleteUser.ts        # حذف مستخدم (DELETE)
│   └── index.ts                # تصدير جميع الـ hooks
│
├── 📁 types/                   # TypeScript Types & Interfaces
│   └── index.ts                # جميع الأنواع المستخدمة في الموديول
│
├── 📁 schemas/                 # Zod Validation Schemas
│   └── index.ts                # schemas للتحقق من البيانات
│
├── 📁 constants/               # الثوابت والإعدادات
│   └── index.ts                # Query keys, roles config, defaults
│
├── 📁 utils/                   # Utility Functions
│   └── validation.ts           # دوال مساعدة للتحقق من البيانات
│
├── index.ts                    # تصدير كل شيء من الموديول
├── README.md                   # دليل الاستخدام
└── STRUCTURE.md                # هذا الملف
```

## 🔧 المكونات (Components)

### 1. UsersTable
جدول كامل لعرض المستخدمين مع:
- ✅ Loading state
- ✅ Empty state
- ✅ Hover effects
- ✅ Actions (View, Delete)
- ✅ Status badges

### 2. UsersFilters
فلاتر البحث والتصفية:
- ✅ Role filter
- ✅ Total count display
- ✅ Auto reset page on filter change

### 3. UsersPagination
التنقل بين الصفحات:
- ✅ Previous/Next buttons
- ✅ Current page display
- ✅ Disabled states

### 4. RoleBadge
عرض دور المستخدم بألوان مختلفة:
- 🔵 CLIENT - أزرق
- 🟢 DRIVER - أخضر
- 🔴 ADMIN - أحمر
- 🟣 CUSTOMER_SUPPORT - بنفسجي

## 🪝 Hooks

### 1. useGetUsers
```typescript
const { data, isLoading, error } = useGetUsers({
  page: 1,
  limit: 20,
  role: "CLIENT"
});
```

### 2. useCreateUser
```typescript
const { mutate: createUser, isPending } = useCreateUser();

createUser(
  { data: { phone, name, email, role }, token },
  {
    onSuccess: () => console.log("تم الإنشاء"),
    onError: (error) => console.error(error)
  }
);
```

### 3. useUpdateUser
```typescript
const { mutate: updateUser } = useUpdateUser();

updateUser({
  id: 1,
  data: { name: "اسم جديد" },
  token
});
```

### 4. useDeleteUser
```typescript
const { mutate: deleteUser, isPending } = useDeleteUser();

deleteUser(
  { id: 1, token },
  {
    onSuccess: () => console.log("تم الحذف")
  }
);
```

## 📝 Types

```typescript
// User
interface User {
  id: number;
  phone: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
}

// UserRole
type UserRole = "CLIENT" | "ADMIN" | "CUSTOMER_SUPPORT" | "DRIVER";

// UsersFilters
interface UsersFilters {
  page?: number;
  limit?: number;
  role?: UserRole | "";
  search?: string;
}

// UsersResponse
interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

## ✅ Schemas (Zod)

```typescript
// User validation
userSchema

// Filters validation
usersFiltersSchema

// Update validation
updateUserSchema

// Create validation
createUserSchema
```

## 🎨 Constants

```typescript
// Pagination
DEFAULT_PAGE = 1
DEFAULT_LIMIT = 20
MAX_LIMIT = 100

// User roles config
USER_ROLES = {
  CLIENT: { label, color, description },
  DRIVER: { label, color, description },
  ADMIN: { label, color, description },
  CUSTOMER_SUPPORT: { label, color, description }
}

// Query keys
QUERY_KEYS = {
  users: (filters) => ["users", filters],
  user: (id) => ["user", id]
}
```

## 🚀 الاستخدام في الصفحة

```typescript
// src/app/admin/users/page.tsx
import { useState } from "react";
import { useGetUsers, useDeleteUser } from "@/modules/users/hooks";
import {
  UsersTable,
  UsersFilters,
  UsersPagination,
} from "@/modules/users/components";

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");

  const { data, isLoading } = useGetUsers({
    page,
    limit: 20,
    role: roleFilter || undefined,
  });

  const { mutate: deleteUser, isPending } = useDeleteUser();

  // ... باقي المنطق
}
```

## ✨ المميزات

1. **فصل كامل للمسؤوليات**
   - Components للعرض فقط
   - Hooks للمنطق والـ API
   - Types للأنواع
   - Schemas للتحقق

2. **قابلية إعادة الاستخدام**
   - كل مكون مستقل
   - يمكن استخدامه في أي مكان

3. **Type Safety**
   - TypeScript بشكل كامل
   - Zod للتحقق من البيانات

4. **React Query Integration**
   - Caching تلقائي
   - Invalidation ذكي
   - Loading & Error states

5. **Clean Code**
   - تسميات واضحة
   - تعليقات مفيدة
   - بنية منظمة

## 📦 التصدير

```typescript
// استيراد كل شيء من الموديول
import {
  // Hooks
  useGetUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  
  // Components
  UsersTable,
  UsersFilters,
  UsersPagination,
  RoleBadge,
  
  // Types
  User,
  UserRole,
  UsersFilters,
  
  // Schemas
  userSchema,
  createUserSchema,
  
} from "@/modules/users";
```

## 🎯 Next Steps

1. ✅ إضافة Search functionality
2. ✅ إضافة Bulk actions
3. ✅ إضافة Export to CSV
4. ✅ إضافة User details modal
5. ✅ إضافة Create user modal

---

**تم التصميم والتطوير بشكل احترافي ✨**
