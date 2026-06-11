"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import { useCurrency } from "@/lib/currency-context";
import {
  TrendingUp,
  Clock,
  Users,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  totalSales: number;
  pendingInvoices: number;
  totalCustomers: number;
  totalRevenue: number;
  lowStockItems: Array<{
    id: string;
    quantity: number;
    product: { name: string; reorderLevel: number };
    outlet: { name: string };
  }>;
  recentSales: Array<{
    id: string;
    number: string;
    total: number;
    status: string;
    date: string;
    customer: { name: string };
    outlet: { name: string };
  }>;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  DISPATCHED: "bg-purple-100 text-purple-700",
  PARTIALLY_PAID: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function DashboardPage() {
  const { format } = useCurrency();
  const [data, setData] = useState<DashboardData | null>(null);
  const [fefoCount, setFefoCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then(r => r.json()).then(setData);
    fetch("/api/fefo").then(r => r.json()).then((d) => {
      if (Array.isArray(d)) setFefoCount(d.filter((b: { expiryDate: string }) => {
        const exp = new Date(b.expiryDate);
        const now = new Date();
        const diffDays = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 30 && diffDays >= 0;
      }).length);
      else if (typeof d?.count === "number") setFefoCount(d.count);
    }).catch(() => setFefoCount(0));
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Dashboard</h1>

      {/* FEFO Alert Banner */}
      {fefoCount !== null && fefoCount > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-5 py-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {fefoCount} batch{fefoCount !== 1 ? "es" : ""} expiring within 30 days
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Review and prioritise these items for dispatch to avoid wastage.
            </p>
          </div>
          <Link
            href="/dashboard/fefo"
            className="flex-shrink-0 text-xs font-medium px-3 py-1.5 bg-amber-200 dark:bg-amber-700 hover:bg-amber-300 dark:hover:bg-amber-600 text-amber-900 dark:text-amber-100 rounded-lg transition-colors"
          >
            View FEFO Alerts
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Total Revenue"
          value={format(data.totalRevenue)}
          icon={<DollarSign className="w-6 h-6 text-green-600" />}
          bg="bg-green-50 dark:bg-green-900/30"
        />
        <KpiCard
          title="Total Sales"
          value={String(data.totalSales)}
          icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
          bg="bg-blue-50 dark:bg-blue-900/30"
        />
        <KpiCard
          title="Pending Invoices"
          value={String(data.pendingInvoices)}
          icon={<Clock className="w-6 h-6 text-yellow-600" />}
          bg="bg-yellow-50 dark:bg-yellow-900/30"
        />
        <KpiCard
          title="Active Customers"
          value={String(data.totalCustomers)}
          icon={<Users className="w-6 h-6 text-purple-600" />}
          bg="bg-purple-50 dark:bg-purple-900/30"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-slate-100 mb-4">Recent Sales</h2>
          {/* Desktop list / Mobile cards */}
          <div className="hidden sm:block space-y-3">
            {data.recentSales.length === 0 && (
              <p className="text-gray-500 dark:text-slate-400 text-sm">No sales yet</p>
            )}
            {data.recentSales.map(sale => (
              <div key={sale.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-700 last:border-0">
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-slate-100">{sale.number}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{sale.customer.name} — {sale.outlet.name}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{formatDate(sale.date)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm text-gray-900 dark:text-slate-100">{format(sale.total)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[sale.status] ?? "bg-gray-100"}`}>
                    {sale.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {data.recentSales.length === 0 && (
              <p className="text-gray-500 dark:text-slate-400 text-sm">No sales yet</p>
            )}
            {data.recentSales.map(sale => (
              <div key={sale.id} className="rounded-lg border border-gray-100 dark:border-slate-700 p-3 bg-gray-50 dark:bg-slate-700/40">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm text-gray-900 dark:text-slate-100">{sale.number}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[sale.status] ?? "bg-gray-100"}`}>
                    {sale.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400">{sale.customer.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-400 dark:text-slate-500">{formatDate(sale.date)}</p>
                  <p className="font-semibold text-sm text-gray-900 dark:text-slate-100">{format(sale.total)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Low / Out of Stock</h2>
          </div>
          <div className="space-y-3">
            {data.lowStockItems.length === 0 && (
              <p className="text-gray-500 dark:text-slate-400 text-sm">All stock levels are healthy</p>
            )}
            {data.lowStockItems.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-700 last:border-0">
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-slate-100">{item.product.name}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{item.outlet.name}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${Number(item.quantity) <= 0 ? "text-red-600" : "text-amber-600"}`}>
                    {Number(item.quantity)} units
                  </p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">Reorder: {item.product.reorderLevel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon, bg }: {
  title: string; value: string; icon: React.ReactNode; bg: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
