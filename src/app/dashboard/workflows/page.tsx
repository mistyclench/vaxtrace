"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, GitBranch, Save } from "lucide-react";

const ROLES = ["ADMIN", "MANAGER", "SALES", "WAREHOUSE", "ACCOUNTANT"];

interface WorkflowStep {
  id?: string;
  stepOrder: number;
  approverRole: string;
  label: string;
  required: boolean;
}

interface Workflow {
  id?: string;
  trigger: string;
  name: string;
  description: string;
  active: boolean;
  steps: WorkflowStep[];
}

const DEFAULT_WORKFLOWS: Workflow[] = [
  {
    trigger: "sale.confirm",
    name: "Sale Confirmation",
    description: "Approval workflow triggered when a sale is confirmed.",
    active: false,
    steps: [{ stepOrder: 1, approverRole: "MANAGER", label: "Manager Approval", required: true }],
  },
  {
    trigger: "grn.create",
    name: "GRN Approval",
    description: "Approval workflow for Goods Received Notes.",
    active: false,
    steps: [{ stepOrder: 1, approverRole: "MANAGER", label: "Manager Approval", required: true }],
  },
  {
    trigger: "dispatch.create",
    name: "Dispatch Approval",
    description: "Approval workflow triggered when stock is dispatched.",
    active: false,
    steps: [{ stepOrder: 1, approverRole: "MANAGER", label: "Manager Approval", required: true }],
  },
];

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>(DEFAULT_WORKFLOWS);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/workflows")
      .then(r => r.json())
      .then((data: Workflow[]) => {
        if (!Array.isArray(data) || data.length === 0) return;
        setWorkflows(prev => prev.map(def => {
          const found = data.find(d => d.trigger === def.trigger);
          return found ? { ...def, ...found, steps: found.steps ?? def.steps } : def;
        }));
      })
      .catch(() => {});
  }, []);

  function updateWorkflow(trigger: string, patch: Partial<Workflow>) {
    setWorkflows(wfs => wfs.map(w => w.trigger === trigger ? { ...w, ...patch } : w));
  }

  function updateStep(trigger: string, idx: number, patch: Partial<WorkflowStep>) {
    setWorkflows(wfs => wfs.map(w => {
      if (w.trigger !== trigger) return w;
      const steps = w.steps.map((s, i) => i === idx ? { ...s, ...patch } : s);
      return { ...w, steps };
    }));
  }

  function addStep(trigger: string) {
    setWorkflows(wfs => wfs.map(w => {
      if (w.trigger !== trigger) return w;
      const nextOrder = (w.steps[w.steps.length - 1]?.stepOrder ?? 0) + 1;
      return { ...w, steps: [...w.steps, { stepOrder: nextOrder, approverRole: "MANAGER", label: "Approval Step", required: true }] };
    }));
  }

  function removeStep(trigger: string, idx: number) {
    setWorkflows(wfs => wfs.map(w => {
      if (w.trigger !== trigger) return w;
      return { ...w, steps: w.steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stepOrder: i + 1 })) };
    }));
  }

  async function save(trigger: string) {
    setSaving(s => ({ ...s, [trigger]: true }));
    setMessages(m => ({ ...m, [trigger]: "" }));
    try {
      const wf = workflows.find(w => w.trigger === trigger)!;
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wf),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setWorkflows(wfs => wfs.map(w => w.trigger === trigger ? { ...w, ...updated, steps: updated.steps ?? w.steps } : w));
      setMessages(m => ({ ...m, [trigger]: "Saved successfully." }));
    } catch {
      setMessages(m => ({ ...m, [trigger]: "Failed to save." }));
    } finally {
      setSaving(s => ({ ...s, [trigger]: false }));
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <GitBranch className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Workflow Configuration</h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-slate-400">
        Configure approval workflows for sales, goods receiving, and dispatch. When active, new transactions will require approvals before proceeding.
      </p>

      <div className="space-y-6">
        {workflows.map(wf => (
          <div key={wf.trigger} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 space-y-4">
            {/* Header row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900 dark:text-slate-100">{wf.name}</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{wf.description}</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-gray-600 dark:text-slate-400">{wf.active ? "Active" : "Inactive"}</span>
                <div
                  onClick={() => updateWorkflow(wf.trigger, { active: !wf.active })}
                  className={`relative inline-flex h-6 w-11 rounded-full transition-colors cursor-pointer ${wf.active ? "bg-blue-600" : "bg-gray-300 dark:bg-slate-600"}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${wf.active ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
              </label>
            </div>

            {/* Description edit */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Description</label>
              <input
                type="text"
                value={wf.description}
                onChange={e => updateWorkflow(wf.trigger, { description: e.target.value })}
                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Steps */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 dark:text-slate-300">Approval Steps</h3>
                <button
                  type="button"
                  onClick={() => addStep(wf.trigger)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Step
                </button>
              </div>

              {wf.steps.length === 0 && (
                <p className="text-xs text-gray-400 dark:text-slate-500">No steps configured. Add a step to enable this workflow.</p>
              )}

              {wf.steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/40 rounded-lg">
                  <span className="text-xs font-bold text-gray-400 dark:text-slate-500 w-5 text-center">{step.stepOrder}</span>
                  <input
                    type="text"
                    value={step.label}
                    onChange={e => updateStep(wf.trigger, idx, { label: e.target.value })}
                    className="flex-1 border border-gray-300 dark:border-slate-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Step label"
                  />
                  <select
                    value={step.approverRole}
                    onChange={e => updateStep(wf.trigger, idx, { approverRole: e.target.value })}
                    className="border border-gray-300 dark:border-slate-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={step.required}
                      onChange={e => updateStep(wf.trigger, idx, { required: e.target.checked })}
                      className="rounded border-gray-300 dark:border-slate-600"
                    />
                    Required
                  </label>
                  <button
                    type="button"
                    onClick={() => removeStep(wf.trigger, idx)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Save + message */}
            <div className="flex items-center justify-between pt-2">
              {messages[wf.trigger] && (
                <p className={`text-xs ${messages[wf.trigger].includes("Failed") ? "text-red-500" : "text-green-600 dark:text-green-400"}`}>
                  {messages[wf.trigger]}
                </p>
              )}
              <div className="ml-auto">
                <button
                  onClick={() => save(wf.trigger)}
                  disabled={saving[wf.trigger]}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving[wf.trigger] ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
