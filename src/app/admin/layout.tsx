"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === "/admin/login") {
      setLoading(false);
      return;
    }

    // Check authentication
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      router.push("/admin/login");
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      if (userData.role !== "ADMIN") {
        router.push("/admin/login");
        return;
      }

      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      router.push("/admin/login");
      return;
    } finally {
      setLoading(false);
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Remove cookie
    document.cookie = "token=; path=/; max-age=0";
    router.push("/admin/login");
  };

  // Show login page without layout
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Show loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Show nothing if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">🚗 Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">Ride Sharing System</p>
        </div>

        <nav className="px-4 space-y-1">
          <NavLink href="/admin" icon="📊">
            Dashboard
          </NavLink>
          <NavLink href="/admin/users" icon="👥">
            Users
          </NavLink>
          <NavLink href="/admin/drivers" icon="🚗">
            Drivers
          </NavLink>
          <NavLink href="/admin/rides" icon="🗺️">
            Rides
          </NavLink>
          <NavLink href="/admin/rides/create" icon="➕">
            Create Ride
          </NavLink>
          <NavLink href="/admin/pending-drivers" icon="⏳">
            Pending Drivers
          </NavLink>
          <NavLink href="/admin/settings" icon="⚙️">
            Settings
          </NavLink>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          {user && (
            <div className="mb-3 px-4 py-2 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500">Logged in as</div>
              <div className="font-semibold text-sm truncate">
                {user.email || user.name || "Admin"}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition"
    >
      <span className="text-xl">{icon}</span>
      <span className="font-medium">{children}</span>
    </Link>
  );
}
