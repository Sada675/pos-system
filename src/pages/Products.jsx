import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProducts } from "../context/ProductsContext";

import {
  Plus,
  Search,
  Package,
  Boxes,
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
  TrendingUp,
  SlidersHorizontal,
  ArrowUpRight,
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

// ===================================
// STOCK STATUS HELPER
// ===================================

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
  const { products, setProducts, categories } = useProducts();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
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
  // STAT CARD FILTER HANDLER
  // ===================================

  const handleStatFilter = (filter) => {
    setStockFilter(filter);
    setCurrentPage(1);
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
  // HANDLE INPUT CHANGE
  // ===================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    // Custom unit selection
    if (name === "unit") {
      setIsCustomUnit(value === "Custom");

      if (value !== "Custom") {
        setForm((previous) => ({
          ...previous,
          unit: value,
          customUnit: "",
        }));
      }
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

    // Get actual unit
    const finalUnit = isCustomUnit ? form.customUnit.trim() : form.unit;

    // Required fields validation
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
      alert("Please fill in all required fields.");
      return;
    }

    if (finalUnit === "Custom") {
      alert("Please enter a valid custom unit.");
      return;
    }

    // Category validation
    const categoryExists = categories.some(
      (category) => category.name === form.category,
    );

    if (!categoryExists) {
      alert("Please select a valid category.");
      return;
    }

    // Number validation
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
      alert("Please enter valid positive numbers.");
      return;
    }

    // Final product data
    const productData = {
      name: form.name.trim(),
      category: form.category,
      size: form.size.trim(),

      purchasePrice,
      sellingPrice,
      stock,
      minStock,

      // Save actual unit, not Custom
      unit: finalUnit,
    };

    // UPDATE PRODUCT
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
    }

    // ADD PRODUCT
    else {
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
    const confirmed = window.confirm(
      "Are you sure you want to delete this product? This action cannot be undone.",
    );

    if (!confirmed) return;

    setProducts((previous) => previous.filter((product) => product.id !== id));
  };

  // ===================================
  // RESET FILTERS
  // ===================================

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("All");
    setStockFilter("All");
    setCurrentPage(1);
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
    <div className="space-y-7">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600" />

            <p className="text-sm font-semibold text-blue-600">
              Inventory Management
            </p>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
            Products
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage your products, pricing and inventory levels.
          </p>
        </div>

        <button
          onClick={openAddModal}
          disabled={categories.length === 0}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={19} />
          Add New Product
        </button>
      </div>

      {/* CLICKABLE STATISTICS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatBox
          title="Total Products"
          value={totalProducts}
          description="Products registered"
          icon={Package}
          color="blue"
          active={stockFilter === "All"}
          onClick={() => handleStatFilter("All")}
        />

        <StatBox
          title="Stock Value"
          value={formatCurrency(totalStockValue)}
          description="Based on purchase prices"
          icon={CircleDollarSign}
          color="emerald"
          onClick={() => handleStatFilter("All")}
        />

        <StatBox
          title="Low Stock"
          value={lowStockProducts}
          description="Products need restocking"
          icon={AlertTriangle}
          color="orange"
          active={stockFilter === "Low Stock"}
          onClick={() => handleStatFilter("Low Stock")}
        />

        <StatBox
          title="Out of Stock"
          value={outOfStockProducts}
          description="Currently unavailable"
          icon={PackageX}
          color="red"
          active={stockFilter === "Out of Stock"}
          onClick={() => handleStatFilter("Out of Stock")}
        />
      </div>

      {/* PRODUCTS SECTION */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* SECTION HEADER */}

        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800">All Products</h2>

              <p className="mt-1 text-xs text-slate-400">
                Click any product card to view or edit its details.
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600">
              {filteredProducts.length} Products Found
            </div>
          </div>

          {/* SEARCH AND CATEGORY */}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {/* SEARCH */}

            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search name, size or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* CATEGORY */}

            <div className="relative">
              <Filter
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-600 outline-none transition focus:border-blue-500"
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
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-600 outline-none transition focus:border-blue-500"
              >
                <option value="All">All Stock Status</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* QUICK FILTERS */}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold text-slate-400">
              Quick filters:
            </span>

            {[
              { label: "All", value: "All" },
              { label: "In Stock", value: "In Stock" },
              { label: "Low Stock", value: "Low Stock" },
              { label: "Out of Stock", value: "Out of Stock" },
            ].map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => handleStatFilter(filter.value)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  stockFilter === filter.value
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {filter.label}
              </button>
            ))}

            {(search || categoryFilter !== "All" || stockFilter !== "All") && (
              <button
                type="button"
                onClick={resetFilters}
                className="ml-auto text-xs font-semibold text-red-500 transition hover:text-red-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* PRODUCT CARDS */}

        <div className="bg-slate-50/50 p-5 sm:p-6">
          {currentProducts.length > 0 ? (
            <motion.div
              layout
              className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
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
            </motion.div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Package size={30} />
              </div>

              <h3 className="mt-4 font-bold text-slate-700">
                No Products Found
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
                {products.length === 0
                  ? "Your inventory is empty. Add your first product to get started."
                  : "No products match your search or selected filters. Try changing your filters."}
              </p>

              {products.length === 0 ? (
                <button
                  onClick={openAddModal}
                  disabled={categories.length === 0}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  <Plus size={17} />
                  Add First Product
                </button>
              ) : (
                <button
                  onClick={resetFilters}
                  className="mt-5 rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* PAGINATION */}

        {filteredProducts.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:px-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Show:</span>

                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value={6}>6</option>
                  <option value={8}>8</option>
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                </select>
              </div>

              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-bold text-slate-800">
                  {startIndex + 1}
                </span>
                {" - "}
                <span className="font-bold text-slate-800">
                  {Math.min(startIndex + itemsPerPage, filteredProducts.length)}
                </span>
                {" of "}
                <span className="font-bold text-slate-800">
                  {filteredProducts.length}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <span className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              {/* MODAL HEADER */}

              <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      {editingId !== null ? (
                        <Pencil size={17} />
                      ) : (
                        <Plus size={19} />
                      )}
                    </div>

                    <h2 className="text-lg font-bold text-slate-800">
                      {editingId !== null ? "Edit Product" : "Add New Product"}
                    </h2>
                  </div>

                  <p className="text-xs text-slate-400">
                    Enter your product information below.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl bg-slate-100 p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-500"
                >
                  <X size={20} />
                </button>
              </div>

              {/* FORM */}

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
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

                  {/* UNIT SELECT */}

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

                    {/* CUSTOM UNIT INPUT */}

                    <AnimatePresence>
                      {isCustomUnit && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -5 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -5 }}
                          className="mt-3 overflow-hidden"
                        >
                          <input
                            type="text"
                            name="customUnit"
                            value={form.customUnit}
                            onChange={handleChange}
                            placeholder="Enter custom unit e.g. Dozen, Roll, Bag"
                            required={isCustomUnit}
                            autoFocus
                            className="form-input border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />

                          <p className="mt-1.5 text-xs text-slate-400">
                            Enter the unit in which this product is measured.
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
                      placeholder="Enter available quantity"
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

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 p-5 sm:flex-row sm:justify-end sm:p-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={categories.length === 0}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save size={17} />

                    {editingId !== null ? "Update Product" : "Save Product"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ===================================
// PRODUCT CARD
// ===================================

function ProductCard({ product, status, onEdit, onDelete }) {
  const statusStyles = {
    "In Stock": {
      badge: "bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
    },

    "Low Stock": {
      badge: "bg-orange-50 text-orange-700",
      dot: "bg-orange-500",
    },

    "Out of Stock": {
      badge: "bg-red-50 text-red-700",
      dot: "bg-red-500",
    },
  };

  const currentStatus = statusStyles[status];

  const stock = Number(product.stock) || 0;
  const minStock = Number(product.minStock) || 0;

  const profit =
    Number(product.sellingPrice || 0) - Number(product.purchasePrice || 0);

  const unit = product.unit || "KG";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={onEdit}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Edit ${product.name}`}
      className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {/* CARD HEADER */}

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition ${
              status === "Out of Stock"
                ? "bg-red-50 text-red-500"
                : status === "Low Stock"
                  ? "bg-orange-50 text-orange-500"
                  : "bg-blue-50 text-blue-600"
            }`}
          >
            <Package size={23} />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-slate-800 transition group-hover:text-blue-600">
              {product.name}
            </h3>

            <p className="mt-1 text-xs text-slate-400">{product.category}</p>
          </div>
        </div>

        <span
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-bold ${currentStatus.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${currentStatus.dot}`} />

          {status}
        </span>
      </div>

      {/* PRODUCT SIZE */}

      <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Product Size
          </p>

          <p className="mt-1 text-sm font-bold text-slate-700">
            {product.size}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Unit
          </p>

          <p className="mt-1 text-sm font-bold text-slate-700">{unit}</p>
        </div>
      </div>

      {/* STOCK INFORMATION */}

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500">
            Available Stock
          </p>

          <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
            <Boxes size={14} />
            {stock.toLocaleString()} {unit}
          </div>
        </div>

        <div
          className={`mt-3 h-2 overflow-hidden rounded-full ${
            status === "Out of Stock"
              ? "bg-red-100"
              : status === "Low Stock"
                ? "bg-orange-100"
                : "bg-emerald-100"
          }`}
        >
          <div
            className={`h-full rounded-full transition-all ${
              status === "Out of Stock"
                ? "w-0"
                : status === "Low Stock"
                  ? "w-1/3 bg-orange-500"
                  : "w-full bg-emerald-500"
            }`}
          />
        </div>

        <div className="mt-2 flex justify-between text-[11px] text-slate-400">
          <span>
            Minimum: {minStock} {unit}
          </span>

          <span>
            {status === "Out of Stock"
              ? "Unavailable"
              : status === "Low Stock"
                ? "Restock Needed"
                : "Stock Available"}
          </span>
        </div>
      </div>

      {/* PRICES */}

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Purchase Price
          </p>

          <p className="mt-1 text-sm font-bold text-slate-600">
            {formatCurrency(product.purchasePrice)}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Selling Price
          </p>

          <p className="mt-1 text-sm font-bold text-slate-800">
            {formatCurrency(product.sellingPrice)}
          </p>
        </div>
      </div>

      {/* PROFIT */}

      <div className="mt-4 flex items-center justify-between rounded-xl bg-blue-50/70 px-3 py-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-blue-600" />

          <span className="text-xs font-medium text-slate-600">
            Profit / {unit}
          </span>
        </div>

        <span
          className={`text-sm font-bold ${
            profit >= 0 ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {formatCurrency(profit)}
        </span>
      </div>

      {/* CARD ACTIONS */}

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 transition group-hover:gap-2">
          Edit Details
          <ArrowUpRight size={14} />
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            title="Edit Product"
            aria-label="Edit product"
            className="rounded-lg bg-blue-50 p-2.5 text-blue-600 transition hover:bg-blue-100"
          >
            <Pencil size={16} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete Product"
            aria-label="Delete product"
            className="rounded-lg bg-red-50 p-2.5 text-red-500 transition hover:bg-red-100"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ===================================
// CLICKABLE STATISTICS CARD
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
      icon: "bg-blue-50 text-blue-600",
      line: "bg-blue-500",
    },

    emerald: {
      icon: "bg-emerald-50 text-emerald-600",
      line: "bg-emerald-500",
    },

    orange: {
      icon: "bg-orange-50 text-orange-600",
      line: "bg-orange-500",
    },

    red: {
      icon: "bg-red-50 text-red-600",
      line: "bg-red-500",
    },
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative w-full overflow-hidden rounded-2xl border bg-white p-5 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg ${
        active
          ? "border-blue-300 ring-2 ring-blue-100"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <h3 className="mt-2 text-2xl font-bold text-slate-800">{value}</h3>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClasses[color].icon}`}
        >
          <Icon size={23} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-slate-400">{description}</p>

        <ArrowUpRight
          size={16}
          className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-blue-600"
        />
      </div>

      <div
        className={`absolute bottom-0 left-0 h-1 transition-all duration-300 ${
          active ? "w-full" : "w-0 group-hover:w-full"
        } ${colorClasses[color].line}`}
      />
    </motion.button>
  );
}

// ===================================
// FORM FIELD
// ===================================

function FormField({ label, required, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {children}
    </div>
  );
}

export default Products;
