"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import { useCurrency } from "@/lib/currency-context";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Sale {
  id: string; number: string; date: string; dueDate: string;
  total: number; amountPaid: number; status: string; outlet: { name: string };
}
interface Customer {
  id: string; code: string; name: string; contact?: string; address?: string;
  email?: string; creditLimit: number; balance: number; creditDays: number;
  sales: Sale[];
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700", CONFIRMED: "bg-blue-100 text-blue-700",
  DISPATCHED: "bg-purple-100 text-purple-700", PARTIALLY_PAID: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700", CANCELLED: "bg-red-100 text-red-700",
};

export default function CustomerDetailPage() {
  const { format } = useCurrency();
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetch(`/api/customers/${id}`).then(r => r.json()).then(setCustomer);
  }, [id]);

  if (!customer) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  const outstanding = customer.sales
    .filter(s => !["PAID","CANCELLED"].includes(s.status))
    .reduce((sum, s) => sum + (Number(s.total) - Number(s.amountPaid)), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/customers" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{customer.code}</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Credit Limit", value: format(customer.creditLimit), color: "text-blue-600" },
          { label: "Outstanding Balance", value: format(customer.balance), color: "text-red-600" },
          { label: "Available Credit", value: format(Number(customer.creditLimit) - Number(customer.balance)), color: Number(customer.creditLimit) - Number(customer.balance) < 0 ? "text-red-600" : "text-green-600" },
          { label: "Credit Days", value: `${customer.creditDays} days`, color: "text-gray-700" },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{item.label}</p>
            <p className={`text-xl font-bold mt-1 ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Contact Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-semibold mb-3">Contact Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Phone:</span> <span className="ml-2">{customer.contact || "-"}</span></div>
          <div><span className="text-gray-500">Email:</span> <span className="ml-2">{customer.email || "-"}</span></div>
          <div className="col-span-2"><span className="text-gray-500">Address:</span> <span className="ml-2">{customer.address || "-"}</span></div>
        </div>
      </div>

      {/* Statement */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold">Account Statement</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Invoice #</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Due Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Outlet</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Paid</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Balance</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customer.sales.map(sale => (
              <tr key={sale.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-medium text-blue-600">{sale.number}</td>
                <td className="px-4 py-3">{formatDate(sale.date)}</td>
                <td className="px-4 py-3">{formatDate(sale.dueDate)}</td>
                <td className="px-4 py-3 text-gray-500">{sale.outlet.name}</td>
                <td className="px-4 py-3 text-right">{format(sale.total)}</td>
                <td className="px-4 py-3 text-right text-green-600">{format(sale.amountPaid)}</td>
                <td className="px-4 py-3 text-right font-medium text-red-600">{format(Number(sale.total) - Number(sale.amountPaid))}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[sale.status] ?? ""}`}>{sale.status}</span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/sales/${sale.id}`} className="text-xs text-blue-600 hover:underline">View</Link>
                </td>
              </tr>
            ))}
            {customer.sales.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No sales</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
