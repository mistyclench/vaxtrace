"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { CurrencyProvider } from "@/lib/currency-context";
import { ThemeProvider } from "@/lib/theme-context";
import { PermissionsProvider } from "@/lib/permissions-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "loading" || !session) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-slate-950">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <CurrencyProvider>
        <PermissionsProvider>
          <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-950">
            <MobileHeader onMenuOpen={() => setMobileOpen(true)} />
            <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
            <main className="flex-1 ml-0 md:ml-64 overflow-y-auto mt-14 md:mt-0">
              <div className="p-4 md:p-6">{children}</div>
            </main>
          </div>
        </PermissionsProvider>
      </CurrencyProvider>
    </ThemeProvider>
  );
}
