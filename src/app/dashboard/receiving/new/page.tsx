"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Product { id: string; code: string; name: string; unit: string; costPrice: number }
interface Outlet { id: string; name: string }
interface LineItem { productId: string; quantity: number; unitCost: number }

export default function NewGRNPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [form, setForm] = useState({ outletId: "", supplier: "", lpoRef: "", notes: "" });
  const [lines, setLines] = useState<LineItem[]>([{ productId: "", quantity: 1, unitCost: 0 }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/products").then(r => r.json()).then(setProducts);
    fetch("/api/outlets").then(r => r.json()).then((data: Outlet[]) => {
      setOutlets(data);
      if (data.length > 0) setForm(f => ({ ...f, outletId: data[0].id }));
    });
  }, []);

  function addLine() { setLines(l => [...l, { productId: "", quantity: 1, unitCost: 0 }]); }
  function removeLine(i: number) { setLines(l => l.filter((_, idx) => idx !== i)); }
  function updateLine(i: number, field: keyof LineItem, value: string | number) {
    setLines(l => l.map((line, idx) => {
      if (idx !== i) return line;
      const updated = { ...line, [field]: value };
      if (field === "productId") {
        const p = products.find(p => p.id === value);
        if (p) updated.unitCost = Number(p.costPrice);
      }
      return updated;
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.outletId || !form.supplier) return setError("Outlet and supplier are required");
    if (lines.some(l => !l.productId)) return setError("All lines must have a product");
    setSaving(true);
    const res = await fetch("/api/grn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, lines }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed to save");
      return;
    }
    router.push("/dashboard/receiving");
  }

  const total = lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/receiving" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-bold text-gray-900">New Goods Received Note</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">GRN Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Receiving Outlet</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.outletId} onChange={e => setForm(f => ({ ...f, outletId: e.target.value }))} required>
                {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LPO Reference</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.lpoRef} onChange={e => setForm(f => ({ ...f, lpoRef: e.target.value }))} placeholder="Optional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Items Received</h2>
            <button type="button" onClick={addLine} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-medium text-gray-600">Product</th>
                <th className="text-right py-2 font-medium text-gray-600 w-28">Qty</th>
                <th className="text-right py-2 font-medium text-gray-600 w-32">Unit Cost</th>
                <th className="text-right py-2 font-medium text-gray-600 w-32">Total</th>
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
                  <td className="py-2 pr-4">
                    <input type="number" step="0.01" min="0" className="w-full text-right border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={line.unitCost} onChange={e => updateLine(i, "unitCost", parseFloat(e.target.value))} required />
                  </td>
                  <td className="py-2 pr-4 text-right font-medium">${(line.quantity * line.unitCost).toFixed(2)}</td>
                  <td className="py-2">
                    {lines.length > 1 && (
                      <button type="button" onClick={() => removeLine(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200">
                <td colSpan={3} className="py-3 font-semibold text-right">Total:</td>
                <td className="py-3 text-right font-bold text-lg">${total.toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/receiving" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</Link>
          <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? "Saving..." : "Create GRN"}
          </button>
        </div>
      </form>
    </div>
  );
}
