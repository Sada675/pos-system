import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useProducts } from "../context/ProductsContext";

import {
  Search,
  Plus,
  ShoppingCart,
  Wallet,
  Clock,
  X,
  Trash2,
  Eye,
  Package,
  CheckCircle2,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  CalendarDays,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PURCHASES_KEY = "steel-store-purchases";
const STOCK_HISTORY_KEY = "steel-store-stock-history";

const formatCurrency = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 2,
  })}`;

const generateInvoiceNumber = () => {
  return `PUR-${Date.now().toString().slice(-8)}`;
};

const getInitialForm = () => ({
  supplier: "",
  invoice: generateInvoiceNumber(),
  date: new Date().toISOString().split("T")[0],
  paid: "",
  notes: "",

  items: [
    {
      productName: "",
      category: "",
      size: "",
      unit: "KG",
      quantity: "",
      rate: "",
      sellingPrice: "",
      minStock: 5,
    },
  ],
});

function Purchases() {
  const { products = [], setProducts, categories = [] } = useProducts();

  // -----------------------------------
  // PURCHASES FROM LOCAL STORAGE
  // -----------------------------------

  const [purchases, setPurchases] = useState(() => {
    try {
      const saved = localStorage.getItem(PURCHASES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save purchase records
  useEffect(() => {
    localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases));
  }, [purchases]);

  // -----------------------------------
  // SEARCH AND FILTERS
  // -----------------------------------

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // -----------------------------------
  // PAGINATION
  // -----------------------------------

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // -----------------------------------
  // MODAL STATES
  // -----------------------------------

  const [showModal, setShowModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  // Purchase form
  const [formData, setFormData] = useState(getInitialForm);

  // -----------------------------------
  // PURCHASE STATISTICS
  // -----------------------------------

  const stats = useMemo(() => {
    const totalPurchases = purchases.length;

    const totalAmount = purchases.reduce(
      (sum, purchase) => sum + Number(purchase.total || 0),
      0,
    );

    const totalPaid = purchases.reduce(
      (sum, purchase) => sum + Number(purchase.paid || 0),
      0,
    );

    const totalPending = purchases.reduce(
      (sum, purchase) =>
        sum +
        Math.max(0, Number(purchase.total || 0) - Number(purchase.paid || 0)),
      0,
    );

    return {
      totalPurchases,
      totalAmount,
      totalPaid,
      totalPending,
    };
  }, [purchases]);

  // -----------------------------------
  // FILTER PURCHASES
  // -----------------------------------

  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        String(purchase.invoice || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(purchase.supplier || "")
          .toLowerCase()
          .includes(searchValue) ||
        (purchase.items || []).some((item) =>
          String(item.product || "")
            .toLowerCase()
            .includes(searchValue),
        );

      let matchesStatus = true;

      if (statusFilter === "Pending") {
        matchesStatus =
          Number(purchase.total || 0) - Number(purchase.paid || 0) > 0;
      } else if (statusFilter !== "All") {
        matchesStatus = purchase.status === statusFilter;
      }

      return matchesSearch && matchesStatus;
    });
  }, [purchases, search, statusFilter]);

  // -----------------------------------
  // PAGINATION LOGIC
  // -----------------------------------

  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const endIndex = Math.min(
    startIndex + itemsPerPage,
    filteredPurchases.length,
  );

  const paginatedPurchases = filteredPurchases.slice(startIndex, endIndex);

  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  );

  // Reset pagination when search, filter or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, itemsPerPage]);

  // Prevent invalid page after records change
  useEffect(() => {
    if (totalPages === 0) {
      setCurrentPage(1);
    } else if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // -----------------------------------
  // FORM TOTALS
  // -----------------------------------

  const purchaseTotal = useMemo(() => {
    return formData.items.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.rate || 0),
      0,
    );
  }, [formData.items]);

  const paidAmount = Number(formData.paid || 0);

  const remainingAmount = Math.max(0, purchaseTotal - paidAmount);

  const paymentStatus =
    paidAmount <= 0
      ? "Unpaid"
      : paidAmount >= purchaseTotal
        ? "Paid"
        : "Partial";

  // -----------------------------------
  // GENERAL INPUT CHANGE
  // -----------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // -----------------------------------
  // ITEM INPUT CHANGE
  // -----------------------------------

  const handleItemChange = (index, field, value) => {
    setFormData((previous) => {
      const updatedItems = [...previous.items];

      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };

      // Automatically load existing product details
      if (field === "productName") {
        const existingProduct = products.find(
          (product) =>
            product.name?.toLowerCase().trim() === value.toLowerCase().trim(),
        );

        if (existingProduct) {
          updatedItems[index] = {
            ...updatedItems[index],

            productName: existingProduct.name,

            category: existingProduct.category || "",

            size: existingProduct.size || "",

            unit: existingProduct.unit || "KG",

            sellingPrice: existingProduct.sellingPrice || "",

            minStock: existingProduct.minStock ?? 5,
          };
        }
      }

      return {
        ...previous,
        items: updatedItems,
      };
    });
  };

  // -----------------------------------
  // ADD ITEM
  // -----------------------------------

  const addItem = () => {
    setFormData((previous) => ({
      ...previous,

      items: [
        ...previous.items,
        {
          productName: "",
          category: "",
          size: "",
          unit: "KG",
          quantity: "",
          rate: "",
          sellingPrice: "",
          minStock: 5,
        },
      ],
    }));
  };

  // -----------------------------------
  // REMOVE ITEM
  // -----------------------------------

  const removeItem = (index) => {
    setFormData((previous) => ({
      ...previous,

      items: previous.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  // -----------------------------------
  // OPEN PURCHASE MODAL
  // -----------------------------------

  const openPurchaseModal = () => {
    setFormData(getInitialForm());
    setShowModal(true);
  };

  // -----------------------------------
  // SAVE PURCHASE
  // -----------------------------------

  const handleSubmit = (e) => {
    e.preventDefault();

    const supplier = formData.supplier.trim();

    if (!supplier) {
      alert("Please enter supplier name.");
      return;
    }

    if (!formData.invoice.trim()) {
      alert("Please enter invoice number.");
      return;
    }

    if (!formData.date) {
      alert("Please select purchase date.");
      return;
    }

    if (!formData.items.length) {
      alert("Please add at least one purchase item.");
      return;
    }

    // Validate each item
    const invalidItem = formData.items.find(
      (item) =>
        !item.productName.trim() ||
        !item.unit.trim() ||
        !Number.isFinite(Number(item.quantity)) ||
        Number(item.quantity) <= 0 ||
        !Number.isFinite(Number(item.rate)) ||
        Number(item.rate) <= 0 ||
        (item.sellingPrice !== "" &&
          (!Number.isFinite(Number(item.sellingPrice)) ||
            Number(item.sellingPrice) < 0)) ||
        !Number.isFinite(Number(item.minStock)) ||
        Number(item.minStock) < 0,
    );

    if (invalidItem) {
      alert(
        "Please enter valid product names, units, quantities and purchase rates.",
      );
      return;
    }

    if (
      !Number.isFinite(paidAmount) ||
      paidAmount < 0 ||
      paidAmount > purchaseTotal
    ) {
      alert("Paid amount must be between zero and the purchase total.");
      return;
    }

    if (purchaseTotal <= 0) {
      alert("Purchase total must be greater than zero.");
      return;
    }

    // Prevent duplicate invoice numbers
    const duplicateInvoice = purchases.some(
      (purchase) =>
        purchase.invoice?.toLowerCase().trim() ===
        formData.invoice.toLowerCase().trim(),
    );

    if (duplicateInvoice) {
      alert("This invoice number already exists.");
      return;
    }

    // -----------------------------------
    // PREPARE PURCHASE ITEMS
    // -----------------------------------

    const selectedItems = formData.items.map((item) => {
      const existingProduct = products.find(
        (product) =>
          product.name?.toLowerCase().trim() ===
          item.productName.toLowerCase().trim(),
      );

      return {
        productId: existingProduct?.id || null,

        product: item.productName.trim(),

        category: item.category.trim(),

        size: item.size.trim(),

        quantity: Number(item.quantity),

        unit: item.unit.trim(),

        rate: Number(item.rate),

        sellingPrice:
          item.sellingPrice === ""
            ? Number(existingProduct?.sellingPrice || 0)
            : Number(item.sellingPrice),

        minStock: Number(item.minStock || 0),
      };
    });

    const status =
      paidAmount === 0
        ? "Unpaid"
        : paidAmount >= purchaseTotal
          ? "Paid"
          : "Partial";

    const purchaseId = Date.now();

    const newPurchase = {
      id: purchaseId,

      invoice: formData.invoice.trim(),

      supplier,

      date: formData.date,

      items: selectedItems,

      total: purchaseTotal,

      paid: paidAmount,

      balance: purchaseTotal - paidAmount,

      status,

      notes: formData.notes.trim(),

      createdAt: new Date().toISOString(),
    };

    // -----------------------------------
    // UPDATE REAL PRODUCT STOCK
    // -----------------------------------

    const updatedProducts = [...products];

    const stockActivities = [];

    selectedItems.forEach((item, index) => {
      const existingIndex = updatedProducts.findIndex(
        (product) =>
          product.name?.toLowerCase().trim() ===
          item.product.toLowerCase().trim(),
      );

      if (existingIndex !== -1) {
        // Existing product
        const existingProduct = updatedProducts[existingIndex];

        const previousStock = Number(existingProduct.stock || 0);

        const newStock = previousStock + item.quantity;

        const oldPurchasePrice = Number(existingProduct.purchasePrice || 0);

        // Weighted average purchase price
        const weightedAverage =
          newStock > 0
            ? (previousStock * oldPurchasePrice + item.quantity * item.rate) /
              newStock
            : item.rate;

        updatedProducts[existingIndex] = {
          ...existingProduct,

          stock: newStock,

          purchasePrice: Number(weightedAverage.toFixed(2)),

          ...(item.sellingPrice > 0 && {
            sellingPrice: item.sellingPrice,
          }),
        };

        stockActivities.push({
          id: `purchase-${purchaseId}-${index}`,

          productId: existingProduct.id,

          productName: existingProduct.name,

          type: "add",

          quantity: item.quantity,

          previousStock,

          newStock,

          unit: item.unit,

          note: `Purchase from ${supplier} · Invoice ${newPurchase.invoice}`,

          date: new Date().toISOString(),
        });
      } else {
        // New product
        const newProduct = {
          id: `product-${purchaseId}-${index}`,

          name: item.product,

          category: item.category || "Uncategorized",

          size: item.size || "",

          purchasePrice: item.rate,

          sellingPrice: item.sellingPrice,

          stock: item.quantity,

          unit: item.unit,

          minStock: item.minStock,
        };

        updatedProducts.push(newProduct);

        stockActivities.push({
          id: `purchase-${purchaseId}-${index}`,

          productId: newProduct.id,

          productName: newProduct.name,

          type: "add",

          quantity: item.quantity,

          previousStock: 0,

          newStock: item.quantity,

          unit: item.unit,

          note: `New product added through purchase · ${newPurchase.invoice}`,

          date: new Date().toISOString(),
        });

        // Save generated product ID in purchase item
        selectedItems[index].productId = newProduct.id;
      }
    });

    // Update ProductsContext
    setProducts(updatedProducts);

    // -----------------------------------
    // SAVE STOCK HISTORY
    // -----------------------------------

    try {
      const oldHistory = JSON.parse(
        localStorage.getItem(STOCK_HISTORY_KEY) || "[]",
      );

      localStorage.setItem(
        STOCK_HISTORY_KEY,
        JSON.stringify([...stockActivities, ...oldHistory]),
      );
    } catch (error) {
      console.error("Stock history error:", error);
    }

    // -----------------------------------
    // SAVE PURCHASE
    // -----------------------------------

    setPurchases((previous) => [newPurchase, ...previous]);

    // Show first page after adding purchase
    setCurrentPage(1);

    setShowModal(false);

    setFormData(getInitialForm());
  };

  // -----------------------------------
  // PAYMENT STATUS STYLE
  // -----------------------------------

  const getStatusStyle = (status) => {
    switch (status) {
      case "Paid":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";

      case "Partial":
        return "bg-amber-50 text-amber-700 border-amber-100";

      default:
        return "bg-red-50 text-red-600 border-red-100";
    }
  };

  // -----------------------------------
  // CLICKABLE STAT CARDS
  // -----------------------------------

  const statCards = [
    {
      title: "Total Purchases",

      value: stats.totalPurchases,

      description: "All purchase invoices",

      icon: ShoppingCart,

      color: "bg-blue-50 text-blue-600",

      filter: "All",
    },

    {
      title: "Purchase Amount",

      value: formatCurrency(stats.totalAmount),

      description: "Total purchase value",

      icon: Wallet,

      color: "bg-indigo-50 text-indigo-600",

      filter: "All",
    },

    {
      title: "Total Paid",

      value: formatCurrency(stats.totalPaid),

      description: "Payments completed",

      icon: CheckCircle2,

      color: "bg-emerald-50 text-emerald-600",

      filter: "Paid",
    },

    {
      title: "Pending Payments",

      value: formatCurrency(stats.totalPending),

      description: "Remaining supplier dues",

      icon: Clock,

      color: "bg-amber-50 text-amber-600",

      filter: "Pending",
    },
  ];

  const handleCardClick = (filter) => {
    setStatusFilter(filter);
    setSearch("");
    setCurrentPage(1);
  };

  // -----------------------------------
  // UI
  // -----------------------------------

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
            <ShoppingCart size={17} />
            Purchase Management
          </div>

          <h1 className="text-2xl font-bold text-slate-800">
            Purchases Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage purchases, suppliers, invoices and stock receiving.
          </p>
        </div>

        <button
          onClick={openPurchaseModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} />
          New Purchase
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;

          const active = statusFilter === card.filter;

          return (
            <motion.button
              key={card.title}
              type="button"
              onClick={() => handleCardClick(card.filter)}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07 }}
              className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition ${
                active
                  ? "border-blue-400 ring-2 ring-blue-100"
                  : "border-slate-100 hover:border-blue-200 hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {card.title}
                  </p>

                  <h2 className="mt-3 break-words text-xl font-bold text-slate-800">
                    {card.value}
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    {card.description}
                  </p>
                </div>

                <div className={`rounded-xl p-3 ${card.color}`}>
                  <Icon size={22} />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs font-semibold text-blue-600">
                  View Records
                </span>

                <ArrowUpRight size={16} className="text-blue-500" />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* PURCHASE HISTORY */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {/* TABLE HEADER */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Purchase History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View all supplier purchase invoices.
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
                placeholder="Search invoice, supplier, product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 sm:w-64"
              />
            </div>

            {/* STATUS FILTER */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="All">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Pending">Pending Payments</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-slate-50">
              <tr className="text-xs uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Invoice</th>

                <th className="px-6 py-4">Supplier</th>

                <th className="px-6 py-4">Date</th>

                <th className="px-6 py-4">Items</th>

                <th className="px-6 py-4">Total Amount</th>

                <th className="px-6 py-4">Paid</th>

                <th className="px-6 py-4">Balance</th>

                <th className="px-6 py-4">Status</th>

                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedPurchases.length > 0 ? (
                paginatedPurchases.map((purchase) => (
                  <tr
                    key={purchase.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <span className="font-semibold text-blue-600">
                        {purchase.invoice}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-700">
                        {purchase.supplier}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-500">
                      {purchase.date}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {purchase.items?.length || 0} Product(s)
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {formatCurrency(purchase.total)}
                    </td>

                    <td className="px-6 py-4 font-medium text-emerald-600">
                      {formatCurrency(purchase.paid)}
                    </td>

                    <td className="px-6 py-4 font-medium text-red-500">
                      {formatCurrency(purchase.total - purchase.paid)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusStyle(purchase.status)}`}
                      >
                        {purchase.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedPurchase(purchase)}
                        title="View Purchase Details"
                        className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                      >
                        <Eye size={17} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-14 text-center">
                    <ShoppingCart
                      size={38}
                      className="mx-auto mb-3 text-slate-300"
                    />

                    <p className="font-semibold text-slate-700">
                      No Purchase Records Found
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      Create a new purchase or change your filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex flex-col justify-between gap-4 border-t border-slate-100 p-4 lg:flex-row lg:items-center">
          {/* LEFT SIDE: ROWS PER PAGE + SHOWING */}
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
                {filteredPurchases.length === 0 ? 0 : startIndex + 1}–{endIndex}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-700">
                {filteredPurchases.length}
              </span>{" "}
              purchases
            </p>

            {/* CLEAR FILTER */}
            {statusFilter !== "All" && (
              <button
                onClick={() => {
                  setStatusFilter("All");
                  setCurrentPage(1);
                }}
                className="text-xs font-semibold text-blue-600 transition hover:text-blue-700"
              >
                Clear Filter
              </button>
            )}
          </div>

          {/* RIGHT SIDE: PAGE NAVIGATION */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* PREVIOUS */}
            <button
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1 || totalPages === 0}
              title="Previous Page"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
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
              title="Next Page"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* NEW PURCHASE MODAL */}
      <AnimatePresence>
        {showModal && (
          <Modal onClose={() => setShowModal(false)}>
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Create New Purchase
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter supplier and purchased product details.
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="max-h-[70vh] space-y-6 overflow-y-auto p-5">
                {/* SUPPLIER DETAILS */}
                <section>
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
                    <Truck size={18} className="text-blue-600" />
                    Supplier Information
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Supplier Name *
                      </label>

                      <input
                        type="text"
                        name="supplier"
                        value={formData.supplier}
                        onChange={handleChange}
                        placeholder="Enter any supplier name"
                        className="purchase-input"
                        required
                      />

                      <p className="mt-1 text-xs text-slate-400">
                        You can enter any supplier name.
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Invoice Number *
                      </label>

                      <input
                        type="text"
                        name="invoice"
                        value={formData.invoice}
                        onChange={handleChange}
                        placeholder="Enter invoice number"
                        className="purchase-input"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Purchase Date *
                      </label>

                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="purchase-input"
                        required
                      />
                    </div>
                  </div>
                </section>

                {/* PURCHASE ITEMS */}
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-semibold text-slate-800">
                      <Package size={18} className="text-blue-600" />
                      Purchase Items
                    </h3>

                    <button
                      type="button"
                      onClick={addItem}
                      className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      <Plus size={17} />
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.items.map((item, index) => {
                      const existingProduct = products.find(
                        (product) =>
                          product.name?.toLowerCase().trim() ===
                          item.productName.toLowerCase().trim(),
                      );

                      const lineTotal =
                        Number(item.quantity || 0) * Number(item.rate || 0);

                      return (
                        <div
                          key={index}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="mb-4 flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-slate-800">
                                Item {index + 1}
                              </p>

                              {existingProduct ? (
                                <p className="mt-1 text-xs font-medium text-emerald-600">
                                  Existing product · Stock will increase
                                </p>
                              ) : item.productName.trim() ? (
                                <p className="mt-1 text-xs font-medium text-blue-600">
                                  New product · Will be added to inventory
                                </p>
                              ) : (
                                <p className="mt-1 text-xs text-slate-400">
                                  Enter product details below
                                </p>
                              )}
                            </div>

                            {formData.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                              >
                                <Trash2 size={17} />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {/* PRODUCT NAME */}
                            <div className="sm:col-span-2">
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Product Name *
                              </label>

                              <input
                                type="text"
                                list="inventory-products"
                                value={item.productName}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "productName",
                                    e.target.value,
                                  )
                                }
                                placeholder="Select existing or enter new product name"
                                className="purchase-input"
                                required
                              />

                              <datalist id="inventory-products">
                                {products.map((product) => (
                                  <option
                                    key={product.id}
                                    value={product.name}
                                  />
                                ))}
                              </datalist>
                            </div>

                            {/* CATEGORY */}
                            {!existingProduct && (
                              <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                  Category
                                </label>

                                <input
                                  type="text"
                                  list="purchase-categories"
                                  value={item.category}
                                  onChange={(e) =>
                                    handleItemChange(
                                      index,
                                      "category",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Enter category"
                                  className="purchase-input"
                                />

                                <datalist id="purchase-categories">
                                  {categories.map((category) => (
                                    <option
                                      key={category.id ?? category.name}
                                      value={category.name}
                                    />
                                  ))}
                                </datalist>
                              </div>
                            )}

                            {/* SIZE */}
                            {!existingProduct && (
                              <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                  Size / Specification
                                </label>

                                <input
                                  type="text"
                                  value={item.size}
                                  onChange={(e) =>
                                    handleItemChange(
                                      index,
                                      "size",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="e.g. 10mm, 2 inch, 4x8"
                                  className="purchase-input"
                                />
                              </div>
                            )}

                            {/* UNIT */}
                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Unit *
                              </label>

                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "unit",
                                    e.target.value,
                                  )
                                }
                                placeholder="KG, Piece, Ton, Sheet..."
                                className="purchase-input"
                                required
                              />
                            </div>

                            {/* QUANTITY */}
                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Quantity *
                              </label>

                              <input
                                type="number"
                                min="0.01"
                                step="any"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "quantity",
                                    e.target.value,
                                  )
                                }
                                placeholder="Enter quantity"
                                className="purchase-input"
                                required
                              />
                            </div>

                            {/* PURCHASE RATE */}
                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Purchase Rate (Rs.) *
                              </label>

                              <input
                                type="number"
                                min="0.01"
                                step="any"
                                value={item.rate}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "rate",
                                    e.target.value,
                                  )
                                }
                                placeholder="Enter purchase rate"
                                className="purchase-input"
                                required
                              />
                            </div>

                            {/* SELLING PRICE */}
                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Selling Price (Rs.)
                              </label>

                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.sellingPrice}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "sellingPrice",
                                    e.target.value,
                                  )
                                }
                                placeholder={
                                  existingProduct
                                    ? `Current: ${existingProduct.sellingPrice || 0}`
                                    : "Enter selling price"
                                }
                                className="purchase-input"
                              />
                            </div>

                            {/* MINIMUM STOCK */}
                            {!existingProduct && (
                              <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                  Minimum Stock Alert
                                </label>

                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={item.minStock}
                                  onChange={(e) =>
                                    handleItemChange(
                                      index,
                                      "minStock",
                                      e.target.value,
                                    )
                                  }
                                  className="purchase-input"
                                />
                              </div>
                            )}
                          </div>

                          {/* ITEM TOTAL */}
                          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                            <span className="text-sm text-slate-500">
                              Item Subtotal
                            </span>

                            <span className="font-bold text-slate-800">
                              {formatCurrency(lineTotal)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* PAYMENT DETAILS */}
                <section>
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
                    <Wallet size={18} className="text-blue-600" />
                    Payment Information
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Paid Amount (Rs.)
                      </label>

                      <input
                        type="number"
                        name="paid"
                        min="0"
                        max={purchaseTotal}
                        step="any"
                        value={formData.paid}
                        onChange={handleChange}
                        placeholder="Enter paid amount"
                        className="purchase-input"
                      />

                      <p className="mt-1 text-xs text-slate-400">
                        Leave empty if payment has not been made.
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Notes
                      </label>

                      <input
                        type="text"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Optional purchase notes"
                        className="purchase-input"
                      />
                    </div>
                  </div>
                </section>

                {/* PURCHASE SUMMARY */}
                <section className="rounded-2xl bg-slate-900 p-5 text-white">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold">Purchase Summary</h3>

                    <FileText size={20} className="text-blue-400" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-slate-300">
                      <span>Total Items</span>

                      <span>{formData.items.length}</span>
                    </div>

                    <div className="flex justify-between text-sm text-slate-300">
                      <span>Total Purchase</span>

                      <span>{formatCurrency(purchaseTotal)}</span>
                    </div>

                    <div className="flex justify-between text-sm text-emerald-400">
                      <span>Paid Amount</span>

                      <span>{formatCurrency(paidAmount)}</span>
                    </div>

                    <div className="flex justify-between border-t border-slate-700 pt-4">
                      <span className="font-semibold">Remaining Balance</span>

                      <span className="text-xl font-bold text-amber-400">
                        {formatCurrency(remainingAmount)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Payment Status</span>

                      <span
                        className={`font-semibold ${
                          paymentStatus === "Paid"
                            ? "text-emerald-400"
                            : paymentStatus === "Partial"
                              ? "text-amber-400"
                              : "text-red-400"
                        }`}
                      >
                        {paymentStatus}
                      </span>
                    </div>
                  </div>
                </section>

                {/* IMPORTANT NOTICE */}
                <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <AlertCircle size={19} className="shrink-0 text-blue-600" />

                  <p className="text-xs leading-5 text-blue-700">
                    Saving this purchase will automatically increase inventory
                    stock. New product names will be added to your product list.
                  </p>
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 p-5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={purchaseTotal <= 0 || paidAmount > purchaseTotal}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <CheckCircle2 size={18} />
                  Save Purchase & Update Stock
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* PURCHASE DETAILS MODAL */}
      <AnimatePresence>
        {selectedPurchase && (
          <Modal onClose={() => setSelectedPurchase(null)}>
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Purchase Details
                </h2>

                <p className="mt-1 text-sm font-medium text-blue-600">
                  {selectedPurchase.invoice}
                </p>
              </div>

              <button
                onClick={() => setSelectedPurchase(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              {/* SUPPLIER DETAILS */}
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Truck size={18} className="text-blue-600" />

                  <h3 className="font-semibold text-slate-800">
                    Supplier Information
                  </h3>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Supplier</span>

                    <span className="text-right font-semibold text-slate-800">
                      {selectedPurchase.supplier}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Invoice</span>

                    <span className="font-medium text-slate-800">
                      {selectedPurchase.invoice}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Purchase Date</span>

                    <span className="font-medium text-slate-800">
                      {selectedPurchase.date}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Status</span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        selectedPurchase.status === "Paid"
                          ? "bg-emerald-50 text-emerald-700"
                          : selectedPurchase.status === "Partial"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-600"
                      }`}
                    >
                      {selectedPurchase.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* PRODUCTS */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
                  <Package size={18} className="text-blue-600" />
                  Purchased Products
                </h3>

                <div className="space-y-3">
                  {(selectedPurchase.items || []).map((item, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-slate-100 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-800">
                            {item.product}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {item.quantity} {item.unit} ×{" "}
                            {formatCurrency(item.rate)}
                          </p>
                        </div>

                        <p className="font-bold text-slate-800">
                          {formatCurrency(item.quantity * item.rate)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PAYMENT SUMMARY */}
              <div className="space-y-3 rounded-xl bg-slate-900 p-5 text-sm text-white">
                <div className="flex justify-between">
                  <span className="text-slate-300">Total Amount</span>

                  <strong>{formatCurrency(selectedPurchase.total)}</strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-300">Paid Amount</span>

                  <strong className="text-emerald-400">
                    {formatCurrency(selectedPurchase.paid)}
                  </strong>
                </div>

                <div className="flex justify-between border-t border-slate-700 pt-3">
                  <span className="font-semibold">Remaining Balance</span>

                  <strong className="text-lg text-amber-400">
                    {formatCurrency(
                      selectedPurchase.total - selectedPurchase.paid,
                    )}
                  </strong>
                </div>
              </div>

              {selectedPurchase.notes && (
                <div className="rounded-xl border border-slate-100 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase text-slate-400">
                    Purchase Notes
                  </p>

                  <p className="text-sm text-slate-600">
                    {selectedPurchase.notes}
                  </p>
                </div>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* INPUT STYLES */}
      <style>{`
        .purchase-input {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: white;
          padding: 11px 13px;
          font-size: 14px;
          color: #334155;
          outline: none;
          transition: all 0.2s;
        }

        .purchase-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .purchase-input::placeholder {
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
}

// -----------------------------------
// REUSABLE MODAL
// -----------------------------------

const Modal = ({ children, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        className="my-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

export default Purchases;
