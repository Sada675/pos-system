import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useProducts } from "../context/ProductsContext";
import { useSales } from "../context/SalesContext";

import {
  Search,
  Package,
  Boxes,
  AlertTriangle,
  TrendingUp,
  X,
  Save,
  History,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Ban,
  ClipboardList,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  Settings2,
} from "lucide-react";

const HISTORY_KEY = "steel-store-stock-history";

const Inventory = () => {
  // Shared application data
  const { products = [], setProducts, categories = [] } = useProducts();

  const { sales = [] } = useSales();

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");

  // Modals
  const [showStockModal, setShowStockModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);

  // Stock reconciliation
  const [actualStock, setActualStock] = useState("");
  const [stockReason, setStockReason] = useState("Physical Count");
  const [stockNote, setStockNote] = useState("");

  // Availability
  const [availability, setAvailability] = useState("available");
  const [statusNote, setStatusNote] = useState("");

  // Inventory history
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // Persist inventory history
  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  // Currency formatter
  const formatCurrency = (amount) => {
    return `Rs. ${Number(amount || 0).toLocaleString("en-PK", {
      maximumFractionDigits: 2,
    })}`;
  };

  // Date formatter
  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Invalid date";
    }

    return parsedDate.toLocaleString("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // Get product stock status
  const getProductStatus = (product) => {
    const stock = Number(product.stock || 0);
    const minimum = Number(product.minStock ?? 5);

    if (stock <= 0) {
      return {
        label: "Out of Stock",
        color: "bg-red-50 text-red-600 border-red-100",
        icon: XCircle,
      };
    }

    if (product.availabilityStatus === "unavailable") {
      return {
        label: "Unavailable",
        color: "bg-slate-100 text-slate-600 border-slate-200",
        icon: Ban,
      };
    }

    if (stock <= minimum) {
      return {
        label: "Low Stock",
        color: "bg-orange-50 text-orange-600 border-orange-100",
        icon: AlertTriangle,
      };
    }

    return {
      label: "In Stock",
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
      icon: CheckCircle2,
    };
  };

  // Real inventory statistics
  const stats = useMemo(() => {
    const totalProducts = products.length;

    const totalStock = products.reduce(
      (sum, product) => sum + Number(product.stock || 0),
      0,
    );

    const stockValue = products.reduce(
      (sum, product) =>
        sum + Number(product.stock || 0) * Number(product.purchasePrice || 0),
      0,
    );

    const lowStock = products.filter((product) => {
      const stock = Number(product.stock || 0);

      return (
        stock > 0 &&
        stock <= Number(product.minStock ?? 5) &&
        product.availabilityStatus !== "unavailable"
      );
    }).length;

    const outOfStock = products.filter(
      (product) => Number(product.stock || 0) <= 0,
    ).length;

    const unavailable = products.filter(
      (product) =>
        Number(product.stock || 0) > 0 &&
        product.availabilityStatus === "unavailable",
    ).length;

    const inStock = products.filter((product) => {
      const stock = Number(product.stock || 0);

      return (
        stock > Number(product.minStock ?? 5) &&
        product.availabilityStatus !== "unavailable"
      );
    }).length;

    return {
      totalProducts,
      totalStock,
      stockValue,
      lowStock,
      outOfStock,
      unavailable,
      inStock,
    };
  }, [products]);

  // Merge inventory activities and completed POS sales
  const activityHistory = useMemo(() => {
    const inventoryActivities = history.map((item) => ({
      ...item,
      source: "inventory",
    }));

    const salesActivities = sales.flatMap((sale) => {
      const items = sale.items || [];

      return items.map((item, index) => ({
        id: `sale-${sale.id}-${item.id || item.productId}-${index}`,

        productId: item.id || item.productId,

        productName: item.name || item.productName || "Unknown Product",

        type: "sale",

        quantity: Number(item.quantity || 0),

        difference: -Number(item.quantity || 0),

        unit: item.unit || "pcs",

        invoiceNumber: sale.invoiceNumber || sale.id || "N/A",

        customerName: sale.customerName || "Walk-in Customer",

        date: sale.saleDate || sale.createdAt || sale.date,

        source: "sales",
      }));
    });

    return [...inventoryActivities, ...salesActivities].sort(
      (a, b) => new Date(b.date || 0) - new Date(a.date || 0),
    );
  }, [history, sales]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        product.name?.toLowerCase().includes(searchValue) ||
        product.size?.toLowerCase().includes(searchValue) ||
        product.category?.toLowerCase().includes(searchValue);

      const matchesCategory =
        categoryFilter === "All" || product.category === categoryFilter;

      const stock = Number(product.stock || 0);
      const minimum = Number(product.minStock ?? 5);

      let matchesStatus = true;

      switch (stockFilter) {
        case "In Stock":
          matchesStatus =
            stock > minimum && product.availabilityStatus !== "unavailable";
          break;

        case "Low Stock":
          matchesStatus =
            stock > 0 &&
            stock <= minimum &&
            product.availabilityStatus !== "unavailable";
          break;

        case "Out of Stock":
          matchesStatus = stock <= 0;
          break;

        case "Unavailable":
          matchesStatus =
            stock > 0 && product.availabilityStatus === "unavailable";
          break;

        default:
          matchesStatus = true;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, search, categoryFilter, stockFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const endIndex = Math.min(startIndex + itemsPerPage, filteredProducts.length);

  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  );

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, stockFilter, itemsPerPage]);

  // Keep current page valid when filtered products change
  useEffect(() => {
    if (totalPages === 0) {
      setCurrentPage(1);
    } else if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Open stock reconciliation modal
  const openStockModal = (product) => {
    setSelectedProduct(product);

    setActualStock(String(Number(product.stock || 0)));

    setStockReason("Physical Count");

    setStockNote("");

    setShowStockModal(true);
  };

  // Calculate stock difference
  const stockDifference = selectedProduct
    ? Number(actualStock) - Number(selectedProduct.stock || 0)
    : 0;

  // Save physical stock correction
  const handleStockUpdate = (e) => {
    e.preventDefault();

    if (!selectedProduct) return;

    if (
      actualStock === "" ||
      !Number.isFinite(Number(actualStock)) ||
      Number(actualStock) < 0
    ) {
      alert("Please enter a valid stock quantity.");
      return;
    }

    const newStock = Number(actualStock);

    const currentProduct = products.find(
      (product) => product.id === selectedProduct.id,
    );

    if (!currentProduct) {
      alert("Product not found.");
      return;
    }

    const previousStock = Number(currentProduct.stock || 0);

    const difference = newStock - previousStock;

    if (difference === 0) {
      setShowStockModal(false);
      setSelectedProduct(null);
      return;
    }

    // Update shared ProductsContext
    setProducts((previous) =>
      previous.map((product) =>
        product.id === selectedProduct.id
          ? {
              ...product,
              stock: newStock,
            }
          : product,
      ),
    );

    // Record activity
    const activity = {
      id: `reconciliation-${Date.now()}`,

      productId: selectedProduct.id,

      productName: selectedProduct.name,

      type: "reconciliation",

      previousStock,

      newStock,

      difference,

      reason: stockReason,

      note: stockNote.trim(),

      unit: currentProduct.unit || "pcs",

      date: new Date().toISOString(),
    };

    setHistory((previous) => [activity, ...previous]);

    setShowStockModal(false);

    setSelectedProduct(null);
  };

  // Open availability modal
  const openStatusModal = (product) => {
    setSelectedProduct(product);

    setAvailability(product.availabilityStatus || "available");

    setStatusNote("");

    setShowStatusModal(true);
  };

  // Save availability
  const handleStatusUpdate = (e) => {
    e.preventDefault();

    if (!selectedProduct) return;

    const currentProduct = products.find(
      (product) => product.id === selectedProduct.id,
    );

    if (!currentProduct) {
      alert("Product not found.");
      return;
    }

    if (Number(currentProduct.stock || 0) <= 0) {
      alert(
        "This product has zero stock. Add stock before changing its availability.",
      );
      return;
    }

    const previousStatus = currentProduct.availabilityStatus || "available";

    if (previousStatus === availability) {
      setShowStatusModal(false);
      setSelectedProduct(null);
      return;
    }

    // Update shared ProductsContext
    setProducts((previous) =>
      previous.map((product) =>
        product.id === selectedProduct.id
          ? {
              ...product,
              availabilityStatus: availability,
            }
          : product,
      ),
    );

    // Record activity
    const activity = {
      id: `availability-${Date.now()}`,

      productId: selectedProduct.id,

      productName: selectedProduct.name,

      type: "availability",

      previousStatus,

      newStatus: availability,

      note: statusNote.trim(),

      date: new Date().toISOString(),
    };

    setHistory((previous) => [activity, ...previous]);

    setShowStatusModal(false);

    setSelectedProduct(null);
  };

  // Reset filters
  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("All");
    setStockFilter("All");
    setCurrentPage(1);
  };

  // Close modals
  const closeStockModal = () => {
    setShowStockModal(false);
    setSelectedProduct(null);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen space-y-7 bg-[#f8fafc] p-4 md:p-7">
      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
            <Boxes size={17} />
            Inventory Management
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-800 md:text-3xl">
            Inventory Overview
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Monitor product quantities, availability and stock activity.
          </p>
        </div>

        <button
          onClick={resetFilters}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <RotateCcw size={17} />
          Reset Filters
        </button>
      </div>

      {/* STATISTICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          subtitle="Registered products"
          icon={Package}
          color="blue"
        />

        <StatCard
          title="Total Quantity"
          value={stats.totalStock.toLocaleString()}
          subtitle="Combined stock units"
          icon={Boxes}
          color="purple"
        />

        <StatCard
          title="Inventory Value"
          value={formatCurrency(stats.stockValue)}
          subtitle="Calculated at purchase cost"
          icon={TrendingUp}
          color="emerald"
        />

        <StatCard
          title="Stock Alerts"
          value={stats.lowStock + stats.outOfStock}
          subtitle={`${stats.lowStock} low stock · ${stats.outOfStock} out of stock`}
          icon={AlertTriangle}
          color="orange"
        />
      </div>

      {/* STOCK ALERTS */}
      {(stats.lowStock > 0 ||
        stats.outOfStock > 0 ||
        stats.unavailable > 0) && (
        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <AlertTriangle size={21} />
            </div>

            <div>
              <h3 className="font-bold text-slate-800">
                Inventory Needs Attention
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                {stats.lowStock} products have low stock, {stats.outOfStock} are
                out of stock and {stats.unavailable} are marked unavailable.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STOCK SUMMARY */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          title="In Stock"
          count={stats.inStock}
          color="emerald"
          onClick={() => setStockFilter("In Stock")}
        />

        <SummaryCard
          title="Low Stock"
          count={stats.lowStock}
          color="orange"
          onClick={() => setStockFilter("Low Stock")}
        />

        <SummaryCard
          title="Out of Stock"
          count={stats.outOfStock}
          color="red"
          onClick={() => setStockFilter("Out of Stock")}
        />
      </div>

      {/* PRODUCT INVENTORY */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* TABLE HEADER */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Product Inventory
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Check current stock and manage product availability.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {/* SEARCH */}
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-52"
              />
            </div>

            {/* CATEGORY */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="All">All Categories</option>

              {categories.map((category) => (
                <option
                  key={category.id ?? category.name}
                  value={category.name}
                >
                  {category.name}
                </option>
              ))}
            </select>

            {/* STATUS */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="All">All Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Purchase Price</th>
                <th className="px-5 py-4">Available Quantity</th>
                <th className="px-5 py-4">Minimum Level</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((product, index) => {
                  const status = getProductStatus(product);
                  const StatusIcon = status.icon;

                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.025 }}
                      className="transition hover:bg-slate-50"
                    >
                      {/* PRODUCT */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Package size={19} />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-800">
                              {product.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {product.size || "Standard"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* CATEGORY */}
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {product.category || "Uncategorized"}
                      </td>

                      {/* PURCHASE PRICE */}
                      <td className="px-5 py-4 text-sm font-medium text-slate-700">
                        {formatCurrency(product.purchasePrice)}
                      </td>

                      {/* AVAILABLE QUANTITY */}
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800">
                          {Number(product.stock || 0).toLocaleString()}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {product.unit || "pcs"}
                        </p>
                      </td>

                      {/* MINIMUM LEVEL */}
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {product.minStock ?? 5} {product.unit || "pcs"}
                      </td>

                      {/* STATUS */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${status.color}`}
                        >
                          <StatusIcon size={14} />
                          {status.label}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openStockModal(product)}
                            title="Reconcile Physical Stock"
                            className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
                          >
                            <ClipboardList size={16} />
                            Count
                          </button>

                          <button
                            onClick={() => openStatusModal(product)}
                            title="Manage Availability"
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                          >
                            <Settings2 size={17} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-5 py-16 text-center">
                    <Package
                      size={40}
                      className="mx-auto mb-3 text-slate-300"
                    />

                    <h3 className="font-semibold text-slate-700">
                      No Products Found
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      Try changing your search or filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {/* PAGINATION */}
        <div className="flex flex-col justify-between gap-4 border-t border-slate-100 p-4 lg:flex-row lg:items-center">
          {/* LEFT SIDE: ROWS PER PAGE + SHOWING RECORDS */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* ROWS PER PAGE */}
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-xs font-medium text-slate-500">
                Rows per page
              </span>

              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
              >
                {[6, 8, 12, 24, 48].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            {/* SHOWING RECORDS */}
            <p className="text-xs font-medium text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-700">
                {filteredProducts.length === 0 ? 0 : startIndex + 1}–{endIndex}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-700">
                {filteredProducts.length}
              </span>{" "}
              products
            </p>
          </div>

          {/* RIGHT SIDE: PAGE NAVIGATION */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* PREVIOUS */}
            <button
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1 || totalPages === 0}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
              title="Previous Page"
            >
              <ChevronLeft size={17} />
            </button>

            {/* PAGE NUMBERS */}
            {pageNumbers.map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition ${
                  currentPage === page
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-200"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                {page}
              </button>
            ))}

            {/* NEXT */}
            <button
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              disabled={currentPage >= totalPages || totalPages === 0}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
              title="Next Page"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <History size={20} />
            </div>

            <div>
              <h2 className="font-bold text-slate-800">
                Recent Inventory Activity
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Record of stock, POS sales and availability changes.
              </p>
            </div>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
            {activityHistory.length} Activities
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {activityHistory.length > 0 ? (
            activityHistory.slice(0, 7).map((item) => {
              const isIncrease =
                item.type === "reconciliation"
                  ? Number(item.difference) > 0
                  : item.type === "add";

              const isSale = item.type === "sale";

              const isStockActivity =
                item.type === "reconciliation" ||
                item.type === "add" ||
                item.type === "remove" ||
                isSale;

              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        !isStockActivity
                          ? "bg-blue-50 text-blue-600"
                          : isIncrease
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-red-50 text-red-600"
                      }`}
                    >
                      {!isStockActivity ? (
                        <Settings2 size={19} />
                      ) : isIncrease ? (
                        <ArrowUpRight size={19} />
                      ) : (
                        <ArrowDownRight size={19} />
                      )}
                    </div>

                    <div>
                      <p className="font-semibold text-slate-800">
                        {item.productName}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {formatDate(item.date)}
                      </p>

                      {isSale && (
                        <>
                          <p className="mt-1 text-xs font-medium text-blue-600">
                            POS Sale · Invoice: {item.invoiceNumber}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Customer: {item.customerName}
                          </p>
                        </>
                      )}

                      {item.reason && (
                        <p className="mt-1 text-xs text-slate-500">
                          Reason: {item.reason}
                        </p>
                      )}

                      {item.note && (
                        <p className="mt-1 text-xs text-slate-500">
                          Note: {item.note}
                        </p>
                      )}

                      {item.type === "availability" && (
                        <p className="mt-1 text-xs text-blue-600">
                          {item.previousStatus} → {item.newStatus}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pl-12 sm:pl-0">
                    {isStockActivity ? (
                      <div className="text-right">
                        <p
                          className={`font-bold ${
                            isIncrease ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {isIncrease ? "+" : "-"}
                          {Math.abs(
                            Number(item.difference ?? item.quantity ?? 0),
                          ).toLocaleString()}

                          {item.unit ? ` ${item.unit}` : ""}
                        </p>

                        {item.type !== "sale" && (
                          <p className="mt-1 text-xs text-slate-400">
                            {item.previousStock} → {item.newStock}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-blue-600">
                        Availability Updated
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-10 text-center">
              <History size={35} className="mx-auto mb-3 text-slate-300" />

              <p className="font-medium text-slate-600">No Activity Yet</p>

              <p className="mt-1 text-sm text-slate-400">
                POS sales and inventory changes will appear here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* STOCK RECONCILIATION MODAL */}
      <AnimatePresence>
        {showStockModal && selectedProduct && (
          <Modal onClose={closeStockModal}>
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-blue-600">
                    <ClipboardList size={17} />
                    Inventory Reconciliation
                  </div>

                  <h2 className="text-xl font-bold text-slate-800">
                    Update Physical Stock
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Enter the actual quantity counted in your store.
                  </p>
                </div>

                <button
                  onClick={closeStockModal}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleStockUpdate} className="space-y-5 p-5">
              {/* PRODUCT */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Selected Product
                </p>

                <h3 className="mt-1 font-bold text-slate-800">
                  {selectedProduct.name}
                </h3>

                <div className="mt-3 flex justify-between">
                  <span className="text-sm text-slate-500">
                    Current system quantity
                  </span>

                  <span className="font-bold text-slate-800">
                    {selectedProduct.stock || 0} {selectedProduct.unit || "pcs"}
                  </span>
                </div>
              </div>

              {/* ACTUAL STOCK */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Actual Physical Quantity
                </label>

                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={actualStock}
                  onChange={(e) => setActualStock(e.target.value)}
                  placeholder="Enter actual stock quantity"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-semibold outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Count the physical products and enter the total quantity.
                </p>
              </div>

              {/* DIFFERENCE */}
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">
                    Stock Difference
                  </span>

                  <span
                    className={`text-lg font-bold ${
                      stockDifference > 0
                        ? "text-emerald-600"
                        : stockDifference < 0
                          ? "text-red-600"
                          : "text-slate-600"
                    }`}
                  >
                    {stockDifference > 0 ? "+" : ""}
                    {Number.isFinite(stockDifference)
                      ? stockDifference
                      : 0}{" "}
                    {selectedProduct.unit || "pcs"}
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  {stockDifference > 0
                    ? "Physical stock is higher than the system record."
                    : stockDifference < 0
                      ? "Physical stock is lower than the system record."
                      : "No difference detected. Stock is already correct."}
                </p>
              </div>

              {/* REASON */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Reason for Correction
                </label>

                <select
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="Physical Count">Physical Stock Count</option>

                  <option value="Damaged Goods">Damaged Goods</option>

                  <option value="Lost Goods">Missing / Lost Goods</option>

                  <option value="Data Correction">
                    Previous Entry Correction
                  </option>

                  <option value="Other">Other Reason</option>
                </select>
              </div>

              {/* NOTE */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Additional Note (Optional)
                </label>

                <textarea
                  rows="3"
                  value={stockNote}
                  onChange={(e) => setStockNote(e.target.value)}
                  placeholder="Write a short explanation..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={stockDifference === 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Save size={18} />
                Save Stock Correction
              </button>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* AVAILABILITY MODAL */}
      <AnimatePresence>
        {showStatusModal && selectedProduct && (
          <Modal onClose={closeStatusModal}>
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-blue-600">
                    <Settings2 size={17} />
                    Product Availability
                  </div>

                  <h2 className="text-xl font-bold text-slate-800">
                    Manage Availability
                  </h2>
                </div>

                <button
                  onClick={closeStatusModal}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleStatusUpdate} className="space-y-5 p-5">
              {/* PRODUCT */}
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Selected Product
                </p>

                <h3 className="mt-1 font-bold text-slate-800">
                  {selectedProduct.name}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Available Quantity:{" "}
                  <strong>
                    {selectedProduct.stock || 0} {selectedProduct.unit || "pcs"}
                  </strong>
                </p>
              </div>

              {/* AVAILABILITY */}
              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-700">
                  Select Availability
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={Number(selectedProduct.stock || 0) <= 0}
                    onClick={() => setAvailability("available")}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      availability === "available"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 text-slate-500"
                    }`}
                  >
                    <CheckCircle2 size={18} />
                    Available
                  </button>

                  <button
                    type="button"
                    disabled={Number(selectedProduct.stock || 0) <= 0}
                    onClick={() => setAvailability("unavailable")}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      availability === "unavailable"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-slate-200 text-slate-500"
                    }`}
                  >
                    <Ban size={18} />
                    Unavailable
                  </button>
                </div>

                {Number(selectedProduct.stock || 0) <= 0 && (
                  <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-600">
                    This product is out of stock. Receive new stock before
                    making it available.
                  </p>
                )}
              </div>

              {/* NOTE */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Reason (Optional)
                </label>

                <textarea
                  rows="3"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Why is this product unavailable?"
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={Number(selectedProduct.stock || 0) <= 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Save size={18} />
                Save Availability
              </button>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

// STATISTICS CARD
const StatCard = ({ title, value, subtitle, icon: Icon, color }) => {
  const styles = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    emerald: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <h3 className="mt-3 text-2xl font-bold text-slate-800">{value}</h3>
        </div>

        <div className={`rounded-xl p-3 ${styles[color]}`}>
          <Icon size={22} />
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">{subtitle}</p>
    </motion.div>
  );
};

// SUMMARY CARD
const SummaryCard = ({ title, count, color, onClick }) => {
  const styles = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",

    orange: "border-orange-100 bg-orange-50 text-orange-700",

    red: "border-red-100 bg-red-50 text-red-700",
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between rounded-2xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-sm ${styles[color]}`}
    >
      <div>
        <p className="text-sm font-semibold opacity-80">{title}</p>

        <h3 className="mt-2 text-2xl font-bold">{count}</h3>
      </div>

      <ArrowUpRight size={22} />
    </button>
  );
};

// REUSABLE MODAL
const Modal = ({ children, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.96,
          y: 15,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.96,
          y: 15,
        }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

export default Inventory;
