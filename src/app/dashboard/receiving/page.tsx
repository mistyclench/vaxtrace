"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import { useCurrency } from "@/lib/currency-context";
import Link from "next/link";
import { Plus } from "lucide-react";

interface GRN {
  id: string; number: string; supplier: string; date: string; lpoRef?: string;
  outlet: { name: string }; user: { name: string };
  lines: Array<{ quantity: number; unitCost: number; product: { name: string } }>;
}

export default function ReceivingPage() {
  const { format } = useCurrency();
  const [grns, setGrns] = useState<GRN[]>([]);

  useEffect(() => {
    fetch("/api/grn").then(r => r.json()).then(setGrns);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Goods Receiving (GRN)</h1>
        <Link href="/dashboard/receiving/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> New GRN
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">GRN #</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Supplier</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">LPO Ref</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Outlet</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Items</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Total Value</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Created By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {grns.map(grn => {
              const totalValue = grn.lines.reduce((sum, l) => sum + Number(l.quantity) * Number(l.unitCost), 0);
              return (
                <tr key={grn.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-medium text-blue-600">{grn.number}</td>
                  <td className="px-4 py-3">{formatDate(grn.date)}</td>
                  <td className="px-4 py-3 font-medium">{grn.supplier}</td>
                  <td className="px-4 py-3 text-gray-500">{grn.lpoRef || "-"}</td>
                  <td className="px-4 py-3 text-gray-500">{grn.outlet.name}</td>
                  <td className="px-4 py-3 text-right">{grn.lines.length}</td>
                  <td className="px-4 py-3 text-right font-medium">{format(totalValue)}</td>
                  <td className="px-4 py-3 text-gray-500">{grn.user.name}</td>
                </tr>
              );
            })}
            {grns.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No GRNs yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
