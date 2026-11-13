import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  Plus,
  Search,
  Wallet,
  TrendingDown,
  CalendarDays,
  Receipt,
  Pencil,
  Trash2,
  Eye,
  X,
  Save,
  Filter,
  CreditCard,
  Banknote,
  Building2,
  Coffee,
  Truck,
  Zap,
  Home,
  Users,
  Wrench,
  MoreHorizontal,
  ChevronDown,
  ArrowDownRight,
  FileText,
} from "lucide-react";

const EXPENSES_KEY = "steel-store-expenses";

const CATEGORIES = [
  "Rent",
  "Electricity",
  "Salary",
  "Transport",
  "Maintenance",
  "Food & Tea",
  "Internet",
  "Office Supplies",
  "Other",
];

const PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "Easypaisa",
  "JazzCash",
  "Card",
];

const CATEGORY_ICONS = {
  Rent: Home,
  Electricity: Zap,
  Salary: Users,
  Transport: Truck,
  Maintenance: Wrench,
  "Food & Tea": Coffee,
  Internet: Building2,
  "Office Supplies": FileText,
  Other: MoreHorizontal,
};

const emptyForm = {
  title: "",
  category: "Other",
  amount: "",
  date: new Date().toISOString().split("T")[0],
  paymentMethod: "Cash",
  description: "",
};

const readExpenses = () => {
  try {
    const data = JSON.parse(localStorage.getItem(EXPENSES_KEY));

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

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getMonthKey = (date) => {
  if (!date) return "";

  return date.slice(0, 7);
};

export default function Expenses() {
  const [expenses, setExpenses] = useState(readExpenses);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const currentMonth = today.slice(0, 7);

  // Save expenses
  useEffect(() => {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  }, [expenses]);

  // Listen for changes from another browser tab
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === EXPENSES_KEY || event.key === null) {
        setExpenses(readExpenses());
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Calculate dashboard statistics
  const stats = useMemo(() => {
    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + Number(expense.amount || 0),
      0,
    );

    const todayExpenses = expenses
      .filter((expense) => expense.date === today)
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    const monthlyExpenses = expenses
      .filter((expense) => getMonthKey(expense.date) === currentMonth)
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    return {
      totalExpenses,
      todayExpenses,
      monthlyExpenses,
      totalRecords: expenses.length,
    };
  }, [expenses, today, currentMonth]);

  // Category-wise expense summary
  const categorySummary = useMemo(() => {
    const summary = {};

    expenses.forEach((expense) => {
      const category = expense.category || "Other";

      summary[category] =
        (summary[category] || 0) + Number(expense.amount || 0);
    });

    return Object.entries(summary)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage:
          stats.totalExpenses > 0 ? (amount / stats.totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, stats.totalExpenses]);

  // Monthly expense summary
  const monthlySummary = useMemo(() => {
    const summary = {};

    expenses.forEach((expense) => {
      const key = getMonthKey(expense.date);

      if (!key) return;

      summary[key] = (summary[key] || 0) + Number(expense.amount || 0);
    });

    return Object.entries(summary)
      .map(([month, amount]) => ({
        month,
        amount,
      }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 6);
  }, [expenses]);

  // Search and filters
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((expense) => {
        const query = search.toLowerCase();

        const matchesSearch =
          expense.title?.toLowerCase().includes(query) ||
          expense.category?.toLowerCase().includes(query) ||
          expense.description?.toLowerCase().includes(query) ||
          expense.paymentMethod?.toLowerCase().includes(query);

        const matchesCategory =
          categoryFilter === "All" || expense.category === categoryFilter;

        const matchesPayment =
          paymentFilter === "All" || expense.paymentMethod === paymentFilter;

        let matchesDate = true;

        if (dateFilter === "Today") {
          matchesDate = expense.date === today;
        }

        if (dateFilter === "This Month") {
          matchesDate = getMonthKey(expense.date) === currentMonth;
        }

        if (dateFilter === "This Year") {
          matchesDate = expense.date?.slice(0, 4) === today.slice(0, 4);
        }

        return (
          matchesSearch && matchesCategory && matchesPayment && matchesDate
        );
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [
    expenses,
    search,
    categoryFilter,
    paymentFilter,
    dateFilter,
    today,
    currentMonth,
  ]);

  // Reset filters
  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("All");
    setPaymentFilter("All");
    setDateFilter("All");
  };

  // Open add form
  const openAddForm = () => {
    setEditingExpense(null);
    setForm({
      ...emptyForm,
      date: today,
    });
    setError("");
    setShowForm(true);
  };

  // Open edit form
  const openEditForm = (expense) => {
    setEditingExpense(expense);

    setForm({
      title: expense.title || "",
      category: expense.category || "Other",
      amount: String(expense.amount ?? ""),
      date: expense.date || today,
      paymentMethod: expense.paymentMethod || "Cash",
      description: expense.description || "",
    });

    setError("");
    setShowForm(true);
  };

  // Input handler
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Save expense
  const handleSubmit = (e) => {
    e.preventDefault();

    const title = form.title.trim();
    const amount = Number(form.amount);

    if (!title) {
      setError("Please enter expense title.");
      return;
    }

    if (!form.category.trim()) {
      setError("Please select or enter a category.");
      return;
    }

    if (form.amount === "" || !Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid amount greater than zero.");
      return;
    }

    if (!form.date) {
      setError("Please select an expense date.");
      return;
    }

    if (new Date(`${form.date}T00:00:00`) > new Date(`${today}T23:59:59`)) {
      setError("Future expense dates are not allowed.");
      return;
    }

    if (!form.paymentMethod) {
      setError("Please select a payment method.");
      return;
    }

    if (editingExpense) {
      setExpenses((prev) =>
        prev.map((expense) =>
          expense.id === editingExpense.id
            ? {
                ...expense,
                ...form,
                title,
                category: form.category.trim(),
                amount,
                updatedAt: new Date().toISOString(),
              }
            : expense,
        ),
      );
    } else {
      const newExpense = {
        id: `EXP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ...form,
        title,
        category: form.category.trim(),
        amount,
        createdAt: new Date().toISOString(),
      };

      setExpenses((prev) => [newExpense, ...prev]);
    }

    setShowForm(false);
    setEditingExpense(null);
    setForm(emptyForm);
    setError("");
  };

  // Delete expense
  const handleDelete = (expense) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${expense.title}"?`,
    );

    if (!confirmed) return;

    setExpenses((prev) => prev.filter((item) => item.id !== expense.id));

    if (selectedExpense?.id === expense.id) {
      setSelectedExpense(null);
    }
  };

  // Dashboard cards
  const statCards = [
    {
      title: "Total Expenses",
      value: formatCurrency(stats.totalExpenses),
      description: "All recorded expenses",
      icon: Wallet,
      color: "blue",
      filter: "All",
    },
    {
      title: "This Month",
      value: formatCurrency(stats.monthlyExpenses),
      description: "Current month's expenses",
      icon: CalendarDays,
      color: "violet",
      filter: "This Month",
    },
    {
      title: "Today's Expenses",
      value: formatCurrency(stats.todayExpenses),
      description: "Expenses recorded today",
      icon: TrendingDown,
      color: "amber",
      filter: "Today",
    },
    {
      title: "Total Records",
      value: stats.totalRecords,
      description: "Number of expense entries",
      icon: Receipt,
      color: "emerald",
      filter: "All",
    },
  ];

  const colorStyles = {
    blue: {
      icon: "bg-blue-50 text-blue-600",
      border: "hover:border-blue-300",
    },
    violet: {
      icon: "bg-violet-50 text-violet-600",
      border: "hover:border-violet-300",
    },
    amber: {
      icon: "bg-amber-50 text-amber-600",
      border: "hover:border-amber-300",
    },
    emerald: {
      icon: "bg-emerald-50 text-emerald-600",
      border: "hover:border-emerald-300",
    },
  };

  return (
    <div className="min-h-screen space-y-6 bg-slate-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-3 text-white shadow-sm">
            <Wallet size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800">Expenses</h1>

            <p className="mt-1 text-sm text-slate-500">
              Track and manage your business expenses.
            </p>
          </div>
        </div>

        <button
          onClick={openAddForm}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={19} />
          Add Expense
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const colors = colorStyles[card.color];

          return (
            <motion.button
              key={card.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              onClick={() => {
                setDateFilter(card.filter);
                setCategoryFilter("All");
                setPaymentFilter("All");
                setSearch("");
              }}
              className={`rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md ${colors.border}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-500">
                    {card.title}
                  </p>

                  <h2 className="mt-3 break-words text-xl font-bold text-slate-800">
                    {card.value}
                  </h2>
                </div>

                <div className={`rounded-xl p-3 ${colors.icon}`}>
                  <Icon size={22} />
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-400">{card.description}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Expense Analytics */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Category Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-800">Expense Categories</h2>

              <p className="mt-1 text-xs text-slate-400">
                Category-wise spending overview
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Filter size={19} />
            </div>
          </div>

          {categorySummary.length > 0 ? (
            <div className="space-y-5">
              {categorySummary.slice(0, 5).map((item) => {
                const Icon = CATEGORY_ICONS[item.category] || MoreHorizontal;

                return (
                  <button
                    key={item.category}
                    onClick={() => {
                      setCategoryFilter(item.category);
                      setDateFilter("All");
                      setPaymentFilter("All");
                      setSearch("");
                    }}
                    className="w-full text-left"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                          <Icon size={16} />
                        </div>

                        <span className="text-sm font-semibold text-slate-700">
                          {item.category}
                        </span>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-800">
                          {formatCurrency(item.amount)}
                        </p>

                        <p className="text-xs text-slate-400">
                          {item.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{
                          width: `${item.percentage}%`,
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center">
              <Wallet className="mx-auto text-slate-300" size={30} />

              <p className="mt-3 text-sm text-slate-500">
                No expense data available yet.
              </p>
            </div>
          )}
        </div>

        {/* Monthly Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-800">Monthly Expenses</h2>

              <p className="mt-1 text-xs text-slate-400">
                Your recent monthly spending
              </p>
            </div>

            <div className="rounded-lg bg-violet-50 p-2 text-violet-600">
              <CalendarDays size={19} />
            </div>
          </div>

          {monthlySummary.length > 0 ? (
            <div className="space-y-4">
              {monthlySummary.map((item) => {
                const monthLabel = new Date(
                  `${item.month}-01T00:00:00`,
                ).toLocaleDateString("en-PK", {
                  month: "long",
                  year: "numeric",
                });

                const maxAmount = Math.max(
                  ...monthlySummary.map((m) => m.amount),
                  1,
                );

                return (
                  <button
                    key={item.month}
                    onClick={() => {
                      setDateFilter("All");
                      setSearch("");
                      setCategoryFilter("All");
                      setPaymentFilter("All");
                    }}
                    className="w-full text-left"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-slate-600">
                        {monthLabel}
                      </span>

                      <span className="text-sm font-bold text-slate-800">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-violet-500"
                        style={{
                          width: `${(item.amount / maxAmount) * 100}%`,
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center">
              <CalendarDays className="mx-auto text-slate-300" size={30} />

              <p className="mt-3 text-sm text-slate-500">
                No monthly records available.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Table Header */}
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Expense Records
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredExpenses.length} records found
            </p>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search expenses..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="All">All Categories</option>

              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="All">All Payments</option>

              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="All">All Dates</option>
              <option value="Today">Today</option>
              <option value="This Month">This Month</option>
              <option value="This Year">This Year</option>
            </select>
          </div>

          {(search ||
            categoryFilter !== "All" ||
            paymentFilter !== "All" ||
            dateFilter !== "All") && (
            <div className="flex justify-end">
              <button
                onClick={resetFilters}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Expense</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Payment Method</th>
                <th className="px-5 py-4">Amount</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((expense) => {
                const Icon = CATEGORY_ICONS[expense.category] || MoreHorizontal;

                return (
                  <tr key={expense.id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                          <Icon size={19} />
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800">
                            {expense.title}
                          </p>

                          <p className="max-w-[220px] truncate text-xs text-slate-400">
                            {expense.description || "No description"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {expense.category}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDate(expense.date)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <CreditCard size={15} className="text-slate-400" />

                        {expense.paymentMethod}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm font-bold text-slate-800">
                      {formatCurrency(expense.amount)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedExpense(expense)}
                          title="View Details"
                          className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          onClick={() => openEditForm(expense)}
                          title="Edit Expense"
                          className="rounded-lg bg-amber-50 p-2 text-amber-600 transition hover:bg-amber-100"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => handleDelete(expense)}
                          title="Delete Expense"
                          className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-5 py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <Receipt size={27} />
                    </div>

                    <h3 className="mt-4 font-semibold text-slate-700">
                      No expenses found
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      Add an expense or change your filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {filteredExpenses.length > 0 && (
          <div className="flex flex-col justify-between gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center">
            <p className="text-sm text-slate-500">
              Showing {filteredExpenses.length} expense records
            </p>

            <p className="text-sm font-bold text-slate-800">
              Filtered Total:{" "}
              {formatCurrency(
                filteredExpenses.reduce(
                  (sum, expense) => sum + Number(expense.amount || 0),
                  0,
                ),
              )}
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Expense Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {editingExpense ? "Edit Expense" : "Add New Expense"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Enter your business expense details.
                  </p>
                </div>

                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 p-6">
                {/* Expense Title */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Expense Title *
                  </label>

                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Shop Electricity Bill"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Category and Amount */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Category *
                    </label>

                    <input
                      name="category"
                      list="expense-categories"
                      value={form.category}
                      onChange={handleChange}
                      placeholder="Enter category"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <datalist id="expense-categories">
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Amount (Rs.) *
                    </label>

                    <input
                      type="number"
                      name="amount"
                      min="0.01"
                      step="0.01"
                      value={form.amount}
                      onChange={handleChange}
                      placeholder="Enter amount"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* Date and Payment Method */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Expense Date *
                    </label>

                    <input
                      type="date"
                      name="date"
                      max={today}
                      value={form.date}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Payment Method *
                    </label>

                    <select
                      name="paymentMethod"
                      value={form.paymentMethod}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Description / Notes
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Additional details about this expense..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Error */}
                {error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                    {error}
                  </p>
                )}

                {/* Actions */}
                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <Save size={17} />

                    {editingExpense ? "Update Expense" : "Save Expense"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Expense Details Modal */}
      <AnimatePresence>
        {selectedExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Expense Details
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Complete expense information
                  </p>
                </div>

                <button
                  onClick={() => setSelectedExpense(null)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5 p-6">
                <div className="rounded-2xl bg-blue-50 p-5 text-center">
                  <p className="text-sm font-medium text-blue-600">
                    Expense Amount
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-blue-800">
                    {formatCurrency(selectedExpense.amount)}
                  </h2>

                  <span className="mt-3 inline-block rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">
                    {selectedExpense.category}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-500">
                      Expense Title
                    </span>

                    <strong className="text-right text-sm text-slate-800">
                      {selectedExpense.title}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-500">Category</span>

                    <strong className="text-sm text-slate-800">
                      {selectedExpense.category}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-500">Date</span>

                    <strong className="text-sm text-slate-800">
                      {formatDate(selectedExpense.date)}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-500">
                      Payment Method
                    </span>

                    <strong className="text-sm text-slate-800">
                      {selectedExpense.paymentMethod}
                    </strong>
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-sm text-slate-500">Description</p>

                    <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                      {selectedExpense.description ||
                        "No description provided."}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs text-slate-400">Expense ID</p>

                    <p className="mt-1 break-all text-xs font-semibold text-slate-600">
                      {selectedExpense.id}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 p-5 text-right">
                <button
                  onClick={() => setSelectedExpense(null)}
                  className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
