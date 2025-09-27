import type { Invoice } from "@/types";
import { formatCurrency } from "@/lib/format";

interface InvoiceHistoryProps {
  invoices: Invoice[];
}

const statusStyles: Record<Invoice["status"], string> = {
  draft: "bg-slate-800 text-slate-300",
  open: "bg-amber-500/10 text-amber-200",
  paid: "bg-emerald-500/10 text-emerald-200",
  void: "bg-slate-700 text-slate-300",
};

export function InvoiceHistory({ invoices }: InvoiceHistoryProps) {
  if (invoices.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-800 bg-slate-950/40 px-4 py-6 text-center text-sm text-slate-400">
        Invoices will appear here once billing cycles complete.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
      <table className="min-w-full divide-y divide-slate-800 text-sm">
        <thead className="bg-slate-900/80 text-slate-400">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Invoice</th>
            <th className="px-4 py-3 text-left font-semibold">Status</th>
            <th className="px-4 py-3 text-left font-semibold">Amount due</th>
            <th className="px-4 py-3 text-left font-semibold">Due date</th>
            <th className="px-4 py-3 text-left font-semibold">Download</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 text-slate-300">
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td className="px-4 py-3 font-medium text-white">{invoice.id}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[invoice.status]}`}>
                  {invoice.status}
                </span>
              </td>
              <td className="px-4 py-3 text-white">{formatCurrency(invoice.amountDue)}</td>
              <td className="px-4 py-3 text-slate-200">
                {invoice.dueDate instanceof Date
                  ? invoice.dueDate.toLocaleDateString()
                  : new Date(invoice.dueDate).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <a
                  href={invoice.invoicePdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-blue-300 transition hover:text-blue-200"
                >
                  View PDF
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
