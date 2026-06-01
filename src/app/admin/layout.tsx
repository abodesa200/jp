"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ActivityIcon,
  BarChart3,
  Bell,
  Building2,
  Car,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Plus,
  Settings,
  Tag,
  Users
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
  {
    group: "Overview",
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
    ],
  },
  {
    group: "Management",
    items: [
      { href: "/admin/users", icon: Users, label: "Users" },
      { href: "/admin/drivers", icon: Car, label: "Drivers" },
      { href: "/admin/pending-drivers", icon: Car, label: "Pending Drivers", badge: "pending" },
      { href: "/admin/rides", icon: MapPin, label: "Rides" },
      { href: "/admin/departments", icon: Building2, label: "Departments" },
    ],
  },
  {
    group: "Finance",
    items: [
      { href: "/admin/payments", icon: CreditCard, label: "Payments" },
      { href: "/admin/promo-codes", icon: Tag, label: "Promo Codes" },
    ],
  },
  {
    group: "Communication",
    items: [
      { href: "/admin/notifications", icon: Bell, label: "Notifications" },
      { href: "/admin/support", icon: MessageSquare, label: "Support Tickets" },
    ],
  },
  {
    group: "Analytics",
    items: [
      { href: "/admin/reports", icon: BarChart3, label: "Reports" },
      { href: "/admin/heatmap", icon: ActivityIcon, label: "Busy Heatmap" },
    ],
  },
  {
    group: "System",
    items: [
      { href: "/admin/settings", icon: Settings, label: "Settings" },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);


  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; path=/; max-age=0";
    router.push("/admin/login");
  };

  if (pathname === "/admin/login") return <>{children}</>;



  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "AD";

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex min-h-screen bg-background">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "hidden lg:flex flex-col fixed top-0 left-0 h-full border-r bg-card transition-all duration-300 z-30",
            collapsed ? "w-16" : "w-64"
          )}
        >
          {/* Logo */}
          <div className={cn("flex items-center h-16 px-4 border-b", collapsed ? "justify-center" : "gap-3")}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              R
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">RideAdmin</p>
                <p className="text-xs text-muted-foreground truncate">Management Panel</p>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
            {navItems.map((group) => (
              <div key={group.group} className="mb-4">
                {!collapsed && (
                  <p className="px-3 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.group}
                  </p>
                )}
                {group.items.map((item) => {
                  const isActive = (item as any).exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  const showBadge = (item as any).badge === "pending" && pendingCount > 0;

                  const linkContent = (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        collapsed && "justify-center px-2"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {showBadge && (
                            <Badge variant="destructive" className="h-5 text-xs px-1.5">
                              {pendingCount}
                            </Badge>
                          )}
                        </>
                      )}
                    </Link>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{item.label}</p>
                          {showBadge && <span className="ml-1 text-destructive">({pendingCount})</span>}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return linkContent;
                })}
              </div>
            ))}
          </nav>

          {/* Quick Action */}
          {!collapsed && (
            <div className="px-3 pb-2">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/admin/rides/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Ride
                </Link>
              </Button>
            </div>
          )}

          <Separator />

          {/* User + Collapse */}
          <div className={cn("p-3 flex items-center gap-2", collapsed && "justify-center")}>
            {!collapsed && (
              <>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{user?.name || "Admin"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </>
            )}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Logout</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCollapsed(!collapsed)}
                  >
                    {collapsed ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{collapsed ? "Expand" : "Collapse"}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </aside>

        {/* Mobile Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 h-14 border-b bg-card flex items-center px-4 gap-3 z-30">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex items-center h-14 px-4 border-b gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                  R
                </div>
                <div>
                  <p className="font-semibold text-sm">RideAdmin</p>
                  <p className="text-xs text-muted-foreground">Management Panel</p>
                </div>
              </div>
              <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
                {navItems.map((group) => (
                  <div key={group.group} className="mb-4">
                    <p className="px-3 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {group.group}
                    </p>
                    {group.items.map((item) => {
                      const isActive = (item as any).exact
                        ? pathname === item.href
                        : pathname.startsWith(item.href);
                      const showBadge = (item as any).badge === "pending" && pendingCount > 0;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1">{item.label}</span>
                          {showBadge && (
                            <Badge variant="destructive" className="h-5 text-xs px-1.5">
                              {pendingCount}
                            </Badge>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>
              <div className="p-3 border-t flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{user?.name || "Admin"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
            R
          </div>
          <span className="font-semibold text-sm">RideAdmin</span>
        </header>

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 transition-all duration-300",
            collapsed ? "lg:ml-16" : "lg:ml-64",
            "mt-14 lg:mt-0"
          )}
        >
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </TooltipProvider>
  );
}
