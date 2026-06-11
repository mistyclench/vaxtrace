"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Pagination } from "@/components/Pagination";

interface StockItem {
  id: string;
  quantity: number;
  updatedAt: string;
  product: { id: string; name: string; code: string; unit: string; reorderLevel: number; category: { name: string } };
  outlet: { id: string; name: string };
}

interface Outlet { id: string; name: string }

const PER_PAGE = 15;

export default function InventoryPage() {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/outlets").then(r => r.json()).then(setOutlets);
  }, []);

  useEffect(() => {
    setPage(1);
    fetch(`/api/inventory${selectedOutlet ? `?outletId=${selectedOutlet}` : ""}`).then(r => r.json()).then(setStock);
  }, [selectedOutlet]);

  const paged = stock.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Inventory</h1>
        <select
          className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
          value={selectedOutlet}
          onChange={e => setSelectedOutlet(e.target.value)}
        >
          <option value="">All Outlets</option>
          {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>

      {/* FEFO Alert Banner */}
      <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-5 py-4">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">FEFO Reminder</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
            Check FEFO Alerts for batches nearing expiry. First-Expired, First-Out batches should be dispatched before newer stock.
          </p>
        </div>
        <Link
          href="/dashboard/fefo"
          className="flex-shrink-0 text-xs font-medium px-3 py-1.5 bg-amber-200 dark:bg-amber-700 hover:bg-amber-300 dark:hover:bg-amber-600 text-amber-900 dark:text-amber-100 rounded-lg transition-colors"
        >
          View FEFO Alerts
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Product</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Code</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Category</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Outlet</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Qty</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Unit</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Reorder</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Updated</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {paged.map(item => {
              const qty = Number(item.quantity);
              const reorder = item.product.reorderLevel;
              const status = qty <= 0 ? "OUT" : qty <= reorder ? "LOW" : "OK";
              return (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-100">{item.product.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">{item.product.code}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{item.product.category.name}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{item.outlet.name}</td>
                  <td className={`px-4 py-3 text-right font-bold ${qty <= 0 ? "text-red-600" : qty <= reorder ? "text-amber-600" : "text-green-600"}`}>{qty}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{item.product.unit}</td>
                  <td className="px-4 py-3 text-right text-gray-500 dark:text-slate-400">{reorder}</td>
                  <td className="px-4 py-3 text-gray-400 dark:text-slate-500 text-xs">{formatDate(item.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status === "OUT" ? "bg-red-100 text-red-700" : status === "LOW" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {stock.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400 dark:text-slate-500">No stock records</td></tr>}
          </tbody>
        </table>
        <Pagination total={stock.length} page={page} perPage={PER_PAGE} onChange={setPage} />
      </div>
    </div>
  );
}
