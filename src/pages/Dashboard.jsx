import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import StatCard from "../components/StatCard";

import { useProducts } from "../context/ProductsContext";
import { useSales } from "../context/SalesContext";
import { useCustomers } from "../context/CustomersContext";

// Currency Formatter
const formatCurrency = (amount) => {
  return `Rs. ${Number(amount || 0).toLocaleString("en-PK")}`;
};

// Date Formatter
const formatDate = (date) => {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "-";

  return parsedDate.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Get Sale Total
const getSaleTotal = (sale) => {
  return Number(
    sale.grandTotal ?? sale.totalAmount ?? sale.total ?? sale.subtotal ?? 0,
  );
};

// Get Invoice Number
const getInvoiceNumber = (sale) => {
  return sale.invoiceNumber || sale.invoice || sale.id || "N/A";
};

// Get Customer Name
const getCustomerName = (sale) => {
  return sale.customerName || sale.customer?.name || "Walk-in Customer";
};

// Get Product Names
const getProductNames = (sale) => {
  if (!sale.items || !sale.items.length) {
    return "No products";
  }

  return sale.items
    .map((item) => item.name || item.productName || "Product")
    .join(", ");
};

// Get Sale Date
const getSaleDate = (sale) => {
  return sale.saleDate || sale.createdAt || sale.date || null;
};

function Dashboard() {
  const navigate = useNavigate();

  // Context Data
  const { products = [] } = useProducts();
  const { sales = [] } = useSales();
  const { customers = [] } = useCustomers();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // -----------------------------------
  // Dashboard Statistics
  // -----------------------------------

  const totalRevenue = useMemo(() => {
    return sales.reduce((total, sale) => {
      return total + getSaleTotal(sale);
    }, 0);
  }, [sales]);

  const totalSales = sales.length;

  const totalProducts = products.length;

  const totalCustomers = customers.length;

  // Low Stock Products
  const lowStockProducts = useMemo(() => {
    return products.filter((product) => {
      const stock = Number(product.stock || 0);
      const minStock = Number(product.minStock || 0);

      return stock <= minStock;
    });
  }, [products]);

  const outOfStockProducts = useMemo(() => {
    return products.filter((product) => {
      return Number(product.stock || 0) <= 0;
    });
  }, [products]);

  // -----------------------------------
  // Monthly Sales Chart
  // -----------------------------------

  const salesData = useMemo(() => {
    const currentYear = new Date().getFullYear();

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const monthlySales = months.map((month, index) => {
      return {
        month,
        sales: 0,
        monthIndex: index,
      };
    });

    sales.forEach((sale) => {
      const date = getSaleDate(sale);

      if (!date) return;

      const parsedDate = new Date(date);

      if (
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.getFullYear() !== currentYear
      ) {
        return;
      }

      const monthIndex = parsedDate.getMonth();

      monthlySales[monthIndex].sales += getSaleTotal(sale);
    });

    return monthlySales;
  }, [sales]);

  // -----------------------------------
  // Stock Summary
  // -----------------------------------

  const stockSummary = useMemo(() => {
    const categories = {};

    products.forEach((product) => {
      const category = product.category || "Other";

      if (!categories[category]) {
        categories[category] = {
          name: category,
          total: 0,
          healthy: 0,
          low: 0,
          out: 0,
        };
      }

      categories[category].total += 1;

      const stock = Number(product.stock || 0);
      const minStock = Number(product.minStock || 0);

      if (stock <= 0) {
        categories[category].out += 1;
      } else if (stock <= minStock) {
        categories[category].low += 1;
      } else {
        categories[category].healthy += 1;
      }
    });

    return Object.values(categories).map((category) => ({
      ...category,

      percentage: category.total
        ? Math.round((category.healthy / category.total) * 100)
        : 0,
    }));
  }, [products]);

  // -----------------------------------
  // Recent Transactions
  // -----------------------------------

  const transactions = useMemo(() => {
    return [...sales].sort((a, b) => {
      const dateA = new Date(getSaleDate(a) || 0).getTime();
      const dateB = new Date(getSaleDate(b) || 0).getTime();

      return dateB - dateA;
    });
  }, [sales]);

  // -----------------------------------
  // Pagination
  // -----------------------------------

  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentTransactions = transactions.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleItemsPerPage = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // -----------------------------------
  // Navigation
  // -----------------------------------

  const handleCardNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="space-y-8">
      {/* ================================= */}
      {/* Page Heading */}
      {/* ================================= */}

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Dashboard Overview
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor your steel business performance.
          </p>
        </div>

        <button
          onClick={() => navigate("/pos")}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
        >
          <ShoppingCart size={18} />
          New Sale
        </button>
      </motion.div>

      {/* ================================= */}
      {/* Statistics Cards */}
      {/* ================================= */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {/* Revenue Card */}

        <motion.div
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleCardNavigation("/reports")}
          className="cursor-pointer rounded-2xl transition focus-within:ring-2 focus-within:ring-blue-500"
        >
          <StatCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            icon={DollarSign}
            change="View reports"
            color="bg-blue-50 text-blue-600"
          />

          <p className="px-5 pb-3 text-xs font-medium text-blue-600">
            Explore revenue <ArrowUpRight size={13} className="inline" />
          </p>
        </motion.div>

        {/* Sales Card */}

        <motion.div
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleCardNavigation("/reports")}
          className="cursor-pointer rounded-2xl transition"
        >
          <StatCard
            title="Total Sales"
            value={totalSales.toLocaleString()}
            icon={ShoppingCart}
            change="View transactions"
            color="bg-emerald-50 text-emerald-600"
          />

          <p className="px-5 pb-3 text-xs font-medium text-emerald-600">
            Explore sales <ArrowUpRight size={13} className="inline" />
          </p>
        </motion.div>

        {/* Products Card */}

        <motion.div
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleCardNavigation("/products")}
          className="cursor-pointer rounded-2xl transition"
        >
          <StatCard
            title="Total Products"
            value={totalProducts.toLocaleString()}
            icon={Package}
            change={`${lowStockProducts.length} low stock`}
            color="bg-orange-50 text-orange-600"
          />

          <p className="px-5 pb-3 text-xs font-medium text-orange-600">
            Manage products <ArrowUpRight size={13} className="inline" />
          </p>
        </motion.div>

        {/* Customers Card */}

        <motion.div
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleCardNavigation("/customers")}
          className="cursor-pointer rounded-2xl transition"
        >
          <StatCard
            title="Total Customers"
            value={totalCustomers.toLocaleString()}
            icon={Users}
            change="View customers"
            color="bg-purple-50 text-purple-600"
          />

          <p className="px-5 pb-3 text-xs font-medium text-purple-600">
            Manage customers <ArrowUpRight size={13} className="inline" />
          </p>
        </motion.div>
      </div>

      {/* ================================= */}
      {/* Chart and Stock Summary */}
      {/* ================================= */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Sales Chart */}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-2 md:p-6"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-800">Sales Overview</h2>

              <p className="mt-1 text-xs text-slate-400">
                Monthly sales for {new Date().getFullYear()}
              </p>
            </div>

            <span className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600">
              This Year
            </span>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient
                    id="salesGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />

                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#eef2f7"
                />

                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  tickFormatter={(value) => `${value / 1000}k`}
                />

                <Tooltip
                  formatter={(value) => [formatCurrency(value), "Sales"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fill="url(#salesGradient)"
                  animationDuration={1200}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Stock Summary */}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Stock Summary</h2>

            <MoreHorizontal className="text-slate-400" size={20} />
          </div>

          <p className="mt-2 text-xs text-slate-400">
            Product availability by category
          </p>

          {/* Stock Alerts */}

          <div className="mt-5 flex gap-3">
            <div className="flex-1 rounded-xl bg-orange-50 p-3">
              <p className="text-xs text-orange-600">Low Stock</p>

              <h3 className="mt-1 text-xl font-bold text-orange-700">
                {lowStockProducts.length}
              </h3>
            </div>

            <div className="flex-1 rounded-xl bg-red-50 p-3">
              <p className="text-xs text-red-600">Out of Stock</p>

              <h3 className="mt-1 text-xl font-bold text-red-700">
                {outOfStockProducts.length}
              </h3>
            </div>
          </div>

          {/* Categories */}

          <div className="mt-7 space-y-6">
            {stockSummary.length > 0 ? (
              stockSummary.slice(0, 5).map((item) => (
                <div key={item.name}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-600">
                      {item.name}
                    </span>

                    <span className="text-xs font-bold text-slate-800">
                      {item.healthy}/{item.total} Healthy
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.percentage > 60
                          ? "bg-emerald-500"
                          : item.percentage > 30
                            ? "bg-orange-500"
                            : "bg-red-500"
                      }`}
                      style={{
                        width: `${item.percentage}%`,
                      }}
                    />
                  </div>

                  <div className="mt-2 flex gap-3 text-[11px]">
                    <span className="text-emerald-600">
                      {item.healthy} Healthy
                    </span>

                    <span className="text-orange-600">{item.low} Low</span>

                    <span className="text-red-600">{item.out} Out</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <Package size={32} className="mx-auto text-slate-300" />

                <p className="mt-2 text-sm text-slate-400">
                  No products available.
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate("/inventory")}
            className="mt-7 w-full rounded-xl bg-slate-50 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            View Inventory
          </button>
        </motion.div>
      </div>

      {/* ================================= */}
      {/* Recent Transactions */}
      {/* ================================= */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
      >
        {/* Table Header */}

        <div className="flex items-center justify-between border-b border-slate-100 p-5 md:p-6">
          <div>
            <h2 className="font-bold text-slate-800">Recent Transactions</h2>

            <p className="mt-1 text-xs text-slate-400">
              Latest sales from your store
            </p>
          </div>

          <button
            onClick={() => navigate("/reports")}
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            View All
          </button>
        </div>

        {/* Transactions Table */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Invoice</th>

                <th className="px-6 py-4 font-semibold">Customer</th>

                <th className="px-6 py-4 font-semibold">Product</th>

                <th className="px-6 py-4 font-semibold">Date</th>

                <th className="px-6 py-4 font-semibold">Amount</th>

                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {currentTransactions.map((item, index) => {
                const status = item.paymentStatus || item.status || "Unpaid";

                const isPaid = status.toLowerCase() === "paid";

                const isPartial = status.toLowerCase() === "partial";

                return (
                  <tr
                    key={item.id || item.invoiceNumber || index}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                      {getInvoiceNumber(item)}
                    </td>

                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      {getCustomerName(item)}
                    </td>

                    <td className="max-w-[200px] truncate px-6 py-4 text-sm text-slate-500">
                      {getProductNames(item)}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(getSaleDate(item))}
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                      {formatCurrency(getSaleTotal(item))}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isPaid
                            ? "bg-emerald-50 text-emerald-600"
                            : isPartial
                              ? "bg-blue-50 text-blue-600"
                              : "bg-orange-50 text-orange-600"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {/* Empty State */}

              {currentTransactions.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-14 text-center">
                    <div className="flex flex-col items-center">
                      <ShoppingCart size={35} className="text-slate-300" />

                      <h3 className="mt-3 font-semibold text-slate-700">
                        No Transactions Yet
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        Your completed sales will appear here.
                      </p>

                      <button
                        onClick={() => navigate("/pos")}
                        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                      >
                        Create First Sale
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ================================= */}
        {/* Pagination */}
        {/* ================================= */}

        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row md:px-6">
          {/* Records Information */}

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Rows per page:</span>

              <select
                value={itemsPerPage}
                onChange={handleItemsPerPage}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-800">
                {transactions.length === 0 ? 0 : startIndex + 1}
              </span>
              {" - "}
              <span className="font-semibold text-slate-800">
                {Math.min(startIndex + itemsPerPage, transactions.length)}
              </span>
              {" of "}
              <span className="font-semibold text-slate-800">
                {transactions.length}
              </span>
              {" records"}
            </p>
          </div>

          {/* Pagination Buttons */}

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-9 w-9 rounded-lg text-xs font-semibold transition ${
                    currentPage === page
                      ? "bg-blue-600 text-white shadow-md"
                      : "border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  {page}
                </button>
              ),
            )}

            <button
              onClick={handleNext}
              disabled={currentPage === totalPages || totalPages === 0}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ================================= */}
      {/* Low Stock Alert */}
      {/* ================================= */}

      {lowStockProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col justify-between gap-4 rounded-2xl border border-orange-100 bg-orange-50 p-5 sm:flex-row sm:items-center"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-orange-100 p-3 text-orange-600">
              <AlertTriangle size={22} />
            </div>

            <div>
              <h3 className="font-bold text-orange-800">Inventory Alert</h3>

              <p className="mt-1 text-sm text-orange-700">
                {lowStockProducts.length} product(s) have low or zero stock.
                Check your inventory.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/inventory")}
            className="whitespace-nowrap rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Check Inventory
          </button>
        </motion.div>
      )}
    </div>
  );
}

export default Dashboard;
