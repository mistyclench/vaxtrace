"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Plus } from "lucide-react";

interface Dispatch {
  id: string; number: string; date: string; reason?: string;
  fromOutlet: { name: string }; toOutletId?: string;
  user: { name: string };
  lines: Array<{ quantity: number; product: { name: string } }>;
}

export default function DispatchPage() {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);

  useEffect(() => {
    fetch("/api/dispatch").then(r => r.json()).then(setDispatches);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Stock Dispatch / Transfer</h1>
        <Link href="/dashboard/dispatch/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> New Dispatch
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Dispatch #</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">From</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">To</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Items</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Reason</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dispatches.map(d => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-medium text-blue-600">{d.number}</td>
                <td className="px-4 py-3">{formatDate(d.date)}</td>
                <td className="px-4 py-3 font-medium">{d.fromOutlet.name}</td>
                <td className="px-4 py-3 text-gray-500">{d.toOutletId ? "Outlet" : "External"}</td>
                <td className="px-4 py-3 text-right">{d.lines.length}</td>
                <td className="px-4 py-3 text-gray-500">{d.reason || "-"}</td>
                <td className="px-4 py-3 text-gray-500">{d.user.name}</td>
              </tr>
            ))}
            {dispatches.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No dispatches yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
