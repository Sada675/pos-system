import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useCustomers } from "../context/CustomersContext";
import { useSales } from "../context/SalesContext";

import {
  Search,
  Users,
  User,
  Phone,
  ShoppingBag,
  Receipt,
  Wallet,
  CreditCard,
  Banknote,
  CalendarDays,
  ArrowLeft,
  Printer,
  Package,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  CircleDollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  Hash,
  ShoppingCart,
} from "lucide-react";

// ==================================================
// HELPERS
// ==================================================

const formatCurrency = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK", {
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
  let value = String(phone || "").replace(/[\s()-]/g, "");

  if (value.startsWith("+92")) {
    value = "0" + value.slice(3);
  } else if (value.startsWith("0092")) {
    value = "0" + value.slice(4);
  } else if (value.startsWith("92")) {
    value = "0" + value.slice(2);
  }

  return value;
};

const escapeHTML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });

// ==================================================
// SALE CALCULATIONS
// ==================================================

const getSaleTotal = (sale) => {
  if (sale.grandTotal !== undefined && sale.grandTotal !== null) {
    return Number(sale.grandTotal) || 0;
  }

  if (sale.total !== undefined && sale.total !== null) {
    return Number(sale.total) || 0;
  }

  if (sale.subtotal !== undefined && sale.subtotal !== null) {
    return Math.max(
      0,
      (Number(sale.subtotal) || 0) - (Number(sale.discount) || 0),
    );
  }

  return (sale.items || []).reduce(
    (total, item) =>
      total +
      (Number(item.total) ||
        Number(item.price || 0) * Number(item.quantity || 0)),
    0,
  );
};

const getSalePaid = (sale) => {
  if (sale.paid !== undefined && sale.paid !== null) {
    return Number(sale.paid) || 0;
  }

  return 0;
};

const getSaleBalance = (sale) => {
  if (sale.balance !== undefined && sale.balance !== null) {
    return Number(sale.balance) || 0;
  }

  return Math.max(getSaleTotal(sale) - getSalePaid(sale), 0);
};

const getSaleQuantity = (sale) =>
  (sale.items || []).reduce(
    (total, item) => total + (Number(item.quantity) || 0),
    0,
  );

// ==================================================
// PAYMENT STATUS
// ==================================================

const getPaymentStatus = (sale) => {
  if (sale.paymentStatus) return sale.paymentStatus;

  const balance = getSaleBalance(sale);
  const paid = getSalePaid(sale);

  if (balance <= 0) return "Paid";
  if (paid > 0) return "Partial";

  return "Unpaid";
};

const getStatusStyles = (status) => {
  switch (String(status || "").toLowerCase()) {
    case "paid":
      return "bg-green-50 text-green-700 border-green-100";

    case "partial":
      return "bg-amber-50 text-amber-700 border-amber-100";

    case "unpaid":
      return "bg-red-50 text-red-700 border-red-100";

    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
};

const getStatusIcon = (status) => {
  switch (String(status || "").toLowerCase()) {
    case "paid":
      return CheckCircle2;

    case "partial":
      return AlertCircle;

    case "unpaid":
      return XCircle;

    default:
      return Clock;
  }
};

// ==================================================
// CUSTOMER MATCHING
// ==================================================

const isSameCustomer = (customer, sale) => {
  const customerPhone = normalizePhone(customer.phone);
  const salePhone = normalizePhone(sale.customerPhone);

  // Phone number is the primary identifier.
  if (customerPhone && salePhone) {
    return customerPhone === salePhone;
  }

  // Fallback to name only when both phone numbers are missing.
  if (!customerPhone && !salePhone) {
    const customerName = String(customer.name || "")
      .trim()
      .toLowerCase();

    const saleName = String(sale.customerName || "")
      .trim()
      .toLowerCase();

    return Boolean(customerName && saleName && customerName === saleName);
  }

  return false;
};

// ==================================================
// PRINT CUSTOMER HISTORY
// ==================================================

const printCustomerHistory = (customer, customerSales, summary) => {
  const printWindow = window.open("", "_blank", "width=1000,height=750");

  if (!printWindow) {
    alert("Please allow pop-ups to print customer history.");
    return;
  }

  const purchaseRows = customerSales
    .map((sale) => {
      const products = (sale.items || [])
        .map(
          (item) => `
            <div class="product-item">
              <strong>${escapeHTML(item.name)}</strong>
              <span>
                ${escapeHTML(item.quantity)} ${escapeHTML(item.unit || "")}
                × ${formatCurrency(item.price)}
              </span>
            </div>
          `,
        )
        .join("");

      return `
        <section class="invoice">
          <div class="invoice-header">
            <div>
              <h3>Invoice #${escapeHTML(sale.invoiceNumber || sale.id)}</h3>
              <p>${escapeHTML(formatDateTime(sale.saleDate))}</p>
            </div>

            <span class="status">
              ${escapeHTML(getPaymentStatus(sale))}
            </span>
          </div>

          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              ${(sale.items || [])
                .map(
                  (item) => `
                    <tr>
                      <td>${escapeHTML(item.name)}</td>
                      <td>
                        ${escapeHTML(item.quantity)}
                        ${escapeHTML(item.unit || "")}
                      </td>
                      <td>${formatCurrency(item.price)}</td>
                      <td>
                        ${formatCurrency(
                          item.total ??
                            Number(item.price || 0) *
                              Number(item.quantity || 0),
                        )}
                      </td>
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>

          <div class="invoice-totals">
            <div>
              <span>Subtotal</span>
              <strong>${formatCurrency(sale.subtotal)}</strong>
            </div>

            <div>
              <span>Discount</span>
              <strong>${formatCurrency(sale.discount)}</strong>
            </div>

            <div>
              <span>Grand Total</span>
              <strong>${formatCurrency(getSaleTotal(sale))}</strong>
            </div>

            <div>
              <span>Amount Received</span>
              <strong>
                ${formatCurrency(sale.amountReceived ?? sale.paid)}
              </strong>
            </div>

            <div>
              <span>Amount Applied</span>
              <strong>${formatCurrency(getSalePaid(sale))}</strong>
            </div>

            <div>
              <span>Remaining Balance</span>
              <strong>${formatCurrency(getSaleBalance(sale))}</strong>
            </div>

            <div>
              <span>Payment Method</span>
              <strong>${escapeHTML(sale.paymentMethod || "N/A")}</strong>
            </div>
          </div>
        </section>
      `;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Customer Purchase History</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            color: #1e293b;
            padding: 30px;
            background: white;
          }

          .header {
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          h1 {
            margin: 0;
            color: #2563eb;
          }

          .subtitle {
            color: #64748b;
            margin-top: 6px;
          }

          .customer-info {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 20px;
            border-radius: 10px;
            margin: 25px 0;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }

          .stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 30px;
          }

          .stat {
            padding: 15px;
            background: #eff6ff;
            border-radius: 8px;
          }

          .stat span {
            display: block;
            color: #64748b;
            font-size: 12px;
          }

          .stat strong {
            display: block;
            margin-top: 8px;
            font-size: 17px;
          }

          .invoice {
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 22px;
            page-break-inside: avoid;
          }

          .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
          }

          .invoice-header h3 {
            margin: 0;
          }

          .invoice-header p {
            color: #64748b;
            font-size: 12px;
          }

          .status {
            background: #dcfce7;
            color: #15803d;
            padding: 7px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th, td {
            border-bottom: 1px solid #e2e8f0;
            padding: 10px;
            text-align: left;
            font-size: 13px;
          }

          th {
            background: #f8fafc;
          }

          .invoice-totals {
            max-width: 350px;
            margin: 20px 0 0 auto;
          }

          .invoice-totals div {
            display: flex;
            justify-content: space-between;
            padding: 7px 0;
            font-size: 13px;
          }

          .footer {
            text-align: center;
            border-top: 1px solid #e2e8f0;
            margin-top: 35px;
            padding-top: 20px;
            color: #64748b;
          }

          @media print {
            body {
              padding: 10px;
            }

            .invoice {
              break-inside: avoid;
            }
          }
        </style>
      </head>

      <body>
        <div class="header">
          <div>
            <h1>STEEL STORE</h1>
            <p class="subtitle">Customer Purchase History</p>
          </div>

          <div>
            <strong>Generated:</strong>
            <p>${escapeHTML(formatDateTime(new Date()))}</p>
          </div>
        </div>

        <div class="customer-info">
          <div>
            <strong>Customer Name</strong>
            <p>${escapeHTML(customer.name)}</p>
          </div>

          <div>
            <strong>Phone Number</strong>
            <p>${escapeHTML(customer.phone || "N/A")}</p>
          </div>
        </div>

        <div class="stats">
          <div class="stat">
            <span>Total Orders</span>
            <strong>${summary.orders}</strong>
          </div>

          <div class="stat">
            <span>Total Spending</span>
            <strong>${formatCurrency(summary.spent)}</strong>
          </div>

          <div class="stat">
            <span>Total Paid</span>
            <strong>${formatCurrency(summary.paid)}</strong>
          </div>

          <div class="stat">
            <span>Outstanding</span>
            <strong>${formatCurrency(summary.balance)}</strong>
          </div>
        </div>

        <h2>Purchase History</h2>

        ${purchaseRows || "<p>No purchase history found.</p>"}

        <div class="footer">
          <h3>Thank You For Your Business!</h3>
          <p>Customer purchase record generated from POS sales.</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

// ==================================================
// CUSTOMER DETAIL PAGE
// ==================================================

function CustomerDetail({ customer, customerSales, onBack }) {
  const [expandedInvoices, setExpandedInvoices] = useState([]);

  const summary = useMemo(() => {
    return customerSales.reduce(
      (result, sale) => {
        result.orders += 1;
        result.spent += getSaleTotal(sale);
        result.paid += getSalePaid(sale);
        result.balance += getSaleBalance(sale);
        result.quantity += getSaleQuantity(sale);

        return result;
      },
      {
        orders: 0,
        spent: 0,
        paid: 0,
        balance: 0,
        quantity: 0,
      },
    );
  }, [customerSales]);

  const latestPurchase = customerSales[0];

  const toggleInvoice = (id) => {
    setExpandedInvoices((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* BACK AND HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
          >
            <ArrowLeft size={19} />
          </button>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Customer Management
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-800">
              Customer Details
            </h1>
          </div>
        </div>

        <button
          onClick={() => printCustomerHistory(customer, customerSales, summary)}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700"
        >
          <Printer size={18} />
          Print Purchase History
        </button>
      </div>

      {/* PROFILE HERO */}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-100 sm:p-8">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[35px] border-white/10" />

        <div className="absolute -bottom-24 right-40 h-52 w-52 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-white shadow-inner backdrop-blur-sm">
              <User size={38} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium text-blue-100">
                Customer Profile
              </p>

              <h2 className="mt-1 break-words text-2xl font-bold sm:text-3xl">
                {customer.name}
              </h2>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-blue-100">
                <span className="flex items-center gap-2">
                  <Phone size={15} />
                  {customer.phone || "Phone not provided"}
                </span>

                <span className="flex items-center gap-2">
                  <ShoppingBag size={15} />
                  {summary.orders} Purchases
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm sm:min-w-48">
            <p className="text-xs font-medium text-blue-100">Customer Since</p>

            <p className="mt-2 text-lg font-bold">
              {formatDate(
                customerSales.length
                  ? customerSales[customerSales.length - 1].saleDate
                  : customer.createdAt,
              )}
            </p>

            <p className="mt-2 text-xs text-blue-100">
              {latestPurchase
                ? `Last purchase: ${formatDate(latestPurchase.saleDate)}`
                : "No purchase recorded"}
            </p>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Total Purchases",
            value: summary.orders,
            subtitle: "Completed orders",
            icon: ShoppingBag,
            color: "blue",
          },
          {
            title: "Total Spending",
            value: formatCurrency(summary.spent),
            subtitle: "Total purchase value",
            icon: TrendingUp,
            color: "indigo",
          },
          {
            title: "Total Paid",
            value: formatCurrency(summary.paid),
            subtitle: "Amount applied",
            icon: Wallet,
            color: "green",
          },
          {
            title: "Outstanding Balance",
            value: formatCurrency(summary.balance),
            subtitle: "Remaining amount",
            icon: CircleDollarSign,
            color: "red",
          },
        ].map((card, index) => {
          const Icon = card.icon;

          const colorStyles = {
            blue: "bg-blue-50 text-blue-600",
            indigo: "bg-indigo-50 text-indigo-600",
            green: "bg-green-50 text-green-600",
            red: "bg-red-50 text-red-600",
          };

          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {card.title}
                  </p>

                  <h3 className="mt-3 break-words text-xl font-bold text-slate-800">
                    {card.value}
                  </h3>

                  <p className="mt-2 text-xs text-slate-400">{card.subtitle}</p>
                </div>

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colorStyles[card.color]}`}
                >
                  <Icon size={21} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ADDITIONAL INFORMATION */}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <User size={20} />
            </div>

            <div>
              <h3 className="font-bold text-slate-800">Customer Information</h3>

              <p className="text-xs text-slate-400">
                Information received from POS customer records
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-400">
                Customer Name
              </p>

              <p className="mt-2 font-semibold text-slate-800">
                {customer.name || "N/A"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-400">Phone Number</p>

              <p className="mt-2 font-semibold text-slate-800">
                {customer.phone || "N/A"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-400">
                Email Address
              </p>

              <p className="mt-2 break-all font-semibold text-slate-800">
                {customer.email || "N/A"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-400">Customer ID</p>

              <p className="mt-2 break-all font-semibold text-slate-800">
                {customer.id || "N/A"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <Receipt size={20} />
            </div>

            <div>
              <h3 className="font-bold text-slate-800">Purchase Overview</h3>

              <p className="text-xs text-slate-400">Customer activity</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Total Orders</span>
              <strong className="text-slate-800">{summary.orders}</strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Total Quantity</span>
              <strong className="text-slate-800">{summary.quantity}</strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Average Order</span>

              <strong className="text-slate-800">
                {formatCurrency(
                  summary.orders ? summary.spent / summary.orders : 0,
                )}
              </strong>
            </div>

            <div className="border-t border-dashed border-slate-200 pt-4">
              <p className="text-xs text-slate-400">Last Purchase</p>

              <p className="mt-2 font-semibold text-slate-800">
                {latestPurchase
                  ? formatDateTime(latestPurchase.saleDate)
                  : "No purchases yet"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PURCHASE HISTORY */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Receipt size={21} />
            </div>

            <div>
              <h2 className="font-bold text-slate-800">Purchase History</h2>

              <p className="text-xs text-slate-400">
                All invoices and products purchased by this customer
              </p>
            </div>
          </div>

          <span className="w-fit rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600">
            {customerSales.length} Invoices
          </span>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          {customerSales.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                <ShoppingCart size={30} />
              </div>

              <h3 className="mt-4 font-bold text-slate-700">
                No Purchase History
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                No POS sales have been recorded for this customer.
              </p>
            </div>
          ) : (
            customerSales.map((sale, index) => {
              const invoiceId = sale.id || sale.invoiceNumber || index;

              const isExpanded = expandedInvoices.includes(invoiceId);

              const status = getPaymentStatus(sale);
              const StatusIcon = getStatusIcon(status);

              return (
                <motion.div
                  key={invoiceId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.2) }}
                  className="overflow-hidden rounded-2xl border border-slate-200 transition hover:border-blue-200"
                >
                  {/* INVOICE HEADER */}

                  <button
                    type="button"
                    onClick={() => toggleInvoice(invoiceId)}
                    className="flex w-full flex-col gap-4 p-4 text-left transition hover:bg-slate-50/70 sm:p-5"
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <FileText size={21} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-800">
                              Invoice #{sale.invoiceNumber || sale.id || "N/A"}
                            </h3>

                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusStyles(status)}`}
                            >
                              <StatusIcon size={12} />
                              {status}
                            </span>
                          </div>

                          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                            <CalendarDays size={13} />
                            {formatDateTime(sale.saleDate)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <div className="sm:text-right">
                          <p className="text-xs text-slate-400">
                            Invoice Total
                          </p>

                          <p className="mt-1 text-lg font-bold text-blue-600">
                            {formatCurrency(getSaleTotal(sale))}
                          </p>
                        </div>

                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          {isExpanded ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-4">
                      <div>
                        <p className="text-[11px] text-slate-400">Products</p>

                        <p className="mt-1 text-sm font-bold text-slate-700">
                          {sale.items?.length || 0}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-slate-400">
                          Total Quantity
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-700">
                          {getSaleQuantity(sale)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-slate-400">
                          Amount Paid
                        </p>

                        <p className="mt-1 text-sm font-bold text-green-600">
                          {formatCurrency(getSalePaid(sale))}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-slate-400">Remaining</p>

                        <p className="mt-1 text-sm font-bold text-red-500">
                          {formatCurrency(getSaleBalance(sale))}
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* EXPANDED DETAILS */}

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-5 border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5">
                          {/* PRODUCTS */}

                          <div>
                            <div className="mb-3 flex items-center gap-2">
                              <Package size={17} className="text-blue-600" />

                              <h4 className="text-sm font-bold text-slate-800">
                                Purchased Products
                              </h4>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                              <table className="w-full min-w-[560px] text-left text-sm">
                                <thead>
                                  <tr className="bg-slate-50 text-xs text-slate-500">
                                    <th className="px-4 py-3 font-semibold">
                                      Product
                                    </th>

                                    <th className="px-4 py-3 font-semibold">
                                      Size
                                    </th>

                                    <th className="px-4 py-3 font-semibold">
                                      Quantity
                                    </th>

                                    <th className="px-4 py-3 font-semibold">
                                      Unit Price
                                    </th>

                                    <th className="px-4 py-3 text-right font-semibold">
                                      Total
                                    </th>
                                  </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                  {(sale.items || []).map((item, itemIndex) => (
                                    <tr key={`${item.id}-${itemIndex}`}>
                                      <td className="px-4 py-3 font-semibold text-slate-700">
                                        {item.name || "N/A"}
                                      </td>

                                      <td className="px-4 py-3 text-slate-500">
                                        {item.size || "N/A"}
                                      </td>

                                      <td className="px-4 py-3 text-slate-600">
                                        {item.quantity} {item.unit || ""}
                                      </td>

                                      <td className="px-4 py-3 text-slate-600">
                                        {formatCurrency(item.price)}
                                      </td>

                                      <td className="px-4 py-3 text-right font-bold text-slate-800">
                                        {formatCurrency(
                                          item.total ??
                                            Number(item.price || 0) *
                                              Number(item.quantity || 0),
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* PAYMENT DETAILS */}

                          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                              <div className="mb-4 flex items-center gap-2">
                                <Wallet size={17} className="text-blue-600" />

                                <h4 className="text-sm font-bold text-slate-800">
                                  Payment Details
                                </h4>
                              </div>

                              <div className="space-y-3">
                                <div className="flex justify-between gap-3 text-sm">
                                  <span className="text-slate-500">
                                    Payment Method
                                  </span>

                                  <strong className="text-slate-800">
                                    {sale.paymentMethod || "N/A"}
                                  </strong>
                                </div>

                                <div className="flex justify-between gap-3 text-sm">
                                  <span className="text-slate-500">
                                    Payment Status
                                  </span>

                                  <strong
                                    className={
                                      status === "Paid"
                                        ? "text-green-600"
                                        : status === "Partial"
                                          ? "text-amber-600"
                                          : "text-red-600"
                                    }
                                  >
                                    {status}
                                  </strong>
                                </div>

                                <div className="flex justify-between gap-3 text-sm">
                                  <span className="text-slate-500">
                                    Amount Received
                                  </span>

                                  <strong className="text-green-600">
                                    {formatCurrency(
                                      sale.amountReceived ?? sale.paid,
                                    )}
                                  </strong>
                                </div>

                                <div className="flex justify-between gap-3 text-sm">
                                  <span className="text-slate-500">
                                    Amount Applied
                                  </span>

                                  <strong className="text-slate-800">
                                    {formatCurrency(getSalePaid(sale))}
                                  </strong>
                                </div>

                                <div className="flex justify-between gap-3 text-sm">
                                  <span className="text-slate-500">
                                    Change Returned
                                  </span>

                                  <strong className="text-blue-600">
                                    {formatCurrency(sale.changeReturned)}
                                  </strong>
                                </div>
                              </div>
                            </div>

                            {/* BILL SUMMARY */}

                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                              <div className="mb-4 flex items-center gap-2">
                                <Receipt size={17} className="text-blue-600" />

                                <h4 className="text-sm font-bold text-slate-800">
                                  Invoice Summary
                                </h4>
                              </div>

                              <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-500">
                                    Subtotal
                                  </span>

                                  <strong className="text-slate-700">
                                    {formatCurrency(sale.subtotal)}
                                  </strong>
                                </div>

                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-500">
                                    Discount
                                  </span>

                                  <strong className="text-red-500">
                                    - {formatCurrency(sale.discount)}
                                  </strong>
                                </div>

                                <div className="flex justify-between border-t border-dashed border-slate-200 pt-3">
                                  <span className="font-bold text-slate-800">
                                    Grand Total
                                  </span>

                                  <strong className="text-lg text-blue-600">
                                    {formatCurrency(getSaleTotal(sale))}
                                  </strong>
                                </div>

                                <div className="flex justify-between rounded-lg bg-red-50 px-3 py-2.5">
                                  <span className="text-sm font-medium text-red-700">
                                    Remaining Balance
                                  </span>

                                  <strong className="text-red-600">
                                    {formatCurrency(getSaleBalance(sale))}
                                  </strong>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* INVOICE FOOTER */}

                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <Hash size={13} />
                              Invoice: {sale.invoiceNumber || sale.id}
                            </span>

                            <span>
                              Sale Date: {formatDateTime(sale.saleDate)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ==================================================
// MAIN CUSTOMERS COMPONENT
// ==================================================

function Customers() {
  const { customers = [] } = useCustomers();
  const { sales = [] } = useSales();

  const [search, setSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  // ==================================================
  // CUSTOMER DATA FROM POS
  // ==================================================

  const customerRecords = useMemo(() => {
    const records = [];

    // First receive the customer records saved by POS.
    customers.forEach((customer) => {
      if (!customer?.name) return;

      const existingIndex = records.findIndex(
        (record) =>
          record.phone &&
          normalizePhone(record.phone) === normalizePhone(customer.phone),
      );

      if (existingIndex >= 0) {
        records[existingIndex] = {
          ...records[existingIndex],
          ...customer,
          phone: customer.phone || records[existingIndex].phone,
        };
      } else {
        records.push({ ...customer });
      }
    });

    // Add a customer from POS sales only if their record is not already present.
    // This also supports older sales that may not have a customer record.
    sales.forEach((sale) => {
      if (!sale.customerName) return;

      const existing = records.some((customer) =>
        isSameCustomer(customer, sale),
      );

      if (!existing) {
        records.push({
          id: `sale-customer-${sale.id || sale.invoiceNumber}`,
          name: sale.customerName,
          phone: sale.customerPhone || "",
        });
      }
    });

    return records;
  }, [customers, sales]);

  // ==================================================
  // CUSTOMER PURCHASE HISTORY
  // ==================================================

  const getCustomerSales = (customer) => {
    return sales
      .filter((sale) => isSameCustomer(customer, sale))
      .sort(
        (a, b) =>
          new Date(b.saleDate || b.createdAt || 0) -
          new Date(a.saleDate || a.createdAt || 0),
      );
  };

  // ==================================================
  // CUSTOMER SUMMARY
  // ==================================================

  const customersWithSummary = useMemo(() => {
    return customerRecords
      .map((customer) => {
        const customerSales = sales
          .filter((sale) => isSameCustomer(customer, sale))
          .sort(
            (a, b) =>
              new Date(b.saleDate || b.createdAt || 0) -
              new Date(a.saleDate || a.createdAt || 0),
          );

        const summary = customerSales.reduce(
          (result, sale) => {
            result.orders += 1;
            result.spent += getSaleTotal(sale);
            result.paid += getSalePaid(sale);
            result.balance += getSaleBalance(sale);

            return result;
          },
          {
            orders: 0,
            spent: 0,
            paid: 0,
            balance: 0,
          },
        );

        return {
          ...customer,
          ...summary,
          latestPurchase: customerSales[0]?.saleDate || null,
          customerSales,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.latestPurchase || b.createdAt || 0) -
          new Date(a.latestPurchase || a.createdAt || 0),
      );
  }, [customerRecords, sales]);

  // ==================================================
  // SEARCH
  // ==================================================

  const filteredCustomers = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) return customersWithSummary;

    return customersWithSummary.filter((customer) => {
      return (
        String(customer.name || "")
          .toLowerCase()
          .includes(searchText) ||
        String(customer.phone || "")
          .toLowerCase()
          .includes(searchText) ||
        String(customer.email || "")
          .toLowerCase()
          .includes(searchText)
      );
    });
  }, [customersWithSummary, search]);

  // ==================================================
  // DASHBOARD SUMMARY
  // ==================================================

  const dashboardSummary = useMemo(() => {
    return customersWithSummary.reduce(
      (result, customer) => {
        result.customers += 1;
        result.orders += customer.orders;
        result.spent += customer.spent;
        result.balance += customer.balance;

        return result;
      },
      {
        customers: 0,
        orders: 0,
        spent: 0,
        balance: 0,
      },
    );
  }, [customersWithSummary]);

  // ==================================================
  // SELECTED CUSTOMER
  // ==================================================

  const selectedCustomer = customersWithSummary.find(
    (customer) => String(customer.id) === String(selectedCustomerId),
  );

  if (selectedCustomer) {
    return (
      <CustomerDetail
        customer={selectedCustomer}
        customerSales={getCustomerSales(selectedCustomer)}
        onBack={() => setSelectedCustomerId(null)}
      />
    );
  }

  // ==================================================
  // MAIN UI
  // ==================================================

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div>
        <p className="text-sm font-semibold text-blue-600">Sales Management</p>

        <h1 className="mt-1 text-2xl font-bold text-slate-800">Customers</h1>

        <p className="mt-1 text-sm text-slate-500">
          View customer records and their purchase history from POS sales.
        </p>
      </div>

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Total Customers",
            value: dashboardSummary.customers,
            icon: Users,
            color: "blue",
            subtitle: "Registered customers",
          },
          {
            title: "Total Orders",
            value: dashboardSummary.orders,
            icon: ShoppingBag,
            color: "indigo",
            subtitle: "POS invoices",
          },
          {
            title: "Total Sales",
            value: formatCurrency(dashboardSummary.spent),
            icon: TrendingUp,
            color: "green",
            subtitle: "Total purchase value",
          },
          {
            title: "Outstanding",
            value: formatCurrency(dashboardSummary.balance),
            icon: Wallet,
            color: "red",
            subtitle: "Pending customer balance",
          },
        ].map((card, index) => {
          const Icon = card.icon;

          const colorStyles = {
            blue: "bg-blue-50 text-blue-600",
            indigo: "bg-indigo-50 text-indigo-600",
            green: "bg-green-50 text-green-600",
            red: "bg-red-50 text-red-600",
          };

          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {card.title}
                  </p>

                  <h3 className="mt-3 break-words text-xl font-bold text-slate-800">
                    {card.value}
                  </h3>

                  <p className="mt-2 text-xs text-slate-400">{card.subtitle}</p>
                </div>

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colorStyles[card.color]}`}
                >
                  <Icon size={21} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* CUSTOMER LIST */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* LIST HEADER */}

        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-800">Customer Records</h2>

            <p className="mt-1 text-xs text-slate-400">
              Customers are received directly from POS.
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or phone..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* CUSTOMER ROWS */}

        <div className="divide-y divide-slate-100">
          {filteredCustomers.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                <Users size={32} />
              </div>

              <h3 className="mt-4 font-bold text-slate-700">
                {search ? "No Customers Found" : "No Customer Records"}
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                {search
                  ? "Try searching with another name or phone number."
                  : "Customer records will appear here when sales are made through POS."}
              </p>
            </div>
          ) : (
            filteredCustomers.map((customer, index) => (
              <motion.button
                key={customer.id || `${customer.name}-${index}`}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.2) }}
                onClick={() => setSelectedCustomerId(customer.id)}
                className="group flex w-full flex-col gap-4 p-4 text-left transition hover:bg-blue-50/40 sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                {/* CUSTOMER */}

                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">
                    <User size={23} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-slate-800 transition group-hover:text-blue-600">
                      {customer.name}
                    </h3>

                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                      <Phone size={13} />
                      {customer.phone || "Phone not provided"}
                    </p>
                  </div>
                </div>

                {/* CUSTOMER STATS */}

                <div className="grid grid-cols-3 gap-3 sm:w-[430px] sm:shrink-0 sm:gap-5">
                  <div>
                    <p className="text-[11px] text-slate-400">Purchases</p>

                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {customer.orders}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-400">Total Spent</p>

                    <p className="mt-1 text-sm font-bold text-blue-600">
                      {formatCurrency(customer.spent)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-400">Balance</p>

                    <p
                      className={`mt-1 text-sm font-bold ${
                        customer.balance > 0 ? "text-red-500" : "text-green-600"
                      }`}
                    >
                      {formatCurrency(customer.balance)}
                    </p>
                  </div>
                </div>

                {/* LAST PURCHASE */}

                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:w-40 sm:shrink-0 sm:border-0 sm:pt-0">
                  <div>
                    <p className="text-[11px] text-slate-400">Last Purchase</p>

                    <p className="mt-1 text-xs font-semibold text-slate-600">
                      {customer.latestPurchase
                        ? formatDate(customer.latestPurchase)
                        : "No purchases"}
                    </p>
                  </div>

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 transition group-hover:bg-blue-100 group-hover:text-blue-600">
                    <ArrowLeft size={17} className="rotate-180" />
                  </div>
                </div>
              </motion.button>
            ))
          )}
        </div>

        {/* FOOTER */}

        {filteredCustomers.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Showing{" "}
              <strong className="text-slate-700">
                {filteredCustomers.length}
              </strong>{" "}
              of{" "}
              <strong className="text-slate-700">
                {customersWithSummary.length}
              </strong>{" "}
              customers
            </p>

            <p className="text-xs text-slate-400">
              Data synchronized from POS sales
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Customers;
