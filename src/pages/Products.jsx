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
} from "lucide-react";

const emptyForm = {
  name: "",
  category: "",
  size: "",
  purchasePrice: "",
  sellingPrice: "",
  stock: "",
  unit: "KG",
  minStock: "",
};

const formatCurrency = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK")}`;

function Products() {
  // Shared Products and Categories Context
  const { products, setProducts, categories } = useProducts();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Statistics
  const totalProducts = products.length;

  const lowStockProducts = products.filter(
    (product) => Number(product.stock) <= Number(product.minStock),
  ).length;

  const totalStockValue = products.reduce(
    (total, product) =>
      total + Number(product.stock || 0) * Number(product.purchasePrice || 0),
    0,
  );

  // Search and Category Filtering
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const searchTerm = search.toLowerCase();

      const matchesSearch =
        (product.name || "").toLowerCase().includes(searchTerm) ||
        (product.size || "").toLowerCase().includes(searchTerm);

      const matchesCategory =
        categoryFilter === "All" || product.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  // Pagination Calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentProducts = filteredProducts.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Reset pagination when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, itemsPerPage]);

  // Keep selected category filter valid
  useEffect(() => {
    if (
      categoryFilter !== "All" &&
      !categories.some((category) => category.name === categoryFilter)
    ) {
      setCategoryFilter("All");
    }
  }, [categories, categoryFilter]);

  // Keep current page valid after deletion
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }

    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Pagination Handlers
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

  // Open Add Modal
  const openAddModal = () => {
    setEditingId(null);

    setForm({
      ...emptyForm,
      category: categories[0]?.name || "",
    });

    setModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (product) => {
    setEditingId(product.id);

    setForm({
      ...product,
      purchasePrice: String(product.purchasePrice),
      sellingPrice: String(product.sellingPrice),
      stock: String(product.stock),
      minStock: String(product.minStock),
    });

    setModalOpen(true);
  };

  // Close Modal
  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm({
      ...emptyForm,
      category: categories[0]?.name || "",
    });
  };

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Add or Update Product
  const handleSubmit = (e) => {
    e.preventDefault();

    const purchasePrice = Number(form.purchasePrice);
    const sellingPrice = Number(form.sellingPrice);
    const stock = Number(form.stock);
    const minStock = Number(form.minStock);

    // Validate required fields
    if (
      !form.name.trim() ||
      !form.size.trim() ||
      !form.category ||
      !form.unit ||
      form.purchasePrice === "" ||
      form.sellingPrice === "" ||
      form.stock === "" ||
      form.minStock === ""
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    // Validate selected category
    const categoryExists = categories.some(
      (category) => category.name === form.category,
    );

    if (!categoryExists) {
      alert("Please select a valid category.");
      return;
    }

    // Validate numeric values
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

    const productData = {
      ...form,
      name: form.name.trim(),
      size: form.size.trim(),
      purchasePrice,
      sellingPrice,
      stock,
      minStock,
    };

    if (editingId !== null) {
      // Update existing product
      setProducts((previous) =>
        previous.map((product) =>
          product.id === editingId
            ? { ...productData, id: editingId }
            : product,
        ),
      );
    } else {
      // Add new product
      const newProduct = {
        ...productData,
        id: Date.now(),
      };

      setProducts((previous) => [newProduct, ...previous]);

      setCurrentPage(1);
    }

    closeModal();
  };

  // Delete Product
  const handleDelete = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?",
    );

    if (!confirmed) return;

    setProducts((previous) => previous.filter((product) => product.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Inventory Management
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-800">
            Products Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your steel products, prices and stock.
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatBox
          title="Total Products"
          value={totalProducts}
          icon={Package}
          color="blue"
          description="Products in your store"
        />

        <StatBox
          title="Total Stock Value"
          value={formatCurrency(totalStockValue)}
          icon={Boxes}
          color="emerald"
          description="Based on purchase prices"
        />

        <StatBox
          title="Low Stock Products"
          value={lowStockProducts}
          icon={AlertTriangle}
          color="orange"
          description="Products need restocking"
        />
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Search and Filter */}
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-bold text-slate-800">All Products</h2>

            <p className="mt-1 text-xs text-slate-400">
              Manage your complete product inventory.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Search */}
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 sm:w-60"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm text-slate-600 outline-none focus:border-blue-500 sm:w-48"
              >
                <option value="All">All Categories</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Purchase Price</th>
                <th className="px-6 py-4 font-semibold">Selling Price</th>
                <th className="px-6 py-4 font-semibold">Stock</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {currentProducts.map((product) => {
                  const isLowStock =
                    Number(product.stock) <= Number(product.minStock);

                  return (
                    <motion.tr
                      key={product.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Package size={21} />
                          </div>

                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {product.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Size: {product.size}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                          {product.category}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {formatCurrency(product.purchasePrice)}
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                        {formatCurrency(product.sellingPrice)}
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-800">
                          {Number(product.stock).toLocaleString()}{" "}
                          <span className="text-xs font-medium text-slate-400">
                            {product.unit}
                          </span>
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Min: {product.minStock} {product.unit}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                            isLowStock
                              ? "bg-orange-50 text-orange-600"
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {isLowStock ? "Low Stock" : "In Stock"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            title="Edit Product"
                            className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            onClick={() => handleDelete(product.id)}
                            title="Delete Product"
                            className="rounded-lg bg-red-50 p-2 text-red-500 transition hover:bg-red-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <div className="py-16 text-center">
              <Package size={40} className="mx-auto text-slate-300" />

              <h3 className="mt-3 font-bold text-slate-600">
                No Products Found
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                {products.length === 0
                  ? "Add your first product to get started."
                  : "Try another search or category filter."}
              </p>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row md:px-6">
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
                <option value={100}>100</option>
              </select>
            </div>

            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-800">
                {filteredProducts.length === 0 ? 0 : startIndex + 1}
              </span>
              {" - "}
              <span className="font-semibold text-slate-800">
                {Math.min(startIndex + itemsPerPage, filteredProducts.length)}
              </span>
              {" of "}
              <span className="font-semibold text-slate-800">
                {filteredProducts.length}
              </span>
              {" products"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1 || totalPages === 0}
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
                      ? "bg-blue-600 text-white shadow-md shadow-blue-100"
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
      </div>

      {/* Add / Edit Product Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {editingId !== null ? "Edit Product" : "Add New Product"}
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
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

              {/* Form */}
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

                  <FormField label="Unit" required>
                    <select
                      name="unit"
                      value={form.unit}
                      onChange={handleChange}
                      required
                      className="form-input"
                    >
                      <option value="KG">KG</option>
                      <option value="Ton">Ton</option>
                      <option value="Piece">Piece</option>
                      <option value="Feet">Feet</option>
                      <option value="Meter">Meter</option>
                      <option value="Bundle">Bundle</option>
                      <option value="Sheet">Sheet</option>
                    </select>
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

                  <FormField label="Opening Stock" required>
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

                {/* Modal Footer */}
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

// Reusable Statistics Card
function StatBox({ title, value, icon: Icon, color, description }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <h3 className="mt-2 text-2xl font-bold text-slate-800">{value}</h3>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClasses[color]}`}
        >
          <Icon size={23} />
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-400">{description}</p>
    </motion.div>
  );
}

// Reusable Form Field
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
