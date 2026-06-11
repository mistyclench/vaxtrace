"use client";

import { useEffect, useState } from "react";
import { Save, Shield } from "lucide-react";

const RESOURCES = [
  { id: "dashboard",    label: "Dashboard" },
  { id: "sales",        label: "Sales / POS" },
  { id: "customers",    label: "Customers" },
  { id: "inventory",    label: "Inventory" },
  { id: "products",     label: "Products" },
  { id: "categories",   label: "Categories" },
  { id: "receiving",    label: "Goods Receiving" },
  { id: "dispatch",     label: "Stock Dispatch" },
  { id: "fefo",         label: "FEFO Alerts" },
  { id: "temperature",  label: "Temperature" },
  { id: "stock-taking", label: "Stock Taking" },
  { id: "users",        label: "Users" },
  { id: "roles",        label: "Roles & Permissions" },
  { id: "settings",     label: "Settings" },
  { id: "workflows",    label: "Workflows" },
];

const ACTIONS = ["view", "create", "edit", "delete", "approve", "manage"];

const ROLES = ["ADMIN", "MANAGER", "SALES", "WAREHOUSE", "ACCOUNTANT"] as const;
type RoleType = typeof ROLES[number];

// Built-in defaults if DB is empty
const DEFAULTS: Record<RoleType, Record<string, string[]>> = {
  ADMIN: Object.fromEntries(RESOURCES.map(r => [r.id, [...ACTIONS]])),
  MANAGER: Object.fromEntries(RESOURCES.map(r => {
    const full = ["sales","customers","inventory","receiving","dispatch"];
    return [r.id, full.includes(r.id) ? ["view","create","edit","approve"] : ["view"]];
  })),
  SALES: {
    dashboard: ["view"], sales: ["view","create"], customers: ["view","create"],
    inventory: ["view"], products: ["view"], fefo: ["view"],
    categories: [], receiving: [], dispatch: [], temperature: [], "stock-taking": [], users: [], roles: [], settings: [], workflows: [],
  },
  WAREHOUSE: {
    dashboard: ["view"], inventory: ["view","create","edit"], receiving: ["view","create"],
    dispatch: ["view","create"], fefo: ["view"], temperature: ["view","create"], "stock-taking": ["view","create","edit"],
    sales: [], customers: [], products: ["view"], categories: [], users: [], roles: [], settings: [], workflows: [],
  },
  ACCOUNTANT: {
    dashboard: ["view"], sales: ["view","approve"], customers: ["view","approve"],
    receiving: ["view","approve"], settings: ["view"],
    inventory: [], products: [], categories: [], dispatch: [], fefo: [], temperature: [], "stock-taking": [], users: [], roles: [], workflows: [],
  },
};

type PermMatrix = Record<string, Record<string, boolean>>;

function defaultMatrix(role: RoleType): PermMatrix {
  const matrix: PermMatrix = {};
  for (const r of RESOURCES) {
    matrix[r.id] = {};
    for (const a of ACTIONS) {
      matrix[r.id][a] = (DEFAULTS[role][r.id] ?? []).includes(a);
    }
  }
  return matrix;
}

export default function RolesPage() {
  const [activeRole, setActiveRole] = useState<RoleType>("MANAGER");
  const [matrices, setMatrices] = useState<Record<RoleType, PermMatrix>>(() => {
    const m = {} as Record<RoleType, PermMatrix>;
    for (const role of ROLES) m[role] = defaultMatrix(role);
    return m;
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/permissions")
      .then(r => r.json())
      .then((data: Record<string, Record<string, string[]>>) => {
        if (!data || Object.keys(data).length === 0) return;
        const newMatrices = { ...matrices };
        for (const role of ROLES) {
          if (!data[role]) continue;
          const matrix: PermMatrix = {};
          for (const r of RESOURCES) {
            matrix[r.id] = {};
            for (const a of ACTIONS) {
              matrix[r.id][a] = (data[role][r.id] ?? []).includes(a);
            }
          }
          newMatrices[role] = matrix;
        }
        setMatrices(newMatrices);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(resource: string, action: string) {
    if (activeRole === "ADMIN") return;
    setMatrices(prev => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        [resource]: {
          ...prev[activeRole][resource],
          [action]: !prev[activeRole][resource][action],
        },
      },
    }));
  }

  async function save() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const matrix = matrices[activeRole];
      for (const r of RESOURCES) {
        const actions = ACTIONS.filter(a => matrix[r.id][a]);
        await fetch("/api/permissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: activeRole, resource: r.id, actions }),
        });
      }
      setSuccess(`Permissions for ${activeRole} saved.`);
    } catch {
      setError("Failed to save permissions.");
    } finally {
      setSaving(false);
    }
  }

  const matrix = matrices[activeRole];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Roles &amp; Permissions</h1>
      </div>

      {success && <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm">{success}</div>}
      {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {/* Role tabs */}
      <div className="flex flex-wrap gap-2">
        {ROLES.map(role => (
          <button
            key={role}
            onClick={() => setActiveRole(role)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeRole === role
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      {activeRole === "ADMIN" && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
          ADMIN has all permissions and cannot be modified.
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-slate-400 w-44">Resource</th>
                {ACTIONS.map(a => (
                  <th key={a} className="text-center px-3 py-3 font-medium text-gray-600 dark:text-slate-400 capitalize w-20">{a}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {RESOURCES.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                  <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-slate-200">{r.label}</td>
                  {ACTIONS.map(a => {
                    const checked = activeRole === "ADMIN" ? true : matrix[r.id][a];
                    return (
                      <td key={a} className="text-center px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(r.id, a)}
                          disabled={activeRole === "ADMIN"}
                          className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {activeRole !== "ADMIN" && (
        <div className="flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : `Save ${activeRole} Permissions`}
          </button>
        </div>
      )}
    </div>
  );
}
