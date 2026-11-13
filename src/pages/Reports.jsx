import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  Wallet,
  Receipt,
  CalendarDays,
  Download,
  Printer,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  CreditCard,
  FileText,
  Truck,
  PieChart,
  RefreshCw,
} from "lucide-react";

const SALES_KEY = "steel-store-sales";
const PURCHASES_KEY = "steel-store-purchases";
const EXPENSES_KEY = "steel-store-expenses";
const PRODUCTS_KEY = "steel-store-products";

const readStorage = (key) => {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const formatCurrency = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getDateString = (date) => {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "";

  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, "0"),
    String(parsed.getDate()).padStart(2, "0"),
  ].join("-");
};

const getRecordDate = (record, type) => {
  if (type === "sale") {
    return getDateString(record.saleDate || record.createdAt);
  }

  return getDateString(record.date || record.createdAt);
};

const escapeCSV = (value) => {
  const text = String(value ?? "");

  return `"${text.replace(/"/g, '""')}"`;
};

const downloadCSV = (filename, rows) => {
  if (!rows.length) {
    alert("No data available to export.");
    return;
  }

  const csv = rows.map((row) => row.map(escapeCSV).join(",")).join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
};

export default function Reports() {
  const [sales] = useState(() => readStorage(SALES_KEY));

  const [purchases] = useState(() => readStorage(PURCHASES_KEY));

  const [expenses] = useState(() => readStorage(EXPENSES_KEY));

  const [products] = useState(() => readStorage(PRODUCTS_KEY));

  const today = getDateString(new Date());

  const [dateRange, setDateRange] = useState("All");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [activeTab, setActiveTab] = useState("Overview");
  const [search, setSearch] = useState("");

  // Date range presets
  const handleDateRange = (value) => {
    setDateRange(value);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let start = "";
    let end = today;

    if (value === "Today") {
      start = today;
    }

    if (value === "This Month") {
      start = getDateString(new Date(currentYear, currentMonth, 1));
    }

    if (value === "This Year") {
      start = `${currentYear}-01-01`;
    }

    if (value === "Last 30 Days") {
      const date = new Date();
      date.setDate(date.getDate() - 29);
      start = getDateString(date);
    }

    if (value === "All") {
      start = "";
      end = "";
    }

    setStartDate(start);
    setEndDate(end);
  };

  const handleCustomDate = (type, value) => {
    setDateRange("Custom");

    if (type === "start") {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
  };

  // Date filter
  const isWithinRange = (date) => {
    if (!date) return false;

    if (startDate && date < startDate) {
      return false;
    }

    if (endDate && date > endDate) {
      return false;
    }

    return true;
  };

  // Filter records
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => isWithinRange(getRecordDate(sale, "sale")));
  }, [sales, startDate, endDate]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase) =>
      isWithinRange(getRecordDate(purchase, "purchase")),
    );
  }, [purchases, startDate, endDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) =>
      isWithinRange(getRecordDate(expense, "expense")),
    );
  }, [expenses, startDate, endDate]);

  // Financial calculations
  const reportStats = useMemo(() => {
    const totalSales = filteredSales.reduce(
      (sum, sale) => sum + Number(sale.grandTotal || 0),
      0,
    );

    const totalCollected = filteredSales.reduce(
      (sum, sale) => sum + Number(sale.paid ?? sale.amountReceived ?? 0),
      0,
    );

    const outstanding = filteredSales.reduce(
      (sum, sale) =>
        sum +
        Math.max(
          0,
          Number(
            sale.balance ??
              Math.max(
                0,
                Number(sale.grandTotal || 0) - Number(sale.paid || 0),
              ),
          ),
        ),
      0,
    );

    const totalPurchases = filteredPurchases.reduce(
      (sum, purchase) => sum + Number(purchase.total || 0),
      0,
    );

    const totalPurchasePaid = filteredPurchases.reduce(
      (sum, purchase) => sum + Number(purchase.paid || 0),
      0,
    );

    const purchasePending = filteredPurchases.reduce(
      (sum, purchase) =>
        sum +
        Math.max(0, Number(purchase.total || 0) - Number(purchase.paid || 0)),
      0,
    );

    const totalExpenses = filteredExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount || 0),
      0,
    );

    const totalInvoices = filteredSales.length;

    const totalItemsSold = filteredSales.reduce((sum, sale) => {
      return (
        sum +
        (sale.items || []).reduce(
          (itemSum, item) => itemSum + Number(item.quantity || 0),
          0,
        )
      );
    }, 0);

    return {
      totalSales,
      totalCollected,
      outstanding,
      totalPurchases,
      totalPurchasePaid,
      purchasePending,
      totalExpenses,
      totalInvoices,
      totalItemsSold,
    };
  }, [filteredSales, filteredPurchases, filteredExpenses]);

  // Product cost calculation using current purchase prices
  const productCostMap = useMemo(() => {
    const map = new Map();

    products.forEach((product) => {
      map.set(String(product.id), Number(product.purchasePrice || 0));

      map.set(
        String(product.name || "")
          .toLowerCase()
          .trim(),
        Number(product.purchasePrice || 0),
      );
    });

    return map;
  }, [products]);

  // Estimated gross profit
  const profitStats = useMemo(() => {
    let estimatedCost = 0;
    let matchedQuantity = 0;
    let unmatchedQuantity = 0;

    filteredSales.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        const quantity = Number(item.quantity || 0);

        const cost =
          productCostMap.get(String(item.id)) ??
          productCostMap.get(
            String(item.name || "")
              .toLowerCase()
              .trim(),
          );

        if (cost !== undefined) {
          estimatedCost += cost * quantity;
          matchedQuantity += quantity;
        } else {
          unmatchedQuantity += quantity;
        }
      });
    });

    const grossProfit = reportStats.totalSales - estimatedCost;

    const netProfit = grossProfit - reportStats.totalExpenses;

    return {
      estimatedCost,
      grossProfit,
      netProfit,
      matchedQuantity,
      unmatchedQuantity,
    };
  }, [
    filteredSales,
    productCostMap,
    reportStats.totalSales,
    reportStats.totalExpenses,
  ]);

  // Payment method breakdown
  const paymentSummary = useMemo(() => {
    const summary = {};

    filteredSales.forEach((sale) => {
      const method = sale.paymentMethod || "Other";

      summary[method] =
        (summary[method] || 0) + Number(sale.paid ?? sale.amountReceived ?? 0);
    });

    return Object.entries(summary)
      .map(([method, amount]) => ({
        method,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredSales]);

  // Top selling products
  const topProducts = useMemo(() => {
    const summary = {};

    filteredSales.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        const key = String(item.id || item.name).toLowerCase();

        if (!summary[key]) {
          summary[key] = {
            name: item.name || "Unknown Product",
            quantity: 0,
            revenue: 0,
          };
        }

        summary[key].quantity += Number(item.quantity || 0);

        summary[key].revenue += Number(
          item.total ?? Number(item.price || 0) * Number(item.quantity || 0),
        );
      });
    });

    return Object.values(summary)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredSales]);

  // Category-wise expenses
  const expenseCategories = useMemo(() => {
    const summary = {};

    filteredExpenses.forEach((expense) => {
      const category = expense.category || "Other";

      summary[category] =
        (summary[category] || 0) + Number(expense.amount || 0);
    });

    return Object.entries(summary)
      .map(([category, amount]) => ({
        category,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses]);

  // Supplier-wise purchases
  const supplierSummary = useMemo(() => {
    const summary = {};

    filteredPurchases.forEach((purchase) => {
      const supplier = purchase.supplier || "Unknown";

      if (!summary[supplier]) {
        summary[supplier] = {
          supplier,
          purchases: 0,
          paid: 0,
          pending: 0,
        };
      }

      summary[supplier].purchases += Number(purchase.total || 0);

      summary[supplier].paid += Number(purchase.paid || 0);

      summary[supplier].pending += Math.max(
        0,
        Number(purchase.total || 0) - Number(purchase.paid || 0),
      );
    });

    return Object.values(summary).sort((a, b) => b.purchases - a.purchases);
  }, [filteredPurchases]);

  // Monthly trend
  const monthlyTrend = useMemo(() => {
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - i);

      const key = getDateString(date).slice(0, 7);

      const label = date.toLocaleDateString("en-PK", {
        month: "short",
        year: "2-digit",
      });

      const monthSales = filteredSales
        .filter((sale) => getRecordDate(sale, "sale").startsWith(key))
        .reduce((sum, sale) => sum + Number(sale.grandTotal || 0), 0);

      const monthPurchases = filteredPurchases
        .filter((purchase) =>
          getRecordDate(purchase, "purchase").startsWith(key),
        )
        .reduce((sum, purchase) => sum + Number(purchase.total || 0), 0);

      const monthExpenses = filteredExpenses
        .filter((expense) => getRecordDate(expense, "expense").startsWith(key))
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

      months.push({
        key,
        label,
        sales: monthSales,
        purchases: monthPurchases,
        expenses: monthExpenses,
      });
    }

    return months;
  }, [filteredSales, filteredPurchases, filteredExpenses]);

  // Report cards
  const cards = [
    {
      title: "Total Sales",
      value: formatCurrency(reportStats.totalSales),
      detail: `${reportStats.totalInvoices} invoices`,
      icon: ShoppingCart,
      color: "blue",
    },
    {
      title: "Collected Amount",
      value: formatCurrency(reportStats.totalCollected),
      detail: "Payments received",
      icon: Wallet,
      color: "emerald",
    },
    {
      title: "Total Purchases",
      value: formatCurrency(reportStats.totalPurchases),
      detail: `${filteredPurchases.length} purchase records`,
      icon: Package,
      color: "violet",
    },
    {
      title: "Total Expenses",
      value: formatCurrency(reportStats.totalExpenses),
      detail: `${filteredExpenses.length} expense records`,
      icon: Receipt,
      color: "amber",
    },
  ];

  const colors = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
  };

  // Search filtered sales
  const searchedSales = filteredSales.filter((sale) => {
    const query = search.toLowerCase();

    return (
      String(sale.invoiceNumber || "")
        .toLowerCase()
        .includes(query) ||
      String(sale.customerName || "")
        .toLowerCase()
        .includes(query) ||
      String(sale.paymentMethod || "")
        .toLowerCase()
        .includes(query)
    );
  });

  // Export report
  const exportReport = () => {
    const rows = [
      [
        "Type",
        "Invoice / Title",
        "Customer / Supplier",
        "Date",
        "Amount",
        "Paid",
        "Remaining",
      ],
    ];

    filteredSales.forEach((sale) => {
      rows.push([
        "Sale",
        sale.invoiceNumber || sale.id,
        sale.customerName || "Walk-in Customer",
        getRecordDate(sale, "sale"),
        sale.grandTotal || 0,
        sale.paid || 0,
        sale.balance || 0,
      ]);
    });

    filteredPurchases.forEach((purchase) => {
      rows.push([
        "Purchase",
        purchase.invoice || purchase.id,
        purchase.supplier || "",
        getRecordDate(purchase, "purchase"),
        purchase.total || 0,
        purchase.paid || 0,
        Math.max(0, Number(purchase.total || 0) - Number(purchase.paid || 0)),
      ]);
    });

    filteredExpenses.forEach((expense) => {
      rows.push([
        "Expense",
        expense.title || expense.id,
        expense.category || "",
        getRecordDate(expense, "expense"),
        expense.amount || 0,
        expense.amount || 0,
        0,
      ]);
    });

    downloadCSV(`steel-store-report-${today}.csv`, rows);
  };

  const tabs = ["Overview", "Sales", "Purchases", "Expenses", "Products"];

  const maxTrend = Math.max(
    1,
    ...monthlyTrend.map((item) =>
      Math.max(item.sales, item.purchases, item.expenses),
    ),
  );

  return (
    <div className="min-h-screen space-y-6 bg-slate-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-3 text-white">
            <BarChart3 size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Reports & Analytics
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Monitor your business performance and financial reports.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportReport}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Download size={17} />
            Export CSV
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Printer size={17} />
            Print Report
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-bold text-slate-800">Report Period</h2>

          <p className="mt-1 text-xs text-slate-400">
            Select a date range to analyze your records.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">
              Quick Filter
            </label>

            <select
              value={dateRange}
              onChange={(e) => handleDateRange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 sm:w-44"
            >
              <option value="All">All Time</option>
              <option value="Today">Today</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Month">This Month</option>
              <option value="This Year">This Year</option>
              <option value="Custom">Custom Range</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">
              From
            </label>

            <input
              type="date"
              value={startDate}
              max={endDate || today}
              onChange={(e) => handleCustomDate("start", e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-500">
              To
            </label>

            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              max={today}
              onChange={(e) => handleCustomDate("end", e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={() => handleDateRange("All")}
            title="Reset date filter"
            className="rounded-xl border border-slate-200 p-3 text-slate-500 transition hover:bg-slate-50"
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => {
          const Icon = card.icon;

          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-500">
                    {card.title}
                  </p>

                  <h2 className="mt-3 break-words text-xl font-bold text-slate-800">
                    {card.value}
                  </h2>
                </div>

                <div className={`rounded-xl p-3 ${colors[card.color]}`}>
                  <Icon size={22} />
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-400">{card.detail}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Profit and Loss */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-slate-900 p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-300">Estimated Gross Profit</p>

              <h2 className="mt-3 text-2xl font-bold">
                {formatCurrency(profitStats.grossProfit)}
              </h2>
            </div>

            <div className="rounded-xl bg-white/10 p-3">
              <TrendingUp size={23} />
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            Sales minus estimated product cost
          </p>
        </div>

        <div className="rounded-2xl bg-blue-600 p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-100">Total Business Expenses</p>

              <h2 className="mt-3 text-2xl font-bold">
                {formatCurrency(reportStats.totalExpenses)}
              </h2>
            </div>

            <div className="rounded-xl bg-white/15 p-3">
              <TrendingDown size={23} />
            </div>
          </div>

          <p className="mt-3 text-xs text-blue-100">
            Operating expenses for selected period
          </p>
        </div>

        <div
          className={`rounded-2xl p-5 text-white shadow-sm ${
            profitStats.netProfit >= 0 ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">Estimated Net Profit</p>

              <h2 className="mt-3 text-2xl font-bold">
                {formatCurrency(profitStats.netProfit)}
              </h2>
            </div>

            <div className="rounded-xl bg-white/15 p-3">
              {profitStats.netProfit >= 0 ? (
                <ArrowUpRight size={23} />
              ) : (
                <ArrowDownRight size={23} />
              )}
            </div>
          </div>

          <p className="mt-3 text-xs text-white/80">
            Estimated gross profit minus expenses
          </p>
        </div>
      </div>

      {/* Profit Calculation Note */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm leading-6 text-amber-800">
          <strong>Important:</strong> Profit is an estimate calculated using the
          current product purchase prices. Historical purchase cost and stock
          valuation are not stored per sale item, so this figure may differ from
          exact accounting profit.
          {profitStats.unmatchedQuantity > 0 && (
            <>
              {" "}
              {profitStats.unmatchedQuantity} sold item quantities could not be
              matched with current products and are excluded from estimated
              cost.
            </>
          )}
        </p>
      </div>

      {/* Report Tabs */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-2">
        <div className="flex min-w-max gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSearch("");
              }}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                activeTab === tab
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Overview */}
      {activeTab === "Overview" && (
        <div className="space-y-5">
          {/* Monthly Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-6">
              <h2 className="font-bold text-slate-800">Business Performance</h2>

              <p className="mt-1 text-xs text-slate-400">
                Monthly sales, purchases and expenses
              </p>
            </div>

            <div className="mb-5 flex flex-wrap gap-4">
              <span className="flex items-center gap-2 text-xs text-slate-600">
                <span className="h-3 w-3 rounded-sm bg-blue-500" />
                Sales
              </span>

              <span className="flex items-center gap-2 text-xs text-slate-600">
                <span className="h-3 w-3 rounded-sm bg-violet-500" />
                Purchases
              </span>

              <span className="flex items-center gap-2 text-xs text-slate-600">
                <span className="h-3 w-3 rounded-sm bg-amber-500" />
                Expenses
              </span>
            </div>

            <div className="grid grid-cols-6 gap-3">
              {monthlyTrend.map((month) => (
                <div
                  key={month.key}
                  className="flex min-w-0 flex-col items-center"
                >
                  <div className="flex h-48 w-full items-end justify-center gap-1 border-b border-slate-100 pb-2">
                    {[
                      {
                        value: month.sales,
                        color: "bg-blue-500",
                      },
                      {
                        value: month.purchases,
                        color: "bg-violet-500",
                      },
                      {
                        value: month.expenses,
                        color: "bg-amber-500",
                      },
                    ].map((bar, index) => (
                      <div
                        key={index}
                        title={formatCurrency(bar.value)}
                        className={`w-full max-w-5 rounded-t-md ${bar.color} transition-all hover:opacity-75`}
                        style={{
                          height: `${
                            bar.value > 0
                              ? Math.max(4, (bar.value / maxTrend) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    ))}
                  </div>

                  <p className="mt-3 text-xs font-medium text-slate-500">
                    {month.label}
                  </p>
                </div>
              ))}
            </div>

            {filteredSales.length === 0 &&
              filteredPurchases.length === 0 &&
              filteredExpenses.length === 0 && (
                <p className="mt-5 text-center text-sm text-slate-400">
                  No data available for this period.
                </p>
              )}
          </div>

          {/* Payment and Category */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-800">Payment Methods</h2>

              <p className="mt-1 text-xs text-slate-400">
                Collected sales amount by payment method
              </p>

              <div className="mt-5 space-y-4">
                {paymentSummary.length > 0 ? (
                  paymentSummary.map((item) => (
                    <div key={item.method}>
                      <div className="mb-2 flex justify-between gap-3">
                        <span className="text-sm font-medium text-slate-600">
                          {item.method}
                        </span>

                        <strong className="text-sm text-slate-800">
                          {formatCurrency(item.amount)}
                        </strong>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{
                            width: `${
                              reportStats.totalCollected > 0
                                ? (item.amount / reportStats.totalCollected) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-8 text-center text-sm text-slate-400">
                    No payment records available.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-800">Expense Categories</h2>

              <p className="mt-1 text-xs text-slate-400">
                Spending distribution
              </p>

              <div className="mt-5 space-y-4">
                {expenseCategories.length > 0 ? (
                  expenseCategories.map((item) => (
                    <div key={item.category}>
                      <div className="mb-2 flex justify-between gap-3">
                        <span className="text-sm font-medium text-slate-600">
                          {item.category}
                        </span>

                        <strong className="text-sm text-slate-800">
                          {formatCurrency(item.amount)}
                        </strong>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-amber-500"
                          style={{
                            width: `${
                              reportStats.totalExpenses > 0
                                ? (item.amount / reportStats.totalExpenses) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-8 text-center text-sm text-slate-400">
                    No expense records available.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-800">
                  Top Selling Products
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Products ranked by sold quantity
                </p>
              </div>

              <Package className="text-blue-600" size={22} />
            </div>

            {topProducts.length > 0 ? (
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <div
                    key={product.name}
                    className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-700">
                        {index + 1}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {product.name}
                        </p>

                        <p className="text-xs text-slate-400">
                          {product.quantity} units sold
                        </p>
                      </div>
                    </div>

                    <strong className="shrink-0 text-sm text-slate-800">
                      {formatCurrency(product.revenue)}
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400">
                No product sales available.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Sales Report */}
      {activeTab === "Sales" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryBox
              title="Total Sales"
              value={formatCurrency(reportStats.totalSales)}
            />

            <SummaryBox
              title="Collected"
              value={formatCurrency(reportStats.totalCollected)}
            />

            <SummaryBox
              title="Outstanding"
              value={formatCurrency(reportStats.outstanding)}
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 p-5">
              <h2 className="font-bold text-slate-800">Sales Transactions</h2>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoice or customer..."
                className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Invoice</th>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Payment</th>
                    <th className="px-5 py-4">Total</th>
                    <th className="px-5 py-4">Paid</th>
                    <th className="px-5 py-4">Balance</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {searchedSales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                        {sale.invoiceNumber || sale.id}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {sale.customerName || "Walk-in"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {formatDate(getRecordDate(sale, "sale"))}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {sale.paymentMethod || "—"}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                        {formatCurrency(sale.grandTotal)}
                      </td>

                      <td className="px-5 py-4 text-sm text-emerald-600">
                        {formatCurrency(sale.paid)}
                      </td>

                      <td className="px-5 py-4 text-sm text-amber-600">
                        {formatCurrency(sale.balance)}
                      </td>
                    </tr>
                  ))}

                  {searchedSales.length === 0 && (
                    <EmptyRow columns={7} message="No sales records found." />
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Purchases Report */}
      {activeTab === "Purchases" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryBox
              title="Total Purchases"
              value={formatCurrency(reportStats.totalPurchases)}
            />

            <SummaryBox
              title="Paid Amount"
              value={formatCurrency(reportStats.totalPurchasePaid)}
            />

            <SummaryBox
              title="Pending Payments"
              value={formatCurrency(reportStats.purchasePending)}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-slate-800">
              Supplier Purchase Summary
            </h2>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[650px] text-left">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">Total Purchases</th>
                    <th className="px-4 py-3">Paid</th>
                    <th className="px-4 py-3">Pending</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {supplierSummary.map((item) => (
                    <tr key={item.supplier}>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-800">
                        {item.supplier}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-700">
                        {formatCurrency(item.purchases)}
                      </td>

                      <td className="px-4 py-4 text-sm text-emerald-600">
                        {formatCurrency(item.paid)}
                      </td>

                      <td className="px-4 py-4 text-sm text-amber-600">
                        {formatCurrency(item.pending)}
                      </td>
                    </tr>
                  ))}

                  {supplierSummary.length === 0 && (
                    <EmptyRow
                      columns={4}
                      message="No purchase records found."
                    />
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Expenses Report */}
      {activeTab === "Expenses" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SummaryBox
              title="Total Expenses"
              value={formatCurrency(reportStats.totalExpenses)}
            />

            <SummaryBox
              title="Expense Records"
              value={filteredExpenses.length}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-slate-800">Expense Breakdown</h2>

            <div className="mt-5 space-y-4">
              {expenseCategories.map((item) => (
                <div key={item.category}>
                  <div className="mb-2 flex justify-between gap-3">
                    <span className="text-sm font-medium text-slate-600">
                      {item.category}
                    </span>

                    <strong className="text-sm text-slate-800">
                      {formatCurrency(item.amount)}
                    </strong>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{
                        width: `${
                          reportStats.totalExpenses > 0
                            ? (item.amount / reportStats.totalExpenses) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}

              {expenseCategories.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">
                  No expense records found.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Products Report */}
      {activeTab === "Products" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryBox title="Total Products" value={products.length} />

            <SummaryBox
              title="Total Stock Units"
              value={products.reduce(
                (sum, product) => sum + Number(product.stock || 0),
                0,
              )}
            />

            <SummaryBox
              title="Current Stock Value"
              value={formatCurrency(
                products.reduce(
                  (sum, product) =>
                    sum +
                    Number(product.stock || 0) *
                      Number(product.purchasePrice || 0),
                  0,
                ),
              )}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-slate-800">Inventory Valuation</h2>

            <p className="mt-1 text-xs text-slate-400">
              Current inventory based on purchase prices
            </p>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[650px] text-left">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Purchase Price</th>
                    <th className="px-4 py-3">Stock Value</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {products.map((product) => {
                    const stock = Number(product.stock || 0);

                    const stockValue =
                      stock * Number(product.purchasePrice || 0);

                    const status =
                      stock <= 0
                        ? "Out of Stock"
                        : stock <= Number(product.minStock || 0)
                          ? "Low Stock"
                          : "In Stock";

                    return (
                      <tr key={product.id}>
                        <td className="px-4 py-4">
                          <p className="text-sm font-semibold text-slate-800">
                            {product.name}
                          </p>

                          <p className="text-xs text-slate-400">
                            {product.category || "General"}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-700">
                          {stock} {product.unit || "pcs"}
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-600">
                          {formatCurrency(product.purchasePrice)}
                        </td>

                        <td className="px-4 py-4 text-sm font-semibold text-slate-800">
                          {formatCurrency(stockValue)}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              status === "In Stock"
                                ? "bg-emerald-50 text-emerald-700"
                                : status === "Low Stock"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-red-50 text-red-700"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {products.length === 0 && (
                    <EmptyRow columns={5} message="No products available." />
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Footer Summary */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-bold text-slate-800">Report Summary</h3>

            <p className="mt-1 text-xs text-slate-400">
              Data calculated from your saved POS records.
            </p>
          </div>

          <div className="text-sm text-slate-500">
            Period:{" "}
            <strong className="text-slate-700">
              {startDate || "All time"} — {endDate || "Present"}
            </strong>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate-400">Invoices</p>

            <h3 className="mt-1 text-lg font-bold text-slate-800">
              {reportStats.totalInvoices}
            </h3>
          </div>

          <div>
            <p className="text-xs text-slate-400">Items Sold</p>

            <h3 className="mt-1 text-lg font-bold text-slate-800">
              {reportStats.totalItemsSold}
            </h3>
          </div>

          <div>
            <p className="text-xs text-slate-400">Purchases</p>

            <h3 className="mt-1 text-lg font-bold text-slate-800">
              {filteredPurchases.length}
            </h3>
          </div>

          <div>
            <p className="text-xs text-slate-400">Expenses</p>

            <h3 className="mt-1 text-lg font-bold text-slate-800">
              {filteredExpenses.length}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable summary card
function SummaryBox({ title, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>

      <h2 className="mt-3 break-words text-xl font-bold text-slate-800">
        {value}
      </h2>
    </div>
  );
}

// Empty table state
function EmptyRow({ columns, message }) {
  return (
    <tr>
      <td colSpan={columns} className="px-5 py-12 text-center">
        <FileText size={28} className="mx-auto text-slate-300" />

        <p className="mt-3 text-sm text-slate-500">{message}</p>
      </td>
    </tr>
  );
}
