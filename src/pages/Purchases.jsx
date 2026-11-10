import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  ShoppingCart,
  Wallet,
  Clock,
  FileText,
  X,
  Trash2,
  CalendarDays,
  Eye,
  Package,
  CheckCircle2,
  AlertCircle,
  Truck,
} from "lucide-react";

// Mock suppliers
const suppliers = [
  { id: 1, name: "Al Madina Steel Traders" },
  { id: 2, name: "Pakistan Steel Mills" },
  { id: 3, name: "Swabi Iron Store" },
  { id: 4, name: "National Steel Suppliers" },
];

// Mock products
const availableProducts = [
  { id: 1, name: "Steel Rod 10mm", unit: "KG" },
  { id: 2, name: "Steel Rod 12mm", unit: "KG" },
  { id: 3, name: "Steel Rod 16mm", unit: "KG" },
  { id: 4, name: "GI Pipe 1 Inch", unit: "Piece" },
  { id: 5, name: "Steel Pipe 2 Inch", unit: "Piece" },
  { id: 6, name: "Steel Sheet 4x8", unit: "Sheet" },
  { id: 7, name: "Steel Angle", unit: "Piece" },
  { id: 8, name: "I Beam", unit: "Piece" },
];

// Initial purchase records
const initialPurchases = [
  {
    id: 1,
    invoice: "PUR-1001",
    supplier: "Al Madina Steel Traders",
    date: "2026-11-09",
    items: [
      {
        product: "Steel Rod 10mm",
        quantity: 500,
        unit: "KG",
        rate: 245,
      },
    ],
    total: 122500,
    paid: 122500,
    status: "Paid",
  },
  {
    id: 2,
    invoice: "PUR-1002",
    supplier: "Pakistan Steel Mills",
    date: "2026-11-08",
    items: [
      {
        product: "GI Pipe 1 Inch",
        quantity: 50,
        unit: "Piece",
        rate: 1800,
      },
    ],
    total: 90000,
    paid: 40000,
    status: "Partial",
  },
  {
    id: 3,
    invoice: "PUR-1003",
    supplier: "Swabi Iron Store",
    date: "2026-11-07",
    items: [
      {
        product: "Steel Sheet 4x8",
        quantity: 30,
        unit: "Sheet",
        rate: 4200,
      },
    ],
    total: 126000,
    paid: 0,
    status: "Unpaid",
  },
];

const formatCurrency = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK")}`;

function Purchases() {
  const [purchases, setPurchases] = useState(initialPurchases);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const [formData, setFormData] = useState({
    supplier: "",
    invoice: `PUR-${Date.now().toString().slice(-5)}`,
    date: new Date().toISOString().split("T")[0],
    paid: "",
    notes: "",
    items: [
      {
        productId: "",
        quantity: "",
        rate: "",
      },
    ],
  });

  // Calculate purchase totals
  const totalPurchases = purchases.length;

  const totalAmount = purchases.reduce(
    (sum, purchase) => sum + purchase.total,
    0
  );

  const totalPaid = purchases.reduce(
    (sum, purchase) => sum + purchase.paid,
    0
  );

  const totalPending = totalAmount - totalPaid;

  // Search and filter
  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        purchase.invoice.toLowerCase().includes(searchValue) ||
        purchase.supplier.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        purchase.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [purchases, search, statusFilter]);

  // Calculate current form total
  const purchaseTotal = formData.items.reduce((sum, item) => {
    return sum + Number(item.quantity || 0) * Number(item.rate || 0);
  }, 0);

  const paidAmount = Number(formData.paid || 0);

  const remainingAmount = Math.max(0, purchaseTotal - paidAmount);

  // Handle general input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Handle item input changes
  const handleItemChange = (index, field, value) => {
    setFormData((previous) => {
      const updatedItems = [...previous.items];

      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };

      return {
        ...previous,
        items: updatedItems,
      };
    });
  };

  // Add another product row
  const addItem = () => {
    setFormData((previous) => ({
      ...previous,
      items: [
        ...previous.items,
        {
          productId: "",
          quantity: "",
          rate: "",
        },
      ],
    }));
  };

  // Remove product row
  const removeItem = (index) => {
    setFormData((previous) => ({
      ...previous,
      items: previous.items.filter((_, i) => i !== index),
    }));
  };

  // Open new purchase modal
  const openPurchaseModal = () => {
    setFormData({
      supplier: "",
      invoice: `PUR-${Date.now().toString().slice(-5)}`,
      date: new Date().toISOString().split("T")[0],
      paid: "",
      notes: "",
      items: [
        {
          productId: "",
          quantity: "",
          rate: "",
        },
      ],
    });

    setShowModal(true);
  };

  // Save purchase
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.supplier) {
      alert("Please select a supplier.");
      return;
    }

    const validItems = formData.items.every(
      (item) =>
        item.productId &&
        Number(item.quantity) > 0 &&
        Number(item.rate) > 0
    );

    if (!validItems || purchaseTotal <= 0) {
      alert("Please complete all product details.");
      return;
    }

    if (paidAmount < 0 || paidAmount > purchaseTotal) {
      alert("Paid amount cannot be greater than purchase total.");
      return;
    }

    const selectedItems = formData.items.map((item) => {
      const product = availableProducts.find(
        (p) => p.id === Number(item.productId)
      );

      return {
        product: product.name,
        quantity: Number(item.quantity),
        unit: product.unit,
        rate: Number(item.rate),
      };
    });

    const status =
      paidAmount === 0
        ? "Unpaid"
        : paidAmount >= purchaseTotal
          ? "Paid"
          : "Partial";

    const newPurchase = {
      id: Date.now(),
      invoice: formData.invoice,
      supplier: formData.supplier,
      date: formData.date,
      items: selectedItems,
      total: purchaseTotal,
      paid: paidAmount,
      status,
      notes: formData.notes,
    };

    setPurchases((previous) => [newPurchase, ...previous]);

    setShowModal(false);
  };

  // Status badge
  const getStatusStyle = (status) => {
    switch (status) {
      case "Paid":
        return "bg-emerald-50 text-emerald-700";

      case "Partial":
        return "bg-amber-50 text-amber-700";

      default:
        return "bg-red-50 text-red-600";
    }
  };

  const statCards = [
    {
      title: "Total Purchases",
      value: totalPurchases,
      description: "All purchase invoices",
      icon: ShoppingCart,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Purchase Amount",
      value: formatCurrency(totalAmount),
      description: "Total purchase value",
      icon: Wallet,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      title: "Total Paid",
      value: formatCurrency(totalPaid),
      description: "Payments completed",
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Pending Payments",
      value: formatCurrency(totalPending),
      description: "Remaining supplier dues",
      icon: Clock,
      color: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Purchases Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage supplier purchases, invoices and payments.
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

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;

          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {card.title}
                  </p>

                  <h2 className="mt-3 text-xl font-bold text-slate-800">
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
            </motion.div>
          );
        })}
      </div>

      {/* Purchase History */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Purchase History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View and manage all supplier purchase invoices.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search invoice or supplier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input pl-10 sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input sm:w-36"
            >
              <option value="All">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-slate-50">
              <tr className="text-xs uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4 font-semibold">Invoice</th>
                <th className="px-6 py-4 font-semibold">Supplier</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Items</th>
                <th className="px-6 py-4 font-semibold">Total Amount</th>
                <th className="px-6 py-4 font-semibold">Paid</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.length > 0 ? (
                filteredPurchases.map((purchase) => (
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
                      {purchase.items.length} Product(s)
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {formatCurrency(purchase.total)}
                    </td>

                    <td className="px-6 py-4 text-sm font-medium text-emerald-600">
                      {formatCurrency(purchase.paid)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(purchase.status)}`}
                      >
                        {purchase.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedPurchase(purchase)}
                        title="View Purchase"
                        className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                      >
                        <Eye size={17} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    No purchase records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-6 py-4 text-sm text-slate-500">
          Showing {filteredPurchases.length} of {purchases.length} purchases
        </div>
      </div>

      {/* New Purchase Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              onClick={(e) => e.stopPropagation()}
              className="my-auto w-full max-w-3xl rounded-2xl bg-white shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 p-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Create New Purchase
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Add supplier details and purchased products.
                  </p>
                </div>

                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>

                <div className="max-h-[65vh] space-y-6 overflow-y-auto p-6">

                  {/* Supplier Information */}
                  <div>
                    <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
                      <Truck size={18} className="text-blue-600" />
                      Supplier Information
                    </h3>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Supplier *
                        </label>

                        <select
                          name="supplier"
                          value={formData.supplier}
                          onChange={handleChange}
                          className="form-input"
                          required
                        >
                          <option value="">Select Supplier</option>

                          {suppliers.map((supplier) => (
                            <option
                              key={supplier.id}
                              value={supplier.name}
                            >
                              {supplier.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Invoice Number
                        </label>

                        <input
                          type="text"
                          name="invoice"
                          value={formData.invoice}
                          onChange={handleChange}
                          className="form-input"
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
                          className="form-input"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Purchase Products */}
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 font-semibold text-slate-800">
                        <Package size={18} className="text-blue-600" />
                        Purchase Items
                      </h3>

                      <button
                        type="button"
                        onClick={addItem}
                        className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                      >
                        <Plus size={16} />
                        Add Item
                      </button>
                    </div>

                    <div className="space-y-4">
                      {formData.items.map((item, index) => {
                        const selectedProduct = availableProducts.find(
                          (product) =>
                            product.id === Number(item.productId)
                        );

                        const lineTotal =
                          Number(item.quantity || 0) *
                          Number(item.rate || 0);

                        return (
                          <div
                            key={index}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="mb-3 flex items-center justify-between">
                              <p className="text-sm font-semibold text-slate-700">
                                Item {index + 1}
                              </p>

                              {formData.items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeItem(index)}
                                  className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div className="sm:col-span-2">
                                <label className="mb-2 block text-xs font-medium text-slate-600">
                                  Product *
                                </label>

                                <select
                                  value={item.productId}
                                  onChange={(e) =>
                                    handleItemChange(
                                      index,
                                      "productId",
                                      e.target.value
                                    )
                                  }
                                  className="form-input"
                                  required
                                >
                                  <option value="">Select Product</option>

                                  {availableProducts.map((product) => (
                                    <option
                                      key={product.id}
                                      value={product.id}
                                    >
                                      {product.name} ({product.unit})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="mb-2 block text-xs font-medium text-slate-600">
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
                                      e.target.value
                                    )
                                  }
                                  placeholder="Enter quantity"
                                  className="form-input"
                                  required
                                />

                                {selectedProduct && (
                                  <p className="mt-1 text-xs text-slate-400">
                                    Unit: {selectedProduct.unit}
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="mb-2 block text-xs font-medium text-slate-600">
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
                                      e.target.value
                                    )
                                  }
                                  placeholder="Enter rate"
                                  className="form-input"
                                  required
                                />
                              </div>
                            </div>

                            <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-sm">
                              <span className="text-slate-500">
                                Item Total
                              </span>

                              <span className="font-bold text-slate-800">
                                {formatCurrency(lineTotal)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div>
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
                          step="any"
                          value={formData.paid}
                          onChange={handleChange}
                          placeholder="Enter paid amount"
                          className="form-input"
                        />
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
                          placeholder="Optional notes"
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Purchase Summary */}
                  <div className="rounded-xl bg-slate-900 p-5 text-white">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm text-slate-300">
                        <span>Purchase Total</span>
                        <span>{formatCurrency(purchaseTotal)}</span>
                      </div>

                      <div className="flex justify-between text-sm text-emerald-400">
                        <span>Paid Amount</span>
                        <span>{formatCurrency(paidAmount)}</span>
                      </div>

                      <div className="flex justify-between border-t border-slate-700 pt-3">
                        <span className="font-semibold">
                          Remaining Balance
                        </span>

                        <span className="text-xl font-bold text-amber-400">
                          {formatCurrency(remainingAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Modal Footer */}
                <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 p-6 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <CheckCircle2 size={17} />
                    Save Purchase
                  </button>
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Purchase Details Modal */}
      <AnimatePresence>
        {selectedPurchase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPurchase(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Purchase Details
                  </h2>

                  <p className="mt-1 text-sm text-blue-600">
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

              <div className="mb-5 space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Supplier</span>
                  <span className="text-right font-semibold text-slate-800">
                    {selectedPurchase.supplier}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Date</span>
                  <span className="font-medium text-slate-800">
                    {selectedPurchase.date}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Status</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(selectedPurchase.status)}`}
                  >
                    {selectedPurchase.status}
                  </span>
                </div>
              </div>

              <h3 className="mb-3 font-semibold text-slate-800">
                Purchased Products
              </h3>

              <div className="space-y-3">
                {selectedPurchase.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between gap-3 border-b border-slate-100 pb-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {item.product}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {item.quantity} {item.unit} × {formatCurrency(item.rate)}
                      </p>
                    </div>

                    <p className="font-semibold text-slate-800">
                      {formatCurrency(item.quantity * item.rate)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-3 border-t border-slate-200 pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Amount</span>
                  <span className="font-bold text-slate-800">
                    {formatCurrency(selectedPurchase.total)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Paid Amount</span>
                  <span className="font-semibold text-emerald-600">
                    {formatCurrency(selectedPurchase.paid)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Remaining</span>
                  <span className="font-bold text-red-600">
                    {formatCurrency(
                      selectedPurchase.total - selectedPurchase.paid
                    )}
                  </span>
                </div>
              </div>

              {selectedPurchase.notes && (
                <p className="mt-4 text-sm text-slate-500">
                  Notes: {selectedPurchase.notes}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Purchases;