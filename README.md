# 🚗 Ride Sharing Platform

A modern, full-featured ride-sharing platform built with Next.js, featuring real-time tracking, carpooling, and comprehensive admin management.

## ✨ Features

### 🎯 Core Features
- **Real-time Ride Tracking** - Live location updates using Socket.IO
- **Carpooling System** - Share rides and reduce costs
- **Driver Management** - Complete driver approval and management system
- **User Management** - Comprehensive user administration
- **Admin Dashboard** - Analytics and statistics
- **OTP Authentication** - Secure email-based authentication

### 🎨 UI/UX
- **Modern Design** - Built with shadcn/ui components
- **Responsive** - Works on all devices
- **Dark Mode** - Full dark mode support
- **Accessible** - WCAG compliant components

### 🏗️ Architecture
- **Feature-Based Modules** - Organized by features
- **Type-Safe** - Full TypeScript support
- **Validated** - Zod schema validation
- **Reusable Components** - Shared component library

---

## 📁 Project Structure

```
src/
├── modules/              # Feature modules
│   ├── dashboard/        # Dashboard module
│   ├── drivers/          # Drivers management
│   ├── rides/            # Rides management
│   └── ...
├── components/
│   ├── shared/           # Reusable components
│   └── ui/               # shadcn/ui components
├── app/                  # Next.js App Router
│   ├── api/              # API routes
│   └── admin/            # Admin pages
└── prisma/               # Database schema
```

For detailed architecture documentation, see [ARCHITECTURE.md](src/modules/ARCHITECTURE.md)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ride-sharing-platform
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL="postgresql://..."
RESEND_API_KEY="your-resend-api-key"
JWT_SECRET="your-jwt-secret"
```

4. **Set up the database**
```bash
pnpm prisma migrate dev
pnpm prisma generate
```

5. **Run the development server**
```bash
pnpm dev
```

6. **Run the Socket.IO server** (in a separate terminal)
```bash
pnpm tsx socket-server.ts
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

---

## 📚 Documentation

- **[Architecture Guide](src/modules/ARCHITECTURE.md)** - Detailed architecture overview
- **[Usage Guide](src/modules/USAGE_GUIDE.md)** - How to use the system
- **[Examples](src/modules/EXAMPLES.md)** - Practical code examples
- **[Refactoring Summary](REFACTORING_SUMMARY.md)** - What changed in the refactor

---

## 🎨 Tech Stack

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Lucide Icons** - Icon library

### Backend
- **Next.js API Routes** - Backend API
- **Prisma** - ORM
- **PostgreSQL** - Database
- **Socket.IO** - Real-time communication
- **Zod** - Schema validation

### Authentication
- **JWT** - Token-based auth
- **Resend** - Email service for OTP

---

## 📦 Available Modules

### Dashboard Module
Complete analytics dashboard with:
- Overview statistics
- Top drivers list
- Recent rides
- Revenue tracking

### Drivers Module
Driver management with:
- Driver approval system
- Vehicle information
- Rating system
- Online/offline status

### Rides Module
Ride management with:
- Ride tracking
- Status management
- Carpooling support
- Distance and fare calculation

---

## 🎯 Shared Components

### Data Display
- `DataTable` - Reusable table with pagination
- `StatCard` - Statistics card with trends
- `StatusBadge` - Status indicators
- `TypeBadge` - Type indicators

### Layout
- `PageHeader` - Consistent page headers
- `EmptyState` - Empty state displays

### Feedback
- `LoadingSpinner` - Loading indicators
- `ErrorAlert` - Error messages
- `ConfirmDialog` - Confirmation dialogs

---

## 🔧 Development

### Adding a New Module

1. Create the module structure:
```bash
mkdir -p src/modules/feature-name/{components,hooks,services,schemas,types}
```

2. Follow the existing patterns in other modules

3. Export from `index.ts`

4. Use in your pages

See [Usage Guide](src/modules/USAGE_GUIDE.md) for detailed instructions.

### Code Style

- Use TypeScript for type safety
- Follow the existing component patterns
- Use shared components when possible
- Validate inputs with Zod schemas
- Handle errors gracefully

---

## 🧪 Testing

```bash
# Run tests (when implemented)
pnpm test

# Run linter
pnpm lint

# Type check
pnpm type-check
```

---

## 📝 API Documentation

API documentation is available in:
- [API-AUTH-EMAIL.md](API-AUTH-EMAIL.md) - Authentication endpoints
- [API-RIDES.md](API-RIDES.md) - Rides endpoints
- [openapi.yaml](openapi.yaml) - OpenAPI specification

---

## 🚀 Deployment

### Build for Production

```bash
pnpm build
```

### Start Production Server

```bash
pnpm start
```

### Deploy to Vercel

The easiest way to deploy is using [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=<your-repo-url>)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) - The React framework
- [shadcn/ui](https://ui.shadcn.com) - Beautiful UI components
- [Prisma](https://prisma.io) - Next-generation ORM
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS

---

## 📞 Support

For support, email support@example.com or open an issue on GitHub.

---

**Built with ❤️ using Next.js and TypeScript**
