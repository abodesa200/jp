# Modules Architecture

كل module يحتوي على:

- **components/**: مكونات React خاصة بالـ module
- **hooks/**: Custom hooks للـ module
- **services/**: API calls والـ business logic
- **schemas/**: Zod validation schemas
- **types/**: TypeScript types والـ interfaces

## Available Modules

- `dashboard/`: لوحة التحكم الرئيسية
- `drivers/`: إدارة السائقين
- `rides/`: إدارة الرحلات
- `users/`: إدارة المستخدمين
- `auth/`: المصادقة والتسجيل
