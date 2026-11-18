import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProducts } from "../context/ProductsContext";

import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  Pencil,
  Trash2,
  X,
  Save,
  Filter,
  ChevronLeft,
  ChevronRight,
  PackageX,
  CircleDollarSign,
  SlidersHorizontal,
  RotateCcw,
  AlertCircle,
} from "lucide-react";

// ===================================
// CONSTANTS
// ===================================

const UNIT_OPTIONS = ["KG", "Ton", "Piece", "Feet", "Meter", "Bundle", "Sheet"];

const emptyForm = {
  name: "",
  category: "",
  size: "",
  purchasePrice: "",
  sellingPrice: "",
  stock: "",
  unit: "KG",
  customUnit: "",
  minStock: "",
};

const formatCurrency = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK")}`;

const getStockStatus = (product) => {
  const stock = Number(product.stock) || 0;
  const minStock = Number(product.minStock) || 0;

  if (stock <= 0) return "Out of Stock";
  if (stock <= minStock) return "Low Stock";

  return "In Stock";
};

// ===================================
// PRODUCTS COMPONENT
// ===================================

function Products() {
  const { products = [], setProducts, categories = [] } = useProducts();

  const productsListRef = useRef(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");

  // Active statistics card
  const [activeStatCard, setActiveStatCard] = useState("total");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Shared warning and delete confirmation modals
  const [alertMessage, setAlertMessage] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  const showAlert = (message) => {
    setAlertMessage(String(message));
  };

  const [form, setForm] = useState(emptyForm);
  const [isCustomUnit, setIsCustomUnit] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // ===================================
  // STATISTICS
  // ===================================

  const totalProducts = products.length;

  const lowStockProducts = products.filter(
    (product) => getStockStatus(product) === "Low Stock",
  ).length;

  const outOfStockProducts = products.filter(
    (product) => getStockStatus(product) === "Out of Stock",
  ).length;

  const totalStockValue = products.reduce(
    (total, product) =>
      total +
      (Number(product.stock) || 0) * (Number(product.purchasePrice) || 0),
    0,
  );

  // ===================================
  // ACTIVE FILTER CHECK
  // ===================================

  const hasActiveFilters =
    search.trim() !== "" || categoryFilter !== "All" || stockFilter !== "All";

  // ===================================
  // SEARCH AND FILTER
  // ===================================

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const searchTerm = search.toLowerCase().trim();

      const matchesSearch =
        (product.name || "").toLowerCase().includes(searchTerm) ||
        (product.size || "").toLowerCase().includes(searchTerm) ||
        (product.category || "").toLowerCase().includes(searchTerm) ||
        (product.unit || "").toLowerCase().includes(searchTerm);

      const matchesCategory =
        categoryFilter === "All" || product.category === categoryFilter;

      const matchesStock =
        stockFilter === "All" || getStockStatus(product) === stockFilter;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, search, categoryFilter, stockFilter]);

  // ===================================
  // PAGINATION
  // ===================================

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentProducts = filteredProducts.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, stockFilter, itemsPerPage]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }

    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    if (
      categoryFilter !== "All" &&
      !categories.some((category) => category.name === categoryFilter)
    ) {
      setCategoryFilter("All");
    }
  }, [categories, categoryFilter]);

  // ===================================
  // SCROLL TO PRODUCTS
  // ===================================

  const scrollToProducts = () => {
    setTimeout(() => {
      productsListRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  // ===================================
  // FILTER HANDLERS
  // ===================================

  const handleStatFilter = (filter, cardName) => {
    setStockFilter(filter);
    setCurrentPage(1);
    setActiveStatCard(cardName);

    scrollToProducts();
  };

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("All");
    setStockFilter("All");
    setCurrentPage(1);
    setActiveStatCard("total");
  };

  // ===================================
  // MANUAL STOCK FILTER
  // ===================================

  const handleStockFilterChange = (value) => {
    setStockFilter(value);

    if (value === "All") {
      setActiveStatCard("total");
    } else if (value === "Low Stock") {
      setActiveStatCard("low");
    } else if (value === "Out of Stock") {
      setActiveStatCard("out");
    } else {
      setActiveStatCard(null);
    }
  };

  // ===================================
  // MODAL HANDLERS
  // ===================================

  const openAddModal = () => {
    setEditingId(null);
    setIsCustomUnit(false);

    setForm({
      ...emptyForm,
      category: categories[0]?.name || "",
    });

    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingId(product.id);

    const productUnit = product.unit || "KG";
    const isStandardUnit = UNIT_OPTIONS.includes(productUnit);

    setIsCustomUnit(!isStandardUnit);

    setForm({
      ...emptyForm,
      ...product,
      unit: isStandardUnit ? productUnit : "Custom",
      customUnit: isStandardUnit ? "" : productUnit,
      purchasePrice: String(product.purchasePrice ?? ""),
      sellingPrice: String(product.sellingPrice ?? ""),
      stock: String(product.stock ?? ""),
      minStock: String(product.minStock ?? ""),
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setIsCustomUnit(false);

    setForm({
      ...emptyForm,
      category: categories[0]?.name || "",
    });
  };

  // ===================================
  // INPUT HANDLER
  // ===================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "unit" && value !== "Custom" ? { customUnit: "" } : {}),
    }));

    if (name === "unit") {
      setIsCustomUnit(value === "Custom");
    }
  };

  // ===================================
  // ADD / UPDATE PRODUCT
  // ===================================

  const handleSubmit = (e) => {
    e.preventDefault();

    const purchasePrice = Number(form.purchasePrice);
    const sellingPrice = Number(form.sellingPrice);
    const stock = Number(form.stock);
    const minStock = Number(form.minStock);

    const finalUnit = isCustomUnit ? form.customUnit.trim() : form.unit;

    if (
      !form.name.trim() ||
      !form.size.trim() ||
      !form.category ||
      !finalUnit ||
      form.purchasePrice === "" ||
      form.sellingPrice === "" ||
      form.stock === "" ||
      form.minStock === ""
    ) {
      showAlert("Please fill in all required fields.");
      return;
    }

    if (!finalUnit || finalUnit === "Custom") {
      showAlert("Please enter a valid custom unit.");
      return;
    }

    const categoryExists = categories.some(
      (category) => category.name === form.category,
    );

    if (!categoryExists) {
      showAlert("Please select a valid category.");
      return;
    }

    if (
      !Number.isFinite(purchasePrice) ||
      !Number.isFinite(sellingPrice) ||
      !Number.isFinite(stock) ||
      !Number.isFinite(minStock) ||
      purchasePrice < 0 ||
      sellingPrice < 0 ||
      stock < 0 ||
      minStock < 0
    ) {
      showAlert("Please enter valid positive numbers.");
      return;
    }

    const productData = {
      name: form.name.trim(),
      category: form.category,
      size: form.size.trim(),
      purchasePrice,
      sellingPrice,
      stock,
      minStock,
      unit: finalUnit,
    };

    if (editingId !== null) {
      setProducts((previous) =>
        previous.map((product) =>
          product.id === editingId
            ? {
                ...product,
                ...productData,
                id: editingId,
              }
            : product,
        ),
      );
    } else {
      const newProduct = {
        ...productData,
        id: Date.now(),
      };

      setProducts((previous) => [newProduct, ...previous]);

      setCurrentPage(1);
    }

    closeModal();
  };

  // ===================================
  // DELETE PRODUCT
  // ===================================

  const handleDelete = (id) => {
    setDeleteConfirmation(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmation === null) return;

    setProducts((previous) =>
      previous.filter((product) => product.id !== deleteConfirmation),
    );

    setDeleteConfirmation(null);
  };

  // ===================================
  // PAGINATION HANDLERS
  // ===================================

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // ===================================
  // UI
  // ===================================

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-600">
            Inventory Management
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Products
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your products, pricing and stock.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          disabled={categories.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* STATISTICS CARDS */}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatBox
          title="Total Products"
          value={totalProducts}
          description="Registered products"
          icon={Package}
          color="blue"
          active={activeStatCard === "total"}
          onClick={() => handleStatFilter("All", "total")}
        />

        <StatBox
          title="Stock Value"
          value={formatCurrency(totalStockValue)}
          description="Purchase price value"
          icon={CircleDollarSign}
          color="emerald"
          active={activeStatCard === "value"}
          onClick={() => handleStatFilter("All", "value")}
        />

        <StatBox
          title="Low Stock"
          value={lowStockProducts}
          description="Need restocking"
          icon={AlertTriangle}
          color="orange"
          active={activeStatCard === "low"}
          onClick={() => handleStatFilter("Low Stock", "low")}
        />

        <StatBox
          title="Out of Stock"
          value={outOfStockProducts}
          description="Currently unavailable"
          icon={PackageX}
          color="red"
          active={activeStatCard === "out"}
          onClick={() => handleStatFilter("Out of Stock", "out")}
        />
      </div>

      {/* PRODUCTS SECTION */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {/* SECTION HEADER */}

        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-800">All Products</h2>

            <p className="mt-1 text-xs text-slate-500">
              {filteredProducts.length} products found
            </p>
          </div>

          {/* SEARCH AND FILTERS */}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.3fr_1fr_1fr_auto]">
            {/* SEARCH */}

            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
              />
            </div>

            {/* CATEGORY FILTER */}

            <div className="relative">
              <Filter
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
              >
                <option value="All">All Categories</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* STOCK FILTER */}

            <div className="relative">
              <SlidersHorizontal
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={stockFilter}
                onChange={(e) => handleStockFilterChange(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
              >
                <option value="All">All Stock Status</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>

            {/* CLEAR FILTERS BUTTON */}

            <AnimatePresence>
              {hasActiveFilters && (
                <motion.button
                  type="button"
                  onClick={resetFilters}
                  initial={{ opacity: 0, scale: 0.9, x: 8 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: 8 }}
                  transition={{ duration: 0.18 }}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100"
                >
                  <RotateCcw size={15} />
                  <span>Clear Filters</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* ACTIVE FILTER INDICATORS */}

          {hasActiveFilters && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400">
                Active filters:
              </span>

              {search.trim() && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                  Search: {search}
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="ml-1 rounded-full hover:text-blue-900"
                    aria-label="Clear search"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              {categoryFilter !== "All" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-700">
                  Category: {categoryFilter}
                  <button
                    type="button"
                    onClick={() => setCategoryFilter("All")}
                    className="ml-1 rounded-full hover:text-purple-900"
                    aria-label="Clear category filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              {stockFilter !== "All" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  Stock: {stockFilter}
                  <button
                    type="button"
                    onClick={() => handleStockFilterChange("All")}
                    className="ml-1 rounded-full hover:text-emerald-900"
                    aria-label="Clear stock filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* PRODUCT LIST */}

        <div
          ref={productsListRef}
          className="scroll-mt-6 bg-slate-50/60 p-3 sm:p-4"
        >
          {currentProducts.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <div className="min-w-[900px]">
                {/* COMMON TABLE HEADER */}

                <div className="grid grid-cols-[minmax(220px,1.5fr)_minmax(150px,1fr)_minmax(120px,.8fr)_minmax(120px,.8fr)_minmax(120px,.8fr)_90px] items-center gap-4 border-b border-slate-200 bg-slate-100/80 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <span>Product</span>
                  <span>Available Stock</span>
                  <span>Purchase Price</span>
                  <span>Selling Price</span>
                  <span>Profit / Unit</span>
                  <span className="text-center">Actions</span>
                </div>

                {/* PRODUCT ROWS */}

                <AnimatePresence mode="popLayout">
                  {currentProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      status={getStockStatus(product)}
                      onEdit={() => openEditModal(product)}
                      onDelete={() => handleDelete(product.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <Package size={25} />
              </div>

              <h3 className="mt-3 font-semibold text-slate-700">
                No Products Found
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                {products.length === 0
                  ? "Your inventory is empty. Add your first product."
                  : "Try changing your search or filters."}
              </p>

              {products.length === 0 ? (
                <button
                  type="button"
                  onClick={openAddModal}
                  disabled={categories.length === 0}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Plus size={17} />
                  Add First Product
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                >
                  <RotateCcw size={15} />
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* PAGINATION */}

        {filteredProducts.length > 0 && (
          <div className="flex flex-col gap-4 border-t border-slate-100 bg-white px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
            {/* LEFT SIDE */}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">
                  Rows per page:
                </span>

                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                >
                  {[6, 8, 12, 24, 48].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <div className="h-4 w-px bg-slate-200" />

              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-800">
                  {startIndex + 1} -{" "}
                  {Math.min(startIndex + itemsPerPage, filteredProducts.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-800">
                  {filteredProducts.length}
                </span>{" "}
                products
              </p>
            </div>

            {/* RIGHT SIDE */}

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={15} />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1,
                ).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-semibold transition ${
                      currentPage === page
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="my-auto w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl"
            >
              {/* MODAL HEADER */}

              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    {editingId !== null ? (
                      <Pencil size={18} />
                    ) : (
                      <Plus size={20} />
                    )}
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-800">
                      {editingId !== null ? "Edit Product" : "Add New Product"}
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Enter your product information.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                >
                  <X size={20} />
                </button>
              </div>

              {/* FORM */}

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                  <FormField label="Product Name" required>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. Steel Rod 10mm"
                      required
                      className="form-input"
                    />
                  </FormField>

                  <FormField label="Category" required>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      required
                      className="form-input"
                    >
                      <option value="">Select Category</option>

                      {categories.map((category) => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Product Size" required>
                    <input
                      type="text"
                      name="size"
                      value={form.size}
                      onChange={handleChange}
                      placeholder="e.g. 10mm / 2 Inch"
                      required
                      className="form-input"
                    />
                  </FormField>

                  <FormField label="Unit" required>
                    <select
                      name="unit"
                      value={form.unit}
                      onChange={handleChange}
                      required
                      className="form-input"
                    >
                      {UNIT_OPTIONS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}

                      <option value="Custom">+ Add Custom Unit</option>
                    </select>

                    <AnimatePresence>
                      {isCustomUnit && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 overflow-hidden"
                        >
                          <input
                            type="text"
                            name="customUnit"
                            value={form.customUnit}
                            onChange={handleChange}
                            placeholder="Enter custom unit"
                            required={isCustomUnit}
                            autoFocus
                            className="form-input"
                          />

                          <p className="mt-1 text-xs text-slate-400">
                            e.g. Dozen, Roll, Bag
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </FormField>

                  <FormField label="Purchase Price (Rs.)" required>
                    <input
                      type="number"
                      name="purchasePrice"
                      value={form.purchasePrice}
                      onChange={handleChange}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      required
                      className="form-input"
                    />
                  </FormField>

                  <FormField label="Selling Price (Rs.)" required>
                    <input
                      type="number"
                      name="sellingPrice"
                      value={form.sellingPrice}
                      onChange={handleChange}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      required
                      className="form-input"
                    />
                  </FormField>

                  <FormField
                    label={
                      editingId !== null ? "Available Stock" : "Opening Stock"
                    }
                    required
                  >
                    <input
                      type="number"
                      name="stock"
                      value={form.stock}
                      onChange={handleChange}
                      placeholder="Enter quantity"
                      min="0"
                      step="0.01"
                      required
                      className="form-input"
                    />
                  </FormField>

                  <FormField label="Minimum Stock Alert" required>
                    <input
                      type="number"
                      name="minStock"
                      value={form.minStock}
                      onChange={handleChange}
                      placeholder="e.g. 50"
                      min="0"
                      step="0.01"
                      required
                      className="form-input"
                    />
                  </FormField>
                </div>

                {/* MODAL FOOTER */}

                <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={categories.length === 0}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save size={16} />
                    {editingId !== null ? "Update Product" : "Save Product"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WARNING MODAL - SAME DESIGN AS POS */}

      <AnimatePresence>
        {alertMessage && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ duration: 0.2 }}
              role="alertdialog"
              aria-modal="true"
              className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className="px-6 pt-7 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 ring-8 ring-amber-50/60">
                  <AlertCircle size={34} strokeWidth={2} />
                </div>

                <h2 className="mt-5 text-xl font-bold text-slate-800">
                  Attention Required
                </h2>

                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-500">
                  {alertMessage}
                </p>
              </div>

              <div className="p-6 pt-5">
                <button
                  type="button"
                  onClick={() => setAlertMessage("")}
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 active:scale-[0.98]"
                >
                  Okay, Got It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL - SAME CENTERED DESIGN */}

      <AnimatePresence>
        {deleteConfirmation !== null && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ duration: 0.2 }}
              role="alertdialog"
              aria-modal="true"
              className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className="px-6 pt-7 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 ring-8 ring-amber-50/60">
                  <AlertTriangle size={34} strokeWidth={2} />
                </div>

                <h2 className="mt-5 text-xl font-bold text-slate-800">
                  Delete Product?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Are you sure you want to delete this product? This action
                  cannot be undone.
                </p>
              </div>

              <div className="flex gap-3 p-6 pt-5">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmation(null)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 active:scale-[0.98]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-700 active:scale-[0.98]"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ===================================
// PRODUCT ROW
// ===================================

function ProductCard({ product, status, onEdit, onDelete }) {
  const statusStyles = {
    "In Stock": {
      badge: "bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
      progress: "bg-emerald-500",
    },

    "Low Stock": {
      badge: "bg-orange-50 text-orange-700",
      dot: "bg-orange-500",
      progress: "bg-orange-500",
    },

    "Out of Stock": {
      badge: "bg-red-50 text-red-700",
      dot: "bg-red-500",
      progress: "bg-red-500",
    },
  };

  const currentStatus = statusStyles[status] || statusStyles["In Stock"];

  const stock = Number(product.stock) || 0;
  const minStock = Number(product.minStock) || 0;

  const purchasePrice = Number(product.purchasePrice) || 0;
  const sellingPrice = Number(product.sellingPrice) || 0;

  const profit = sellingPrice - purchasePrice;
  const unit = product.unit || "KG";

  const stockPercentage =
    stock <= 0
      ? 0
      : minStock > 0
        ? Math.min((stock / (minStock * 3)) * 100, 100)
        : 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
      className="grid grid-cols-[minmax(220px,1.5fr)_minmax(150px,1fr)_minmax(120px,.8fr)_minmax(120px,.8fr)_minmax(120px,.8fr)_90px] items-center gap-4 border-b border-slate-100 px-4 py-3.5 transition last:border-b-0 hover:bg-blue-50/30"
    >
      {/* PRODUCT */}

      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Package size={19} />
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-slate-800">
            {product.name}
          </h3>

          <p className="mt-0.5 truncate text-xs text-slate-500">
            {product.category}
            <span className="mx-1.5 text-slate-300">•</span>
            {product.size}
          </p>

          <span
            className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${currentStatus.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${currentStatus.dot}`} />
            {status}
          </span>
        </div>
      </div>

      {/* STOCK */}

      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-800">
          {stock.toLocaleString()}{" "}
          <span className="text-xs font-medium text-slate-400">{unit}</span>
        </p>

        <div className="mt-1.5 h-1.5 max-w-28 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${currentStatus.progress}`}
            style={{ width: `${stockPercentage}%` }}
          />
        </div>

        <p className="mt-1 text-[10px] text-slate-400">
          Min: {minStock} {unit}
        </p>
      </div>

      {/* PURCHASE PRICE */}

      <p className="text-sm font-semibold text-slate-700">
        {formatCurrency(purchasePrice)}
      </p>

      {/* SELLING PRICE */}

      <p className="text-sm font-semibold text-slate-800">
        {formatCurrency(sellingPrice)}
      </p>

      {/* PROFIT */}

      <p
        className={`text-sm font-semibold ${
          profit >= 0 ? "text-emerald-600" : "text-red-600"
        }`}
      >
        {formatCurrency(profit)}
      </p>

      {/* ACTIONS */}

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={onEdit}
          title="Edit Product"
          className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
        >
          <Pencil size={15} />
        </button>

        <button
          type="button"
          onClick={onDelete}
          title="Delete Product"
          className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </motion.div>
  );
}

// ===================================
// STATISTICS CARD
// ===================================

function StatBox({
  title,
  value,
  icon: Icon,
  color,
  description,
  onClick,
  active = false,
}) {
  const colorClasses = {
    blue: {
      icon: "bg-blue-100 text-blue-700",
      active:
        "border-blue-400 bg-blue-50 ring-2 ring-blue-200 shadow-md shadow-blue-100",
      text: "text-blue-700",
    },

    emerald: {
      icon: "bg-emerald-100 text-emerald-700",
      active:
        "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200 shadow-md shadow-emerald-100",
      text: "text-emerald-700",
    },

    orange: {
      icon: "bg-orange-100 text-orange-700",
      active:
        "border-orange-400 bg-orange-50 ring-2 ring-orange-200 shadow-md shadow-orange-100",
      text: "text-orange-700",
    },

    red: {
      icon: "bg-red-100 text-red-700",
      active:
        "border-red-400 bg-red-50 ring-2 ring-red-200 shadow-md shadow-red-100",
      text: "text-red-700",
    },
  };

  const selectedColor = colorClasses[color] || colorClasses.blue;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={`relative w-full rounded-xl border p-4 text-left transition-all duration-200 ${
        active
          ? `${selectedColor.active} scale-[1.02]`
          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
      }`}
    >
      {/* ACTIVE INDICATOR */}

      {active && (
        <span
          className={`absolute right-3 top-3 h-2.5 w-2.5 rounded-full ${
            color === "blue"
              ? "bg-blue-600"
              : color === "emerald"
                ? "bg-emerald-600"
                : color === "orange"
                  ? "bg-orange-600"
                  : "bg-red-600"
          }`}
        />
      )}

      <div className="flex items-center justify-between gap-2">
        <p
          className={`text-xs font-medium sm:text-sm ${
            active ? selectedColor.text : "text-slate-500"
          }`}
        >
          {title}
        </p>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
            selectedColor.icon
          }`}
        >
          <Icon size={18} />
        </div>
      </div>

      <h3
        className={`mt-3 break-words text-xl font-bold sm:text-2xl ${
          active ? selectedColor.text : "text-slate-800"
        }`}
      >
        {value}
      </h3>

      <p
        className={`mt-1 text-[11px] ${
          active ? selectedColor.text : "text-slate-400"
        }`}
      >
        {description}
      </p>
    </motion.button>
  );
}

// ===================================
// FORM FIELD
// ===================================

function FormField({ label, required, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {children}
    </div>
  );
}

export default Products;
