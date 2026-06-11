"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import { useCurrency } from "@/lib/currency-context";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Pagination } from "@/components/Pagination";

interface GRN {
  id: string; number: string; supplier: string; date: string; lpoRef?: string;
  outlet: { name: string }; user: { name: string };
  lines: Array<{ quantity: number; unitCost: number; product: { name: string } }>;
}

const PER_PAGE = 15;

export default function ReceivingPage() {
  const { format } = useCurrency();
  const [grns, setGrns] = useState<GRN[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/grn").then(r => r.json()).then(setGrns);
  }, []);

  const paged = grns.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Goods Receiving (GRN)</h1>
        <Link href="/dashboard/receiving/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> New GRN
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">GRN #</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Supplier</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">LPO Ref</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Outlet</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Items</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Total Value</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Created By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {paged.map(grn => {
              const totalValue = grn.lines.reduce((sum, l) => sum + Number(l.quantity) * Number(l.unitCost), 0);
              return (
                <tr key={grn.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3 font-mono font-medium text-blue-600">{grn.number}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-slate-100">{formatDate(grn.date)}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-100">{grn.supplier}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{grn.lpoRef || "-"}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{grn.outlet.name}</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-slate-100">{grn.lines.length}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-slate-100">{format(totalValue)}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{grn.user.name}</td>
                </tr>
              );
            })}
            {grns.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 dark:text-slate-500">No GRNs yet</td></tr>}
          </tbody>
        </table>
        <Pagination total={grns.length} page={page} perPage={PER_PAGE} onChange={setPage} />
      </div>
    </div>
  );
}
