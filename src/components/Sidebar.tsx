"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/lib/theme-context";
import {
  LayoutDashboard, Package, Tag, Users, BarChart3,
  ClipboardList, Truck, ShoppingCart, Settings, LogOut,
  Warehouse, Thermometer, AlertTriangle, Sun, Moon,
} from "lucide-react";

const allNavItems = [
  { href: "/dashboard",              label: "Dashboard",      icon: LayoutDashboard, roles: ["ADMIN","MANAGER","SALES","WAREHOUSE","ACCOUNTANT"] },
  { href: "/dashboard/sales",        label: "Sales / POS",    icon: ShoppingCart,    roles: ["ADMIN","MANAGER","SALES","ACCOUNTANT"] },
  { href: "/dashboard/customers",    label: "Customers",      icon: Users,           roles: ["ADMIN","MANAGER","SALES","ACCOUNTANT"] },
  { href: "/dashboard/inventory",    label: "Inventory",      icon: BarChart3,       roles: ["ADMIN","MANAGER","WAREHOUSE"] },
  { href: "/dashboard/stock-taking", label: "Stock Taking",   icon: ClipboardList,   roles: ["ADMIN","MANAGER","WAREHOUSE"] },
  { href: "/dashboard/receiving",    label: "Goods Receiving",icon: Package,         roles: ["ADMIN","MANAGER","WAREHOUSE"] },
  { href: "/dashboard/dispatch",     label: "Stock Dispatch", icon: Truck,           roles: ["ADMIN","MANAGER","WAREHOUSE"] },
  { href: "/dashboard/fefo",         label: "FEFO Alerts",    icon: AlertTriangle,   roles: ["ADMIN","MANAGER","WAREHOUSE"] },
  { href: "/dashboard/temperature",  label: "Temperature",    icon: Thermometer,     roles: ["ADMIN","MANAGER","WAREHOUSE"] },
  { href: "/dashboard/products",     label: "Products",       icon: Package,         roles: ["ADMIN","MANAGER"] },
  { href: "/dashboard/categories",   label: "Categories",     icon: Tag,             roles: ["ADMIN","MANAGER"] },
  { href: "/dashboard/users",        label: "Users",          icon: Users,           roles: ["ADMIN"] },
  { href: "/dashboard/settings",     label: "Settings",       icon: Settings,        roles: ["ADMIN"] },
];

export function Sidebar() {
  const pathname  = usePathname();
  const { data: session } = useSession();
  const { theme, toggle } = useTheme();
  const role = (session?.user as any)?.role ?? "";

  const navItems = allNavItems.filter(item => item.roles.includes(role));

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Warehouse className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">VaxTrace</h1>
            <p className="text-xs text-gray-400 mt-0.5">Wholesale Mgmt</p>
          </div>
        </div>
      </div>

      {/* Nav — scrollable, scrollbar hidden */}
      <nav className="flex-1 py-3 overflow-y-auto scrollbar-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
          const isFEFO = item.href === "/dashboard/fefo";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : isFEFO
                    ? "text-amber-400 hover:bg-amber-900/30 hover:text-amber-300"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <item.icon className={`w-4 h-4 shrink-0 ${isFEFO && !isActive ? "fefo-pulse" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: user info + theme toggle + sign out */}
      <div className="p-4 border-t border-gray-700 shrink-0 space-y-3">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark"
            ? <><Sun className="w-4 h-4" /> Light Mode</>
            : <><Moon className="w-4 h-4" /> Dark Mode</>
          }
        </button>

        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
            {session?.user?.name?.[0] ?? "U"}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-medium truncate">{session?.user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{role}</p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm w-full px-1"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
