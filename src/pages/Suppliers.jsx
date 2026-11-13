import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  Plus,
  Search,
  Users,
  ShoppingBag,
  Wallet,
  AlertCircle,
  Pencil,
  Trash2,
  Eye,
  X,
  Save,
  Phone,
  Mail,
  MapPin,
  Building2,
  CalendarDays,
  Receipt,
  ChevronRight,
  Truck,
} from "lucide-react";

const SUPPLIERS_KEY = "steel-store-suppliers";
const PURCHASES_KEY = "steel-store-purchases";

const readStorage = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
};

const formatCurrency = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 2,
  })}`;

const normalizeName = (name = "") => name.trim().toLowerCase();

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState(() => readStorage(SUPPLIERS_KEY));

  const [purchases, setPurchases] = useState(() => readStorage(PURCHASES_KEY));

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  // Save suppliers
  useEffect(() => {
    localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));
  }, [suppliers]);

  // Keep purchase records updated when page opens
  useEffect(() => {
    const refreshData = () => {
      setPurchases(readStorage(PURCHASES_KEY));
    };

    const handleStorage = (event) => {
      if (!event.key || event.key === PURCHASES_KEY) {
        refreshData();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", refreshData);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", refreshData);
    };
  }, []);

  // Extract suppliers from purchase history
  const allSuppliers = useMemo(() => {
    const supplierMap = new Map();

    suppliers.forEach((supplier) => {
      supplierMap.set(normalizeName(supplier.name), supplier);
    });

    purchases.forEach((purchase) => {
      const name = purchase.supplier?.trim();

      if (!name) return;

      const key = normalizeName(name);

      if (!supplierMap.has(key)) {
        supplierMap.set(key, {
          id: `purchase-${key}`,
          name,
          phone: "",
          email: "",
          address: "",
          notes: "",
          fromPurchase: true,
        });
      }
    });

    return Array.from(supplierMap.values());
  }, [suppliers, purchases]);

  // Calculate supplier purchase information
  const supplierData = useMemo(() => {
    return allSuppliers.map((supplier) => {
      const supplierPurchases = purchases.filter(
        (purchase) =>
          normalizeName(purchase.supplier) === normalizeName(supplier.name),
      );

      const totalPurchases = supplierPurchases.reduce(
        (sum, purchase) => sum + Number(purchase.total || 0),
        0,
      );

      const totalPaid = supplierPurchases.reduce(
        (sum, purchase) => sum + Number(purchase.paid || 0),
        0,
      );

      const pendingBalance = supplierPurchases.reduce(
        (sum, purchase) =>
          sum +
          Math.max(0, Number(purchase.total || 0) - Number(purchase.paid || 0)),
        0,
      );

      return {
        ...supplier,
        purchaseCount: supplierPurchases.length,
        totalPurchases,
        totalPaid,
        pendingBalance,
        purchaseHistory: supplierPurchases,
      };
    });
  }, [allSuppliers, purchases]);

  // Dashboard stats
  const stats = useMemo(() => {
    return {
      totalSuppliers: supplierData.length,

      totalPurchases: supplierData.reduce(
        (sum, supplier) => sum + supplier.totalPurchases,
        0,
      ),

      totalPaid: supplierData.reduce(
        (sum, supplier) => sum + supplier.totalPaid,
        0,
      ),

      pendingBalance: supplierData.reduce(
        (sum, supplier) => sum + supplier.pendingBalance,
        0,
      ),
    };
  }, [supplierData]);

  // Search and filters
  const filteredSuppliers = useMemo(() => {
    return supplierData.filter((supplier) => {
      const query = search.toLowerCase();

      const matchesSearch =
        supplier.name.toLowerCase().includes(query) ||
        supplier.phone?.toLowerCase().includes(query) ||
        supplier.email?.toLowerCase().includes(query) ||
        supplier.address?.toLowerCase().includes(query);

      let matchesFilter = true;

      if (activeFilter === "With Purchases") {
        matchesFilter = supplier.purchaseCount > 0;
      }

      if (activeFilter === "Pending") {
        matchesFilter = supplier.pendingBalance > 0;
      }

      if (activeFilter === "No Purchases") {
        matchesFilter = supplier.purchaseCount === 0;
      }

      return matchesSearch && matchesFilter;
    });
  }, [supplierData, search, activeFilter]);

  // Open add form
  const openAddForm = () => {
    setEditingSupplier(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  // Open edit form
  const openEditForm = (supplier) => {
    if (supplier.fromPurchase) {
      setError(
        "Is supplier ko edit karne se pehle Supplier record create karein.",
      );
      return;
    }

    setEditingSupplier(supplier);

    setForm({
      name: supplier.name || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      notes: supplier.notes || "",
    });

    setError("");
    setShowForm(true);
  };

  // Form input handler
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Save supplier
  const handleSubmit = (e) => {
    e.preventDefault();

    const name = form.name.trim();

    if (!name) {
      setError("Supplier name is required.");
      return;
    }

    const duplicate = allSuppliers.some(
      (supplier) =>
        normalizeName(supplier.name) === normalizeName(name) &&
        supplier.id !== editingSupplier?.id,
    );

    if (duplicate) {
      setError("This supplier already exists.");
      return;
    }

    if (editingSupplier) {
      setSuppliers((prev) =>
        prev.map((supplier) =>
          supplier.id === editingSupplier.id
            ? {
                ...supplier,
                ...form,
                name,
                updatedAt: new Date().toISOString(),
              }
            : supplier,
        ),
      );
    } else {
      const newSupplier = {
        id: `SUP-${Date.now()}`,
        ...form,
        name,
        createdAt: new Date().toISOString(),
      };

      setSuppliers((prev) => [newSupplier, ...prev]);
    }

    setShowForm(false);
    setEditingSupplier(null);
    setForm(emptyForm);
    setError("");
  };

  // Delete supplier
  const handleDelete = (supplier) => {
    if (supplier.fromPurchase) {
      alert(
        "Ye supplier purchase history se aaya hai. Iski purchase history delete nahi ki ja sakti.",
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${supplier.name}?`,
    );

    if (!confirmed) return;

    setSuppliers((prev) => prev.filter((item) => item.id !== supplier.id));

    if (selectedSupplier?.id === supplier.id) {
      setSelectedSupplier(null);
    }
  };

  const getStatus = (supplier) => {
    if (supplier.pendingBalance > 0) {
      return "Pending";
    }

    if (supplier.purchaseCount > 0) {
      return "Paid";
    }

    return "No Purchases";
  };

  const statusStyles = {
    Paid: "bg-emerald-50 text-emerald-700",
    Pending: "bg-amber-50 text-amber-700",
    "No Purchases": "bg-slate-100 text-slate-600",
  };

  const statCards = [
    {
      title: "Total Suppliers",
      value: stats.totalSuppliers,
      icon: Users,
      color: "blue",
      filter: "All",
      description: "Registered suppliers",
    },
    {
      title: "Total Purchases",
      value: formatCurrency(stats.totalPurchases),
      icon: ShoppingBag,
      color: "violet",
      filter: "With Purchases",
      description: "Total purchase amount",
    },
    {
      title: "Total Paid",
      value: formatCurrency(stats.totalPaid),
      icon: Wallet,
      color: "emerald",
      filter: "With Purchases",
      description: "Amount paid to suppliers",
    },
    {
      title: "Pending Balance",
      value: formatCurrency(stats.pendingBalance),
      icon: AlertCircle,
      color: "amber",
      filter: "Pending",
      description: "Remaining supplier payments",
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
    emerald: {
      icon: "bg-emerald-50 text-emerald-600",
      border: "hover:border-emerald-300",
    },
    amber: {
      icon: "bg-amber-50 text-amber-600",
      border: "hover:border-amber-300",
    },
  };

  return (
    <div className="min-h-screen space-y-6 bg-slate-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-blue-600 p-2.5 text-white">
              <Truck size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-800">Suppliers</h1>

              <p className="text-sm text-slate-500">
                Manage your suppliers and payments.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openAddForm}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={19} />
          Add Supplier
        </button>
      </div>

      {/* Statistics */}
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
                setActiveFilter(card.filter);
                setSearch("");
              }}
              className={`rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md ${colors.border}`}
            >
              <div className="flex items-start justify-between">
                <div>
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

      {/* Suppliers Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Table Header */}
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Supplier Directory
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredSuppliers.length} suppliers found
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search supplier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-64"
              />
            </div>

            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="All">All Suppliers</option>
              <option value="With Purchases">With Purchases</option>
              <option value="Pending">Pending Balance</option>
              <option value="No Purchases">No Purchases</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Supplier</th>
                <th className="px-5 py-4">Contact</th>
                <th className="px-5 py-4">Purchases</th>
                <th className="px-5 py-4">Total Amount</th>
                <th className="px-5 py-4">Paid</th>
                <th className="px-5 py-4">Pending</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.map((supplier) => {
                const status = getStatus(supplier);

                return (
                  <tr
                    key={supplier.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <Building2 size={19} />
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800">
                            {supplier.name}
                          </p>

                          <p className="text-xs text-slate-400">
                            {supplier.fromPurchase
                              ? "From purchase history"
                              : "Registered supplier"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-700">
                        {supplier.phone || "—"}
                      </p>

                      <p className="text-xs text-slate-400">
                        {supplier.email || ""}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-sm font-semibold text-blue-700">
                        {supplier.purchaseCount}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                      {formatCurrency(supplier.totalPurchases)}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-emerald-600">
                      {formatCurrency(supplier.totalPaid)}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-amber-600">
                      {formatCurrency(supplier.pendingBalance)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
                      >
                        {status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedSupplier(supplier)}
                          title="View Details"
                          className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          onClick={() => openEditForm(supplier)}
                          title="Edit Supplier"
                          className="rounded-lg bg-amber-50 p-2 text-amber-600 transition hover:bg-amber-100"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => handleDelete(supplier)}
                          title="Delete Supplier"
                          className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-5 py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <Users size={27} />
                    </div>

                    <h3 className="mt-4 font-semibold text-slate-700">
                      No suppliers found
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      Add a supplier or change your search.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Supplier Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Enter supplier information below.
                  </p>
                </div>

                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 p-6">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Supplier Name *
                  </label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter supplier name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Phone Number
                    </label>

                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="03XX XXXXXXX"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Email Address
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="supplier@email.com"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Address
                  </label>

                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Supplier address"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Notes
                  </label>

                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Additional information..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                    {error}
                  </p>
                )}

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
                    {editingSupplier ? "Update Supplier" : "Save Supplier"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Supplier Details Modal */}
      <AnimatePresence>
        {selectedSupplier && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="my-auto max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                    <Building2 size={23} />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-800">
                      {selectedSupplier.name}
                    </h2>

                    <p className="text-sm text-slate-500">Supplier Details</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSupplier(null)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 p-5 sm:p-6">
                {/* Contact Information */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                    <Phone size={19} className="text-blue-600" />

                    <div>
                      <p className="text-xs text-slate-400">Phone</p>

                      <p className="text-sm font-semibold text-slate-700">
                        {selectedSupplier.phone || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                    <Mail size={19} className="text-blue-600" />

                    <div className="min-w-0">
                      <p className="text-xs text-slate-400">Email</p>

                      <p className="break-all text-sm font-semibold text-slate-700">
                        {selectedSupplier.email || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 sm:col-span-2">
                    <MapPin size={19} className="text-blue-600" />

                    <div>
                      <p className="text-xs text-slate-400">Address</p>

                      <p className="text-sm font-semibold text-slate-700">
                        {selectedSupplier.address || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div>
                  <h3 className="mb-3 font-bold text-slate-800">
                    Purchase Summary
                  </h3>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-blue-50 p-4">
                      <p className="text-xs text-blue-600">Total Purchases</p>

                      <h3 className="mt-2 text-lg font-bold text-blue-800">
                        {formatCurrency(selectedSupplier.totalPurchases)}
                      </h3>
                    </div>

                    <div className="rounded-xl bg-emerald-50 p-4">
                      <p className="text-xs text-emerald-600">Total Paid</p>

                      <h3 className="mt-2 text-lg font-bold text-emerald-800">
                        {formatCurrency(selectedSupplier.totalPaid)}
                      </h3>
                    </div>

                    <div className="rounded-xl bg-amber-50 p-4">
                      <p className="text-xs text-amber-600">Pending Balance</p>

                      <h3 className="mt-2 text-lg font-bold text-amber-800">
                        {formatCurrency(selectedSupplier.pendingBalance)}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Purchase History */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">
                      Purchase History
                    </h3>

                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {selectedSupplier.purchaseHistory.length} Records
                    </span>
                  </div>

                  {selectedSupplier.purchaseHistory.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full min-w-[600px] text-left">
                        <thead className="bg-slate-50 text-xs text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Invoice</th>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Total</th>
                            <th className="px-4 py-3">Paid</th>
                            <th className="px-4 py-3">Remaining</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {selectedSupplier.purchaseHistory
                            .slice()
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .map((purchase) => (
                              <tr key={purchase.id}>
                                <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                                  {purchase.invoice || "—"}
                                </td>

                                <td className="px-4 py-3 text-sm text-slate-500">
                                  {purchase.date
                                    ? new Date(
                                        purchase.date,
                                      ).toLocaleDateString()
                                    : "—"}
                                </td>

                                <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                                  {formatCurrency(purchase.total)}
                                </td>

                                <td className="px-4 py-3 text-sm text-emerald-600">
                                  {formatCurrency(purchase.paid)}
                                </td>

                                <td className="px-4 py-3 text-sm font-semibold text-amber-600">
                                  {formatCurrency(
                                    Math.max(
                                      0,
                                      Number(purchase.total || 0) -
                                        Number(purchase.paid || 0),
                                    ),
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
                      <Receipt size={28} className="mx-auto text-slate-300" />

                      <p className="mt-3 text-sm font-medium text-slate-600">
                        No purchase history yet
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Purchases from this supplier will appear here.
                      </p>
                    </div>
                  )}
                </div>

                {selectedSupplier.notes && (
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-500">
                      Notes
                    </p>

                    <p className="mt-1 text-sm text-slate-700">
                      {selectedSupplier.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 p-5 text-right">
                <button
                  onClick={() => setSelectedSupplier(null)}
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
