# 🏗️ Architecture Overview

## معمارية المشروع

تم تصميم المشروع باستخدام معمارية **Feature-Based Modules** لتحقيق:
- ✅ فصل واضح للمسؤوليات (Separation of Concerns)
- ✅ سهولة الصيانة والتطوير
- ✅ إعادة استخدام الكود
- ✅ قابلية التوسع

---

## 📁 هيكل المجلدات

```
src/
├── modules/              # Feature modules
│   ├── dashboard/        # لوحة التحكم
│   │   ├── components/   # مكونات React
│   │   ├── hooks/        # Custom hooks
│   │   ├── services/     # API calls
│   │   ├── types/        # TypeScript types
│   │   └── index.ts      # Public exports
│   │
│   ├── drivers/          # إدارة السائقين
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── schemas/      # Zod validation
│   │   ├── types/
│   │   └── index.ts
│   │
│   └── rides/            # إدارة الرحلات
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── schemas/
│       ├── types/
│       └── index.ts
│
├── components/
│   ├── shared/           # مكونات مشتركة
│   │   ├── DataTable.tsx
│   │   ├── StatCard.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── PageHeader.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── ErrorAlert.tsx
│   │   └── index.ts
│   │
│   └── ui/               # shadcn/ui components
│
└── app/                  # Next.js App Router
    └── admin/
        ├── page.tsx      # → DashboardView
        ├── drivers/
        │   └── page.tsx  # → DriversView
        └── rides/
            └── page.tsx  # → RidesView
```

---

## 🎯 Module Structure

كل module يحتوي على:

### 1️⃣ **components/**
مكونات React الخاصة بالـ feature:
- `*View.tsx` - المكون الرئيسي للصفحة
- `*Table.tsx` - جداول البيانات
- `*Filters.tsx` - فلاتر البحث والتصفية
- `*Form.tsx` - نماذج الإدخال

### 2️⃣ **hooks/**
Custom React hooks:
- `use*List.ts` - جلب قوائم البيانات
- `use*Detail.ts` - جلب تفاصيل عنصر واحد
- `use*Mutation.ts` - عمليات التعديل والحذف

### 3️⃣ **services/**
API calls والـ business logic:
```typescript
export class FeatureService {
  private static getAuthHeaders() { ... }
  static async getList() { ... }
  static async getById(id) { ... }
  static async create(data) { ... }
  static async update(id, data) { ... }
  static async delete(id) { ... }
}
```

### 4️⃣ **schemas/**
Zod validation schemas:
```typescript
export const createSchema = z.object({
  field: z.string().min(1),
  // ...
});

export type CreateInput = z.infer<typeof createSchema>;
```

### 5️⃣ **types/**
TypeScript interfaces:
```typescript
export interface Entity {
  id: string;
  // ...
}

export interface ListParams {
  page?: number;
  limit?: number;
  // ...
}
```

---

## 🎨 Shared Components

### DataTable
جدول بيانات قابل لإعادة الاستخدام مع:
- Pagination
- Loading states
- Empty states
- Custom column rendering

```typescript
<DataTable
  data={items}
  columns={columns}
  loading={loading}
  pagination={{
    page: 1,
    total: 100,
    pageSize: 20,
    onPageChange: (page) => {},
  }}
/>
```

### StatCard
بطاقة إحصائيات مع:
- Icons من lucide-react
- Variants (primary, success, warning, danger)
- Trend indicators
- Optional links

```typescript
<StatCard
  title="Total Users"
  value={1234}
  icon={Users}
  variant="primary"
  trend={{ value: 12, label: "this week" }}
/>
```

### StatusBadge & TypeBadge
Badges للحالات والأنواع مع ألوان مخصصة

### PageHeader
Header موحد للصفحات مع:
- Title & description
- Optional action button

---

## 🔄 Data Flow

```
Page Component (app/)
    ↓
View Component (modules/*/components/*View.tsx)
    ↓
Custom Hook (modules/*/hooks/use*.ts)
    ↓
Service (modules/*/services/*.service.ts)
    ↓
API Route (app/api/)
    ↓
Database (Prisma)
```

---

## 🎨 Design System

### Colors
- **Primary**: Blue - للعناصر الأساسية
- **Success**: Green - للحالات الناجحة
- **Warning**: Yellow - للتحذيرات
- **Danger**: Red - للأخطاء والحذف

### Typography
- **Headings**: font-bold tracking-tight
- **Body**: font-normal
- **Mono**: font-mono (للأكواد والـ IDs)

### Spacing
- استخدام `space-y-*` للمسافات العمودية
- استخدام `gap-*` للـ flex/grid

---

## 📝 Naming Conventions

### Files
- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Services: `camelCase.service.ts`
- Types: `index.ts`
- Schemas: `camelCase.schema.ts`

### Variables
- Components: `PascalCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Types/Interfaces: `PascalCase`

---

## 🚀 Best Practices

### 1. Component Composition
```typescript
// ❌ Bad
<div className="...">
  <div className="...">
    {/* Complex logic */}
  </div>
</div>

// ✅ Good
<PageHeader title="..." />
<DataTable data={...} />
```

### 2. Custom Hooks
```typescript
// ❌ Bad - Logic in component
const [data, setData] = useState([]);
useEffect(() => {
  fetch(...).then(setData);
}, []);

// ✅ Good - Logic in hook
const { data, loading } = useFeature();
```

### 3. Type Safety
```typescript
// ❌ Bad
const data: any = await fetch(...);

// ✅ Good
const data: FeatureType = await FeatureService.get();
```

### 4. Error Handling
```typescript
// ✅ Always handle errors
try {
  await service.action();
} catch (err) {
  setError(err instanceof Error ? err.message : "Unknown error");
}
```

---

## 🔧 Adding New Module

1. إنشاء المجلد: `src/modules/feature-name/`
2. إضافة الهيكل الأساسي:
   ```
   feature-name/
   ├── components/
   ├── hooks/
   ├── services/
   ├── schemas/
   ├── types/
   └── index.ts
   ```
3. تطبيق الـ patterns الموجودة
4. Export من `index.ts`
5. استخدام في `app/` pages

---

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Zod](https://zod.dev)
- [Lucide Icons](https://lucide.dev)
