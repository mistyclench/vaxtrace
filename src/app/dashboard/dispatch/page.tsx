"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Pagination } from "@/components/Pagination";

interface Dispatch {
  id: string; number: string; date: string; reason?: string;
  fromOutlet: { name: string }; toOutletId?: string;
  user: { name: string };
  lines: Array<{ quantity: number; product: { name: string } }>;
}

const PER_PAGE = 15;

export default function DispatchPage() {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/dispatch").then(r => r.json()).then(setDispatches);
  }, []);

  const paged = dispatches.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Stock Dispatch / Transfer</h1>
        <Link href="/dashboard/dispatch/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> New Dispatch
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Dispatch #</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">From</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">To</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Items</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Reason</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {paged.map(d => (
              <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                <td className="px-4 py-3 font-mono font-medium text-blue-600">{d.number}</td>
                <td className="px-4 py-3 text-gray-900 dark:text-slate-100">{formatDate(d.date)}</td>
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-100">{d.fromOutlet.name}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{d.toOutletId ? "Outlet" : "External"}</td>
                <td className="px-4 py-3 text-right text-gray-900 dark:text-slate-100">{d.lines.length}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{d.reason || "-"}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{d.user.name}</td>
              </tr>
            ))}
            {dispatches.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 dark:text-slate-500">No dispatches yet</td></tr>}
          </tbody>
        </table>
        <Pagination total={dispatches.length} page={page} perPage={PER_PAGE} onChange={setPage} />
      </div>
    </div>
  );
}
