"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDate } from "@/lib/utils";
import { Thermometer, AlertTriangle, Plus, RefreshCw } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

interface TempLog {
  id: string;
  minTemp: number;
  maxTemp: number;
  currentTemp: number;
  recordedAt: string;
  product: { id: string; name: string; code: string };
  outlet: { id: string; name: string };
}

interface Product { id: string; name: string; code: string }
interface Outlet  { id: string; name: string }

const SAFE_MIN = 2;   // °C — standard cold-chain minimum
const SAFE_MAX = 8;   // °C — standard cold-chain maximum

function excursionClass(temp: number) {
  if (temp < SAFE_MIN) return "text-blue-600 dark:text-blue-400";
  if (temp > SAFE_MAX) return "text-red-600 dark:text-red-400";
  return "text-green-600 dark:text-green-400";
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

export default function TemperaturePage() {
  const [logs, setLogs]         = useState<TempLog[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [outlets, setOutlets]   = useState<Outlet[]>([]);
  const [productId, setProductId] = useState("");
  const [outletId, setOutletId]   = useState("");
  const [days, setDays]           = useState("14");
  const [loading, setLoading]     = useState(false);
  const [showLog, setShowLog]     = useState(false);
  const [newLog, setNewLog]       = useState({ productId: "", outletId: "", currentTemp: "", minTemp: "", maxTemp: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/products?search=").then(r => r.json()).then(setProducts).catch(() => {});
    fetch("/api/outlets").then(r => r.json()).then(setOutlets).catch(() => {});
  }, []);

  const loadLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ days });
    if (productId) params.set("productId", productId);
    if (outletId)  params.set("outletId",  outletId);
    fetch(`/api/temperature?${params}`)
      .then(r => r.json())
      .then(data => { setLogs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [productId, outletId, days]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  async function submitLog(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true);
    const cur = parseFloat(newLog.currentTemp);
    await fetch("/api/temperature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: newLog.productId,
        outletId: newLog.outletId,
        currentTemp: cur,
        minTemp: newLog.minTemp ? parseFloat(newLog.minTemp) : cur,
        maxTemp: newLog.maxTemp ? parseFloat(newLog.maxTemp) : cur,
      }),
    });
    setSubmitting(false);
    setShowLog(false);
    setNewLog({ productId: "", outletId: "", currentTemp: "", minTemp: "", maxTemp: "" });
    loadLogs();
  }

  // Build chart data — group by timestamp label
  const chartData = logs.map(l => ({
    time: formatTime(l.recordedAt),
    current: l.currentTemp,
    min: l.minTemp,
    max: l.maxTemp,
    product: l.product.name,
  }));

  // Excursions
  const excursions = logs.filter(l => l.currentTemp < SAFE_MIN || l.currentTemp > SAFE_MAX);

  // Latest reading per product
  const latestByProduct = new Map<string, TempLog>();
  logs.forEach(l => {
    const key = `${l.product.id}:${l.outlet.id}`;
    if (!latestByProduct.has(key) || new Date(l.recordedAt) > new Date(latestByProduct.get(key)!.recordedAt)) {
      latestByProduct.set(key, l);
    }
  });

  const inp = "w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <Thermometer className="w-6 h-6 text-blue-500" /> Temperature Monitoring
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Cold-chain compliance — safe range: +{SAFE_MIN}°C to +{SAFE_MAX}°C
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadLogs} className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={() => setShowLog(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" /> Log Reading
          </button>
        </div>
      </div>

      {/* Excursion alert banner */}
      {excursions.length > 0 && (
        <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400">
              {excursions.length} temperature excursion{excursions.length > 1 ? "s" : ""} detected
            </p>
            <p className="text-sm text-red-600 dark:text-red-500 mt-0.5">
              Readings outside +{SAFE_MIN}°C – +{SAFE_MAX}°C range. Affected products may require quarantine.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select className={`${inp} w-auto`} value={productId} onChange={e => setProductId(e.target.value)}>
          <option value="">All Products</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className={`${inp} w-auto`} value={outletId} onChange={e => setOutletId(e.target.value)}>
          <option value="">All Outlets</option>
          {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <select className={`${inp} w-auto`} value={days} onChange={e => setDays(e.target.value)}>
          {[["7","Last 7 days"],["14","Last 14 days"],["30","Last 30 days"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Latest readings summary */}
      {latestByProduct.size > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from(latestByProduct.values()).map(l => {
            const ok = l.currentTemp >= SAFE_MIN && l.currentTemp <= SAFE_MAX;
            return (
              <div key={l.id} className={`rounded-xl border p-4 ${ok ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"}`}>
                <div className="flex items-start justify-between mb-1">
                  <Thermometer className={`w-4 h-4 ${ok ? "text-green-500" : "text-red-500"}`} />
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${ok ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400"}`}>
                    {ok ? "IN RANGE" : "EXCURSION"}
                  </span>
                </div>
                <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm leading-tight">{l.product.name}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">{l.outlet.name}</p>
                <p className={`text-2xl font-bold mt-2 ${excursionClass(l.currentTemp)}`}>{l.currentTemp.toFixed(1)}°C</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                  Range: {l.minTemp.toFixed(1)}–{l.maxTemp.toFixed(1)}°C
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500">{formatDate(l.recordedAt)}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <h2 className="font-semibold text-gray-800 dark:text-slate-200 mb-4">
          Temperature Over Time {loading && <span className="text-xs text-gray-400 ml-2">Loading…</span>}
        </h2>
        {logs.length === 0 ? (
          <div className="py-16 text-center text-gray-400 dark:text-slate-500">
            <Thermometer className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No temperature readings found for the selected period.</p>
            <p className="text-sm mt-1">Use "Log Reading" to record the first entry.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#6b7280" }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} unit="°C" domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ backgroundColor: "var(--color-background, #fff)", border: "1px solid #e5e7eb", borderRadius: "0.5rem", fontSize: "12px" }}
                formatter={(value: any, name: any) => [typeof value === "number" ? `${value.toFixed(1)}°C` : value, name ?? ""]}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              {/* Safe zone references */}
              <ReferenceLine y={SAFE_MAX} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `Max ${SAFE_MAX}°C`, fill: "#ef4444", fontSize: 11, position: "right" }} />
              <ReferenceLine y={SAFE_MIN} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: `Min ${SAFE_MIN}°C`, fill: "#3b82f6", fontSize: 11, position: "right" }} />
              <Line type="monotone" dataKey="current" name="Current Temp" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="min" name="Min Temp"     stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
              <Line type="monotone" dataKey="max" name="Max Temp"     stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Log table */}
      {logs.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
            <h2 className="font-semibold text-gray-800 dark:text-slate-200">Reading Log ({logs.length})</h2>
          </div>
          <div className="overflow-x-auto max-h-72 overflow-y-auto scrollbar-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 sticky top-0">
                <tr>
                  {["Recorded","Product","Outlet","Current","Min","Max","Status"].map(h => (
                    <th key={h} className={`px-4 py-2.5 font-medium text-gray-600 dark:text-slate-400 text-left ${["Current","Min","Max"].includes(h)?"text-right":""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {[...logs].reverse().map(l => {
                  const ok = l.currentTemp >= SAFE_MIN && l.currentTemp <= SAFE_MAX;
                  return (
                    <tr key={l.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 ${!ok ? "bg-red-50/50 dark:bg-red-900/10" : ""}`}>
                      <td className="px-4 py-2.5 text-gray-500 dark:text-slate-400 text-xs">{new Date(l.recordedAt).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-gray-900 dark:text-slate-100">{l.product.name}</td>
                      <td className="px-4 py-2.5 text-gray-500 dark:text-slate-400">{l.outlet.name}</td>
                      <td className={`px-4 py-2.5 text-right font-bold ${excursionClass(l.currentTemp)}`}>{l.currentTemp.toFixed(1)}°C</td>
                      <td className="px-4 py-2.5 text-right text-gray-500 dark:text-slate-400">{l.minTemp.toFixed(1)}°C</td>
                      <td className="px-4 py-2.5 text-right text-gray-500 dark:text-slate-400">{l.maxTemp.toFixed(1)}°C</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ok ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"}`}>
                          {ok ? "OK" : l.currentTemp < SAFE_MIN ? "TOO COLD" : "TOO HOT"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log reading modal */}
      {showLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-slate-100">Log Temperature Reading</h2>
            <form onSubmit={submitLog} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Product</label>
                <select className={inp} value={newLog.productId} onChange={e => setNewLog(n => ({ ...n, productId: e.target.value }))} required>
                  <option value="">Select product…</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Outlet</label>
                <select className={inp} value={newLog.outletId} onChange={e => setNewLog(n => ({ ...n, outletId: e.target.value }))} required>
                  <option value="">Select outlet…</option>
                  {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[["currentTemp","Current (°C)"],["minTemp","Min (°C)"],["maxTemp","Max (°C)"]].map(([k,l]) => (
                  <div key={k}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{l}</label>
                    <input type="number" step="0.1" className={inp} value={(newLog as any)[k]} onChange={e => setNewLog(n => ({ ...n, [k]: e.target.value }))} required={k === "currentTemp"} placeholder="0.0" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 dark:text-slate-500">Safe range: +{SAFE_MIN}°C to +{SAFE_MAX}°C. Leave Min/Max blank to use current value.</p>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowLog(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">{submitting ? "Saving…" : "Save Reading"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
