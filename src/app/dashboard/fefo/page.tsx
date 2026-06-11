"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import { AlertTriangle, Clock, CheckCircle, XCircle } from "lucide-react";

interface FEFOItem {
  id: string;
  batchNumber: string;
  expiryDate: string;
  daysLeft: number;
  status: "EXPIRED" | "CRITICAL" | "WARNING" | "WATCH";
  quantity: number;
  unit: string;
  productName: string;
  productCode: string;
  grnNumber: string;
  supplier: string;
  outlet: string;
}

const STATUS_META = {
  EXPIRED:  { label: "Expired",   bg: "bg-red-100 dark:bg-red-900/30",    text: "text-red-700 dark:text-red-400",    border: "border-red-300 dark:border-red-800",    icon: XCircle },
  CRITICAL: { label: "Critical",  bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", border: "border-orange-300 dark:border-orange-800", icon: AlertTriangle },
  WARNING:  { label: "Warning",   bg: "bg-amber-100 dark:bg-amber-900/30",  text: "text-amber-700 dark:text-amber-400",  border: "border-amber-300 dark:border-amber-800",  icon: Clock },
  WATCH:    { label: "Watch",     bg: "bg-blue-100 dark:bg-blue-900/30",   text: "text-blue-700 dark:text-blue-400",   border: "border-blue-300 dark:border-blue-800",   icon: CheckCircle },
};

export default function FEFOPage() {
  const [items, setItems]   = useState<FEFOItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    fetch("/api/fefo")
      .then(r => r.json())
      .then(data => { setItems(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const counts = {
    EXPIRED:  items.filter(i => i.status === "EXPIRED").length,
    CRITICAL: items.filter(i => i.status === "CRITICAL").length,
    WARNING:  items.filter(i => i.status === "WARNING").length,
    WATCH:    items.filter(i => i.status === "WATCH").length,
  };

  const filtered = filter === "ALL" ? items : items.filter(i => i.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">FEFO Alerts</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          First-Expiry-First-Out — batches needing immediate attention sorted by soonest expiry date.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {(["EXPIRED","CRITICAL","WARNING","WATCH"] as const).map(s => {
          const m = STATUS_META[s];
          const Icon = m.icon;
          return (
            <button
              key={s}
              onClick={() => setFilter(filter === s ? "ALL" : s)}
              className={`rounded-xl border p-4 text-left transition-all ${m.bg} ${m.border} ${filter === s ? "ring-2 ring-offset-1 ring-blue-500" : "hover:opacity-90"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${m.text}`} />
                <span className={`text-2xl font-bold ${m.text}`}>{counts[s]}</span>
              </div>
              <p className={`text-sm font-medium ${m.text}`}>{m.label}</p>
              <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">
                {s === "EXPIRED" ? "Past expiry — discard" :
                 s === "CRITICAL" ? "≤ 30 days — use now" :
                 s === "WARNING"  ? "31–60 days — prioritise" :
                 "61–90 days — monitor"}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2">
        {["ALL","EXPIRED","CRITICAL","WARNING","WATCH"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filter === f
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-300 dark:border-slate-600 hover:border-blue-400"
            }`}>
            {f === "ALL" ? `All (${items.length})` : `${f} (${counts[f as keyof typeof counts]})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 dark:text-slate-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-slate-400 font-medium">No batches in this category</p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
              {items.length === 0
                ? "No GRN lines with expiry dates found. Add expiry dates when receiving goods."
                : "All batches are within acceptable expiry range for this filter."}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
              <tr>
                {["Status","Product","Batch #","Expiry Date","Days Left","Qty","GRN #","Supplier","Outlet"].map(h => (
                  <th key={h} className={`px-4 py-3 font-medium text-gray-600 dark:text-slate-400 text-left ${h==="Days Left"||h==="Qty"?"text-right":""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {filtered.map(item => {
                const m = STATUS_META[item.status];
                const Icon = m.icon;
                return (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${m.bg} ${m.text}`}>
                        <Icon className="w-3 h-3" />
                        {m.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-slate-100">{item.productName}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">{item.productCode}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-slate-400">{item.batchNumber}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-slate-300">{formatDate(item.expiryDate)}</td>
                    <td className={`px-4 py-3 text-right font-bold ${
                      item.daysLeft < 0 ? "text-red-600 dark:text-red-400" :
                      item.daysLeft <= 30 ? "text-orange-600 dark:text-orange-400" :
                      item.daysLeft <= 60 ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
                    }`}>
                      {item.daysLeft < 0 ? `${Math.abs(item.daysLeft)}d overdue` : `${item.daysLeft}d`}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-slate-300">{item.quantity} <span className="text-gray-400 dark:text-slate-500">{item.unit}</span></td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">{item.grnNumber}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{item.supplier}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{item.outlet}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400 dark:text-slate-500">
        Showing batches with expiry dates within 90 days from today, sourced from Goods Receiving Notes.
        Batches without expiry dates are not shown — enter expiry dates when creating GRNs.
      </p>
    </div>
  );
}
