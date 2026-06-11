import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PrintButton } from "./PrintButton";

interface Params { saleId: string; type: string }

const DOC_LABELS: Record<string, string> = {
  INVOICE: "TAX INVOICE",
  DELIVERY_NOTE: "DELIVERY NOTE",
  WAYBILL: "WAYBILL",
  GRN: "GOODS RECEIVED NOTE",
  LPO_ACKNOWLEDGEMENT: "LPO ACKNOWLEDGEMENT",
  STORE_VOUCHER: "STORE ISSUE VOUCHER",
};

async function getSettings() {
  const rows = await prisma.settings.findMany();
  const m: Record<string,string> = {};
  for (const r of rows) m[r.key] = r.value;
  return m;
}

export default async function DocumentPage({ params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session) return notFound();

  const { saleId, type } = params;

  if (!Object.keys(DOC_LABELS).includes(type)) return notFound();

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      customer: true,
      outlet: true,
      user: true,
      lines: {
        include: { product: { include: { category: true } } },
      },
    },
  });

  if (!sale) return notFound();

  const settings = await getSettings();
  const companyName = settings.company_name ?? "VaxTrace Ltd";
  const companyAddress = settings.company_address ?? "";
  const companyPhone = settings.company_phone ?? "";
  const companyEmail = settings.company_email ?? "";
  const title = DOC_LABELS[type];
  const currencyCode = settings.currency_code ?? "GHS";
  const currencySymbol = settings.currency_symbol ?? "GH₵";
  const fmt = (amount: number) => formatCurrency(amount, currencyCode, currencySymbol);

  return (
    <div className="bg-white min-h-screen">
      {/* Print controls - hidden on print */}
      <div className="no-print flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-gray-50">
        <h1 className="font-semibold text-gray-800">{title} — {sale.number}</h1>
        <div className="flex items-center gap-3">
          <a href={`/dashboard/sales/${saleId}`} className="text-sm text-gray-600 hover:text-gray-900">← Back to Sale</a>
          <PrintButton />
        </div>
      </div>

      {/* Document body */}
      <div className="max-w-4xl mx-auto px-8 py-10 print:px-4 print:py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{companyName}</h2>
            {companyAddress && <p className="text-sm text-gray-600 mt-1">{companyAddress}</p>}
            {companyPhone && <p className="text-sm text-gray-600">Tel: {companyPhone}</p>}
            {companyEmail && <p className="text-sm text-gray-600">{companyEmail}</p>}
          </div>
          <div className="text-right">
            <h1 className="text-xl font-bold uppercase text-blue-800 tracking-wide">{title}</h1>
            <p className="text-lg font-bold text-gray-900 mt-1">{sale.number}</p>
            <p className="text-sm text-gray-600">Date: {formatDate(sale.date)}</p>
            {type === "INVOICE" && <p className="text-sm text-gray-600">Due: {formatDate(sale.dueDate)}</p>}
            {sale.lpoNumber && <p className="text-sm text-gray-600">LPO Ref: {sale.lpoNumber}</p>}
          </div>
        </div>

        <hr className="border-gray-300 mb-6" />

        {/* Bill to */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              {type === "DELIVERY_NOTE" || type === "WAYBILL" ? "Deliver To" : "Bill To"}
            </p>
            <p className="font-bold text-gray-900">{sale.customer.name}</p>
            {sale.customer.contact && <p className="text-sm text-gray-600">{sale.customer.contact}</p>}
            {sale.customer.address && <p className="text-sm text-gray-600">{sale.customer.address}</p>}
            {sale.customer.email && <p className="text-sm text-gray-600">{sale.customer.email}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Issuing Outlet</p>
            <p className="font-bold text-gray-900">{sale.outlet.name}</p>
            {sale.outlet.address && <p className="text-sm text-gray-600">{sale.outlet.address}</p>}
            <p className="text-sm text-gray-600 mt-2">Prepared by: {sale.user.name}</p>
          </div>
        </div>

        {/* Waybill-specific fields */}
        {type === "WAYBILL" && (
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">Vehicle / Plate</p>
              <div className="border-b border-gray-400 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">Driver Name</p>
              <div className="border-b border-gray-400 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">Route</p>
              <div className="border-b border-gray-400 h-6" />
            </div>
          </div>
        )}

        {/* Store Voucher fields */}
        {type === "STORE_VOUCHER" && (
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">Vote Number</p>
              <div className="border-b border-gray-400 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">Program Code</p>
              <div className="border-b border-gray-400 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">Ledger Folio</p>
              <div className="border-b border-gray-400 h-6" />
            </div>
          </div>
        )}

        {/* LPO Acknowledgement text */}
        {type === "LPO_ACKNOWLEDGEMENT" && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700">
              We acknowledge receipt of your Local Purchase Order No. <strong>{sale.lpoNumber ?? "________________"}</strong>{" "}
              and confirm that the items listed below will be supplied as per the terms and conditions agreed upon.
            </p>
          </div>
        )}

        {/* Items table */}
        <table className="w-full text-sm mb-8">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="text-left px-3 py-2.5 rounded-tl font-medium">Description</th>
              {type !== "DELIVERY_NOTE" && type !== "WAYBILL" && type !== "STORE_VOUCHER" && (
                <th className="text-left px-3 py-2.5 font-medium">Category</th>
              )}
              <th className="text-left px-3 py-2.5 font-medium">Unit</th>
              <th className="text-right px-3 py-2.5 font-medium">Qty</th>
              {(type === "INVOICE" || type === "LPO_ACKNOWLEDGEMENT") && (
                <>
                  <th className="text-right px-3 py-2.5 font-medium">Unit Price</th>
                  <th className="text-right px-3 py-2.5 rounded-tr font-medium">Amount</th>
                </>
              )}
              {(type === "DELIVERY_NOTE" || type === "WAYBILL" || type === "STORE_VOUCHER") && (
                <th className="text-right px-3 py-2.5 rounded-tr font-medium">Received Qty</th>
              )}
              {type === "GRN" && (
                <th className="text-right px-3 py-2.5 rounded-tr font-medium">Condition</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sale.lines.map((line, idx) => (
              <tr key={line.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-3 py-2.5 border-b border-gray-100">
                  <p className="font-medium">{line.product.name}</p>
                  <p className="text-xs text-gray-400">{line.product.code}</p>
                </td>
                {type !== "DELIVERY_NOTE" && type !== "WAYBILL" && type !== "STORE_VOUCHER" && (
                  <td className="px-3 py-2.5 border-b border-gray-100 text-gray-600">{line.product.category.name}</td>
                )}
                <td className="px-3 py-2.5 border-b border-gray-100 text-gray-600">{line.product.unit}</td>
                <td className="px-3 py-2.5 border-b border-gray-100 text-right">{Number(line.quantity)}</td>
                {(type === "INVOICE" || type === "LPO_ACKNOWLEDGEMENT") && (
                  <>
                    <td className="px-3 py-2.5 border-b border-gray-100 text-right">{fmt(Number(line.unitPrice))}</td>
                    <td className="px-3 py-2.5 border-b border-gray-100 text-right font-medium">{fmt(Number(line.total))}</td>
                  </>
                )}
                {(type === "DELIVERY_NOTE" || type === "WAYBILL" || type === "STORE_VOUCHER" || type === "GRN") && (
                  <td className="px-3 py-2.5 border-b border-gray-100 text-right">
                    <div className="border-b border-gray-400 w-16 ml-auto h-5" />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals for invoice */}
        {(type === "INVOICE" || type === "LPO_ACKNOWLEDGEMENT") && (
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal:</span>
                <span className="font-medium">{fmt(Number(sale.subtotal))}</span>
              </div>
              {Number(sale.taxRate) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax ({Number(sale.taxRate)}%):</span>
                  <span className="font-medium">{fmt(Number(sale.taxAmount))}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-300 pt-2 font-bold">
                <span>Total:</span>
                <span className="text-xl">{fmt(Number(sale.total))}</span>
              </div>
              {type === "INVOICE" && (
                <div className="flex justify-between text-sm text-green-700">
                  <span>Amount Paid:</span>
                  <span className="font-medium">{fmt(Number(sale.amountPaid))}</span>
                </div>
              )}
              {type === "INVOICE" && (
                <div className="flex justify-between border-t border-gray-300 pt-1 font-semibold text-red-700">
                  <span>Balance Due:</span>
                  <span>{fmt(Number(sale.total) - Number(sale.amountPaid))}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {sale.notes && (
          <div className="mb-8 p-3 bg-gray-50 rounded text-sm text-gray-600">
            <span className="font-semibold">Notes:</span> {sale.notes}
          </div>
        )}

        {/* Signature blocks */}
        <div className="grid grid-cols-3 gap-8 mt-12">
          <div>
            <p className="text-xs text-gray-400 mb-8">Prepared By</p>
            <div className="border-t border-gray-400 pt-1">
              <p className="text-xs text-gray-500">{sale.user.name}</p>
              <p className="text-xs text-gray-400">Date: _______________</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-8">
              {type === "DELIVERY_NOTE" || type === "WAYBILL" ? "Dispatched By" : "Authorized By"}
            </p>
            <div className="border-t border-gray-400 pt-1">
              <p className="text-xs text-gray-400">Signature: _______________</p>
              <p className="text-xs text-gray-400">Date: _______________</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-8">
              {type === "DELIVERY_NOTE" || type === "WAYBILL" || type === "GRN" ? "Received By" : "Customer Signature"}
            </p>
            <div className="border-t border-gray-400 pt-1">
              <p className="text-xs text-gray-400">Name: _______________</p>
              <p className="text-xs text-gray-400">Date: _______________</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
          <p>{companyName} — {type} generated on {formatDate(new Date())}</p>
        </div>
      </div>
    </div>
  );
}
