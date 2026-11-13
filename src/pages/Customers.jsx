import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useCustomers } from "../context/CustomersContext";
import { useSales } from "../context/SalesContext";

import {
  Users,
  UserPlus,
  Search,
  Phone,
  ShoppingBag,
  Wallet,
  Trash2,
  X,
  Eye,
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
  ArrowUpRight,
  Hash,
  UserRound,
  CircleDollarSign,
} from "lucide-react";

/* =========================================
   HELPERS
========================================= */

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

/* =========================================
   CUSTOMER VALIDATION
========================================= */

const validateCustomerName = (name) => {
  const value = name.trim();

  if (!value) {
    return "Customer name is required.";
  }

  if (value.length < 2) {
    return "Name must contain at least 2 characters.";
  }

  if (value.length > 60) {
    return "Name cannot exceed 60 characters.";
  }

  // English and Urdu letters with spaces and common name punctuation.
  const nameRegex = /^[\p{L}\p{M}]+(?:[ .'-][\p{L}\p{M}]+)*$/u;

  if (!nameRegex.test(value)) {
    return "Only letters, spaces, dots, apostrophes and hyphens are allowed.";
  }

  return "";
};

const validateCustomerPhone = (phone) => {
  if (!phone.trim()) {
    return "";
  }

  const normalized = normalizePhone(phone);

  if (!/^03\d{9}$/.test(normalized)) {
    return "Enter a valid Pakistani mobile number (03XXXXXXXXX).";
  }

  return "";
};

/* =========================================
   REUSABLE STAT CARD
========================================= */

function StatCard({ item, index }) {
  const Icon = item.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{item.title}</p>

          <h3 className="mt-2 break-words text-xl font-bold text-slate-800">
            {item.value}
          </h3>

          {item.subtitle && (
            <p className="mt-1 text-xs text-slate-400">{item.subtitle}</p>
          )}
        </div>

        <div className={`shrink-0 rounded-xl p-3 ${item.color}`}>
          <Icon size={22} />
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================
   MAIN COMPONENT
========================================= */

function Customers() {
  const { customers = [], addCustomer, deleteCustomer } = useCustomers();

  const { sales = [] } = useSales();

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [errors, setErrors] = useState({
    name: "",
    phone: "",
  });

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  /* =========================================
     CUSTOMER SALES
  ========================================= */

  const getCustomerSales = (customer) => {
    if (!customer) return [];

    const customerPhone = normalizePhone(customer.phone);
    const customerName = normalizeName(customer.name);

    return sales
      .filter((sale) => {
        const salePhone = normalizePhone(sale.customerPhone);
        const saleName = normalizeName(sale.customerName);

        // Phone number is the primary identifier.
        if (customerPhone && salePhone) {
          return customerPhone === salePhone;
        }

        // Name matching is used only when both phone numbers are missing.
        return !customerPhone && !salePhone && customerName === saleName;
      })
      .sort((a, b) => {
        const dateA = new Date(a.saleDate || a.createdAt || 0).getTime();

        const dateB = new Date(b.saleDate || b.createdAt || 0).getTime();

        return dateB - dateA;
      });
  };

  /* =========================================
     CUSTOMER SUMMARY
  ========================================= */

  const getCustomerSummary = (customer) => {
    const customerSales = getCustomerSales(customer);

    const totalPurchases = customerSales.reduce(
      (total, sale) => total + Number(sale.grandTotal || 0),
      0,
    );

    const totalPaid = customerSales.reduce(
      (total, sale) => total + Number(sale.paid || 0),
      0,
    );

    const outstanding = customerSales.reduce(
      (total, sale) => total + Number(sale.balance || 0),
      0,
    );

    const totalItems = customerSales.reduce(
      (total, sale) =>
        total +
        (sale.items || []).reduce(
          (sum, item) => sum + Number(item.quantity || 0),
          0,
        ),
      0,
    );

    return {
      customerSales,
      totalOrders: customerSales.length,
      totalPurchases,
      totalPaid,
      outstanding,
      totalItems,
      lastPurchase:
        customerSales[0]?.saleDate || customerSales[0]?.createdAt || null,
    };
  };

  /* =========================================
     FILTER CUSTOMERS
  ========================================= */

  const filteredCustomers = useMemo(() => {
    return customers
      .filter((customer) => {
        const searchText = search.toLowerCase().trim();

        return `${customer.name || ""} ${
          customer.phone || ""
        } ${customer.email || ""}`
          .toLowerCase()
          .includes(searchText);
      })
      .sort((a, b) => {
        const dateA = new Date(a.lastPurchase || a.createdAt || 0).getTime();

        const dateB = new Date(b.lastPurchase || b.createdAt || 0).getTime();

        return dateB - dateA;
      });
  }, [customers, search]);

  /* =========================================
     GLOBAL STATS
  ========================================= */

  const customerSummaries = customers.map((customer) =>
    getCustomerSummary(customer),
  );

  const totalPurchases = customerSummaries.reduce(
    (total, item) => total + item.totalPurchases,
    0,
  );

  const totalOutstanding = customerSummaries.reduce(
    (total, item) => total + item.outstanding,
    0,
  );

  const stats = [
    {
      title: "Total Customers",
      value: customers.length,
      subtitle: "Registered customers",
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Total Purchases",
      value: formatCurrency(totalPurchases),
      subtitle: "Combined purchase value",
      icon: ShoppingBag,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Outstanding Balance",
      value: formatCurrency(totalOutstanding),
      subtitle: "Pending customer payments",
      icon: Wallet,
      color: "bg-orange-50 text-orange-600",
    },
    {
      title: "Total Orders",
      value: sales.length,
      subtitle: "All completed sales",
      icon: Receipt,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  /* =========================================
     FORM HANDLING
  ========================================= */

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      email: "",
      address: "",
    });

    setErrors({
      name: "",
      phone: "",
    });
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === "name") {
      setErrors((prev) => ({
        ...prev,
        name: validateCustomerName(value),
      }));
    }

    if (field === "phone") {
      const phoneError = validateCustomerPhone(value);

      const normalized = normalizePhone(value);

      const duplicate =
        normalized &&
        customers.some(
          (customer) => normalizePhone(customer.phone) === normalized,
        );

      setErrors((prev) => ({
        ...prev,
        phone:
          phoneError ||
          (duplicate ? "This phone number is already registered." : ""),
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const nameError = validateCustomerName(form.name);
    const phoneError = validateCustomerPhone(form.phone);

    const normalizedPhone = normalizePhone(form.phone);

    const phoneExists =
      normalizedPhone &&
      customers.some(
        (customer) => normalizePhone(customer.phone) === normalizedPhone,
      );

    const newErrors = {
      name: nameError,
      phone:
        phoneError ||
        (phoneExists ? "This phone number is already registered." : ""),
    };

    setErrors(newErrors);

    if (newErrors.name || newErrors.phone) {
      return;
    }

    const success = addCustomer({
      ...form,
      name: form.name.trim(),
      phone: normalizedPhone,
      email: form.email.trim(),
      address: form.address.trim(),
    });

    if (!success) return;

    resetForm();
    setShowModal(false);
  };

  /* =========================================
     CUSTOMER ACTIONS
  ========================================= */

  const openCustomerDetails = (customer) => {
    setSelectedCustomer(customer);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeCustomerDetails = () => {
    setSelectedCustomer(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (e, customer) => {
    e.stopPropagation();

    const confirmed = window.confirm(
      `Are you sure you want to delete ${customer.name}?`,
    );

    if (!confirmed) return;

    deleteCustomer(customer.id);

    if (selectedCustomer?.id === customer.id) {
      setSelectedCustomer(null);
    }
  };

  /* =========================================
     PRINT CUSTOMER PURCHASE HISTORY
  ========================================= */

  const handlePrintHistory = (customer) => {
    const summary = getCustomerSummary(customer);
    const customerSales = summary.customerSales;

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
                <h3>Invoice #${escapeHTML(
                  sale.invoiceNumber || `Order ${index + 1}`,
                )}</h3>
                <p>${escapeHTML(
                  formatDateTime(sale.saleDate || sale.createdAt),
                )}</p>
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

            p {
              margin: 7px 0;
              font-size: 12px;
            }

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
            <p><strong>Phone:</strong> ${escapeHTML(customer.phone || "N/A")}</p>
            <p><strong>Email:</strong> ${escapeHTML(customer.email || "N/A")}</p>
            <p><strong>Address:</strong> ${escapeHTML(customer.address || "N/A")}</p>
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

  /* =========================================
     CUSTOMER DETAIL PAGE
  ========================================= */

  if (selectedCustomer) {
    const customer = selectedCustomer;
    const summary = getCustomerSummary(customer);
    const customerSales = summary.customerSales;

    const detailStats = [
      {
        title: "Total Orders",
        value: summary.totalOrders,
        icon: Receipt,
        color: "bg-blue-50 text-blue-600",
      },
      {
        title: "Total Purchases",
        value: formatCurrency(summary.totalPurchases),
        icon: ShoppingBag,
        color: "bg-emerald-50 text-emerald-600",
      },
      {
        title: "Total Paid",
        value: formatCurrency(summary.totalPaid),
        icon: CreditCard,
        color: "bg-purple-50 text-purple-600",
      },
      {
        title: "Outstanding",
        value: formatCurrency(summary.outstanding),
        icon: Wallet,
        color: "bg-orange-50 text-orange-600",
      },
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* DETAIL HEADER */}

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={closeCustomerDetails}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            >
              <ArrowLeft size={20} />
            </button>

            <div>
              <p className="text-sm font-semibold text-blue-600">
                Customer Management / Profile
              </p>

              <h1 className="mt-1 text-2xl font-bold text-slate-800">
                Customer Details
              </h1>
            </div>
          </div>

          <button
            onClick={() => handlePrintHistory(customer)}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700"
          >
            <Printer size={18} />
            Print Purchase History
          </button>
        </div>

        {/* PROFILE CARD */}

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="relative h-32 overflow-hidden bg-gradient-to-r from-blue-800 via-blue-600 to-indigo-600">
            <div className="absolute -right-10 -top-20 h-60 w-60 rounded-full border-[35px] border-white/10" />
            <div className="absolute -bottom-24 right-40 h-48 w-48 rounded-full border-[25px] border-white/10" />

            <div className="absolute left-6 top-6">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                Customer Profile
              </span>
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="-mt-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="flex items-end gap-4">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-blue-50 text-3xl font-bold text-blue-600 shadow-md">
                  {customer.name?.charAt(0)?.toUpperCase() || "C"}
                </div>

                <div className="pb-2">
                  <h2 className="text-xl font-bold text-slate-800 sm:text-2xl">
                    {customer.name}
                  </h2>

                  <p className="mt-1 text-xs font-medium text-slate-400">
                    Customer ID: {customer.id || "N/A"}
                  </p>
                </div>
              </div>

              <span className="flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-600">
                <CheckCircle2 size={15} />
                Registered Customer
              </span>
            </div>

            {/* CUSTOMER CONTACT INFORMATION */}

            <div className="mt-7 grid grid-cols-1 gap-4 border-t border-slate-100 pt-6 md:grid-cols-3">
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                  <Phone size={19} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-slate-400">Phone Number</p>

                  <p className="mt-1 break-all text-sm font-semibold text-slate-700">
                    {customer.phone || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                <div className="rounded-xl bg-purple-100 p-3 text-purple-600">
                  <Mail size={19} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-slate-400">Email Address</p>

                  <p className="mt-1 break-all text-sm font-semibold text-slate-700">
                    {customer.email || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                <div className="rounded-xl bg-orange-100 p-3 text-orange-600">
                  <MapPin size={19} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-slate-400">Address</p>

                  <p className="mt-1 break-words text-sm font-semibold text-slate-700">
                    {customer.address || "Not provided"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PURCHASE STATISTICS */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {detailStats.map((item, index) => (
            <StatCard key={item.title} item={item} index={index} />
          ))}
        </div>

        {/* PURCHASE INSIGHTS */}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <TrendingUp size={19} />
              </div>

              <div>
                <h3 className="font-bold text-slate-800">Purchase Overview</h3>

                <p className="text-xs text-slate-400">
                  Customer purchasing performance
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div>
                <p className="text-xs text-slate-400">Average Order Value</p>

                <h3 className="mt-2 text-xl font-bold text-slate-800">
                  {formatCurrency(
                    summary.totalOrders
                      ? summary.totalPurchases / summary.totalOrders
                      : 0,
                  )}
                </h3>
              </div>

              <div>
                <p className="text-xs text-slate-400">Total Items Purchased</p>

                <h3 className="mt-2 text-xl font-bold text-slate-800">
                  {summary.totalItems}
                </h3>
              </div>

              <div>
                <p className="text-xs text-slate-400">Last Purchase</p>

                <h3 className="mt-2 text-sm font-bold text-slate-800">
                  {formatDate(summary.lastPurchase)}
                </h3>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="mb-2 flex justify-between text-xs">
                <span className="font-medium text-slate-500">
                  Payment Progress
                </span>

                <strong className="text-emerald-600">
                  {summary.totalPurchases
                    ? Math.min(
                        100,
                        (summary.totalPaid / summary.totalPurchases) * 100,
                      ).toFixed(1)
                    : 0}
                  %
                </strong>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all"
                  style={{
                    width: `${
                      summary.totalPurchases
                        ? Math.min(
                            100,
                            (summary.totalPaid / summary.totalPurchases) * 100,
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>

              <div className="mt-3 flex justify-between text-xs">
                <span className="text-emerald-600">
                  Paid: {formatCurrency(summary.totalPaid)}
                </span>

                <span className="text-orange-600">
                  Remaining: {formatCurrency(summary.outstanding)}
                </span>
              </div>
            </div>
          </div>

          {/* LAST PURCHASE */}

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
                <Clock size={19} />
              </div>

              <div>
                <h3 className="font-bold text-slate-800">Last Activity</h3>

                <p className="text-xs text-slate-400">Most recent purchase</p>
              </div>
            </div>

            {customerSales.length > 0 ? (
              <div className="mt-6">
                <p className="text-xs text-slate-400">Last Invoice</p>

                <h3 className="mt-2 text-lg font-bold text-blue-600">
                  #{customerSales[0].invoiceNumber || "N/A"}
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  {formatDateTime(
                    customerSales[0].saleDate || customerSales[0].createdAt,
                  )}
                </p>

                <div className="mt-5 rounded-xl bg-blue-50 p-4">
                  <p className="text-xs text-blue-500">Invoice Amount</p>

                  <h3 className="mt-1 text-xl font-bold text-blue-700">
                    {formatCurrency(customerSales[0].grandTotal)}
                  </h3>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-xl bg-slate-50 p-4 text-center">
                <ShoppingBag size={25} className="mx-auto text-slate-300" />

                <p className="mt-2 text-sm text-slate-400">No purchases yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* PURCHASE HISTORY */}

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Receipt size={21} />
              </div>

              <div>
                <h2 className="font-bold text-slate-800">Purchase History</h2>

                <p className="mt-1 text-xs text-slate-400">
                  All invoices and purchased products
                </p>
              </div>
            </div>

            <span className="w-fit rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600">
              {customerSales.length} Invoices
            </span>
          </div>

          <div className="space-y-5 p-5">
            {customerSales.map((sale, index) => {
              const items = sale.items || [];
              const hasBalance = Number(sale.balance || 0) > 0;

              return (
                <motion.div
                  key={sale.id || sale.invoiceNumber || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="overflow-hidden rounded-2xl border border-slate-200 transition hover:border-blue-200 hover:shadow-md"
                >
                  {/* INVOICE HEADER */}

                  <div className="flex flex-col justify-between gap-4 bg-slate-50 p-5 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                        <Receipt size={21} />
                      </div>

                      <div>
                        <p className="text-xs font-medium text-slate-400">
                          INVOICE NUMBER
                        </p>

                        <h3 className="mt-1 font-bold text-slate-800">
                          #{sale.invoiceNumber || "N/A"}
                        </h3>

                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <CalendarDays size={13} />

                          {formatDateTime(sale.saleDate || sale.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold ${
                          hasBalance
                            ? "bg-orange-50 text-orange-600"
                            : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        {hasBalance ? (
                          <AlertCircle size={14} />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}

                        {hasBalance ? "Payment Pending" : "Fully Paid"}
                      </span>

                      <div className="text-right">
                        <p className="text-xs text-slate-400">Invoice Total</p>

                        <p className="mt-1 text-lg font-bold text-blue-600">
                          {formatCurrency(sale.grandTotal)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* PRODUCT TABLE */}

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[550px] text-left">
                      <thead className="bg-white text-xs uppercase tracking-wide text-slate-400">
                        <tr>
                          <th className="px-5 py-4">Product</th>
                          <th className="px-5 py-4">Quantity</th>
                          <th className="px-5 py-4">Unit Price</th>
                          <th className="px-5 py-4">Total</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {items.map((item, itemIndex) => (
                          <tr
                            key={item.id || itemIndex}
                            className="transition hover:bg-slate-50"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
                                  <Package size={17} />
                                </div>

                                <div>
                                  <p className="text-sm font-semibold text-slate-700">
                                    {item.name || "Product"}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-400">
                                    {item.category || item.size || ""}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4 text-sm font-medium text-slate-600">
                              {item.quantity || 0}
                            </td>

                            <td className="px-5 py-4 text-sm text-slate-600">
                              {formatCurrency(item.price)}
                            </td>

                            <td className="px-5 py-4 text-sm font-bold text-slate-700">
                              {formatCurrency(
                                item.total ??
                                  Number(item.price || 0) *
                                    Number(item.quantity || 0),
                              )}
                            </td>
                          </tr>
                        ))}

                        {items.length === 0 && (
                          <tr>
                            <td
                              colSpan="4"
                              className="px-5 py-8 text-center text-sm text-slate-400"
                            >
                              No product details available.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* INVOICE SUMMARY */}

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 bg-slate-50/70 p-5 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-slate-400">Subtotal</p>

                      <p className="mt-1 text-sm font-bold text-slate-700">
                        {formatCurrency(sale.subtotal)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Discount</p>

                      <p className="mt-1 text-sm font-bold text-slate-700">
                        {formatCurrency(sale.discount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Paid Amount</p>

                      <p className="mt-1 text-sm font-bold text-emerald-600">
                        {formatCurrency(sale.paid)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Remaining</p>

                      <p className="mt-1 text-sm font-bold text-orange-600">
                        {formatCurrency(sale.balance)}
                      </p>
                    </div>
                  </div>

                  {/* PAYMENT METHOD */}

                  <div className="flex flex-col justify-between gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <CreditCard size={15} />
                      Payment Method:
                      <strong className="text-slate-700">
                        {sale.paymentMethod || "N/A"}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      Grand Total:
                      <span className="text-lg text-blue-600">
                        {formatCurrency(sale.grandTotal)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {customerSales.length === 0 && (
              <div className="py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <ShoppingBag size={28} />
                </div>

                <h3 className="mt-4 font-bold text-slate-700">
                  No Purchase History
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  This customer has not made any purchases yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  /* =========================================
     CUSTOMERS LIST PAGE
  ========================================= */

  return (
    <div className="space-y-7">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Customer Management
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-800">Customers</h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage customers and monitor their purchase history.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700"
        >
          <UserPlus size={18} />
          Add Customer
        </button>
      </div>

      {/* STATS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item, index) => (
          <StatCard key={item.title} item={item} index={index} />
        ))}
      </div>

      {/* CUSTOMER TABLE */}

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center">
          <div>
            <h2 className="font-bold text-slate-800">All Customers</h2>

            <p className="mt-1 text-xs text-slate-400">
              {customers.length} registered customers
            </p>
          </div>

          <div className="relative w-full md:max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone or email..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Orders</th>
                <th className="px-6 py-4">Total Purchases</th>
                <th className="px-6 py-4">Outstanding</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((customer, index) => {
                const summary = getCustomerSummary(customer);

                return (
                  <motion.tr
                    key={customer.id || index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.025 }}
                    onClick={() => openCustomerDetails(customer)}
                    className="cursor-pointer transition hover:bg-blue-50/60"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600">
                          {customer.name?.charAt(0)?.toUpperCase() || "C"}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-700">
                            {customer.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {summary.totalOrders > 0
                              ? "Returning customer"
                              : "Registered customer"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Phone size={14} />
                        {customer.phone || "N/A"}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-600">
                        {summary.totalOrders}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm font-bold text-slate-700">
                      {formatCurrency(summary.totalPurchases)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-bold ${
                          summary.outstanding > 0
                            ? "text-orange-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {formatCurrency(summary.outstanding)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openCustomerDetails(customer);
                          }}
                          title="View Customer"
                          className="rounded-lg bg-blue-50 p-2.5 text-blue-600 transition hover:bg-blue-100"
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          onClick={(e) => handleDelete(e, customer)}
                          title="Delete Customer"
                          className="rounded-lg bg-red-50 p-2.5 text-red-500 transition hover:bg-red-100"
                        >
                          <Trash2 size={17} />
                        </button>

                        <ChevronRight size={18} className="text-slate-300" />
                      </div>
                    </td>
                  </motion.tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <Users size={25} />
                    </div>

                    <h3 className="mt-3 font-semibold text-slate-700">
                      No Customers Found
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      Try another search or add a new customer.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col justify-between gap-2 border-t border-slate-100 px-5 py-4 text-xs text-slate-400 sm:flex-row sm:items-center">
          <span>
            Showing {filteredCustomers.length} of {customers.length} customers
          </span>

          <span>Click a customer row to view complete purchase history.</span>
        </div>
      </div>

      {/* ADD CUSTOMER MODAL */}

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            >
              {/* MODAL HEADER */}

              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                    <UserPlus size={22} />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      Add New Customer
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Enter customer information.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="rounded-lg bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"
                >
                  <X size={19} />
                </button>
              </div>

              {/* FORM */}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* NAME */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Customer Name <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <UserRound
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      value={form.name}
                      maxLength={60}
                      onChange={(e) =>
                        handleFieldChange("name", e.target.value)
                      }
                      onBlur={() =>
                        setErrors((prev) => ({
                          ...prev,
                          name: validateCustomerName(form.name),
                        }))
                      }
                      placeholder="Enter full name"
                      className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition focus:ring-4 ${
                        errors.name
                          ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-50"
                          : "border-slate-200 focus:border-blue-500 focus:ring-blue-50"
                      }`}
                    />
                  </div>

                  {errors.name ? (
                    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
                      <AlertCircle size={13} />
                      {errors.name}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-slate-400">
                      English and Urdu names are supported.
                    </p>
                  )}
                </div>

                {/* PHONE */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Phone Number
                  </label>

                  <div className="relative">
                    <Phone
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="tel"
                      value={form.phone}
                      maxLength={16}
                      onChange={(e) =>
                        handleFieldChange("phone", e.target.value)
                      }
                      onBlur={() => {
                        const phoneError = validateCustomerPhone(form.phone);

                        const normalized = normalizePhone(form.phone);

                        const duplicate =
                          normalized &&
                          customers.some(
                            (customer) =>
                              normalizePhone(customer.phone) === normalized,
                          );

                        setErrors((prev) => ({
                          ...prev,
                          phone:
                            phoneError ||
                            (duplicate
                              ? "This phone number is already registered."
                              : ""),
                        }));
                      }}
                      placeholder="03XX XXXXXXX"
                      className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition focus:ring-4 ${
                        errors.phone
                          ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-50"
                          : "border-slate-200 focus:border-blue-500 focus:ring-blue-50"
                      }`}
                    />
                  </div>

                  {errors.phone ? (
                    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
                      <AlertCircle size={13} />
                      {errors.phone}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-slate-400">
                      Pakistani mobile number. Example: 03001234567
                    </p>
                  )}
                </div>

                {/* EMAIL */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email Address
                  </label>

                  <div className="relative">
                    <Mail
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="example@email.com"
                      className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                </div>

                {/* ADDRESS */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Address
                  </label>

                  <div className="relative">
                    <MapPin
                      size={17}
                      className="absolute left-3 top-3.5 text-slate-400"
                    />

                    <textarea
                      rows="3"
                      value={form.address}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      placeholder="Enter customer address"
                      className="w-full resize-none rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                </div>

                {/* BUTTONS */}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={!!errors.name || !!errors.phone}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <UserPlus size={17} />
                    Save Customer
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Customers;
