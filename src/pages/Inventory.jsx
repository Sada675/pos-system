import { useEffect, useMemo, useRef, useState } from "react";
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
  Filter,
  CalendarDays,
  Activity,
} from "lucide-react";

const HISTORY_KEY = "steel-store-stock-history";

const DEFAULT_MIN_STOCK = 5;

const STOCK_REASONS = [
  { value: "Physical Count", label: "Physical Stock Count" },
  { value: "Damaged Goods", label: "Damaged Goods" },
  { value: "Lost Goods", label: "Missing / Lost Goods" },
  { value: "Data Correction", label: "Previous Entry Correction" },
  { value: "Other", label: "Other Reason" },
];

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const getStock = (product) => Math.max(0, toNumber(product?.stock));

const getMinimumStock = (product) => {
  const minimum = Number(product?.minStock);

  return Number.isFinite(minimum) && minimum >= 0 ? minimum : DEFAULT_MIN_STOCK;
};

const getProductId = (product) => product?.id ?? product?._id;

const getProductUnit = (product) => product?.unit || "pcs";

const formatCurrency = (amount) => {
  return `Rs. ${toNumber(amount).toLocaleString("en-PK", {
    maximumFractionDigits: 2,
  })}`;
};

const formatQuantity = (quantity) => {
  return toNumber(quantity).toLocaleString("en-PK", {
    maximumFractionDigits: 2,
  });
};

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

const getValidDate = (date) => {
  const parsed = new Date(date || 0);

  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const getProductStatus = (product) => {
  const stock = getStock(product);
  const minimum = getMinimumStock(product);

  if (stock <= 0) {
    return {
      label: "Out of Stock",
      color: "border-red-100 bg-red-50 text-red-700",
      icon: XCircle,
    };
  }

  if (product.availabilityStatus === "unavailable") {
    return {
      label: "Unavailable",
      color: "border-slate-200 bg-slate-100 text-slate-700",
      icon: Ban,
    };
  }

  if (stock <= minimum) {
    return {
      label: "Low Stock",
      color: "border-orange-100 bg-orange-50 text-orange-700",
      icon: AlertTriangle,
    };
  }

  return {
    label: "In Stock",
    color: "border-emerald-100 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  };
};

const readHistory = () => {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);

    if (!saved) return [];

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const Inventory = () => {
  const { products = [], setProducts, categories = [] } = useProducts();

  const { sales = [] } = useSales();

  const inventoryTableRef = useRef(null);

  // FILTERS

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");

  // MODALS

  const [showStockModal, setShowStockModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);

  // STOCK RECONCILIATION

  const [actualStock, setActualStock] = useState("");
  const [stockReason, setStockReason] = useState("Physical Count");
  const [stockNote, setStockNote] = useState("");

  // PRODUCT AVAILABILITY

  const [availability, setAvailability] = useState("available");
  const [statusNote, setStatusNote] = useState("");

  // INVENTORY HISTORY

  const [history, setHistory] = useState(readHistory);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error("Unable to save inventory history:", error);
    }
  }, [history]);

  // PAGINATION

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // STOCK DIFFERENCE

  const stockDifference = useMemo(() => {
    if (!selectedProduct || actualStock === "") return 0;

    const enteredStock = Number(actualStock);

    if (!Number.isFinite(enteredStock)) return 0;

    return enteredStock - getStock(selectedProduct);
  }, [actualStock, selectedProduct]);

  const isValidActualStock =
    actualStock !== "" &&
    Number.isFinite(Number(actualStock)) &&
    Number(actualStock) >= 0;

  // INVENTORY STATISTICS

  const stats = useMemo(() => {
    const totalProducts = products.length;

    const inStock = products.filter((product) => {
      return getProductStatus(product).label === "In Stock";
    }).length;

    const lowStock = products.filter((product) => {
      return getProductStatus(product).label === "Low Stock";
    }).length;

    const outOfStock = products.filter((product) => {
      return getStock(product) <= 0;
    }).length;

    const stockValue = products.reduce((total, product) => {
      return total + getStock(product) * toNumber(product.purchasePrice);
    }, 0);

    return {
      totalProducts,
      inStock,
      lowStock,
      outOfStock,
      stockValue,
      stockAlerts: lowStock + outOfStock,
    };
  }, [products]);

  // INVENTORY ACTIVITY

  const activityHistory = useMemo(() => {
    const inventoryActivities = history.map((item) => ({
      ...item,
      source: "inventory",
    }));

    const salesActivities = sales.flatMap((sale) => {
      const items = Array.isArray(sale.items) ? sale.items : [];

      return items
        .filter((item) => toNumber(item.quantity) > 0)
        .map((item, index) => {
          const productId = item.productId ?? item.id ?? null;

          return {
            id: `sale-${sale.id ?? sale.invoiceNumber}-${productId ?? index}-${index}`,
            productId,
            productName: item.name || item.productName || "Unknown Product",
            type: "sale",
            quantity: toNumber(item.quantity),
            difference: -Math.abs(toNumber(item.quantity)),
            unit: item.unit || "pcs",
            invoiceNumber: sale.invoiceNumber || sale.id || "N/A",
            customerName: sale.customerName || "Walk-in Customer",
            date: sale.saleDate || sale.createdAt || sale.date || null,
            source: "sales",
          };
        });
    });

    return [...inventoryActivities, ...salesActivities].sort(
      (a, b) => getValidDate(b.date) - getValidDate(a.date),
    );
  }, [history, sales]);

  const recentActivities = activityHistory.slice(0, 10);

  // PRODUCT FILTERING

  const filteredProducts = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return products.filter((product) => {
      const productName = String(product.name || "").toLowerCase();
      const productSize = String(product.size || "").toLowerCase();
      const productCategory = String(product.category || "").toLowerCase();
      const productUnit = String(product.unit || "").toLowerCase();

      const matchesSearch =
        !searchValue ||
        productName.includes(searchValue) ||
        productSize.includes(searchValue) ||
        productCategory.includes(searchValue) ||
        productUnit.includes(searchValue);

      const matchesCategory =
        categoryFilter === "All" || product.category === categoryFilter;

      const status = getProductStatus(product).label;

      const matchesStatus = stockFilter === "All" || status === stockFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, search, categoryFilter, stockFilter]);

  // PAGINATION CALCULATIONS

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const endIndex = Math.min(startIndex + itemsPerPage, filteredProducts.length);

  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, stockFilter, itemsPerPage]);

  useEffect(() => {
    if (totalPages === 0) {
      setCurrentPage(1);
    } else if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // SCROLL TO PRODUCT TABLE

  const scrollToInventory = () => {
    window.setTimeout(() => {
      inventoryTableRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  // STOCK RECONCILIATION MODAL

  const openStockModal = (product) => {
    setSelectedProduct(product);
    setActualStock(String(getStock(product)));
    setStockReason("Physical Count");
    setStockNote("");
    setShowStockModal(true);
  };

  const closeStockModal = () => {
    setShowStockModal(false);
    setSelectedProduct(null);
    setActualStock("");
    setStockNote("");
  };

  // SAVE PHYSICAL STOCK CORRECTION

  const handleStockUpdate = (event) => {
    event.preventDefault();

    if (!selectedProduct) return;

    if (!isValidActualStock) {
      alert("Please enter a valid stock quantity.");
      return;
    }

    const productId = getProductId(selectedProduct);

    const currentProduct = products.find(
      (product) => getProductId(product) === productId,
    );

    if (!currentProduct) {
      alert("Product not found. Please refresh the page.");
      return;
    }

    const previousStock = getStock(currentProduct);
    const newStock = Number(actualStock);
    const difference = newStock - previousStock;

    if (difference === 0) {
      closeStockModal();
      return;
    }

    setProducts((previousProducts) =>
      previousProducts.map((product) =>
        getProductId(product) === productId
          ? {
              ...product,
              stock: newStock,
            }
          : product,
      ),
    );

    const activity = {
      id: `reconciliation-${Date.now()}`,
      productId,
      productName: currentProduct.name,
      type: "reconciliation",
      previousStock,
      newStock,
      difference,
      reason: stockReason,
      note: stockNote.trim(),
      unit: getProductUnit(currentProduct),
      date: new Date().toISOString(),
    };

    setHistory((previous) => [activity, ...previous]);

    closeStockModal();
  };

  // AVAILABILITY MODAL

  const openStatusModal = (product) => {
    setSelectedProduct(product);
    setAvailability(product.availabilityStatus || "available");
    setStatusNote("");
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setSelectedProduct(null);
    setStatusNote("");
  };

  // SAVE PRODUCT AVAILABILITY

  const handleStatusUpdate = (event) => {
    event.preventDefault();

    if (!selectedProduct) return;

    const productId = getProductId(selectedProduct);

    const currentProduct = products.find(
      (product) => getProductId(product) === productId,
    );

    if (!currentProduct) {
      alert("Product not found. Please refresh the page.");
      return;
    }

    if (getStock(currentProduct) <= 0) {
      alert(
        "This product has zero stock. Add stock before changing its availability.",
      );
      return;
    }

    const previousStatus = currentProduct.availabilityStatus || "available";

    if (previousStatus === availability) {
      closeStatusModal();
      return;
    }

    setProducts((previousProducts) =>
      previousProducts.map((product) =>
        getProductId(product) === productId
          ? {
              ...product,
              availabilityStatus: availability,
            }
          : product,
      ),
    );

    const activity = {
      id: `availability-${Date.now()}`,
      productId,
      productName: currentProduct.name,
      type: "availability",
      previousStatus,
      newStatus: availability,
      note: statusNote.trim(),
      date: new Date().toISOString(),
    };

    setHistory((previous) => [activity, ...previous]);

    closeStatusModal();
  };

  // RESET FILTERS

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("All");
    setStockFilter("All");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    search.trim() !== "" || categoryFilter !== "All" || stockFilter !== "All";

  // ACTIVITY DISPLAY HELPERS

  const getActivityDetails = (item) => {
    if (item.type === "sale") {
      return {
        title: "Product Sold",
        description: `POS Sale · Invoice: ${item.invoiceNumber}`,
        color: "bg-red-50 text-red-600",
        icon: ArrowDownRight,
      };
    }

    if (item.type === "reconciliation") {
      const increased = toNumber(item.difference) > 0;

      return {
        title: "Stock Corrected",
        description: item.reason || "Physical stock correction",
        color: increased
          ? "bg-emerald-50 text-emerald-600"
          : "bg-orange-50 text-orange-600",
        icon: increased ? ArrowUpRight : ArrowDownRight,
      };
    }

    if (item.type === "availability") {
      return {
        title: "Availability Updated",
        description: `${item.previousStatus || "available"} → ${item.newStatus || "available"}`,
        color: "bg-blue-50 text-blue-600",
        icon: Settings2,
      };
    }

    if (item.type === "add") {
      return {
        title: "Stock Added",
        description: "Stock added to inventory",
        color: "bg-emerald-50 text-emerald-600",
        icon: ArrowUpRight,
      };
    }

    if (item.type === "remove") {
      return {
        title: "Stock Removed",
        description: "Stock removed from inventory",
        color: "bg-red-50 text-red-600",
        icon: ArrowDownRight,
      };
    }

    return {
      title: "Inventory Updated",
      description: item.note || "Inventory record updated",
      color: "bg-slate-100 text-slate-600",
      icon: Activity,
    };
  };

  // PAGE UI

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
            Monitor product stock, availability, inventory value and stock
            activity.
          </p>
        </div>

        <button
          type="button"
          onClick={resetFilters}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
        >
          <RotateCcw size={17} />
          Reset Filters
        </button>
      </div>

      {/* STATISTICS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Products"
          value={stats.totalProducts.toLocaleString()}
          subtitle="Registered products"
          icon={Package}
          color="blue"
        />

        <StatCard
          title="In-Stock Products"
          value={stats.inStock.toLocaleString()}
          subtitle="Products currently available"
          icon={Boxes}
          color="emerald"
        />

        <StatCard
          title="Inventory Value"
          value={formatCurrency(stats.stockValue)}
          subtitle="Based on purchase prices"
          icon={TrendingUp}
          color="purple"
        />

        <StatCard
          title="Stock Alerts"
          value={stats.stockAlerts.toLocaleString()}
          subtitle={`${stats.lowStock} low stock · ${stats.outOfStock} out of stock`}
          icon={AlertTriangle}
          color="orange"
        />
      </div>

      {/* PRODUCT INVENTORY */}

      <div
        ref={inventoryTableRef}
        className="scroll-mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        {/* TABLE HEADER */}

        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800">
                Product Inventory
              </h2>

              {stockFilter !== "All" && (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                  {stockFilter}
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {filteredProducts.length} matching products found.
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
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search product..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-52"
              />
            </div>

            {/* CATEGORY FILTER */}

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

            {/* STOCK STATUS FILTER */}

            <select
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">All Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>
        </div>

        {/* ACTIVE FILTERS */}

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-3">
            <Filter size={15} className="text-slate-400" />

            <span className="text-xs font-semibold text-slate-500">
              Active Filters:
            </span>

            {search.trim() && (
              <FilterBadge
                label={`Search: ${search}`}
                onRemove={() => setSearch("")}
              />
            )}

            {categoryFilter !== "All" && (
              <FilterBadge
                label={`Category: ${categoryFilter}`}
                onRemove={() => setCategoryFilter("All")}
              />
            )}

            {stockFilter !== "All" && (
              <FilterBadge
                label={`Status: ${stockFilter}`}
                onRemove={() => setStockFilter("All")}
              />
            )}

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <RotateCcw size={16} />
              Clear All
            </button>
          </div>
        )}

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
                      key={getProductId(product) ?? product.name}
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
                              {product.name || "Unnamed Product"}
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
                          {formatQuantity(product.stock)}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {getProductUnit(product)}
                        </p>
                      </td>

                      {/* MINIMUM STOCK */}

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatQuantity(getMinimumStock(product))}{" "}
                        {getProductUnit(product)}
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
                            type="button"
                            onClick={() => openStockModal(product)}
                            title="Reconcile Physical Stock"
                            className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
                          >
                            <ClipboardList size={16} />
                            Count
                          </button>

                          <button
                            type="button"
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

                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="mt-4 rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-100"
                      >
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}

        <div className="flex flex-col justify-between gap-4 border-t border-slate-100 p-4 lg:flex-row lg:items-center">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-xs font-medium text-slate-500">
                Rows per page
              </span>

              <select
                value={itemsPerPage}
                onChange={(event) =>
                  setItemsPerPage(Number(event.target.value))
                }
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
              >
                {[6, 8, 12, 24, 48].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

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

          {/* PAGE NAVIGATION */}

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1 || totalPages === 0}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
              title="Previous Page"
            >
              <ChevronLeft size={17} />
            </button>

            {pageNumbers.map((page) => (
              <button
                type="button"
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

            <button
              type="button"
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

      {/* RECENT INVENTORY ACTIVITY */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* ACTIVITY HEADER */}

        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <History size={20} />
            </div>

            <div>
              <h2 className="font-bold text-slate-800">
                Recent Inventory Activity
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                POS sales, stock corrections and availability updates.
              </p>
            </div>
          </div>

          <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            {activityHistory.length} Total Activities
          </span>
        </div>

        {/* ACTIVITY LIST */}

        <div className="divide-y divide-slate-100">
          {recentActivities.length > 0 ? (
            recentActivities.map((item) => {
              const activity = getActivityDetails(item);
              const ActivityIcon = activity.icon;

              const isStockActivity =
                item.type === "sale" ||
                item.type === "reconciliation" ||
                item.type === "add" ||
                item.type === "remove";

              const difference =
                item.type === "sale"
                  ? -Math.abs(toNumber(item.quantity))
                  : toNumber(item.difference);

              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between gap-3 p-4 transition hover:bg-slate-50/70 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${activity.color}`}
                    >
                      <ActivityIcon size={19} />
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800">
                        {item.productName || "Unknown Product"}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-600">
                        {activity.title}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        <CalendarDays size={12} className="mr-1 inline" />
                        {formatDate(item.date)}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {activity.description}
                      </p>

                      {item.type === "sale" && (
                        <p className="mt-1 text-xs text-slate-500">
                          Customer: {item.customerName}
                        </p>
                      )}

                      {item.note && (
                        <p className="mt-1 break-words text-xs text-slate-500">
                          Note: {item.note}
                        </p>
                      )}

                      {item.type === "reconciliation" && (
                        <p className="mt-1 text-xs text-slate-400">
                          Previous: {formatQuantity(item.previousStock)}{" "}
                          {item.unit || "pcs"} · New:{" "}
                          {formatQuantity(item.newStock)} {item.unit || "pcs"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ACTIVITY QUANTITY */}

                  <div className="shrink-0 pl-13 text-left sm:pl-0 sm:text-right">
                    {isStockActivity ? (
                      <>
                        <p
                          className={`text-sm font-bold ${
                            difference > 0
                              ? "text-emerald-600"
                              : difference < 0
                                ? "text-red-600"
                                : "text-slate-600"
                          }`}
                        >
                          {difference > 0 ? "+" : ""}
                          {formatQuantity(difference)} {item.unit || "pcs"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {item.type === "sale"
                            ? "Sold"
                            : difference > 0
                              ? "Stock Increased"
                              : difference < 0
                                ? "Stock Decreased"
                                : "No Change"}
                        </p>
                      </>
                    ) : (
                      <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">
                        Status Change
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
              <div className="flex items-center justify-between gap-3">
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
                  type="button"
                  onClick={closeStockModal}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleStockUpdate} className="space-y-5 p-5">
              {/* SELECTED PRODUCT */}

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Selected Product
                </p>

                <h3 className="mt-1 font-bold text-slate-800">
                  {selectedProduct.name}
                </h3>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-500">
                    Current system quantity
                  </span>

                  <span className="font-bold text-slate-800">
                    {formatQuantity(selectedProduct.stock)}{" "}
                    {getProductUnit(selectedProduct)}
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
                  onChange={(event) => setActualStock(event.target.value)}
                  placeholder="Enter actual stock quantity"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-semibold outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Count the physical products and enter the total quantity.
                </p>
              </div>

              {/* STOCK DIFFERENCE */}

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-center justify-between gap-3">
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
                    {formatQuantity(stockDifference)}{" "}
                    {getProductUnit(selectedProduct)}
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
                  onChange={(event) => setStockReason(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  {STOCK_REASONS.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
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
                  onChange={(event) => setStockNote(event.target.value)}
                  placeholder="Write a short explanation..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={!isValidActualStock || stockDifference === 0}
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
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-blue-600">
                    <Settings2 size={17} />
                    Product Availability
                  </div>

                  <h2 className="text-xl font-bold text-slate-800">
                    Manage Availability
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Control whether this product can be sold.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeStatusModal}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleStatusUpdate} className="space-y-5 p-5">
              {/* SELECTED PRODUCT */}

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Selected Product
                </p>

                <h3 className="mt-1 font-bold text-slate-800">
                  {selectedProduct.name}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Available Quantity:{" "}
                  <strong className="text-slate-700">
                    {formatQuantity(selectedProduct.stock)}{" "}
                    {getProductUnit(selectedProduct)}
                  </strong>
                </p>
              </div>

              {/* AVAILABILITY OPTIONS */}

              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-700">
                  Select Availability
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={getStock(selectedProduct) <= 0}
                    onClick={() => setAvailability("available")}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      availability === "available"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <CheckCircle2 size={18} />
                    Available
                  </button>

                  <button
                    type="button"
                    disabled={getStock(selectedProduct) <= 0}
                    onClick={() => setAvailability("unavailable")}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      availability === "unavailable"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <Ban size={18} />
                    Unavailable
                  </button>
                </div>

                {getStock(selectedProduct) <= 0 && (
                  <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-600">
                    This product is out of stock. Receive new stock before
                    making it available.
                  </p>
                )}
              </div>

              {/* NOTE */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Reason / Note (Optional)
                </label>

                <textarea
                  rows="3"
                  value={statusNote}
                  onChange={(event) => setStatusNote(event.target.value)}
                  placeholder="Why are you changing product availability?"
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={
                  getStock(selectedProduct) <= 0 ||
                  availability ===
                    (selectedProduct.availabilityStatus || "available")
                }
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
    blue: {
      icon: "bg-blue-50 text-blue-600",
      border: "border-blue-100",
    },
    emerald: {
      icon: "bg-emerald-50 text-emerald-600",
      border: "border-emerald-100",
    },
    purple: {
      icon: "bg-violet-50 text-violet-600",
      border: "border-violet-100",
    },
    orange: {
      icon: "bg-orange-50 text-orange-600",
      border: "border-orange-100",
    },
  };

  const style = styles[color] || styles.blue;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={`rounded-2xl border bg-white p-5 shadow-sm transition ${style.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <h3 className="mt-3 break-words text-2xl font-bold text-slate-800">
            {value}
          </h3>
        </div>

        <div className={`shrink-0 rounded-xl p-3 ${style.icon}`}>
          <Icon size={22} />
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">{subtitle}</p>
    </motion.div>
  );
};

// ACTIVE FILTER BADGE

const FilterBadge = ({ label, onRemove }) => {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
      {label}

      <button
        type="button"
        onClick={onRemove}
        className="rounded-full transition hover:text-red-600"
        title="Remove filter"
      >
        <X size={13} />
      </button>
    </span>
  );
};

// REUSABLE MODAL

const Modal = ({ children, onClose }) => {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
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
        transition={{ duration: 0.2 }}
        onMouseDown={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

export default Inventory;
