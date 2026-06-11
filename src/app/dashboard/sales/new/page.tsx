"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useCurrency } from "@/lib/currency-context";

interface Product { id: string; code: string; name: string; unit: string; sellPrice: number }
interface Outlet { id: string; name: string }
interface Customer { id: string; code: string; name: string; creditLimit: number; balance: number; creditDays: number }
interface LineItem { productId: string; quantity: number; unitPrice: number }

export default function NewSalePage() {
  const { format } = useCurrency();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState({ outletId: "", customerId: "", taxRate: 0, notes: "", lpoNumber: "" });
  const [lines, setLines] = useState<LineItem[]>([{ productId: "", quantity: 1, unitPrice: 0 }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/products").then(r => r.json()).then(setProducts);
    fetch("/api/outlets").then(r => r.json()).then((data: Outlet[]) => {
      setOutlets(data);
      if (data.length > 0) setForm(f => ({ ...f, outletId: data[0].id }));
    });
    fetch("/api/customers").then(r => r.json()).then(setCustomers);
  }, []);

  function handleCustomerChange(id: string) {
    setForm(f => ({ ...f, customerId: id }));
    const c = customers.find(c => c.id === id) ?? null;
    setSelectedCustomer(c);
  }

  function addLine() { setLines(l => [...l, { productId: "", quantity: 1, unitPrice: 0 }]); }
  function removeLine(i: number) { setLines(l => l.filter((_, idx) => idx !== i)); }
  function updateLine(i: number, field: keyof LineItem, value: string | number) {
    setLines(l => l.map((line, idx) => {
      if (idx !== i) return line;
      const updated = { ...line, [field]: value };
      if (field === "productId") {
        const p = products.find(p => p.id === value);
        if (p) updated.unitPrice = Number(p.sellPrice);
      }
      return updated;
    }));
  }

  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const taxAmount = (subtotal * form.taxRate) / 100;
  const total = subtotal + taxAmount;
  const availableCredit = selectedCustomer ? Number(selectedCustomer.creditLimit) - Number(selectedCustomer.balance) : 0;
  const creditOk = !selectedCustomer || total <= availableCredit;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.outletId || !form.customerId) return setError("Outlet and customer are required");
    if (lines.some(l => !l.productId)) return setError("All lines must have a product");
    if (!creditOk) return setError("Total exceeds available credit limit");
    setSaving(true);
    const res = await fetch("/api/sales", {
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
    const sale = await res.json();
    router.push(`/dashboard/sales/${sale.id}`);
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/sales" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-bold text-gray-900">New Sale</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Sale Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outlet</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.outletId} onChange={e => setForm(f => ({ ...f, outletId: e.target.value }))} required>
                {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.customerId} onChange={e => handleCustomerChange(e.target.value)} required>
                <option value="">Select customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
              </select>
            </div>
          </div>

          {selectedCustomer && (
            <div className={`grid grid-cols-3 gap-4 p-4 rounded-lg ${creditOk ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
              <div>
                <p className="text-xs text-gray-500">Credit Limit</p>
                <p className="font-bold">{format(selectedCustomer.creditLimit)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Outstanding Balance</p>
                <p className="font-bold text-red-600">{format(selectedCustomer.balance)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Available Credit</p>
                <p className={`font-bold ${availableCredit < 0 ? "text-red-600" : "text-green-600"}`}>{format(availableCredit)}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LPO Number</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.lpoNumber} onChange={e => setForm(f => ({ ...f, lpoNumber: e.target.value }))} placeholder="Customer PO reference" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
              <input type="number" step="0.01" min="0" max="100" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: parseFloat(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Line Items</h2>
            <button type="button" onClick={addLine} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-medium text-gray-600">Product</th>
                <th className="text-right py-2 font-medium text-gray-600 w-28">Qty</th>
                <th className="text-right py-2 font-medium text-gray-600 w-32">Unit Price</th>
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
                    <input type="number" step="0.01" min="0" className="w-full text-right border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={line.unitPrice} onChange={e => updateLine(i, "unitPrice", parseFloat(e.target.value))} required />
                  </td>
                  <td className="py-2 pr-4 text-right font-medium">{format(line.quantity * line.unitPrice)}</td>
                  <td className="py-2">
                    {lines.length > 1 && <button type="button" onClick={() => removeLine(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-gray-200">
              <tr>
                <td colSpan={3} className="py-2 text-right text-gray-500">Subtotal:</td>
                <td className="py-2 text-right font-medium">{format(subtotal)}</td>
                <td></td>
              </tr>
              {form.taxRate > 0 && (
                <tr>
                  <td colSpan={3} className="py-1 text-right text-gray-500">Tax ({form.taxRate}%):</td>
                  <td className="py-1 text-right font-medium">{format(taxAmount)}</td>
                  <td></td>
                </tr>
              )}
              <tr>
                <td colSpan={3} className="py-2 text-right font-semibold text-lg">Total:</td>
                <td className="py-2 text-right font-bold text-xl text-blue-700">{format(total)}</td>
                <td></td>
              </tr>
              {selectedCustomer && !creditOk && (
                <tr>
                  <td colSpan={5} className="py-2">
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded px-3 py-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>Total exceeds available credit ({format(availableCredit)})</span>
                    </div>
                  </td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/sales" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</Link>
          <button type="submit" disabled={saving || !creditOk} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? "Saving..." : "Create Sale"}
          </button>
        </div>
      </form>
    </div>
  );
}
