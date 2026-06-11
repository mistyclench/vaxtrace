"use client";

import { useEffect, useState } from "react";
import { Save, Plus, Trash2 } from "lucide-react";

const CURRENCIES = [
  { code: "GHS", name: "Ghana Cedi",           symbol: "GH₵" },
  { code: "USD", name: "US Dollar",             symbol: "$"   },
  { code: "EUR", name: "Euro",                  symbol: "€"   },
  { code: "GBP", name: "British Pound",         symbol: "£"   },
  { code: "NGN", name: "Nigerian Naira",        symbol: "₦"   },
  { code: "KES", name: "Kenyan Shilling",       symbol: "KSh" },
  { code: "ZAR", name: "South African Rand",    symbol: "R"   },
  { code: "XOF", name: "West African CFA Franc",symbol: "CFA" },
  { code: "UGX", name: "Ugandan Shilling",      symbol: "USh" },
  { code: "TZS", name: "Tanzanian Shilling",    symbol: "TSh" },
];

interface Outlet { id: string; name: string; address?: string; phone?: string; active: boolean }

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string,string>>({});
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newOutlet, setNewOutlet] = useState({ name: "", address: "", phone: "" });
  const [addingOutlet, setAddingOutlet] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(setSettings);
    fetch("/api/outlets").then(r => r.json()).then(setOutlets);
  }, []);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function addOutlet(e: React.FormEvent) {
    e.preventDefault();
    setAddingOutlet(true);
    await fetch("/api/outlets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newOutlet),
    });
    setAddingOutlet(false);
    setNewOutlet({ name: "", address: "", phone: "" });
    fetch("/api/outlets").then(r => r.json()).then(setOutlets);
  }

  const set = (key: string, value: string) => setSettings(s => ({ ...s, [key]: value }));

  return (
    <div className="space-y-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Company Settings */}
      <form onSubmit={saveSettings} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Company Information</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: "company_name", label: "Company Name" },
            { key: "company_phone", label: "Phone Number" },
            { key: "company_email", label: "Email" },
            { key: "company_address", label: "Address" },
            { key: "company_tin", label: "TIN / Tax ID" },
            { key: "company_website", label: "Website" },
          ].map(field => (
            <div key={field.key} className={field.key === "company_address" ? "col-span-2" : ""}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={settings[field.key] ?? ""}
                onChange={e => set(field.key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <h2 className="font-semibold text-gray-800 pt-4">Currency</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency Code <span className="text-gray-400 font-normal">(ISO 4217)</span></label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={settings.currency_code ?? "GHS"}
              onChange={e => {
                const selected = CURRENCIES.find(c => c.code === e.target.value);
                set("currency_code", e.target.value);
                if (selected) set("currency_symbol", selected.symbol);
              }}
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency Symbol</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={settings.currency_symbol ?? "GH₵"}
              onChange={e => set("currency_symbol", e.target.value)}
              placeholder="e.g. GH₵"
            />
            <p className="text-xs text-gray-400 mt-1">Auto-filled when you pick a currency above. Edit to customise the display symbol.</p>
          </div>
        </div>

        <h2 className="font-semibold text-gray-800 pt-4">Tax & Defaults</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Tax Rate (%)</label>
            <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={settings.default_tax_rate ?? "0"} onChange={e => set("default_tax_rate", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Credit Days</label>
            <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={settings.default_credit_days ?? "30"} onChange={e => set("default_credit_days", e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
          </button>
        </div>
      </form>

      {/* Outlets */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Outlets / Warehouses</h2>
        <div className="space-y-2">
          {outlets.map(outlet => (
            <div key={outlet.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">{outlet.name}</p>
                {outlet.address && <p className="text-xs text-gray-500">{outlet.address}</p>}
                {outlet.phone && <p className="text-xs text-gray-500">{outlet.phone}</p>}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${outlet.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {outlet.active ? "Active" : "Inactive"}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={addOutlet} className="grid grid-cols-3 gap-3 pt-2">
          <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Outlet name" value={newOutlet.name} onChange={e => setNewOutlet(n => ({ ...n, name: e.target.value }))} required />
          <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Address (optional)" value={newOutlet.address} onChange={e => setNewOutlet(n => ({ ...n, address: e.target.value }))} />
          <div className="flex gap-2">
            <input className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Phone (optional)" value={newOutlet.phone} onChange={e => setNewOutlet(n => ({ ...n, phone: e.target.value }))} />
            <button type="submit" disabled={addingOutlet} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
