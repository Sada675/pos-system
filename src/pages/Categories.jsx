import { useState, useMemo } from "react";
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

  // Calculate actual products count for every category
  const categoriesWithCounts = useMemo(() => {
    return categories.map((category) => ({
      ...category,
      products: products.filter((product) => product.category === category.name)
        .length,
    }));
  }, [categories, products]);

  // Search categories
  const filteredCategories = categoriesWithCounts.filter((category) =>
    category.name.toLowerCase().includes(search.toLowerCase()),
  );

  // Statistics
  const totalCategories = categories.length;
  const totalProducts = products.length;

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

      // Rename category in all related products
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
      // Add new category before "Other"
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

  // Close Modal
  const closeModal = () => {
    setModalOpen(false);
    setForm(emptyForm);
    setEditingId(null);
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
          <p className="text-sm font-medium text-blue-600">
            Product Organization
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-800">Categories</h1>

          <p className="mt-1 text-sm text-slate-500">
            Organize and manage your steel product categories.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
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

      {/* Search */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-slate-800">All Categories</h2>

          <p className="mt-1 text-xs text-slate-400">
            Browse and manage your categories.
          </p>
        </div>

        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 sm:w-64"
          />
        </div>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filteredCategories.map((category, index) => (
            <motion.div
              key={category.id}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    colors[category.color] || colors.blue
                  }`}
                >
                  <Boxes size={24} />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(category)}
                    title="Edit Category"
                    className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    onClick={() => handleDelete(category.id)}
                    title="Delete Category"
                    className="rounded-lg bg-red-50 p-2 text-red-500 transition hover:bg-red-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-800">
                {category.name}
              </h3>

              <p className="mt-2 min-h-10 text-sm leading-6 text-slate-500">
                {category.description || "No description available."}
              </p>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Package size={17} />
                  <span className="text-sm">Products</span>
                </div>

                <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700">
                  {category.products}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredCategories.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Layers size={40} className="mx-auto text-slate-300" />

          <h3 className="mt-3 font-bold text-slate-600">No Categories Found</h3>

          <p className="mt-1 text-sm text-slate-400">
            Try another search or create a new category.
          </p>
        </div>
      )}

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
                  <h2 className="text-lg font-bold text-slate-800">
                    {editingId !== null
                      ? "Edit Category"
                      : "Create New Category"}
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Enter your category information.
                  </p>
                </div>

                <button
                  onClick={closeModal}
                  className="rounded-lg bg-slate-100 p-2 text-slate-500 hover:bg-red-50 hover:text-red-500"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 p-5">
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
                      className="form-input"
                    />
                  </div>

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
                      className="form-input resize-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Category Color
                    </label>

                    <select
                      name="color"
                      value={form.color}
                      onChange={handleChange}
                      className="form-input"
                    >
                      <option value="blue">Blue</option>
                      <option value="emerald">Green</option>
                      <option value="orange">Orange</option>
                      <option value="purple">Purple</option>
                      <option value="cyan">Cyan</option>
                    </select>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 p-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
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

// Reusable Statistics Card
function StatCard({ title, value, icon: Icon, color, description }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
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

export default Categories;
