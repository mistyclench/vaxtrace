"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Product { id: string; code: string; name: string; unit: string }
interface Outlet { id: string; name: string }
interface LineItem { productId: string; quantity: number }

export default function NewDispatchPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [form, setForm] = useState({ fromOutletId: "", toOutletId: "", reason: "" });
  const [lines, setLines] = useState<LineItem[]>([{ productId: "", quantity: 1 }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/products").then(r => r.json()).then(setProducts);
    fetch("/api/outlets").then(r => r.json()).then((data: Outlet[]) => {
      setOutlets(data);
      if (data.length > 0) setForm(f => ({ ...f, fromOutletId: data[0].id }));
    });
  }, []);

  function addLine() { setLines(l => [...l, { productId: "", quantity: 1 }]); }
  function removeLine(i: number) { setLines(l => l.filter((_, idx) => idx !== i)); }
  function updateLine(i: number, field: keyof LineItem, value: string | number) {
    setLines(l => l.map((line, idx) => idx === i ? { ...line, [field]: value } : line));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.fromOutletId) return setError("From outlet is required");
    if (lines.some(l => !l.productId)) return setError("All lines must have a product");
    setSaving(true);
    const payload = { ...form, toOutletId: form.toOutletId || undefined, lines };
    const res = await fetch("/api/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed to save");
      return;
    }
    router.push("/dashboard/dispatch");
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/dispatch" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-bold text-gray-900">New Stock Dispatch</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Dispatch Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Outlet</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.fromOutletId} onChange={e => setForm(f => ({ ...f, fromOutletId: e.target.value }))} required>
                {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Outlet (optional)</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.toOutletId} onChange={e => setForm(f => ({ ...f, toOutletId: e.target.value }))}>
                <option value="">External / Customer Delivery</option>
                {outlets.filter(o => o.id !== form.fromOutletId).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Transfer, sale delivery, etc." />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Items</h2>
            <button type="button" onClick={addLine} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-medium text-gray-600">Product</th>
                <th className="text-right py-2 font-medium text-gray-600 w-32">Quantity</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lines.map((line, i) => (
                <tr key={i}>
                  <td className="py-2 pr-4">
                    <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={line.productId} onChange={e => updateLine(i, "productId", e.target.value)} required>
                      <option value="">Select product</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
                    </select>
                  </td>
                  <td className="py-2 pr-4">
                    <input type="number" step="0.01" min="0.01" className="w-full text-right border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={line.quantity} onChange={e => updateLine(i, "quantity", parseFloat(e.target.value))} required />
                  </td>
                  <td className="py-2">
                    {lines.length > 1 && (
                      <button type="button" onClick={() => removeLine(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/dispatch" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</Link>
          <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? "Saving..." : "Create Dispatch"}
          </button>
        </div>
      </form>
    </div>
  );
}
