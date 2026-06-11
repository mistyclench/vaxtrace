import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { CurrencyProvider } from "@/lib/currency-context";
import { ThemeProvider } from "@/lib/theme-context";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <ThemeProvider>
      <CurrencyProvider>
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-950">
          <Sidebar />
          <main className="flex-1 ml-64 overflow-y-auto">
            <div className="p-6">{children}</div>
          </main>
        </div>
      </CurrencyProvider>
    </ThemeProvider>
  );
}
