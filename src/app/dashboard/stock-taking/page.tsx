"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";

interface StockItem {
  id: string;
  quantity: number;
  product: { id: string; name: string; code: string; unit: string };
  outlet: { id: string; name: string };
}

interface Outlet { id: string; name: string }

export default function StockTakingPage() {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [adjustments, setAdjustments] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/outlets").then(r => r.json()).then((data: Outlet[]) => {
      setOutlets(data);
      if (data.length > 0) setSelectedOutlet(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedOutlet) {
      fetch(`/api/inventory?outletId=${selectedOutlet}`).then(r => r.json()).then(setStock);
    }
  }, [selectedOutlet]);

  async function saveAdjustment(item: StockItem) {
    const newQty = adjustments[item.id];
    if (newQty === undefined) return;
    setSaving(item.id);
    await fetch("/api/inventory", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: item.product.id, outletId: item.outlet.id, quantity: parseFloat(newQty) }),
    });
    setSaving(null);
    setAdjustments(a => { const n = { ...a }; delete n[item.id]; return n; });
    fetch(`/api/inventory?outletId=${selectedOutlet}`).then(r => r.json()).then(setStock);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Stock Taking</h1>
        <select
          className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
          value={selectedOutlet}
          onChange={e => setSelectedOutlet(e.target.value)}
        >
          {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Product</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Code</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Unit</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-slate-400">System Qty</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Physical Count</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-slate-400">Variance</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {stock.map(item => {
              const systemQty = Number(item.quantity);
              const physical = adjustments[item.id] !== undefined ? parseFloat(adjustments[item.id] || "0") : systemQty;
              const variance = physical - systemQty;
              return (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-100">{item.product.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">{item.product.code}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{item.product.unit}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-slate-100">{systemQty}</td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="number"
                      step="0.01"
                      className="w-28 text-right border border-gray-300 dark:border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                      value={adjustments[item.id] ?? systemQty}
                      onChange={e => setAdjustments(a => ({ ...a, [item.id]: e.target.value }))}
                    />
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${adjustments[item.id] !== undefined ? (variance > 0 ? "text-green-600" : variance < 0 ? "text-red-600" : "text-gray-500 dark:text-slate-400") : "text-gray-400 dark:text-slate-500"}`}>
                    {adjustments[item.id] !== undefined ? (variance > 0 ? `+${variance.toFixed(2)}` : variance.toFixed(2)) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    {adjustments[item.id] !== undefined && (
                      <button
                        onClick={() => saveAdjustment(item)}
                        disabled={saving === item.id}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs disabled:opacity-50"
                      >
                        <Save className="w-3 h-3" />
                        {saving === item.id ? "..." : "Save"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {stock.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 dark:text-slate-500">No stock records for this outlet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
