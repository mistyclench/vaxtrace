"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import { useCurrency } from "@/lib/currency-context";
import Link from "next/link";
import { Plus, Eye } from "lucide-react";

interface Sale {
  id: string; number: string; date: string; dueDate: string; status: string;
  total: number; amountPaid: number;
  customer: { name: string };
  outlet: { name: string };
  user: { name: string };
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700", CONFIRMED: "bg-blue-100 text-blue-700",
  DISPATCHED: "bg-purple-100 text-purple-700", PARTIALLY_PAID: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700", CANCELLED: "bg-red-100 text-red-700",
};

export default function SalesPage() {
  const { format } = useCurrency();
  const [sales, setSales] = useState<Sale[]>([]);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetch(`/api/sales${statusFilter ? `?status=${statusFilter}` : ""}`).then(r => r.json()).then(setSales);
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
        <div className="flex items-center gap-3">
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {["DRAFT","CONFIRMED","DISPATCHED","PARTIALLY_PAID","PAID","CANCELLED"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <Link href="/dashboard/sales/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" /> New Sale
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Invoice #</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Due</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Outlet</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Paid</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Balance</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sales.map(sale => (
              <tr key={sale.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-medium text-blue-600">{sale.number}</td>
                <td className="px-4 py-3">{formatDate(sale.date)}</td>
                <td className="px-4 py-3">{formatDate(sale.dueDate)}</td>
                <td className="px-4 py-3 font-medium">{sale.customer.name}</td>
                <td className="px-4 py-3 text-gray-500">{sale.outlet.name}</td>
                <td className="px-4 py-3 text-right">{format(sale.total)}</td>
                <td className="px-4 py-3 text-right text-green-600">{format(sale.amountPaid)}</td>
                <td className="px-4 py-3 text-right font-medium text-red-600">{format(Number(sale.total) - Number(sale.amountPaid))}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[sale.status] ?? ""}`}>{sale.status}</span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/sales/${sale.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 inline-block"><Eye className="w-4 h-4" /></Link>
                </td>
              </tr>
            ))}
            {sales.length === 0 && <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">No sales yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
