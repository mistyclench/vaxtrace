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

  useEffect(() => {
    fetch("/api/dashboard").then(r => r.json()).then(setData);
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
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Revenue"
          value={format(data.totalRevenue)}
          icon={<DollarSign className="w-6 h-6 text-green-600" />}
          bg="bg-green-50"
        />
        <KpiCard
          title="Total Sales"
          value={String(data.totalSales)}
          icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
          bg="bg-blue-50"
        />
        <KpiCard
          title="Pending Invoices"
          value={String(data.pendingInvoices)}
          icon={<Clock className="w-6 h-6 text-yellow-600" />}
          bg="bg-yellow-50"
        />
        <KpiCard
          title="Active Customers"
          value={String(data.totalCustomers)}
          icon={<Users className="w-6 h-6 text-purple-600" />}
          bg="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Sales</h2>
          <div className="space-y-3">
            {data.recentSales.length === 0 && (
              <p className="text-gray-500 text-sm">No sales yet</p>
            )}
            {data.recentSales.map(sale => (
              <div key={sale.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-sm text-gray-900">{sale.number}</p>
                  <p className="text-xs text-gray-500">{sale.customer.name} — {sale.outlet.name}</p>
                  <p className="text-xs text-gray-400">{formatDate(sale.date)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{format(sale.total)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[sale.status] ?? "bg-gray-100"}`}>
                    {sale.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-gray-900">Low / Out of Stock</h2>
          </div>
          <div className="space-y-3">
            {data.lowStockItems.length === 0 && (
              <p className="text-gray-500 text-sm">All stock levels are healthy</p>
            )}
            {data.lowStockItems.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-sm text-gray-900">{item.product.name}</p>
                  <p className="text-xs text-gray-500">{item.outlet.name}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${Number(item.quantity) <= 0 ? "text-red-600" : "text-amber-600"}`}>
                    {Number(item.quantity)} units
                  </p>
                  <p className="text-xs text-gray-400">Reorder: {item.product.reorderLevel}</p>
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
