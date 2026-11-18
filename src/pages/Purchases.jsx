import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProducts } from "../context/ProductsContext";
import SupplierPurchaseDetails from "../components/purchases/SupplierPurchaseDetails";

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
  FileText,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Printer,
  UserPlus,
  Phone,
  Check,
  Users,
} from "lucide-react";

const PURCHASES_KEY = "steel-store-purchases";
const STOCK_HISTORY_KEY = "steel-store-stock-history";
const SUPPLIER_ADVANCES_KEY = "steel-store-supplier-advances";
const SUPPLIERS_KEY = "steel-store-suppliers";

const formatCurrency = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 2,
  })}`;

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizeSupplier = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const normalizePhone = (value) =>
  String(value || "")
    .replace(/\D/g, "")
    .replace(/^0092/, "92")
    .replace(/^0(?=\d{10}$)/, "92");

const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[c],
  );

const readLocalStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const getPurchaseBalance = (purchase) =>
  purchase.balance != null
    ? Math.max(0, toNumber(purchase.balance))
    : Math.max(0, toNumber(purchase.total) - toNumber(purchase.paid));

const getPaymentStatus = (total, paid) =>
  paid <= 0 ? "Unpaid" : paid >= total ? "Paid" : "Partial";

const generateInvoiceNumber = (purchases = []) => {
  const prefix = `INV-${new Date().getFullYear()}-`;

  const max = purchases.reduce((highest, p) => {
    const invoice = String(p.invoice || "");

    if (!invoice.startsWith(prefix)) return highest;

    const n = Number(invoice.slice(prefix.length));

    return Number.isFinite(n) ? Math.max(highest, n) : highest;
  }, 0);

  return `${prefix}${String(max + 1).padStart(4, "0")}`;
};

const emptyItem = () => ({
  productName: "",
  category: "",
  size: "",
  unit: "KG",
  quantity: "",
  rate: "",
  sellingPrice: "",
  minStock: 5,
});

const getInitialForm = (invoice) => ({
  supplierId: "",
  supplier: "",
  supplierPhone: "",
  invoice: invoice || "",
  date: new Date().toISOString().split("T")[0],
  paid: "",
  items: [emptyItem()],
});

function Purchases() {
  const { products = [], setProducts, categories = [] } = useProducts();

  const [purchases, setPurchases] = useState(() => {
    const saved = readLocalStorage(PURCHASES_KEY, []);
    return Array.isArray(saved) ? saved : [];
  });

  const [suppliers, setSuppliers] = useState(() => {
    const saved = readLocalStorage(SUPPLIERS_KEY, []);
    return Array.isArray(saved) ? saved : [];
  });

  const [supplierAdvances, setSupplierAdvances] = useState(() =>
    readLocalStorage(SUPPLIER_ADVANCES_KEY, {}),
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const [showModal, setShowModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [selectedSupplierGroup, setSelectedSupplierGroup] = useState(null);

  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [showSupplierOptions, setShowSupplierOptions] = useState(false);

  const [supplierForm, setSupplierForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const [alertMessage, setAlertMessage] = useState("");

  const [formData, setFormData] = useState(() =>
    getInitialForm(generateInvoiceNumber(readLocalStorage(PURCHASES_KEY, []))),
  );

  // Prevent number inputs from changing through mouse wheel.
  useEffect(() => {
    const preventWheelChange = (e) => {
      if (e.target instanceof HTMLInputElement && e.target.type === "number") {
        e.preventDefault();
        e.target.blur();
      }
    };

    document.addEventListener("wheel", preventWheelChange, {
      capture: true,
      passive: false,
    });

    return () => {
      document.removeEventListener("wheel", preventWheelChange, true);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem(
      SUPPLIER_ADVANCES_KEY,
      JSON.stringify(supplierAdvances),
    );
  }, [supplierAdvances]);

  useEffect(() => {
    localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));
  }, [suppliers]);

  // Selected supplier in purchase form.
  const selectedSupplier = suppliers.find(
    (s) => String(s.id) === String(formData.supplierId),
  );

  const supplierKey = selectedSupplier
    ? `supplier:${selectedSupplier.id}`
    : formData.supplierId
      ? `supplier:${formData.supplierId}`
      : normalizeSupplier(formData.supplier);

  const legacySupplierKey = normalizeSupplier(formData.supplier);

  const availableSupplierAdvance = Math.max(
    0,
    toNumber(
      supplierAdvances[supplierKey]?.balance ??
        supplierAdvances[legacySupplierKey]?.balance,
    ),
  );

  // Purchase calculations.
  const purchaseTotal = useMemo(
    () =>
      formData.items.reduce(
        (sum, item) => sum + toNumber(item.quantity) * toNumber(item.rate),
        0,
      ),
    [formData.items],
  );

  const cashPaid = Math.max(0, toNumber(formData.paid));

  const advanceApplied = Math.min(purchaseTotal, availableSupplierAdvance);

  const remainingAfterAdvance = Math.max(0, purchaseTotal - advanceApplied);

  const cashApplied = Math.min(cashPaid, remainingAfterAdvance);

  const newAdvance = Math.max(0, cashPaid - remainingAfterAdvance);

  const totalSettled = advanceApplied + cashApplied;

  const remainingAmount = Math.max(0, purchaseTotal - totalSettled);

  const paymentStatus = getPaymentStatus(purchaseTotal, totalSettled);

  const supplierAdvanceAfterPurchase =
    availableSupplierAdvance - advanceApplied + newAdvance;

  // Overall statistics remain invoice-based.
  const stats = useMemo(
    () => ({
      totalPurchases: purchases.length,

      totalSuppliers: new Set(
        purchases.map((p) =>
          p.supplierId
            ? `id:${p.supplierId}`
            : `legacy:${normalizeSupplier(p.supplier)}:${normalizePhone(
                p.supplierPhone,
              )}`,
        ),
      ).size,

      totalAmount: purchases.reduce((sum, p) => sum + toNumber(p.total), 0),

      totalPaid: purchases.reduce((sum, p) => sum + toNumber(p.paid), 0),

      totalPending: purchases.reduce(
        (sum, p) => sum + getPurchaseBalance(p),
        0,
      ),
    }),
    [purchases],
  );

  // Group all invoices by supplier.
  const supplierGroups = useMemo(() => {
    const groups = new Map();

    purchases.forEach((purchase) => {
      const key = purchase.supplierId
        ? `id:${purchase.supplierId}`
        : `legacy:${normalizeSupplier(purchase.supplier)}:${normalizePhone(
            purchase.supplierPhone,
          )}`;

      if (!groups.has(key)) {
        const supplierRecord = suppliers.find(
          (s) => String(s.id) === String(purchase.supplierId),
        );

        groups.set(key, {
          key,
          supplierId: purchase.supplierId || null,
          name: supplierRecord?.name || purchase.supplier || "Unknown Supplier",
          phone: supplierRecord?.phone || purchase.supplierPhone || "",
          email: supplierRecord?.email || "",
          address: supplierRecord?.address || "",
          purchases: [],
          totalAmount: 0,
          totalPaid: 0,
          totalPending: 0,
          totalItems: 0,
          lastPurchaseDate: purchase.date || "",
        });
      }

      const group = groups.get(key);

      group.purchases.push(purchase);
      group.totalAmount += toNumber(purchase.total);
      group.totalPaid += toNumber(purchase.paid);
      group.totalPending += getPurchaseBalance(purchase);

      group.totalItems += (purchase.items || []).reduce(
        (sum, item) => sum + toNumber(item.quantity),
        0,
      );

      if (
        new Date(purchase.date || purchase.createdAt) >
        new Date(group.lastPurchaseDate || 0)
      ) {
        group.lastPurchaseDate = purchase.date || "";
      }
    });

    return Array.from(groups.values()).map((group) => ({
      ...group,
      invoiceCount: group.purchases.length,
      status:
        group.totalPending <= 0
          ? "Paid"
          : group.totalPaid <= 0
            ? "Unpaid"
            : "Partial",
    }));
  }, [purchases, suppliers]);

  // Supplier overview filtering.
  const filteredSuppliers = useMemo(() => {
    const q = search.trim().toLowerCase();

    return supplierGroups
      .filter((supplier) => {
        const matchesSearch =
          !q ||
          supplier.name.toLowerCase().includes(q) ||
          supplier.phone.toLowerCase().includes(q);

        const matchesStatus =
          statusFilter === "All"
            ? true
            : statusFilter === "Pending"
              ? supplier.totalPending > 0
              : supplier.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort(
        (a, b) =>
          new Date(b.lastPurchaseDate || 0) - new Date(a.lastPurchaseDate || 0),
      );
  }, [supplierGroups, search, statusFilter]);

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const endIndex = Math.min(
    startIndex + itemsPerPage,
    filteredSuppliers.length,
  );

  const paginatedSuppliers = filteredSuppliers.slice(startIndex, endIndex);

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const hasActiveFilters = search.trim() !== "" || statusFilter !== "All";

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, itemsPerPage]);

  useEffect(() => {
    if (!totalPages) setCurrentPage(1);
    else if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const showAlert = (message) => setAlertMessage(message);

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

  const selectSupplier = (supplier) => {
    setFormData((prev) => ({
      ...prev,
      supplierId: String(supplier.id),
      supplier: supplier.name || "",
      supplierPhone: supplier.phone || "",
    }));

    setSupplierSearch(supplier.name || "");
    setShowSupplierOptions(false);
  };

  const filteredSupplierOptions = suppliers.filter((supplier) => {
    const q = supplierSearch.toLowerCase().trim();

    return (
      !q ||
      String(supplier.name || "")
        .toLowerCase()
        .includes(q) ||
      String(supplier.phone || "")
        .toLowerCase()
        .includes(q)
    );
  });

  const handleAddSupplier = (e) => {
    e.preventDefault();

    const name = supplierForm.name.trim();
    const phone = supplierForm.phone.trim();

    if (!name) return showAlert("Please enter supplier name.");

    if (!phone) return showAlert("Please enter supplier phone number.");

    const normalized = normalizePhone(phone);

    const duplicatePhone = suppliers.find(
      (s) => normalizePhone(s.phone) === normalized,
    );

    if (duplicatePhone) {
      selectSupplier(duplicatePhone);

      setShowSupplierModal(false);

      setSupplierForm({
        name: "",
        phone: "",
        email: "",
        address: "",
      });

      showAlert(
        `This phone number already belongs to ${duplicatePhone.name}. Existing supplier selected.`,
      );

      return;
    }

    const duplicateName = suppliers.find(
      (s) => normalizeSupplier(s.name) === normalizeSupplier(name),
    );

    if (duplicateName) {
      showAlert(
        "A supplier with this name already exists. Please select the existing supplier or use a distinct name.",
      );

      return;
    }

    const newSupplier = {
      id: `supplier-${Date.now()}`,
      name,
      phone,
      email: supplierForm.email.trim(),
      address: supplierForm.address.trim(),
      createdAt: new Date().toISOString(),
    };

    setSuppliers((prev) => [newSupplier, ...prev]);

    selectSupplier(newSupplier);
    setShowSupplierModal(false);

    setSupplierForm({
      name: "",
      phone: "",
      email: "",
      address: "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedItems = [...prev.items];

      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };

      if (field === "productName") {
        const existing = products.find(
          (p) => p.name?.toLowerCase().trim() === value.toLowerCase().trim(),
        );

        if (existing) {
          updatedItems[index] = {
            ...updatedItems[index],
            productName: existing.name,
            category: existing.category || "",
            size: existing.size || "",
            unit: existing.unit || "KG",
            sellingPrice: existing.sellingPrice ?? "",
            minStock: existing.minStock ?? 5,
          };
        }
      }

      return {
        ...prev,
        items: updatedItems,
      };
    });
  };

  const addItem = () =>
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, emptyItem()],
    }));

  const removeItem = (index) =>
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));

  const openPurchaseModal = () => {
    setFormData(getInitialForm(generateInvoiceNumber(purchases)));
    setSupplierSearch("");
    setShowSupplierOptions(false);
    setShowModal(true);
  };

  // Save purchase and update inventory.
  const handleSubmit = (e) => {
    e.preventDefault();

    const supplier = formData.supplier.trim();
    const invoice = formData.invoice.trim();

    if (!formData.supplierId || !supplier)
      return showAlert(
        "Please select a supplier from the supplier list. You can add a new supplier if needed.",
      );

    if (!invoice) return showAlert("Please enter invoice number.");

    if (!formData.date) return showAlert("Please select purchase date.");

    if (!formData.items.length)
      return showAlert("Please add at least one purchase item.");

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

    if (invalidItem)
      return showAlert(
        "Please enter valid product names, units, quantities and purchase rates.",
      );

    if (
      formData.paid !== "" &&
      (!Number.isFinite(Number(formData.paid)) || Number(formData.paid) < 0)
    )
      return showAlert("Please enter a valid payment amount.");

    if (purchaseTotal <= 0)
      return showAlert("Purchase total must be greater than zero.");

    if (
      purchases.some(
        (p) => p.invoice?.toLowerCase().trim() === invoice.toLowerCase(),
      )
    )
      return showAlert("This invoice number already exists.");

    const supplierRecord = suppliers.find(
      (s) => String(s.id) === String(formData.supplierId),
    );

    if (!supplierRecord)
      return showAlert(
        "Selected supplier could not be found. Please select the supplier again.",
      );

    const selectedItems = formData.items.map((item) => {
      const existing = products.find(
        (p) =>
          p.name?.toLowerCase().trim() ===
          item.productName.toLowerCase().trim(),
      );

      return {
        productId: existing?.id || null,
        product: item.productName.trim(),
        category: item.category.trim(),
        size: item.size.trim(),
        quantity: Number(item.quantity),
        unit: item.unit.trim(),
        rate: Number(item.rate),
        sellingPrice:
          item.sellingPrice === ""
            ? Number(existing?.sellingPrice || 0)
            : Number(item.sellingPrice),
        minStock: Number(item.minStock || 0),
      };
    });

    const advanceKey = `supplier:${supplierRecord.id}`;

    const oldRecord = supplierAdvances[advanceKey] ||
      supplierAdvances[normalizeSupplier(supplierRecord.name)] || {
        name: supplierRecord.name,
        balance: 0,
        transactions: [],
      };

    const oldBalance = Math.max(0, toNumber(oldRecord.balance));

    const appliedAdvance = Math.min(purchaseTotal, oldBalance);

    const amountAfterAdvance = Math.max(0, purchaseTotal - appliedAdvance);

    const appliedCash = Math.min(cashPaid, amountAfterAdvance);

    const extraAdvance = Math.max(0, cashPaid - amountAfterAdvance);

    const settled = appliedAdvance + appliedCash;

    const balance = Math.max(0, purchaseTotal - settled);

    const status = getPaymentStatus(purchaseTotal, settled);

    const purchaseId = Date.now();

    const createdAt = new Date().toISOString();

    const newPurchase = {
      id: purchaseId,
      invoice,
      supplierId: supplierRecord.id,
      supplier: supplierRecord.name,
      supplierPhone: supplierRecord.phone || "",
      date: formData.date,
      items: selectedItems,
      total: purchaseTotal,
      paid: settled,
      balance,
      status,
      cashPaid,
      cashApplied: appliedCash,
      advanceApplied: appliedAdvance,
      advanceGenerated: extraAdvance,
      createdAt,
    };

    const transactions = [...(oldRecord.transactions || [])];

    if (appliedAdvance > 0)
      transactions.unshift({
        id: `advance-used-${purchaseId}`,
        type: "adjustment",
        amount: appliedAdvance,
        invoice,
        date: createdAt,
        note: `Advance adjusted against ${invoice}`,
      });

    if (extraAdvance > 0)
      transactions.unshift({
        id: `advance-added-${purchaseId}`,
        type: "credit",
        amount: extraAdvance,
        invoice,
        date: createdAt,
        note: "Extra payment saved as supplier advance",
      });

    const updatedAdvances = {
      ...supplierAdvances,

      [advanceKey]: {
        ...oldRecord,
        name: supplierRecord.name,
        supplierId: supplierRecord.id,
        balance: Math.max(0, oldBalance - appliedAdvance + extraAdvance),
        transactions,
      },
    };

    const oldNameKey = normalizeSupplier(supplierRecord.name);

    if (oldNameKey !== advanceKey && updatedAdvances[oldNameKey])
      delete updatedAdvances[oldNameKey];

    const updatedProducts = [...products];

    const stockActivities = [];

    selectedItems.forEach((item, index) => {
      const existingIndex = updatedProducts.findIndex(
        (p) =>
          p.name?.toLowerCase().trim() === item.product.toLowerCase().trim(),
      );

      if (existingIndex !== -1) {
        const existing = updatedProducts[existingIndex];

        const previousStock = toNumber(existing.stock);

        const newStock = previousStock + item.quantity;

        const oldRate = toNumber(existing.purchasePrice);

        const weightedAverage =
          newStock > 0
            ? (previousStock * oldRate + item.quantity * item.rate) / newStock
            : item.rate;

        updatedProducts[existingIndex] = {
          ...existing,
          stock: newStock,
          purchasePrice: Number(weightedAverage.toFixed(2)),
          ...(item.sellingPrice > 0 ? { sellingPrice: item.sellingPrice } : {}),
        };

        item.productId = existing.id;

        stockActivities.push({
          id: `purchase-${purchaseId}-${index}`,
          productId: existing.id,
          productName: existing.name,
          type: "add",
          quantity: item.quantity,
          previousStock,
          newStock,
          unit: item.unit,
          note: `Purchase from ${supplierRecord.name} · Invoice ${invoice}`,
          date: createdAt,
        });
      } else {
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

        item.productId = newProduct.id;

        stockActivities.push({
          id: `purchase-${purchaseId}-${index}`,
          productId: newProduct.id,
          productName: newProduct.name,
          type: "add",
          quantity: item.quantity,
          previousStock: 0,
          newStock: item.quantity,
          unit: item.unit,
          note: `New product added through purchase · ${invoice}`,
          date: createdAt,
        });
      }
    });

    setProducts(updatedProducts);
    setSupplierAdvances(updatedAdvances);
    setPurchases((prev) => [newPurchase, ...prev]);

    const oldHistory = readLocalStorage(STOCK_HISTORY_KEY, []);

    localStorage.setItem(
      STOCK_HISTORY_KEY,
      JSON.stringify([...stockActivities, ...oldHistory]),
    );

    setCurrentPage(1);
    setShowModal(false);

    setFormData(
      getInitialForm(generateInvoiceNumber([newPurchase, ...purchases])),
    );
  };

  const handleDeletePurchase = (purchase) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete purchase ${purchase.invoice}?`,
    );

    if (!confirmed) return;

    const updatedProducts = [...products];

    (purchase.items || []).forEach((item) => {
      const productIndex = updatedProducts.findIndex((p) => {
        if (item.productId) {
          return String(p.id) === String(item.productId);
        }

        return (
          p.name?.toLowerCase().trim() === item.product?.toLowerCase().trim()
        );
      });

      if (productIndex !== -1) {
        const product = updatedProducts[productIndex];

        updatedProducts[productIndex] = {
          ...product,
          stock: Math.max(0, toNumber(product.stock) - toNumber(item.quantity)),
        };
      }
    });

    setProducts(updatedProducts);

    const advanceKey = `supplier:${purchase.supplierId}`;

    setSupplierAdvances((prev) => {
      const current = prev[advanceKey];

      if (!current) return prev;

      const restoredAdvance =
        toNumber(current.balance) +
        toNumber(purchase.advanceApplied) -
        toNumber(purchase.advanceGenerated);

      return {
        ...prev,
        [advanceKey]: {
          ...current,
          balance: Math.max(0, restoredAdvance),
          transactions: (current.transactions || []).filter(
            (transaction) => transaction.invoice !== purchase.invoice,
          ),
        },
      };
    });

    setPurchases((prev) => prev.filter((p) => p.id !== purchase.id));

    const history = readLocalStorage(STOCK_HISTORY_KEY, []);

    localStorage.setItem(
      STOCK_HISTORY_KEY,
      JSON.stringify(
        history.filter(
          (entry) => !String(entry.note || "").includes(purchase.invoice),
        ),
      ),
    );

    if (selectedPurchase?.id === purchase.id) {
      setSelectedPurchase(null);
    }
  };

  const handlePrintPurchase = (selected = null) => {
    const list = selected ? [selected] : purchases;

    if (!list.length)
      return showAlert("No purchase records available to print.");

    const printWindow = window.open("", "_blank", "width=1100,height=850");

    if (!printWindow)
      return showAlert("Please allow pop-ups to print purchase invoices.");

    const invoicesHTML = list
      .map((purchase) => {
        const items = Array.isArray(purchase.items) ? purchase.items : [];

        const total = toNumber(purchase.total);
        const paid = toNumber(purchase.paid);
        const balance = getPurchaseBalance(purchase);

        const rows = items
          .map(
            (item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>
                  <strong>${escapeHTML(item.product)}</strong>
                  ${
                    item.size
                      ? `<br><small>${escapeHTML(item.size)}</small>`
                      : ""
                  }
                </td>
                <td>${escapeHTML(item.category || "-")}</td>
                <td>
                  ${toNumber(item.quantity).toLocaleString("en-PK")}
                  ${escapeHTML(item.unit || "")}
                </td>
                <td>${formatCurrency(item.rate)}</td>
                <td>
                  ${formatCurrency(
                    toNumber(item.quantity) * toNumber(item.rate),
                  )}
                </td>
              </tr>
            `,
          )
          .join("");

        const cashPaidValue = toNumber(purchase.cashPaid ?? purchase.paid);

        const cashAppliedValue = toNumber(
          purchase.cashApplied ??
            Math.max(0, paid - toNumber(purchase.advanceApplied)),
        );

        return `
          <section class="invoice">
            <div class="head">
              <div>
                <h2>Purchase Invoice</h2>
                <b>${escapeHTML(purchase.invoice)}</b>
              </div>
              <span class="status">
                ${escapeHTML(purchase.status || getPaymentStatus(total, paid))}
              </span>
            </div>

            <div class="details">
              <div>
                <small>Supplier</small>
                <strong>${escapeHTML(purchase.supplier)}</strong>
              </div>
              <div>
                <small>Phone</small>
                <strong>${escapeHTML(purchase.supplierPhone || "-")}</strong>
              </div>
              <div>
                <small>Purchase Date</small>
                <strong>${escapeHTML(purchase.date)}</strong>
              </div>
            </div>

            <h3>Purchased Products</h3>

            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Rate</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${rows || '<tr><td colspan="6">No items</td></tr>'}
              </tbody>
            </table>

            <div class="summary">
              <p><span>Total Purchase</span><b>${formatCurrency(total)}</b></p>
              <p><span>Previous Advance Used</span><b>${formatCurrency(purchase.advanceApplied)}</b></p>
              <p><span>Actual Cash Paid</span><b>${formatCurrency(cashPaidValue)}</b></p>
              <p><span>Cash Applied to Invoice</span><b>${formatCurrency(cashAppliedValue)}</b></p>

              ${
                toNumber(purchase.advanceGenerated) > 0
                  ? `<p><span>Extra Payment Saved as Advance</span><b>${formatCurrency(purchase.advanceGenerated)}</b></p>`
                  : ""
              }

              <p class="settled"><span>Total Settled</span><b>${formatCurrency(paid)}</b></p>
              <p class="balance"><span>Remaining Balance</span><b>${formatCurrency(balance)}</b></p>
            </div>
          </section>
        `;
      })
      .join("");

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Purchase Report</title>
          <style>
            * { box-sizing: border-box; }

            body {
              font: 12px Arial, sans-serif;
              color: #1e293b;
              padding: 25px;
            }

            .report {
              display: flex;
              justify-content: space-between;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 15px;
              margin-bottom: 25px;
            }

            .invoice {
              padding-bottom: 25px;
              margin-bottom: 30px;
              border-bottom: 2px dashed #cbd5e1;
              page-break-inside: avoid;
            }

            .head {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }

            .head h2 { margin: 0 0 5px; }
            .head b { color: #2563eb; }

            .status {
              background: #e0f2fe;
              padding: 7px 12px;
              border-radius: 20px;
            }

            .details {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              background: #f8fafc;
              padding: 14px;
              margin: 18px 0;
            }

            .details div {
              display: flex;
              flex-direction: column;
              gap: 6px;
            }

            .details small { color: #64748b; }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            th {
              background: #f1f5f9;
              text-align: left;
            }

            th, td {
              padding: 10px;
              border-bottom: 1px solid #e2e8f0;
            }

            .summary {
              max-width: 380px;
              margin: 20px 0 0 auto;
              background: #f8fafc;
              padding: 15px;
            }

            .summary p {
              display: flex;
              justify-content: space-between;
              gap: 12px;
            }

            .settled {
              border-top: 1px solid #cbd5e1;
              padding-top: 10px;
              color: #15803d;
            }

            .balance {
              border-top: 1px solid #cbd5e1;
              padding-top: 10px;
              color: #b45309;
              font-weight: bold;
            }

            @page {
              size: A4;
              margin: 12mm;
            }

            @media print {
              body { padding: 0; }
            }
          </style>
        </head>

        <body>
          <div class="report">
            <div>
              <h1>${selected ? "Purchase Invoice" : "Purchase History Report"}</h1>
              <p>Steel Store · Supplier purchase records</p>
            </div>
            <div>Printed: ${escapeHTML(new Date().toLocaleDateString("en-PK"))}</div>
          </div>

          ${invoicesHTML}

          <script>
            window.onload = () => {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const statCards = [
    {
      title: "Total Suppliers",
      value: supplierGroups.length,
      description: "Suppliers with purchase records",
      icon: Users,
      color: "bg-blue-50 text-blue-600",
      filter: "All",
    },
    {
      title: "Purchase Amount",
      value: formatCurrency(stats.totalAmount),
      description: `${stats.totalPurchases} total invoices`,
      icon: Wallet,
      color: "bg-indigo-50 text-indigo-600",
      filter: "All",
    },
    {
      title: "Total Paid",
      value: formatCurrency(stats.totalPaid),
      description: "Payments settled against invoices",
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

  return (
    <div
      className="space-y-6"
      onWheelCapture={(e) => {
        if (
          e.target instanceof HTMLInputElement &&
          e.target.type === "number"
        ) {
          e.preventDefault();
          e.target.blur();
        }
      }}
    >
      {/* SUPPLIER DETAILS VIEW */}

      {selectedSupplierGroup ? (
        <SupplierPurchaseDetails
          supplier={selectedSupplierGroup}
          purchases={selectedSupplierGroup.purchases}
          onBack={() => setSelectedSupplierGroup(null)}
          onViewPurchase={setSelectedPurchase}
          onPrintPurchase={handlePrintPurchase}
          onDeletePurchase={handleDeletePurchase}
        />
      ) : (
        <>
          {/* PAGE HEADER */}

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
                Manage supplier purchases, invoices and stock receiving.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => handlePrintPurchase()}
                disabled={!purchases.length}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Printer size={18} />
                Print All Purchases
              </button>

              <button
                onClick={openPurchaseModal}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Plus size={18} />
                New Purchase
              </button>
            </div>
          </div>

          {/* STAT CARDS */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card, index) => {
              const Icon = card.icon;

              const active =
                statusFilter === card.filter &&
                (card.filter !== "All" || !search);

              return (
                <motion.button
                  key={card.title}
                  type="button"
                  onClick={() => {
                    setStatusFilter(card.filter);
                    setSearch("");
                    setCurrentPage(1);
                  }}
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
                      View Suppliers
                    </span>

                    <ArrowUpRight size={16} className="text-blue-500" />
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* SUPPLIER OVERVIEW */}

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Supplier Purchase Overview
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Each supplier is listed once. Open a supplier to view all
                  purchase invoices.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search supplier or phone..."
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 sm:w-64"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="All">All Suppliers</option>
                  <option value="Paid">Fully Paid</option>
                  <option value="Partial">Partially Paid</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Pending">Has Pending Balance</option>
                </select>

                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("All");
                      setCurrentPage(1);
                    }}
                    className="whitespace-nowrap rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs uppercase tracking-wider text-slate-500">
                    {[
                      "Supplier",
                      "Purchases",
                      "Last Purchase",
                      "Total Amount",
                      "Paid",
                      "Pending",
                      "Status",
                      "Action",
                    ].map((heading) => (
                      <th key={heading} className="px-6 py-4">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedSuppliers.length ? (
                    paginatedSuppliers.map((supplier) => (
                      <tr
                        key={supplier.key}
                        onClick={() => setSelectedSupplierGroup(supplier)}
                        className="cursor-pointer transition hover:bg-blue-50/50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                              <Truck size={19} />
                            </div>

                            <div>
                              <p className="font-semibold text-slate-800">
                                {supplier.name}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {supplier.phone || "No phone number"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
                            {supplier.invoiceCount} Invoice(s)
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-500">
                          {supplier.lastPurchaseDate || "-"}
                        </td>

                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {formatCurrency(supplier.totalAmount)}
                        </td>

                        <td className="px-6 py-4 font-medium text-emerald-600">
                          {formatCurrency(supplier.totalPaid)}
                        </td>

                        <td className="px-6 py-4 font-medium text-red-500">
                          {formatCurrency(supplier.totalPending)}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                              supplier.status,
                            )}`}
                          >
                            {supplier.status}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSupplierGroup(supplier);
                            }}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
                          >
                            <Eye size={15} />
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-14 text-center">
                        <Truck
                          size={38}
                          className="mx-auto mb-3 text-slate-300"
                        />

                        <p className="font-semibold text-slate-700">
                          No Suppliers Found
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          Create a purchase or change your filters.
                        </p>
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
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 outline-none focus:border-blue-400"
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
                  <b className="text-slate-700">
                    {filteredSuppliers.length ? startIndex + 1 : 0}–{endIndex}
                  </b>{" "}
                  of{" "}
                  <b className="text-slate-700">{filteredSuppliers.length}</b>{" "}
                  suppliers
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || !totalPages}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-blue-50 disabled:opacity-40"
                >
                  <ChevronLeft size={17} />
                </button>

                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-xs font-semibold ${
                      currentPage === page
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-blue-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage >= totalPages || !totalPages}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-blue-50 disabled:opacity-40"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* CREATE PURCHASE */}

      <AnimatePresence>
        {showModal && (
          <Modal onClose={() => setShowModal(false)}>
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Create New Purchase
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Select supplier and enter purchased product details.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="max-h-[70vh] space-y-6 overflow-y-auto p-5">
                {/* SUPPLIER INFORMATION */}

                <section>
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
                    <Truck size={18} className="text-blue-600" />
                    Supplier Information
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="relative">
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Supplier *
                      </label>

                      <div className="relative">
                        <Search
                          size={17}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          value={supplierSearch}
                          onFocus={() => setShowSupplierOptions(true)}
                          onChange={(e) => {
                            setSupplierSearch(e.target.value);
                            setShowSupplierOptions(true);

                            if (formData.supplierId) {
                              setFormData((p) => ({
                                ...p,
                                supplierId: "",
                                supplier: "",
                                supplierPhone: "",
                              }));
                            }
                          }}
                          placeholder="Search supplier by name or phone"
                          className="purchase-input"
                          style={{ paddingLeft: "42px" }}
                          autoComplete="off"
                        />
                      </div>

                      {showSupplierOptions && (
                        <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                          {filteredSupplierOptions.length ? (
                            filteredSupplierOptions.map((supplier) => (
                              <button
                                key={supplier.id}
                                type="button"
                                onClick={() => selectSupplier(supplier)}
                                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-blue-50"
                              >
                                <span>
                                  <span className="block text-sm font-semibold text-slate-700">
                                    {supplier.name}
                                  </span>

                                  <span className="mt-0.5 block text-xs text-slate-400">
                                    {supplier.phone || "No phone saved"}
                                  </span>
                                </span>

                                {String(supplier.id) ===
                                  String(formData.supplierId) && (
                                  <Check size={16} className="text-blue-600" />
                                )}
                              </button>
                            ))
                          ) : (
                            <p className="px-3 py-3 text-sm text-slate-500">
                              No matching supplier found.
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setShowSupplierOptions(false);

                              setSupplierForm((p) => ({
                                ...p,
                                name: supplierSearch.trim(),
                              }));

                              setShowSupplierModal(true);
                            }}
                            className="mt-1 flex w-full items-center gap-2 border-t border-slate-100 px-3 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                          >
                            <UserPlus size={16} />
                            Add New Supplier
                          </button>
                        </div>
                      )}

                      {selectedSupplier && (
                        <p className="mt-1 text-xs font-medium text-emerald-600">
                          Selected: {selectedSupplier.name} ·{" "}
                          {selectedSupplier.phone || "No phone"}
                        </p>
                      )}

                      {!selectedSupplier && (
                        <button
                          type="button"
                          onClick={() => {
                            setSupplierForm({
                              name: supplierSearch.trim(),
                              phone: "",
                              email: "",
                              address: "",
                            });

                            setShowSupplierModal(true);
                          }}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                          <Plus size={14} />
                          Add new supplier
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Invoice Number *
                      </label>

                      <input
                        name="invoice"
                        value={formData.invoice}
                        onChange={handleChange}
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

                    {selectedSupplier && (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Supplier Phone
                        </label>

                        <input
                          value={selectedSupplier.phone || ""}
                          readOnly
                          className="purchase-input bg-slate-50"
                        />
                      </div>
                    )}
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
                      className="flex items-center gap-1.5 text-sm font-semibold text-blue-600"
                    >
                      <Plus size={17} />
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.items.map((item, index) => {
                      const existing = products.find(
                        (p) =>
                          p.name?.toLowerCase().trim() ===
                          item.productName.toLowerCase().trim(),
                      );

                      const lineTotal =
                        toNumber(item.quantity) * toNumber(item.rate);

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

                              <p
                                className={`mt-1 text-xs font-medium ${
                                  existing
                                    ? "text-emerald-600"
                                    : item.productName.trim()
                                      ? "text-blue-600"
                                      : "text-slate-400"
                                }`}
                              >
                                {existing
                                  ? "Existing product · Stock will increase"
                                  : item.productName.trim()
                                    ? "New product · Will be added to inventory"
                                    : "Enter product details below"}
                              </p>
                            </div>

                            {formData.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                              >
                                <Trash2 size={17} />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Product Name *
                              </label>

                              <input
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
                                {products.map((p) => (
                                  <option key={p.id} value={p.name} />
                                ))}
                              </datalist>
                            </div>

                            {!existing && (
                              <>
                                <div>
                                  <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Category
                                  </label>

                                  <input
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
                                    {categories.map((c) => (
                                      <option
                                        key={c.id ?? c.name}
                                        value={c.name}
                                      />
                                    ))}
                                  </datalist>
                                </div>

                                <div>
                                  <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Size / Specification
                                  </label>

                                  <input
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
                              </>
                            )}

                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Unit *
                              </label>

                              <input
                                value={item.unit}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "unit",
                                    e.target.value,
                                  )
                                }
                                placeholder="KG, Piece, Ton..."
                                className="purchase-input"
                                required
                              />
                            </div>

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
                                  existing
                                    ? `Current: ${existing.sellingPrice || 0}`
                                    : "Enter selling price"
                                }
                                className="purchase-input"
                              />
                            </div>

                            {!existing && (
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

                {/* PAYMENT INFORMATION */}

                <section>
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
                    <Wallet size={18} className="text-blue-600" />
                    Payment Information
                  </h3>

                  {formData.supplierId && (
                    <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-blue-800">
                            Available Supplier Advance
                          </p>

                          <p className="mt-1 text-xs text-blue-600">
                            Existing advance for {formData.supplier}.
                          </p>
                        </div>

                        <p className="text-lg font-bold text-blue-700">
                          {formatCurrency(availableSupplierAdvance)}
                        </p>
                      </div>

                      {advanceApplied > 0 && (
                        <p className="mt-2 text-xs font-medium text-blue-700">
                          {formatCurrency(advanceApplied)} will automatically be
                          adjusted against this purchase.
                        </p>
                      )}
                    </div>
                  )}

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
                    placeholder="Enter actual cash paid"
                    className="purchase-input paid-amount-input"
                  />

                  <p className="mt-1 text-xs text-slate-400">
                    Enter actual cash paid. Any extra payment will be saved as
                    supplier advance.
                  </p>
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

                    <div className="flex justify-between text-sm text-blue-300">
                      <span>Previous Advance Used</span>
                      <span>{formatCurrency(advanceApplied)}</span>
                    </div>

                    <div className="flex justify-between text-sm text-emerald-400">
                      <span>Cash Payment Applied</span>
                      <span>{formatCurrency(cashApplied)}</span>
                    </div>

                    {newAdvance > 0 && (
                      <div className="flex justify-between text-sm text-cyan-300">
                        <span>Extra Payment → New Advance</span>
                        <span>{formatCurrency(newAdvance)}</span>
                      </div>
                    )}

                    <div className="flex justify-between border-t border-slate-700 pt-4">
                      <span className="font-semibold">
                        Remaining Invoice Balance
                      </span>

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

                    <div className="flex justify-between border-t border-slate-700 pt-3 text-sm">
                      <span className="text-slate-300">
                        Supplier Advance After Purchase
                      </span>

                      <span className="font-semibold text-cyan-300">
                        {formatCurrency(supplierAdvanceAfterPurchase)}
                      </span>
                    </div>
                  </div>
                </section>

                <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <AlertCircle size={19} className="shrink-0 text-blue-600" />

                  <p className="text-xs leading-5 text-blue-700">
                    Saving this purchase automatically increases inventory
                    stock. New product names are added to your product list, and
                    the selected supplier's advance is adjusted automatically.
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 p-5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={purchaseTotal <= 0}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <CheckCircle2 size={18} />
                  Save Purchase & Update Stock
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* QUICK ADD SUPPLIER */}

      <AnimatePresence>
        {showSupplierModal && (
          <Modal onClose={() => setShowSupplierModal(false)} narrow>
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Add New Supplier
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create supplier and attach it to this purchase.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSupplierModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-4 p-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Supplier Name *
                </label>

                <input
                  autoFocus
                  value={supplierForm.name}
                  onChange={(e) =>
                    setSupplierForm((p) => ({
                      ...p,
                      name: e.target.value,
                    }))
                  }
                  className="purchase-input"
                  placeholder="Enter supplier name"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Phone Number *
                </label>

                <input
                  value={supplierForm.phone}
                  onChange={(e) =>
                    setSupplierForm((p) => ({
                      ...p,
                      phone: e.target.value,
                    }))
                  }
                  className="purchase-input"
                  placeholder="03XX-XXXXXXX"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email (Optional)
                </label>

                <input
                  type="email"
                  value={supplierForm.email}
                  onChange={(e) =>
                    setSupplierForm((p) => ({
                      ...p,
                      email: e.target.value,
                    }))
                  }
                  className="purchase-input"
                  placeholder="supplier@example.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Address (Optional)
                </label>

                <input
                  value={supplierForm.address}
                  onChange={(e) =>
                    setSupplierForm((p) => ({
                      ...p,
                      address: e.target.value,
                    }))
                  }
                  className="purchase-input"
                  placeholder="Supplier address"
                />
              </div>

              <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-4 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <UserPlus size={17} />
                  Save & Select Supplier
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* PURCHASE DETAILS */}

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

                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Phone</span>
                    <span className="font-medium text-slate-800">
                      {selectedPurchase.supplierPhone || "-"}
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
                        getPaymentStatus(
                          toNumber(selectedPurchase.total),
                          toNumber(selectedPurchase.paid),
                        ) === "Paid"
                          ? "bg-emerald-50 text-emerald-700"
                          : getPaymentStatus(
                                toNumber(selectedPurchase.total),
                                toNumber(selectedPurchase.paid),
                              ) === "Partial"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-600"
                      }`}
                    >
                      {getPaymentStatus(
                        toNumber(selectedPurchase.total),
                        toNumber(selectedPurchase.paid),
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
                  <Package size={18} className="text-blue-600" />
                  Purchased Products
                </h3>

                <div className="space-y-3">
                  {(selectedPurchase.items || []).map((item, i) => (
                    <div
                      key={i}
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

              <div className="space-y-3 rounded-xl bg-slate-900 p-5 text-sm text-white">
                <div className="flex justify-between">
                  <span className="text-slate-300">Total Amount</span>
                  <strong>{formatCurrency(selectedPurchase.total)}</strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-300">Previous Advance Used</span>
                  <strong className="text-blue-300">
                    {formatCurrency(selectedPurchase.advanceApplied || 0)}
                  </strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-300">Actual Cash Paid</span>
                  <strong className="text-emerald-400">
                    {formatCurrency(
                      selectedPurchase.cashPaid ?? selectedPurchase.paid,
                    )}
                  </strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-300">
                    Cash Applied to Invoice
                  </span>
                  <strong>
                    {formatCurrency(
                      selectedPurchase.cashApplied ??
                        Math.max(
                          0,
                          toNumber(selectedPurchase.paid) -
                            toNumber(selectedPurchase.advanceApplied),
                        ),
                    )}
                  </strong>
                </div>

                {toNumber(selectedPurchase.advanceGenerated) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-300">
                      Extra Payment Saved as Advance
                    </span>

                    <strong className="text-cyan-300">
                      {formatCurrency(selectedPurchase.advanceGenerated)}
                    </strong>
                  </div>
                )}

                <div className="flex justify-between border-t border-slate-700 pt-3">
                  <span className="font-semibold">Total Settled</span>

                  <strong className="text-emerald-400">
                    {formatCurrency(selectedPurchase.paid)}
                  </strong>
                </div>

                <div className="flex justify-between border-t border-slate-700 pt-3">
                  <span className="font-semibold">Remaining Balance</span>

                  <strong className="text-lg text-amber-400">
                    {formatCurrency(getPurchaseBalance(selectedPurchase))}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handlePrintPurchase(selectedPurchase)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Printer size={18} />
                Print This Purchase
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* CENTERED ALERT */}

      <AnimatePresence>
        {alertMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
            onClick={() => setAlertMessage("")}
          >
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <AlertCircle size={28} />
              </div>

              <h3 className="text-lg font-bold text-slate-800">
                Attention Required
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {alertMessage}
              </p>

              <button
                type="button"
                onClick={() => setAlertMessage("")}
                className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Okay, Got It
              </button>
            </motion.div>
          </motion.div>
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
          transition: all .2s;
        }

        .purchase-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,.1);
        }

        .purchase-input::placeholder {
          color: #94a3b8;
        }

        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        input[type="number"] {
          -moz-appearance: textfield;
          appearance: textfield;
        }
      `}</style>
    </div>
  );
}

const Modal = ({ children, onClose, narrow = false }) => (
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
      className={`my-auto w-full ${
        narrow ? "max-w-lg" : "max-w-3xl"
      } overflow-visible rounded-2xl bg-white shadow-2xl`}
    >
      {children}
    </motion.div>
  </motion.div>
);

export default Purchases;
