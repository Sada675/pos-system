import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Package,
  Printer,
  ShoppingCart,
  Trash2,
  Truck,
  Wallet,
  X,
  AlertTriangle,
} from "lucide-react";

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatCurrency = (amount) =>
  `Rs. ${toNumber(amount).toLocaleString("en-PK", {
    maximumFractionDigits: 2,
  })}`;

const getBalance = (purchase) =>
  purchase.balance != null
    ? Math.max(0, toNumber(purchase.balance))
    : Math.max(0, toNumber(purchase.total) - toNumber(purchase.paid));

const getStatus = (purchase) => {
  if (purchase.status) return purchase.status;

  const total = toNumber(purchase.total);
  const paid = toNumber(purchase.paid);

  if (paid <= 0) return "Unpaid";
  if (paid >= total) return "Paid";

  return "Partial";
};

const statusStyle = (status) => {
  switch (status) {
    case "Paid":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";

    case "Partial":
      return "border-amber-100 bg-amber-50 text-amber-700";

    default:
      return "border-red-100 bg-red-50 text-red-600";
  }
};

const escapeHTML = (value) =>
  String(value ?? "-").replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });

export default function SupplierPurchaseDetails({
  supplier,
  purchases = [],
  onBack,
  onViewPurchase,
  onPrintPurchase,
  onDeletePurchase,
}) {
  const [pendingDelete, setPendingDelete] = useState(null);

  const totalAmount = purchases.reduce(
    (sum, purchase) => sum + toNumber(purchase.total),
    0,
  );

  const totalPaid = purchases.reduce(
    (sum, purchase) => sum + toNumber(purchase.paid),
    0,
  );

  const totalPending = purchases.reduce(
    (sum, purchase) => sum + getBalance(purchase),
    0,
  );

  const totalItems = purchases.reduce(
    (sum, purchase) =>
      sum +
      (purchase.items || []).reduce(
        (itemSum, item) => itemSum + toNumber(item.quantity),
        0,
      ),
    0,
  );

  const sortedPurchases = [...purchases].sort(
    (a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt),
  );

  // CONFIRM DELETE

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;

    onDeletePurchase?.(pendingDelete);
    setPendingDelete(null);
  };

  // PRINT ALL PURCHASES FOR THIS SUPPLIER

  const handlePrintAllPurchases = () => {
    if (!sortedPurchases.length) return;

    const printWindow = window.open("", "_blank", "width=1000,height=750");

    if (!printWindow) {
      window.alert("Please allow pop-ups to print purchase history.");
      return;
    }

    const invoiceRows = sortedPurchases
      .map((purchase, index) => {
        const items = purchase.items || [];

        const productRows = items
          .map(
            (item) => `
              <tr>
                <td>${escapeHTML(item.product)}</td>
                <td>${escapeHTML(item.category || "-")}</td>
                <td>${toNumber(item.quantity).toLocaleString("en-PK")}</td>
                <td>${formatCurrency(item.rate)}</td>
                <td>${formatCurrency(
                  toNumber(item.quantity) * toNumber(item.rate),
                )}</td>
              </tr>
            `,
          )
          .join("");

        return `
          <section class="invoice-section">
            <div class="invoice-heading">
              <div>
                <h3>Invoice ${index + 1}: ${escapeHTML(purchase.invoice)}</h3>
                <p>Purchase Date: ${escapeHTML(purchase.date || "-")}</p>
              </div>
              <span class="status">${escapeHTML(getStatus(purchase))}</span>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Unit Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>

              <tbody>
                ${
                  productRows ||
                  `<tr><td colspan="5">No products recorded</td></tr>`
                }
              </tbody>
            </table>

            <div class="invoice-summary">
              <div>
                <span>Invoice Total</span>
                <strong>${formatCurrency(purchase.total)}</strong>
              </div>

              <div>
                <span>Paid</span>
                <strong>${formatCurrency(purchase.paid)}</strong>
              </div>

              <div>
                <span>Remaining Balance</span>
                <strong>${formatCurrency(getBalance(purchase))}</strong>
              </div>
            </div>
          </section>
        `;
      })
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Supplier Purchase History - ${escapeHTML(supplier.name)}</title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              color: #1e293b;
              padding: 30px;
              margin: 0;
              font-size: 12px;
            }

            h1, h2, h3, p {
              margin-top: 0;
            }

            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 18px;
              margin-bottom: 22px;
            }

            h1 {
              font-size: 24px;
              margin-bottom: 6px;
            }

            .subtitle {
              color: #64748b;
              font-size: 12px;
            }

            .supplier-info {
              background: #eff6ff;
              border: 1px solid #dbeafe;
              padding: 16px;
              border-radius: 8px;
              margin-bottom: 20px;
            }

            .supplier-info p {
              margin: 5px 0;
            }

            .stats {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              margin-bottom: 25px;
            }

            .stat {
              border: 1px solid #e2e8f0;
              padding: 13px;
              border-radius: 7px;
            }

            .stat span {
              display: block;
              color: #64748b;
              margin-bottom: 7px;
            }

            .stat strong {
              font-size: 15px;
            }

            .invoice-section {
              margin-bottom: 25px;
              page-break-inside: avoid;
            }

            .invoice-heading {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 8px;
              margin-bottom: 10px;
            }

            .invoice-heading h3 {
              font-size: 15px;
              margin-bottom: 5px;
            }

            .invoice-heading p {
              color: #64748b;
              margin-bottom: 0;
            }

            .status {
              padding: 5px 10px;
              border: 1px solid #cbd5e1;
              border-radius: 20px;
              font-weight: bold;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
            }

            th, td {
              border: 1px solid #e2e8f0;
              padding: 9px;
              text-align: left;
            }

            th {
              background: #f1f5f9;
            }

            .invoice-summary {
              display: flex;
              justify-content: flex-end;
              gap: 25px;
              flex-wrap: wrap;
              background: #f8fafc;
              padding: 12px;
            }

            .invoice-summary div {
              display: flex;
              flex-direction: column;
              gap: 5px;
            }

            .invoice-summary span {
              color: #64748b;
            }

            .overall {
              border-top: 2px solid #2563eb;
              margin-top: 25px;
              padding-top: 18px;
            }

            .overall h2 {
              font-size: 18px;
              margin-bottom: 15px;
            }

            .overall-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;
            }

            .overall-grid div {
              background: #eff6ff;
              padding: 13px;
              border-radius: 7px;
            }

            .overall-grid span {
              display: block;
              color: #64748b;
              margin-bottom: 6px;
            }

            .footer {
              margin-top: 30px;
              border-top: 1px solid #e2e8f0;
              padding-top: 12px;
              text-align: center;
              color: #64748b;
            }

            @media print {
              body {
                padding: 10px;
              }

              .invoice-section {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>

        <body>
          <div class="header">
            <div>
              <h1>Supplier Purchase Report</h1>
              <p class="subtitle">Complete purchase history and payment summary</p>
            </div>

            <div>
              <strong>Generated:</strong>
              ${escapeHTML(new Date().toLocaleDateString("en-PK"))}
            </div>
          </div>

          <div class="supplier-info">
            <h2>${escapeHTML(supplier.name)}</h2>
            <p><strong>Phone:</strong> ${escapeHTML(supplier.phone || "-")}</p>
            <p><strong>Email:</strong> ${escapeHTML(supplier.email || "-")}</p>
            <p><strong>Address:</strong> ${escapeHTML(supplier.address || "-")}</p>
          </div>

          <div class="stats">
            <div class="stat">
              <span>Total Purchase Invoices</span>
              <strong>${purchases.length}</strong>
            </div>

            <div class="stat">
              <span>Total Purchase Amount</span>
              <strong>${formatCurrency(totalAmount)}</strong>
            </div>

            <div class="stat">
              <span>Total Paid</span>
              <strong>${formatCurrency(totalPaid)}</strong>
            </div>

            <div class="stat">
              <span>Pending Balance</span>
              <strong>${formatCurrency(totalPending)}</strong>
            </div>
          </div>

          <h2>All Purchase Invoices</h2>

          ${invoiceRows}

          <div class="overall">
            <h2>Overall Supplier Summary</h2>

            <div class="overall-grid">
              <div>
                <span>Total Invoices</span>
                <strong>${purchases.length}</strong>
              </div>

              <div>
                <span>Total Quantity Purchased</span>
                <strong>${totalItems.toLocaleString("en-PK")}</strong>
              </div>

              <div>
                <span>Total Purchase Amount</span>
                <strong>${formatCurrency(totalAmount)}</strong>
              </div>

              <div>
                <span>Total Paid</span>
                <strong>${formatCurrency(totalPaid)}</strong>
              </div>

              <div>
                <span>Total Outstanding</span>
                <strong>${formatCurrency(totalPending)}</strong>
              </div>

              <div>
                <span>Last Purchase</span>
                <strong>${escapeHTML(sortedPurchases[0]?.date || "-")}</strong>
              </div>
            </div>
          </div>

          <div class="footer">
            Supplier Purchase Report
          </div>

          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const stats = [
    {
      title: "Total Purchases",
      value: purchases.length,
      icon: ShoppingCart,
      color: "bg-blue-50 text-blue-600",
      description: "Purchase invoices",
    },
    {
      title: "Total Amount",
      value: formatCurrency(totalAmount),
      icon: Wallet,
      color: "bg-indigo-50 text-indigo-600",
      description: "Total purchase value",
    },
    {
      title: "Total Paid",
      value: formatCurrency(totalPaid),
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-600",
      description: "Settled amount",
    },
    {
      title: "Pending Balance",
      value: formatCurrency(totalPending),
      icon: Clock,
      color: "bg-amber-50 text-amber-600",
      description: "Remaining dues",
    },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* HEADER */}

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <button
              type="button"
              onClick={onBack}
              className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft size={17} />
              Back to Suppliers
            </button>

            <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
              <ShoppingCart size={17} />
              Supplier Purchase History
            </div>

            <h1 className="mt-2 text-2xl font-bold text-slate-800">
              {supplier.name}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Complete purchase history and payment records for this supplier.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePrintAllPurchases}
            disabled={!purchases.length}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:self-center"
          >
            <Printer size={18} />
            Print All Purchases
          </button>
        </div>

        {/* SUPPLIER INFORMATION */}

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                <Truck size={26} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {supplier.name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {supplier.phone || "No phone number"}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-white px-4 py-3">
              <p className="text-xs font-medium text-slate-400">
                Total Purchase Records
              </p>

              <p className="mt-1 text-xl font-bold text-blue-600">
                {purchases.length}
              </p>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-slate-400">
                Supplier Email
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                {supplier.email || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400">
                Supplier Address
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                {supplier.address || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((card, index) => {
            const Icon = card.icon;

            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {card.title}
                    </p>

                    <h3 className="mt-3 break-words text-xl font-bold text-slate-800">
                      {card.value}
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      {card.description}
                    </p>
                  </div>

                  <div className={`rounded-xl p-3 ${card.color}`}>
                    <Icon size={22} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ADDITIONAL SUMMARY */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
                <Package size={21} />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Total Quantity Purchased
                </p>
                <p className="mt-1 text-xl font-bold text-slate-800">
                  {totalItems.toLocaleString("en-PK")}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <CalendarDays size={21} />
              </div>

              <div>
                <p className="text-sm text-slate-500">Last Purchase</p>
                <p className="mt-1 text-xl font-bold text-slate-800">
                  {sortedPurchases[0]?.date || "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PURCHASE HISTORY TABLE */}

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-bold text-slate-800">
              All Purchase Invoices
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              All purchases recorded for {supplier.name}.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs uppercase tracking-wider text-slate-500">
                  {[
                    "Invoice",
                    "Date",
                    "Products",
                    "Total Amount",
                    "Paid",
                    "Balance",
                    "Status",
                    "Actions",
                  ].map((heading) => (
                    <th key={heading} className="px-5 py-4">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sortedPurchases.length ? (
                  sortedPurchases.map((purchase) => {
                    const status = getStatus(purchase);

                    return (
                      <tr
                        key={purchase.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <span className="font-semibold text-blue-600">
                            {purchase.invoice}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {purchase.date || "-"}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {purchase.items?.length || 0} Product(s)
                        </td>

                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {formatCurrency(purchase.total)}
                        </td>

                        <td className="px-5 py-4 font-medium text-emerald-600">
                          {formatCurrency(purchase.paid)}
                        </td>

                        <td className="px-5 py-4 font-medium text-red-500">
                          {formatCurrency(getBalance(purchase))}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${statusStyle(
                              status,
                            )}`}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onPrintPurchase?.(purchase)}
                              title="Print Purchase"
                              className="rounded-lg bg-emerald-50 p-2 text-emerald-600 transition hover:bg-emerald-100"
                            >
                              <Printer size={17} />
                            </button>

                            <button
                              type="button"
                              onClick={() => onViewPurchase?.(purchase)}
                              title="View Purchase"
                              className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                            >
                              <Eye size={17} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setPendingDelete(purchase)}
                              title="Delete Purchase"
                              className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="px-5 py-14 text-center">
                      <FileText
                        size={36}
                        className="mx-auto mb-3 text-slate-300"
                      />

                      <p className="font-semibold text-slate-700">
                        No Purchase Records
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        No purchases have been recorded for this supplier.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col justify-between gap-2 border-t border-slate-100 p-5 sm:flex-row">
            <p className="text-sm text-slate-500">
              Showing <b className="text-slate-700">{purchases.length}</b>{" "}
              purchase invoices
            </p>

            <p className="text-sm font-semibold text-slate-700">
              Total Outstanding:{" "}
              <span className="text-red-500">
                {formatCurrency(totalPending)}
              </span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* CENTERED DELETE CONFIRMATION MODAL */}

      <AnimatePresence>
        {pendingDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
            onClick={() => setPendingDelete(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              {/* MODAL HEADER */}

              <div className="relative border-b border-slate-100 px-6 pb-5 pt-6 text-center">
                <button
                  type="button"
                  onClick={() => setPendingDelete(null)}
                  className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close delete confirmation"
                >
                  <X size={19} />
                </button>

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <AlertTriangle size={30} />
                </div>

                <h2 className="mt-4 text-xl font-bold text-slate-800">
                  Delete Purchase Record?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Are you sure you want to delete this purchase record? Please
                  review the details before continuing.
                </p>
              </div>

              {/* PURCHASE DETAILS */}

              <div className="p-6">
                <div className="rounded-xl border border-red-100 bg-red-50/70 p-4">
                  <div className="flex items-center justify-between gap-3 border-b border-red-100 pb-3">
                    <span className="text-sm text-slate-500">
                      Invoice Number
                    </span>

                    <span className="font-bold text-slate-800">
                      {pendingDelete.invoice || "-"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-b border-red-100 py-3">
                    <span className="text-sm text-slate-500">Supplier</span>

                    <span className="font-semibold text-slate-800">
                      {supplier.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-3">
                    <span className="text-sm text-slate-500">
                      Purchase Amount
                    </span>

                    <span className="font-bold text-red-600">
                      {formatCurrency(pendingDelete.total)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-red-600">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" />

                  <p>
                    Deleting this record may also affect related stock and
                    supplier payment balances. This action cannot be undone.
                  </p>
                </div>
              </div>

              {/* MODAL ACTIONS */}

              <div className="flex gap-3 border-t border-slate-100 bg-slate-50 p-5">
                <button
                  type="button"
                  onClick={() => setPendingDelete(null)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  <Trash2 size={16} />
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
