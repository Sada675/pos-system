import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProducts } from "../context/ProductsContext";

import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Save,
  Layers,
  Package,
  Boxes,
  FolderOpen,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

const colors = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  orange: "bg-orange-50 text-orange-600",
  purple: "bg-purple-50 text-purple-600",
  cyan: "bg-cyan-50 text-cyan-600",
};

const emptyForm = {
  name: "",
  description: "",
  color: "blue",
};

function Categories() {
  const { categories, setCategories, products, setProducts } = useProducts();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // Calculate category product counts
  const categoriesWithCounts = useMemo(() => {
    return categories.map((category) => ({
      ...category,
      products: products.filter((product) => product.category === category.name)
        .length,
    }));
  }, [categories, products]);

  // Search categories
  const filteredCategories = useMemo(() => {
    return categoriesWithCounts.filter((category) =>
      `${category.name} ${category.description || ""}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  }, [categoriesWithCounts, search]);

  // Statistics
  const totalCategories = categories.length;
  const totalProducts = products.length;

  // ==========================================
  // PAGINATION LOGIC
  // ==========================================

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentCategories = filteredCategories.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Reset page when search or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage]);

  // Adjust page when categories are deleted
  useEffect(() => {
    if (totalPages === 0) {
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
    } else if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // Open Add Modal
  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (category) => {
    setEditingId(category.id);

    setForm({
      name: category.name,
      description: category.description || "",
      color: category.color || "blue",
    });

    setModalOpen(true);
  };

  // Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Close Modal
  const closeModal = () => {
    setModalOpen(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  // Add or Update Category
  const handleSubmit = (e) => {
    e.preventDefault();

    const categoryName = form.name.trim();

    if (!categoryName) return;

    // Duplicate validation
    const duplicate = categories.some(
      (category) =>
        category.name.toLowerCase() === categoryName.toLowerCase() &&
        category.id !== editingId,
    );

    if (duplicate) {
      alert("This category already exists!");
      return;
    }

    if (editingId !== null) {
      const oldCategory = categories.find(
        (category) => category.id === editingId,
      );

      // Update category
      setCategories((previous) =>
        previous.map((category) =>
          category.id === editingId
            ? {
                ...category,
                name: categoryName,
                description: form.description.trim(),
                color: form.color,
              }
            : category,
        ),
      );

      // Update category name in related products
      if (oldCategory && oldCategory.name !== categoryName) {
        setProducts((previous) =>
          previous.map((product) =>
            product.category === oldCategory.name
              ? {
                  ...product,
                  category: categoryName,
                }
              : product,
          ),
        );
      }
    } else {
      // Add new category before Other
      setCategories((previous) => {
        const newCategory = {
          id: Date.now(),
          name: categoryName,
          description: form.description.trim(),
          color: form.color,
        };

        const otherIndex = previous.findIndex(
          (category) => category.name.toLowerCase() === "other",
        );

        if (otherIndex === -1) {
          return [...previous, newCategory];
        }

        const updatedCategories = [...previous];

        updatedCategories.splice(otherIndex, 0, newCategory);

        return updatedCategories;
      });
    }

    closeModal();
  };

  // Delete Category
  const handleDelete = (id) => {
    const category = categories.find((item) => item.id === id);

    if (!category) return;

    const assignedProducts = products.filter(
      (product) => product.category === category.name,
    );

    if (assignedProducts.length > 0) {
      alert(
        `This category has ${assignedProducts.length} products. Please move or delete those products first.`,
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"?`,
    );

    if (!confirmed) return;

    setCategories((previous) => previous.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
            <Layers size={16} />
            Product Organization
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-800">
            Categories
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Organize and manage your steel product categories.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-100 transition hover:bg-blue-700 active:scale-95"
        >
          <Plus size={19} />
          Add Category
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          title="Total Categories"
          value={totalCategories}
          icon={Layers}
          color="blue"
          description="Available product categories"
        />

        <StatCard
          title="Total Products"
          value={totalProducts}
          icon={Package}
          color="emerald"
          description="Products across all categories"
        />
      </div>

      {/* Categories Section */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold text-slate-800">All Categories</h2>

            <p className="mt-1 text-xs text-slate-400">
              {filteredCategories.length} categories available
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </div>
        </div>

        {/* Column Headers - Desktop */}
        {filteredCategories.length > 0 && (
          <div className="hidden grid-cols-12 gap-4 bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 md:grid">
            <div className="col-span-5">Category</div>

            <div className="col-span-3">Description</div>

            <div className="col-span-2 text-center">Products</div>

            <div className="col-span-2 text-right">Actions</div>
          </div>
        )}

        {/* Category Rows */}
        <div className="divide-y divide-slate-100">
          <AnimatePresence mode="popLayout">
            {currentCategories.map((category) => (
              <motion.div
                key={category.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="group px-5 py-4 transition hover:bg-slate-50/80 sm:px-6"
              >
                <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-12 md:gap-4">
                  {/* Category Information */}
                  <div className="flex min-w-0 items-center gap-3 md:col-span-5">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        colors[category.color] || colors.blue
                      }`}
                    >
                      <Boxes size={21} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-slate-800">
                        {category.name}
                      </h3>

                      <p className="mt-1 text-xs text-slate-400">
                        Product Category
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-3">
                    <p className="line-clamp-2 text-sm text-slate-500">
                      {category.description || "No description available."}
                    </p>
                  </div>

                  {/* Products Count */}
                  <div className="flex items-center justify-between md:col-span-2 md:justify-center">
                    <span className="text-xs font-medium text-slate-400 md:hidden">
                      Products
                    </span>

                    <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-blue-700">
                      <Package size={15} />

                      <span className="text-sm font-bold">
                        {category.products}
                      </span>

                      <span className="text-xs font-medium text-blue-500">
                        Items
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 md:col-span-2 md:justify-end md:border-0 md:pt-0">
                    <span className="text-xs font-medium text-slate-400 md:hidden">
                      Manage Category
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(category)}
                        title="Edit Category"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 transition hover:border-blue-200 hover:bg-blue-600 hover:text-white"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() => handleDelete(category.id)}
                        title="Delete Category"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-500 transition hover:border-red-200 hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredCategories.length === 0 && (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <FolderOpen size={30} />
            </div>

            <h3 className="mt-4 font-bold text-slate-700">
              No Categories Found
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              {search
                ? "Try searching with a different keyword."
                : "Create your first category to get started."}
            </p>

            {!search && (
              <button
                onClick={openAddModal}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Plus size={17} />
                Create Category
              </button>
            )}
          </div>
        )}

        {/* ==========================================
            PAGINATION FOOTER
        ========================================== */}

        {filteredCategories.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Showing Records + Rows Per Page */}
              {/* Rows Per Page + Showing Records */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Rows Per Page - First */}
                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap text-xs text-slate-400">
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

                {/* Showing Records - Second */}
                <p className="text-xs font-medium text-slate-500">
                  Showing{" "}
                  <span className="font-bold text-slate-700">
                    {startIndex + 1}–
                    {Math.min(
                      startIndex + itemsPerPage,
                      filteredCategories.length,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-slate-700">
                    {filteredCategories.length}
                  </span>{" "}
                  categories
                </p>
              </div>

              {/* Page Navigation */}
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Previous */}
                <button
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600"
                >
                  <ChevronLeft size={15} />

                  <span className="hidden sm:inline">Previous</span>
                </button>

                {/* Page Numbers */}
                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1,
                ).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-xs font-bold transition ${
                      currentPage === page
                        ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-100"
                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                {/* Next */}
                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600"
                >
                  <span className="hidden sm:inline">Next</span>

                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <div className="flex items-center gap-2 text-blue-600">
                    <Layers size={18} />

                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Category Management
                    </span>
                  </div>

                  <h2 className="mt-2 text-lg font-bold text-slate-800">
                    {editingId !== null
                      ? "Edit Category"
                      : "Create New Category"}
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Enter your category information below.
                  </p>
                </div>

                <button
                  onClick={closeModal}
                  className="rounded-lg bg-slate-100 p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-500"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="space-y-5 p-5">
                  {/* Category Name */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Category Name *
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. Steel Rods"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Description
                    </label>

                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Write a short category description..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    />
                  </div>

                  {/* Color */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Category Color
                    </label>

                    <select
                      name="color"
                      value={form.color}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    >
                      <option value="blue">Blue</option>
                      <option value="emerald">Green</option>
                      <option value="orange">Orange</option>
                      <option value="purple">Purple</option>
                      <option value="cyan">Cyan</option>
                    </select>
                  </div>

                  {/* Preview */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Category Preview
                    </p>

                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                          colors[form.color] || colors.blue
                        }`}
                      >
                        <Boxes size={21} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">
                          {form.name || "Category Name"}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-400">
                          {form.description || "Category description"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 p-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-100 transition hover:bg-blue-700 active:scale-95"
                  >
                    <Save size={17} />

                    {editingId !== null ? "Update Category" : "Save Category"}
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

// ==========================================
// STATISTICS CARD
// ==========================================

function StatCard({ title, value, icon: Icon, color, description }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-100 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-800">
            {value}
          </h3>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${
            colorClasses[color]
          }`}
        >
          <Icon size={23} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <p className="text-xs text-slate-400">{description}</p>

        <ChevronRight size={15} className="text-slate-300" />
      </div>
    </motion.div>
  );
}

export default Categories;
