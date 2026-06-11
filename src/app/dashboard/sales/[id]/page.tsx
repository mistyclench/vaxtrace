"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import { useCurrency } from "@/lib/currency-context";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Printer } from "lucide-react";

interface Sale {
  id: string; number: string; date: string; dueDate: string; status: string;
  subtotal: number; taxRate: number; taxAmount: number; total: number; amountPaid: number;
  notes?: string; lpoNumber?: string;
  customer: { id: string; name: string; code: string; contact?: string; address?: string };
  outlet: { name: string; address?: string };
  user: { name: string };
  lines: Array<{
    id: string; quantity: number; unitPrice: number; total: number;
    product: { name: string; code: string; unit: string; category: { name: string } };
  }>;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700", CONFIRMED: "bg-blue-100 text-blue-700",
  DISPATCHED: "bg-purple-100 text-purple-700", PARTIALLY_PAID: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700", CANCELLED: "bg-red-100 text-red-700",
};

const DOCUMENT_TYPES = [
  { type: "INVOICE", label: "Invoice" },
  { type: "DELIVERY_NOTE", label: "Delivery Note" },
  { type: "WAYBILL", label: "Waybill" },
  { type: "GRN", label: "GRN" },
  { type: "LPO_ACKNOWLEDGEMENT", label: "LPO Acknowledgement" },
  { type: "STORE_VOUCHER", label: "Store Voucher" },
];

export default function SaleDetailPage() {
  const { format } = useCurrency();
  const { id } = useParams<{ id: string }>();
  const [sale, setSale] = useState<Sale | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/sales/${id}`).then(r => r.json()).then(setSale);
  }, [id]);

  async function updateStatus(status: string) {
    setUpdating(true);
    const res = await fetch(`/api/sales/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdating(false);
    if (res.ok) setSale(await res.json());
  }

  async function recordPayment() {
    if (!paymentAmount) return;
    setUpdating(true);
    const res = await fetch(`/api/sales/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountPaid: parseFloat(paymentAmount) }),
    });
    setUpdating(false);
    if (res.ok) { setSale(await res.json()); setPaymentAmount(""); }
  }

  if (!sale) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  const balance = Number(sale.total) - Number(sale.amountPaid);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/sales" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-bold text-gray-900">{sale.number}</h1>
        <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusColors[sale.status] ?? ""}`}>{sale.status}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-500">Customer</p>
                <p className="font-bold">{sale.customer.name}</p>
                <p className="text-sm text-gray-500">{sale.customer.code}</p>
                {sale.customer.contact && <p className="text-sm text-gray-500">{sale.customer.contact}</p>}
              </div>
              <div>
                <p className="text-xs text-gray-500">Outlet</p>
                <p className="font-bold">{sale.outlet.name}</p>
                <p className="text-xs text-gray-500 mt-1">Date: {formatDate(sale.date)}</p>
                <p className="text-xs text-gray-500">Due: {formatDate(sale.dueDate)}</p>
                {sale.lpoNumber && <p className="text-xs text-gray-500">LPO: {sale.lpoNumber}</p>}
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-600">Product</th>
                  <th className="text-left py-2 font-medium text-gray-600">Category</th>
                  <th className="text-right py-2 font-medium text-gray-600">Qty</th>
                  <th className="text-right py-2 font-medium text-gray-600">Unit Price</th>
                  <th className="text-right py-2 font-medium text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sale.lines.map(line => (
                  <tr key={line.id}>
                    <td className="py-2">
                      <p className="font-medium">{line.product.name}</p>
                      <p className="text-xs text-gray-400">{line.product.code} | {line.product.unit}</p>
                    </td>
                    <td className="py-2 text-gray-500">{line.product.category.name}</td>
                    <td className="py-2 text-right">{Number(line.quantity)}</td>
                    <td className="py-2 text-right">{format(line.unitPrice)}</td>
                    <td className="py-2 text-right font-medium">{format(line.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-gray-200">
                <tr><td colSpan={4} className="py-2 text-right text-gray-500">Subtotal:</td><td className="py-2 text-right">{format(sale.subtotal)}</td></tr>
                {Number(sale.taxRate) > 0 && <tr><td colSpan={4} className="py-1 text-right text-gray-500">Tax ({Number(sale.taxRate)}%):</td><td className="py-1 text-right">{format(sale.taxAmount)}</td></tr>}
                <tr><td colSpan={4} className="py-2 text-right font-bold">Total:</td><td className="py-2 text-right font-bold text-xl">{format(sale.total)}</td></tr>
                <tr><td colSpan={4} className="py-1 text-right text-green-600">Paid:</td><td className="py-1 text-right text-green-600">{format(sale.amountPaid)}</td></tr>
                <tr><td colSpan={4} className="py-1 text-right font-semibold text-red-600">Balance:</td><td className="py-1 text-right font-bold text-red-600">{format(balance)}</td></tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Actions sidebar */}
        <div className="space-y-4">
          {/* Status actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
            <h3 className="font-semibold text-gray-800">Actions</h3>
            {sale.status === "DRAFT" && (
              <button onClick={() => updateStatus("CONFIRMED")} disabled={updating} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                Confirm Sale
              </button>
            )}
            {sale.status === "CONFIRMED" && (
              <button onClick={() => updateStatus("DISPATCHED")} disabled={updating} className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                Mark Dispatched
              </button>
            )}
            {["CONFIRMED","DISPATCHED","PARTIALLY_PAID"].includes(sale.status) && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Record Payment</p>
                <div className="flex gap-2">
                  <input type="number" step="0.01" min="0" className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none" placeholder="Amount" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
                  <button onClick={recordPayment} disabled={updating} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm disabled:opacity-50">Pay</button>
                </div>
              </div>
            )}
            {sale.status === "DRAFT" && (
              <button onClick={() => updateStatus("CANCELLED")} disabled={updating} className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium disabled:opacity-50">
                Cancel Sale
              </button>
            )}
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2"><FileText className="w-4 h-4" />Documents</h3>
            {DOCUMENT_TYPES.map(doc => (
              <Link
                key={doc.type}
                href={`/dashboard/documents/${sale.id}/${doc.type}`}
                target="_blank"
                className="flex items-center justify-between py-2 px-3 border border-gray-200 rounded-lg hover:bg-gray-50 group"
              >
                <span className="text-sm text-gray-700">{doc.label}</span>
                <Printer className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
