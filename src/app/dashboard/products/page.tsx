"use client";

import { useEffect, useState } from "react";
import { useCurrency } from "@/lib/currency-context";
import { Pagination } from "@/components/Pagination";
import { Plus, Search, Edit, X } from "lucide-react";

interface Product {
  id: string; code: string; name: string; unit: string;
  costPrice: number; sellPrice: number; reorderLevel: number; active: boolean;
  category: { id: string; name: string };
}
interface Category { id: string; name: string }

const emptyForm = { code: "", name: "", categoryId: "", unit: "", costPrice: 0, sellPrice: 0, reorderLevel: 0 };
const PER_PAGE = 15;

export default function ProductsPage() {
  const { format } = useCurrency();
  const [products, setProducts]     = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState<Product | null>(null);
  const [form, setForm]             = useState(emptyForm);
  const [saving, setSaving]         = useState(false);

  useEffect(() => { fetch("/api/categories").then(r => r.json()).then(setCategories); }, []);
  useEffect(() => { setPage(1); load(); }, [search]);

  function load() {
    fetch(`/api/products?search=${encodeURIComponent(search)}`).then(r => r.json()).then(setProducts);
  }
  function openCreate() { setEditing(null); setForm(emptyForm); setShowModal(true); }
  function openEdit(p: Product) {
    setEditing(p);
    setForm({ code: p.code, name: p.name, categoryId: p.category.id, unit: p.unit,
      costPrice: Number(p.costPrice), sellPrice: Number(p.sellPrice), reorderLevel: p.reorderLevel });
    setShowModal(true);
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    await fetch(editing ? `/api/products/${editing.id}` : "/api/products", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    setSaving(false); setShowModal(false); load();
  }
  async function handleDelete(id: string) {
    if (!confirm("Deactivate this product?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" }); load();
  }

  const paged = products.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const inp = "w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Products</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 dark:text-slate-500" />
        <input className={`${inp} pl-9`} placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
            <tr>
              {[["Code",""],["Name",""],["Category",""],["Unit",""],["Cost","text-right"],["Sell","text-right"],["Reorder","text-right"],["",""]].map(([h,cls]) => (
                <th key={h} className={`px-4 py-3 font-medium text-gray-600 dark:text-slate-400 text-left ${cls}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {paged.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">{p.code}</td>
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-100">{p.name}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{p.category.name}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{p.unit}</td>
                <td className="px-4 py-3 text-right text-gray-700 dark:text-slate-300">{format(p.costPrice)}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-slate-100">{format(p.sellPrice)}</td>
                <td className="px-4 py-3 text-right text-gray-500 dark:text-slate-400">{p.reorderLevel}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 rounded"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 rounded"><X className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 dark:text-slate-500">No products found</td></tr>}
          </tbody>
        </table>
        <Pagination total={products.length} page={page} perPage={PER_PAGE} onChange={setPage} />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-slate-100">{editing ? "Edit Product" : "New Product"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Code</label><input className={inp} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} required /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Unit</label><input className={inp} value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="vials" required /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Name</label><input className={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Category</label>
                <select className={inp} value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} required>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {(["costPrice","sellPrice","reorderLevel"] as const).map(key => (
                  <div key={key}><label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{key === "costPrice" ? "Cost Price" : key === "sellPrice" ? "Sell Price" : "Reorder"}</label>
                    <input type="number" step={key === "reorderLevel" ? "1" : "0.01"} className={inp} value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: key === "reorderLevel" ? parseInt(e.target.value)||0 : parseFloat(e.target.value)||0 }))} />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
