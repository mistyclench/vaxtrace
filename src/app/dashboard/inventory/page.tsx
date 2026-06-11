"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";

interface StockItem {
  id: string;
  quantity: number;
  updatedAt: string;
  product: { id: string; name: string; code: string; unit: string; reorderLevel: number; category: { name: string } };
  outlet: { id: string; name: string };
}

interface Outlet { id: string; name: string }

export default function InventoryPage() {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState("");

  useEffect(() => {
    fetch("/api/outlets").then(r => r.json()).then(setOutlets);
  }, []);

  useEffect(() => {
    fetch(`/api/inventory${selectedOutlet ? `?outletId=${selectedOutlet}` : ""}`).then(r => r.json()).then(setStock);
  }, [selectedOutlet]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedOutlet}
          onChange={e => setSelectedOutlet(e.target.value)}
        >
          <option value="">All Outlets</option>
          {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Outlet</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Qty</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Unit</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Reorder</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Updated</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stock.map(item => {
              const qty = Number(item.quantity);
              const reorder = item.product.reorderLevel;
              const status = qty <= 0 ? "OUT" : qty <= reorder ? "LOW" : "OK";
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{item.product.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.product.code}</td>
                  <td className="px-4 py-3 text-gray-500">{item.product.category.name}</td>
                  <td className="px-4 py-3 text-gray-500">{item.outlet.name}</td>
                  <td className={`px-4 py-3 text-right font-bold ${qty <= 0 ? "text-red-600" : qty <= reorder ? "text-amber-600" : "text-green-600"}`}>{qty}</td>
                  <td className="px-4 py-3 text-gray-500">{item.product.unit}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{reorder}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(item.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status === "OUT" ? "bg-red-100 text-red-700" : status === "LOW" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {stock.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No stock records</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
