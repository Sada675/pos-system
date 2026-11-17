import { motion } from "framer-motion";
import {
  ShoppingBag,
  Wallet,
  Receipt,
  ArrowLeft,
  Printer,
  CalendarDays,
  CreditCard,
  MapPin,
  Mail,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  UserRound,
  FileText,
  Phone,
} from "lucide-react";

const formatCurrency = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date) => {
  if (!date) return "N/A";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "N/A";

  return parsedDate.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "N/A";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "N/A";

  return parsedDate.toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalizePhone = (phone) => {
  let value = String(phone || "").replace(/\D/g, "");

  if (value.startsWith("0092")) {
    value = `0${value.slice(4)}`;
  } else if (value.startsWith("92")) {
    value = `0${value.slice(2)}`;
  }

  return value;
};

const normalizeName = (name) =>
  String(name || "")
    .trim()
    .toLowerCase();

const escapeHTML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return entities[char];
  });

function StatCard({ item, index }) {
  const Icon = item.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_24px_rgba(30,64,175,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(30,64,175,0.13)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
            {item.title}
          </p>

          <h3 className="mt-3 break-words text-2xl font-black tracking-tight text-slate-900">
            {item.value}
          </h3>

          {item.subtitle && (
            <p className="mt-2 text-xs text-slate-500">{item.subtitle}</p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.color}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </motion.div>
  );
}

function SectionHeading({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
          <Icon size={20} />
        </div>

        <div>
          <h2 className="font-bold text-slate-800">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>

      {action}
    </div>
  );
}

function CustomerDetails({ customer, sales = [], onBack }) {
  const customerSales = sales
    .filter((sale) => {
      const customerPhone = normalizePhone(customer.phone);
      const salePhone = normalizePhone(sale.customerPhone);
      if (customerPhone) return salePhone === customerPhone;
      return (
        !salePhone &&
        normalizeName(customer.name) === normalizeName(sale.customerName)
      );
    })
    .sort(
      (a, b) =>
        new Date(b.saleDate || b.createdAt || 0).getTime() -
        new Date(a.saleDate || a.createdAt || 0).getTime(),
    );

  const summary = {
    customerSales,
    totalOrders: customerSales.length,
    totalPurchases: customerSales.reduce(
      (t, sale) => t + Number(sale.grandTotal || 0),
      0,
    ),
    totalPaid: customerSales.reduce((t, sale) => t + Number(sale.paid || 0), 0),
    outstanding: customerSales.reduce(
      (t, sale) => t + Number(sale.balance || 0),
      0,
    ),
    totalItems: customerSales.reduce(
      (t, sale) =>
        t +
        (sale.items || []).reduce(
          (sum, item) => sum + Number(item.quantity || 0),
          0,
        ),
      0,
    ),
    lastPurchase:
      customerSales[0]?.saleDate || customerSales[0]?.createdAt || null,
  };

  const detailStats = [
    {
      title: "Total Orders",
      value: summary.totalOrders,
      icon: Receipt,
      color: "bg-sky-100 text-sky-700",
      subtitle: "Completed purchases",
    },
    {
      title: "Total Purchases",
      value: formatCurrency(summary.totalPurchases),
      icon: ShoppingBag,
      color: "bg-emerald-50 text-emerald-600",
      subtitle: "Lifetime purchase value",
    },
    {
      title: "Total Paid",
      value: formatCurrency(summary.totalPaid),
      icon: CreditCard,
      color: "bg-violet-50 text-violet-600",
      subtitle: "Payments received",
    },
    {
      title: "Outstanding",
      value: formatCurrency(summary.outstanding),
      icon: Wallet,
      color: "bg-orange-50 text-orange-600",
      subtitle: "Remaining amount",
    },
  ];

  const paymentProgress = summary.totalPurchases
    ? Math.min(
        100,
        Math.max(0, (summary.totalPaid / summary.totalPurchases) * 100),
      )
    : 0;

  const latestSale = customerSales[0];

  const handlePrintHistory = () => {
    const printWindow = window.open("", "_blank", "width=1000,height=800");

    if (!printWindow) {
      alert("Please allow pop-ups to print customer history.");
      return;
    }

    const invoicesHTML = customerSales
      .map((sale, index) => {
        const items = Array.isArray(sale.items) ? sale.items : [];

        const itemsHTML = items
          .map(
            (item) => `
              <tr>
                <td>${escapeHTML(item.name || "Product")}</td>
                <td>${escapeHTML(item.category || "-")}</td>
                <td>${Number(item.quantity || 0)}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>
                  ${formatCurrency(
                    item.total ??
                      Number(item.price || 0) * Number(item.quantity || 0),
                  )}
                </td>
              </tr>
            `,
          )
          .join("");

        return `
          <section class="invoice">
            <div class="invoice-header">
              <div>
                <h3>
                  Invoice #${escapeHTML(
                    sale.invoiceNumber || `Order ${index + 1}`,
                  )}
                </h3>
                <p>
                  ${escapeHTML(formatDateTime(sale.saleDate || sale.createdAt))}
                </p>
              </div>

              <strong class="status">
                ${Number(sale.balance || 0) > 0 ? "Payment Pending" : "Paid"}
              </strong>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                ${
                  itemsHTML ||
                  `<tr><td colspan="5">No product details available</td></tr>`
                }
              </tbody>
            </table>

            <div class="totals">
              <p>Subtotal <strong>${formatCurrency(sale.subtotal)}</strong></p>
              <p>Discount <strong>${formatCurrency(sale.discount)}</strong></p>
              <p>Grand Total <strong>${formatCurrency(sale.grandTotal)}</strong></p>
              <p>Paid <strong>${formatCurrency(sale.paid)}</strong></p>
              <p>Balance <strong>${formatCurrency(sale.balance)}</strong></p>
              <p>Payment Method <strong>${escapeHTML(sale.paymentMethod || "N/A")}</strong></p>
            </div>
          </section>
        `;
      })
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Purchase History - ${escapeHTML(customer.name)}</title>

          <style>
            * { box-sizing: border-box; }

            body {
              font-family: Arial, sans-serif;
              color: #1e293b;
              padding: 25px;
              margin: 0;
            }

            .header {
              display: flex;
              justify-content: space-between;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 18px;
              margin-bottom: 20px;
            }

            h1 { margin: 0; font-size: 24px; }
            h2 { font-size: 18px; }
            h3 { margin: 0; font-size: 16px; }
            p { margin: 7px 0; font-size: 12px; }

            .customer-info {
              padding: 18px;
              background: #f8fafc;
              border-radius: 10px;
            }

            .summary {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              margin: 20px 0;
            }

            .summary-card {
              padding: 15px;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
            }

            .summary-card strong {
              display: block;
              margin-top: 8px;
              font-size: 16px;
            }

            .invoice {
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              padding: 18px;
              margin-top: 20px;
              page-break-inside: avoid;
            }

            .invoice-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 15px;
            }

            .status {
              color: #15803d;
              font-size: 12px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            th, td {
              border: 1px solid #e2e8f0;
              padding: 9px;
              text-align: left;
              font-size: 12px;
            }

            th { background: #f1f5f9; }

            .totals {
              width: 260px;
              margin: 15px 0 0 auto;
            }

            .totals p {
              display: flex;
              justify-content: space-between;
              gap: 10px;
            }

            .footer {
              text-align: center;
              margin-top: 30px;
              color: #64748b;
              font-size: 11px;
            }

            @media print {
              body { padding: 10px; }
              .invoice { page-break-inside: avoid; }
            }
          </style>
        </head>

        <body>
          <div class="header">
            <div>
              <h1>Customer Purchase History</h1>
              <p>Complete purchase report</p>
            </div>

            <div>
              <strong>Generated On</strong>
              <p>${escapeHTML(formatDateTime(new Date()))}</p>
            </div>
          </div>

          <div class="customer-info">
            <h2>Customer Information</h2>

            <p><strong>Name:</strong> ${escapeHTML(customer.name)}</p>

            ${
              customer.phone?.trim()
                ? `<p><strong>Phone:</strong> ${escapeHTML(customer.phone)}</p>`
                : ""
            }

            ${
              customer.email?.trim()
                ? `<p><strong>Email:</strong> ${escapeHTML(customer.email)}</p>`
                : ""
            }

            ${
              customer.address?.trim()
                ? `<p><strong>Address:</strong> ${escapeHTML(customer.address)}</p>`
                : ""
            }
          </div>

          <div class="summary">
            <div class="summary-card">
              Total Orders
              <strong>${summary.totalOrders}</strong>
            </div>

            <div class="summary-card">
              Total Purchases
              <strong>${formatCurrency(summary.totalPurchases)}</strong>
            </div>

            <div class="summary-card">
              Total Paid
              <strong>${formatCurrency(summary.totalPaid)}</strong>
            </div>

            <div class="summary-card">
              Outstanding
              <strong>${formatCurrency(summary.outstanding)}</strong>
            </div>
          </div>

          <h2>Purchase Invoices</h2>

          ${invoicesHTML || "<p>No purchase history available.</p>"}

          <div class="footer">
            Customer Purchase History Report
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen space-y-7 rounded-3xl bg-gradient-to-br from-sky-50 via-white to-indigo-50/70 p-3 pb-10 sm:p-5"
    >
      {/* PAGE HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-white text-sky-700 shadow-sm transition hover:border-sky-400 hover:bg-sky-100 hover:text-sky-800"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
              <span>Customers</span>
              <ChevronRight size={13} />
              <span className="text-slate-500">Customer Profile</span>
            </div>

            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
              Customer Details
            </h1>
          </div>
        </div>

        <button
          onClick={handlePrintHistory}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:from-indigo-700 hover:to-blue-700"
        >
          <Printer size={17} />
          Print Purchase History
        </button>
      </div>

      {/* CUSTOMER PROFILE HERO */}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
        <div className="relative overflow-hidden bg-gradient-to-r from-[#E0F2FE] via-[#D6EDFF] to-[#BAE6FD] px-6 py-8 sm:px-8">
          <div className="absolute -right-16 -top-28 h-72 w-72 rounded-full border-[35px] border-white/30" />
          <div className="absolute -bottom-36 right-1/3 h-72 w-72 rounded-full border-[35px] border-white/30" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/70 px-3 py-1.5 text-xs font-bold text-sky-900 shadow-sm">
                <UserRound size={14} />
                Customer Profile
              </span>

              <p className="mt-4 text-sm font-medium text-slate-600">
                Customer ID
              </p>

              <p className="mt-1 text-sm font-bold text-slate-900">
                #{customer.id || "N/A"}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white/75 px-4 py-3 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <CheckCircle2 size={15} className="text-emerald-600" />
                Registered Customer
              </div>

              <p className="mt-1 text-xs font-medium text-slate-600">
                Customer account active
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pt-9 pb-6 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border-4 border-white bg-gradient-to-br from-sky-100 to-indigo-100 text-3xl font-black text-indigo-700 shadow-xl">
              {customer.name?.charAt(0)?.toUpperCase() || "C"}
            </div>

            <div className="min-w-0 pb-1">
              <h2 className="break-words text-2xl font-bold text-slate-900">
                {customer.name}
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-500">
                Customer since {formatDate(customer.createdAt)}
              </p>
            </div>
          </div>

          {/* CONTACT INFORMATION */}

          {(customer.phone?.trim() ||
            customer.email?.trim() ||
            customer.address?.trim()) && (
            <div className="mt-7 grid grid-cols-1 gap-3 border-t border-slate-100 pt-6 md:grid-cols-3">
              {customer.phone?.trim() && (
                <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                    <Phone size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Phone Number
                    </p>

                    <p className="mt-1 break-all text-sm font-semibold text-slate-700">
                      {customer.phone}
                    </p>
                  </div>
                </div>
              )}

              {customer.email?.trim() && (
                <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                    <Mail size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Email Address
                    </p>

                    <p className="mt-1 break-all text-sm font-semibold text-slate-700">
                      {customer.email}
                    </p>
                  </div>
                </div>
              )}

              {customer.address?.trim() && (
                <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <MapPin size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Address
                    </p>

                    <p className="mt-1 break-words text-sm font-semibold text-slate-700">
                      {customer.address}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CUSTOMER STATISTICS */}

      <div>
        <div className="mb-4">
          <h2 className="font-bold text-slate-800">Purchase Statistics</h2>

          <p className="mt-1 text-xs text-slate-500">
            Overview of this customer's transactions
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {detailStats.map((item, index) => (
            <StatCard key={item.title} item={item} index={index} />
          ))}
        </div>
      </div>

      {/* PURCHASE OVERVIEW + LAST ACTIVITY */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* PURCHASE OVERVIEW */}

        <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-[0_10px_30px_rgba(49,46,129,0.07)] sm:p-7 xl:col-span-2">
          <SectionHeading
            icon={TrendingUp}
            title="Purchase Overview"
            subtitle="Customer purchasing and payment performance"
          />

          <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50 to-indigo-50/50 p-4">
              <p className="text-xs font-medium text-slate-500">
                Average Order Value
              </p>

              <h3 className="mt-2 break-words text-xl font-bold text-slate-800">
                {formatCurrency(
                  summary.totalOrders
                    ? summary.totalPurchases / summary.totalOrders
                    : 0,
                )}
              </h3>
            </div>

            <div className="rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50 to-indigo-50/50 p-4">
              <p className="text-xs font-medium text-slate-500">
                Items Purchased
              </p>

              <h3 className="mt-2 text-xl font-bold text-slate-800">
                {summary.totalItems}
              </h3>
            </div>

            <div className="rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50 to-indigo-50/50 p-4">
              <p className="text-xs font-medium text-slate-500">
                Last Purchase
              </p>

              <h3 className="mt-2 text-base font-bold text-slate-800">
                {formatDate(summary.lastPurchase)}
              </h3>
            </div>
          </div>

          {/* PAYMENT PROGRESS */}

          <div className="mt-7 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Payment Progress
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Total amount paid against purchases
                </p>
              </div>

              <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-600">
                {paymentProgress.toFixed(1)}%
              </span>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${paymentProgress}%` }}
                transition={{ duration: 0.8 }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <p className="text-xs text-slate-500">Paid Amount</p>
                </div>

                <p className="mt-1 text-sm font-bold text-emerald-600">
                  {formatCurrency(summary.totalPaid)}
                </p>
              </div>

              <div className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <p className="text-xs text-slate-500">Remaining Balance</p>
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                </div>

                <p className="mt-1 text-sm font-bold text-orange-600">
                  {formatCurrency(summary.outstanding)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* LAST ACTIVITY */}

        <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-[0_10px_30px_rgba(49,46,129,0.07)]">
          <div className="border-b border-slate-100 p-5">
            <SectionHeading
              icon={Clock}
              title="Last Activity"
              subtitle="Most recent transaction"
            />
          </div>

          {latestSale ? (
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <Receipt size={22} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Latest Invoice</p>

                  <h3 className="mt-1 truncate font-bold text-slate-800">
                    #{latestSale.invoiceNumber || "N/A"}
                  </h3>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">Date</span>

                  <span className="text-right text-xs font-semibold text-slate-700">
                    {formatDateTime(
                      latestSale.saleDate || latestSale.createdAt,
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">Payment Status</span>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      Number(latestSale.balance || 0) > 0
                        ? "bg-orange-50 text-orange-600"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {Number(latestSale.balance || 0) > 0 ? "Pending" : "Paid"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">Payment Method</span>

                  <span className="text-xs font-semibold text-slate-700">
                    {latestSale.paymentMethod || "N/A"}
                  </span>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 p-5 text-white">
                <p className="text-xs font-medium text-blue-100">
                  Latest Invoice Amount
                </p>

                <h3 className="mt-2 break-words text-2xl font-bold">
                  {formatCurrency(latestSale.grandTotal)}
                </h3>

                <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-3">
                  <span className="text-xs text-blue-100">Outstanding</span>

                  <span className="text-sm font-bold">
                    {formatCurrency(latestSale.balance)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[280px] flex-col items-center justify-center p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <ShoppingBag size={25} />
              </div>

              <h3 className="mt-4 font-bold text-slate-700">No Activity Yet</h3>

              <p className="mt-1 text-sm text-slate-500">
                This customer has not made any purchases.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* PURCHASE HISTORY */}

      <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-[0_10px_30px_rgba(49,46,129,0.07)]">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <SectionHeading
            icon={FileText}
            title="Purchase History"
            subtitle="Complete record of customer invoices and purchased products"
            action={
              <span className="flex w-fit items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600">
                <Receipt size={15} />
                {customerSales.length} Invoices
              </span>
            }
          />
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          {customerSales.map((sale, index) => {
            const items = Array.isArray(sale.items) ? sale.items : [];
            const itemSubtotal = items.reduce(
              (sum, item) =>
                sum +
                Number(
                  item.total ??
                    Number(item.price || 0) * Number(item.quantity || 0),
                ),
              0,
            );
            const subtotal = Number(sale.subtotal ?? itemSubtotal);
            const discount = Number(sale.discount || 0);
            const grandTotal = Number(sale.grandTotal ?? subtotal - discount);
            const paid = Number(sale.paid || 0);
            const balance = Number(
              sale.balance ?? Math.max(grandTotal - paid, 0),
            );
            const hasBalance = balance > 0;
            const isAlternate = index % 2 === 1;
            const theme = isAlternate
              ? {
                  accent: "text-orange-700",
                  border: "border-orange-200",
                  rail: "bg-orange-500",
                  soft: "bg-orange-50",
                  badge: "bg-orange-100 text-orange-800",
                  header: "from-orange-50 via-amber-50 to-white",
                  tableHead: "bg-orange-50 text-orange-900",
                  rowHover: "hover:bg-orange-50/60",
                  divider: "border-orange-100",
                  totalBox: "bg-orange-50/80",
                  totalText: "text-orange-800",
                }
              : {
                  accent: "text-blue-700",
                  border: "border-blue-200",
                  rail: "bg-blue-600",
                  soft: "bg-blue-50",
                  badge: "bg-blue-100 text-blue-800",
                  header: "from-blue-50 via-sky-50 to-white",
                  tableHead: "bg-blue-50 text-blue-900",
                  rowHover: "hover:bg-blue-50/60",
                  divider: "border-blue-100",
                  totalBox: "bg-blue-50/80",
                  totalText: "text-blue-800",
                };

            return (
              <motion.div
                key={sale.id || sale.invoiceNumber || index}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.045 }}
                className="relative pl-4 sm:pl-6"
              >
                {/* Timeline marker: makes every purchase look like a separate record */}
                <div
                  className={`absolute bottom-0 left-0 top-0 w-1 rounded-full ${theme.rail}`}
                />
                <div
                  className={`absolute left-[-7px] top-7 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white text-xs font-black text-white shadow-md ${theme.rail}`}
                >
                  {customerSales.length - index}
                </div>

                <div
                  className={`overflow-hidden rounded-2xl border ${theme.border} bg-white shadow-[0_5px_20px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(15,23,42,0.10)]`}
                >
                  {/* Distinct invoice heading */}
                  <div
                    className={`border-b ${theme.divider} bg-gradient-to-r ${theme.header} p-4 sm:p-5`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl ${theme.badge}`}
                        >
                          <Receipt size={19} />
                          <span className="mt-0.5 text-[9px] font-black">
                            #{customerSales.length - index}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-md px-2 py-1 text-[10px] font-extrabold uppercase tracking-widest ${theme.badge}`}
                            >
                              Purchase Record
                            </span>
                            <span className="text-xs font-semibold text-slate-400">
                              {formatDate(sale.saleDate || sale.createdAt)}
                            </span>
                          </div>
                          <h3 className="mt-1 truncate text-base font-extrabold text-slate-800 sm:text-lg">
                            Invoice #{sale.invoiceNumber || "N/A"}
                          </h3>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                            <Clock size={12} />
                            {formatDateTime(sale.saleDate || sale.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 rounded-xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm sm:min-w-[190px] sm:justify-end">
                        <div className="sm:text-right">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Invoice Total
                          </p>
                          <p
                            className={`mt-0.5 text-xl font-black tracking-tight ${theme.accent}`}
                          >
                            {formatCurrency(grandTotal)}
                          </p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[10px] font-extrabold ${hasBalance ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}
                        >
                          {hasBalance ? (
                            <AlertCircle size={12} />
                          ) : (
                            <CheckCircle2 size={12} />
                          )}
                          {hasBalance ? "Due" : "Paid"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Product details */}
                  <div className="p-4 sm:p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                        Purchased Items
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${theme.badge}`}
                      >
                        {items.length} {items.length === 1 ? "Item" : "Items"}
                      </span>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-slate-100">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[520px] text-left">
                          <thead
                            className={`text-[10px] font-extrabold uppercase tracking-wider ${theme.tableHead}`}
                          >
                            <tr>
                              <th className="px-4 py-3">
                                Product / Description
                              </th>
                              <th className="px-4 py-3 text-center">Qty</th>
                              <th className="px-4 py-3 text-right">
                                Unit Price
                              </th>
                              <th className="px-4 py-3 text-right">
                                Line Total
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {items.map((item, itemIndex) => {
                              const quantity = Number(item.quantity || 0);
                              const unitPrice = Number(item.price || 0);
                              const lineTotal = Number(
                                item.total ?? unitPrice * quantity,
                              );
                              return (
                                <tr
                                  key={item.id || itemIndex}
                                  className={`transition ${theme.rowHover}`}
                                >
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2.5">
                                      <div
                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${theme.badge}`}
                                      >
                                        <Package size={15} />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-slate-700">
                                          {item.name || "Product"}
                                        </p>
                                        {(item.category || item.size) && (
                                          <p className="mt-0.5 text-[11px] text-slate-400">
                                            {item.category || item.size}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="inline-flex min-w-8 justify-center rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                                      {quantity}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right text-xs font-medium text-slate-600">
                                    {formatCurrency(unitPrice)}
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm font-extrabold text-slate-800">
                                    {formatCurrency(lineTotal)}
                                  </td>
                                </tr>
                              );
                            })}
                            {items.length === 0 && (
                              <tr>
                                <td
                                  colSpan="4"
                                  className="px-4 py-8 text-center text-sm text-slate-400"
                                >
                                  No product details available for this invoice.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Financial breakdown */}
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Subtotal
                        </p>
                        <p className="mt-1 text-sm font-extrabold text-slate-700">
                          {formatCurrency(subtotal)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Discount
                        </p>
                        <p className="mt-1 text-sm font-extrabold text-slate-700">
                          {formatCurrency(discount)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                          Paid Amount
                        </p>
                        <p className="mt-1 text-sm font-extrabold text-emerald-700">
                          {formatCurrency(paid)}
                        </p>
                      </div>
                      <div
                        className={`rounded-xl border p-3 ${hasBalance ? "border-rose-100 bg-rose-50/70" : "border-emerald-100 bg-emerald-50/70"}`}
                      >
                        <p
                          className={`text-[10px] font-bold uppercase tracking-wide ${hasBalance ? "text-rose-600" : "text-emerald-600"}`}
                        >
                          Remaining
                        </p>
                        <p
                          className={`mt-1 text-sm font-extrabold ${hasBalance ? "text-rose-700" : "text-emerald-700"}`}
                        >
                          {formatCurrency(balance)}
                        </p>
                      </div>
                    </div>

                    {/* Payment details footer */}
                    <div
                      className={`mt-4 flex flex-col gap-2 border-t ${theme.divider} pt-4 sm:flex-row sm:items-center sm:justify-between`}
                    >
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <CreditCard size={14} className={theme.accent} />{" "}
                          Payment:{" "}
                          <strong className="text-slate-700">
                            {sale.paymentMethod || "N/A"}
                          </strong>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Package size={14} className={theme.accent} /> Total
                          Qty:{" "}
                          <strong className="text-slate-700">
                            {items.reduce(
                              (sum, item) => sum + Number(item.quantity || 0),
                              0,
                            )}
                          </strong>
                        </span>
                      </div>
                      <div
                        className={`flex items-center justify-between gap-4 rounded-lg px-3 py-2 ${theme.soft}`}
                      >
                        <span className="text-xs font-bold text-slate-600">
                          Grand Total
                        </span>
                        <span
                          className={`text-base font-black ${theme.accent}`}
                        >
                          {formatCurrency(grandTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {/* EMPTY HISTORY */}

          {customerSales.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <ShoppingBag size={28} />
              </div>

              <h3 className="mt-4 font-bold text-slate-700">
                No Purchase History
              </h3>

              <p className="mt-1 max-w-sm text-sm text-slate-500">
                This customer has not made any purchases yet. Their invoices
                will appear here after a sale.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default CustomerDetails;
