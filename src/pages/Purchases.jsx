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
  FileText,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Printer,
} from "lucide-react";

const PURCHASES_KEY = "steel-store-purchases";
const STOCK_HISTORY_KEY = "steel-store-stock-history";
const SUPPLIER_ADVANCES_KEY = "steel-store-supplier-advances";

// -----------------------------------
// HELPERS
// -----------------------------------

const formatCurrency = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 2,
  })}`;

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const normalizeSupplier = (supplier) =>
  String(supplier || "")
    .trim()
    .toLowerCase();

const escapeHTML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return entities[character];
  });

const getPurchaseBalance = (purchase) => {
  if (purchase.balance !== undefined && purchase.balance !== null) {
    return Math.max(0, toNumber(purchase.balance));
  }

  return Math.max(0, toNumber(purchase.total) - toNumber(purchase.paid));
};

const getPaymentStatus = (total, paid) => {
  if (paid <= 0) return "Unpaid";
  if (paid >= total) return "Paid";
  return "Partial";
};

const readLocalStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

// -----------------------------------
// INVOICE NUMBER
// -----------------------------------

const generateInvoiceNumber = (purchases = []) => {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const existingNumbers = purchases.map((purchase) => {
    const invoice = String(purchase.invoice || "");

    if (!invoice.startsWith(prefix)) return 0;

    const sequence = Number(invoice.slice(prefix.length));
    return Number.isFinite(sequence) ? sequence : 0;
  });

  const nextNumber = Math.max(0, ...existingNumbers) + 1;

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
};

// -----------------------------------
// INITIAL FORM
// -----------------------------------

const getInitialForm = (invoice) => ({
  supplier: "",
  invoice: invoice || generateInvoiceNumber(),
  date: new Date().toISOString().split("T")[0],
  paid: "",
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

// -----------------------------------
// MAIN COMPONENT
// -----------------------------------

function Purchases() {
  const { products = [], setProducts, categories = [] } = useProducts();

  const [purchases, setPurchases] = useState(() =>
    readLocalStorage(PURCHASES_KEY, []),
  );

  const [supplierAdvances, setSupplierAdvances] = useState(() =>
    readLocalStorage(SUPPLIER_ADVANCES_KEY, {}),
  );

  useEffect(() => {
    localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem(
      SUPPLIER_ADVANCES_KEY,
      JSON.stringify(supplierAdvances),
    );
  }, [supplierAdvances]);

  // -----------------------------------
  // SEARCH AND FILTERS
  // -----------------------------------

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // -----------------------------------
  // MODALS
  // -----------------------------------

  const [showModal, setShowModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const [formData, setFormData] = useState(() =>
    getInitialForm(generateInvoiceNumber(readLocalStorage(PURCHASES_KEY, []))),
  );

  // -----------------------------------
  // SUPPLIER ADVANCE
  // -----------------------------------

  const supplierKey = normalizeSupplier(formData.supplier);

  const availableSupplierAdvance = supplierKey
    ? Math.max(0, toNumber(supplierAdvances[supplierKey]?.balance))
    : 0;

  // -----------------------------------
  // PURCHASE TOTAL
  // -----------------------------------

  const purchaseTotal = useMemo(
    () =>
      formData.items.reduce(
        (sum, item) => sum + toNumber(item.quantity) * toNumber(item.rate),
        0,
      ),
    [formData.items],
  );

  // -----------------------------------
  // PAYMENT CALCULATIONS
  // -----------------------------------

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

  // -----------------------------------
  // STATISTICS
  // -----------------------------------

  const stats = useMemo(() => {
    const totalAmount = purchases.reduce(
      (sum, purchase) => sum + toNumber(purchase.total),
      0,
    );

    const totalPaid = purchases.reduce(
      (sum, purchase) => sum + toNumber(purchase.paid),
      0,
    );

    const totalPending = purchases.reduce(
      (sum, purchase) => sum + getPurchaseBalance(purchase),
      0,
    );

    return {
      totalPurchases: purchases.length,
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
        matchesStatus = getPurchaseBalance(purchase) > 0;
      } else if (statusFilter !== "All") {
        matchesStatus = purchase.status === statusFilter;
      }

      return matchesSearch && matchesStatus;
    });
  }, [purchases, search, statusFilter]);

  const hasActiveFilters = search.trim() !== "" || statusFilter !== "All";

  const clearAllFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setCurrentPage(1);
  };

  // -----------------------------------
  // PAGINATION
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

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, itemsPerPage]);

  useEffect(() => {
    if (totalPages === 0) {
      setCurrentPage(1);
    } else if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // -----------------------------------
  // PRINT PURCHASES
  // -----------------------------------

  const handlePrintPurchase = (selected = null) => {
    const purchasesToPrint = selected ? [selected] : purchases;

    if (!purchasesToPrint.length) {
      alert("No purchase records available to print.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=1100,height=850");

    if (!printWindow) {
      alert("Please allow pop-ups to print purchase invoices.");
      return;
    }

    const invoicesHTML = purchasesToPrint
      .map((purchase) => {
        const items = Array.isArray(purchase.items) ? purchase.items : [];

        const total = toNumber(purchase.total);
        const paid = toNumber(purchase.paid);
        const balance = getPurchaseBalance(purchase);

        const itemRows = items
          .map((item, index) => {
            const quantity = toNumber(item.quantity);
            const rate = toNumber(item.rate);
            const lineTotal = quantity * rate;

            return `
              <tr>
                <td>${index + 1}</td>
                <td>
                  <strong>${escapeHTML(item.product)}</strong>
                  ${
                    item.size
                      ? `<br/><small>${escapeHTML(item.size)}</small>`
                      : ""
                  }
                </td>
                <td>${escapeHTML(item.category || "-")}</td>
                <td>${quantity.toLocaleString("en-PK")} ${escapeHTML(item.unit || "")}</td>
                <td>${formatCurrency(rate)}</td>
                <td>${formatCurrency(lineTotal)}</td>
              </tr>
            `;
          })
          .join("");

        const actualCashPaid = toNumber(purchase.cashPaid ?? purchase.paid);

        const cashApplied = toNumber(
          purchase.cashApplied ??
            Math.max(0, paid - toNumber(purchase.advanceApplied)),
        );

        const advanceApplied = toNumber(purchase.advanceApplied);
        const advanceGenerated = toNumber(purchase.advanceGenerated);

        return `
          <section class="invoice">
            <div class="invoice-header">
              <div>
                <h2>Purchase Invoice</h2>
                <p class="invoice-number">${escapeHTML(purchase.invoice)}</p>
              </div>

              <div class="status ${
                purchase.status === "Paid"
                  ? "paid"
                  : purchase.status === "Partial"
                    ? "partial"
                    : "unpaid"
              }">
                ${escapeHTML(purchase.status || "Unpaid")}
              </div>
            </div>

            <div class="supplier-details">
              <div>
                <span>Supplier</span>
                <strong>${escapeHTML(purchase.supplier)}</strong>
              </div>

              <div>
                <span>Invoice Number</span>
                <strong>${escapeHTML(purchase.invoice)}</strong>
              </div>

              <div>
                <span>Purchase Date</span>
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
                  <th>Purchase Rate</th>
                  <th>Subtotal</th>
                </tr>
              </thead>

              <tbody>
                ${itemRows || `<tr><td colspan="6">No items found.</td></tr>`}
              </tbody>
            </table>

            <div class="payment-section">
              <div class="payment-row">
                <span>Total Purchase</span>
                <strong>${formatCurrency(total)}</strong>
              </div>

              <div class="payment-row">
                <span>Previous Advance Used</span>
                <strong>${formatCurrency(advanceApplied)}</strong>
              </div>

              <div class="payment-row">
                <span>Actual Cash Paid</span>
                <strong>${formatCurrency(actualCashPaid)}</strong>
              </div>

              <div class="payment-row">
                <span>Cash Applied to Invoice</span>
                <strong>${formatCurrency(cashApplied)}</strong>
              </div>

              ${
                advanceGenerated > 0
                  ? `
                    <div class="payment-row">
                      <span>Extra Payment Saved as Advance</span>
                      <strong>${formatCurrency(advanceGenerated)}</strong>
                    </div>
                  `
                  : ""
              }

              <div class="payment-row settled">
                <span>Total Settled</span>
                <strong>${formatCurrency(paid)}</strong>
              </div>

              <div class="payment-row balance">
                <span>Remaining Balance</span>
                <strong>${formatCurrency(balance)}</strong>
              </div>
            </div>
          </section>
        `;
      })
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>
            ${selected ? "Purchase Invoice" : "All Purchase Invoices"}
          </title>

          <meta charset="UTF-8" />

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 30px;
              font-family: Arial, sans-serif;
              color: #1e293b;
              background: #fff;
              font-size: 12px;
            }

            .report-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 18px;
              margin-bottom: 25px;
            }

            .report-header h1 {
              margin: 0;
              font-size: 25px;
              color: #1e293b;
            }

            .report-header p {
              margin: 6px 0 0;
              color: #64748b;
              font-size: 12px;
            }

            .report-date {
              color: #64748b;
              text-align: right;
              font-size: 11px;
            }

            .invoice {
              margin-bottom: 35px;
              padding-bottom: 28px;
              border-bottom: 2px dashed #cbd5e1;
              page-break-inside: avoid;
            }

            .invoice:last-child {
              border-bottom: none;
            }

            .invoice-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 18px;
            }

            .invoice-header h2 {
              margin: 0;
              font-size: 18px;
            }

            .invoice-number {
              margin: 5px 0 0;
              color: #2563eb;
              font-weight: bold;
            }

            .status {
              padding: 7px 13px;
              border-radius: 30px;
              font-size: 11px;
              font-weight: bold;
            }

            .paid {
              background: #dcfce7;
              color: #15803d;
            }

            .partial {
              background: #fef3c7;
              color: #b45309;
            }

            .unpaid {
              background: #fee2e2;
              color: #b91c1c;
            }

            .supplier-details {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 14px;
              margin-bottom: 22px;
            }

            .supplier-details div {
              display: flex;
              flex-direction: column;
              gap: 6px;
            }

            .supplier-details span {
              color: #64748b;
              font-size: 10px;
            }

            .supplier-details strong {
              color: #1e293b;
              font-size: 12px;
            }

            h3 {
              margin: 0 0 12px;
              font-size: 14px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }

            th {
              background: #f1f5f9;
              color: #475569;
              text-align: left;
              font-size: 10px;
              text-transform: uppercase;
              padding: 11px 9px;
            }

            td {
              padding: 11px 9px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 11px;
            }

            td small {
              color: #64748b;
            }

            .payment-section {
              width: 100%;
              max-width: 380px;
              margin-left: auto;
              padding: 15px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
            }

            .payment-row {
              display: flex;
              justify-content: space-between;
              gap: 15px;
              padding: 7px 0;
              color: #475569;
            }

            .payment-row strong {
              color: #1e293b;
            }

            .settled {
              border-top: 1px solid #cbd5e1;
              margin-top: 5px;
              padding-top: 12px;
              color: #15803d;
              font-weight: bold;
            }

            .settled strong {
              color: #15803d;
            }

            .balance {
              border-top: 1px solid #cbd5e1;
              margin-top: 5px;
              padding-top: 12px;
              color: #b45309;
              font-weight: bold;
            }

            .balance strong {
              color: #b45309;
              font-size: 14px;
            }

            .footer {
              margin-top: 25px;
              padding-top: 12px;
              border-top: 1px solid #e2e8f0;
              text-align: center;
              color: #94a3b8;
              font-size: 10px;
            }

            @media print {
              body {
                padding: 15px;
              }

              .invoice {
                page-break-inside: avoid;
              }

              @page {
                size: A4;
                margin: 12mm;
              }
            }
          </style>
        </head>

        <body>
          <div class="report-header">
            <div>
              <h1>
                ${selected ? "Purchase Invoice" : "Purchase History Report"}
              </h1>

              <p>
                ${
                  selected
                    ? "Individual supplier purchase record"
                    : "Complete supplier purchase records"
                }
              </p>
            </div>

            <div class="report-date">
              <strong>Steel Store</strong>
              <br />
              Printed: ${escapeHTML(new Date().toLocaleDateString("en-PK"))}
            </div>
          </div>

          ${invoicesHTML}

          <div class="footer">
            ${
              selected
                ? "Individual Purchase Invoice"
                : "Complete Purchase History Report"
            }
          </div>

          <script>
            window.onload = function () {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  // -----------------------------------
  // INPUT HANDLERS
  // -----------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData((previous) => {
      const updatedItems = [...previous.items];

      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };

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
  // ADD / REMOVE ITEMS
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
    setFormData(getInitialForm(generateInvoiceNumber(purchases)));
    setShowModal(true);
  };

  // -----------------------------------
  // SAVE PURCHASE
  // -----------------------------------

  const handleSubmit = (e) => {
    e.preventDefault();

    const supplier = formData.supplier.trim();
    const invoice = formData.invoice.trim();
    const normalizedSupplier = normalizeSupplier(supplier);

    if (!supplier) {
      alert("Please enter supplier name.");
      return;
    }

    if (!invoice) {
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
      formData.paid !== "" &&
      (!Number.isFinite(Number(formData.paid)) || Number(formData.paid) < 0)
    ) {
      alert("Please enter a valid payment amount.");
      return;
    }

    if (purchaseTotal <= 0) {
      alert("Purchase total must be greater than zero.");
      return;
    }

    const duplicateInvoice = purchases.some(
      (purchase) =>
        purchase.invoice?.toLowerCase().trim() === invoice.toLowerCase(),
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

    // -----------------------------------
    // PAYMENT RECORD
    // -----------------------------------

    const oldSupplierRecord = supplierAdvances[normalizedSupplier] || {
      name: supplier,
      balance: 0,
      transactions: [],
    };

    const oldAdvanceBalance = Math.max(0, toNumber(oldSupplierRecord.balance));

    const appliedAdvance = Math.min(purchaseTotal, oldAdvanceBalance);

    const amountAfterAdvance = Math.max(0, purchaseTotal - appliedAdvance);

    const appliedCash = Math.min(cashPaid, amountAfterAdvance);

    const extraAdvance = Math.max(0, cashPaid - amountAfterAdvance);

    const settledAmount = appliedAdvance + appliedCash;

    const balance = Math.max(0, purchaseTotal - settledAmount);

    const status = getPaymentStatus(purchaseTotal, settledAmount);

    const purchaseId = Date.now();
    const createdAt = new Date().toISOString();

    const newPurchase = {
      id: purchaseId,
      invoice,
      supplier,
      date: formData.date,
      items: selectedItems,
      total: purchaseTotal,
      paid: settledAmount,
      balance,
      status,

      cashPaid,
      cashApplied: appliedCash,
      advanceApplied: appliedAdvance,
      advanceGenerated: extraAdvance,

      createdAt,
    };

    // -----------------------------------
    // UPDATE SUPPLIER ADVANCE LEDGER
    // -----------------------------------

    const transactions = [...(oldSupplierRecord.transactions || [])];

    if (appliedAdvance > 0) {
      transactions.unshift({
        id: `advance-used-${purchaseId}`,
        type: "adjustment",
        amount: appliedAdvance,
        invoice,
        date: createdAt,
        note: `Advance adjusted against ${invoice}`,
      });
    }

    if (extraAdvance > 0) {
      transactions.unshift({
        id: `advance-added-${purchaseId}`,
        type: "credit",
        amount: extraAdvance,
        invoice,
        date: createdAt,
        note: "Extra payment saved as supplier advance",
      });
    }

    const updatedSupplierAdvances = {
      ...supplierAdvances,
      [normalizedSupplier]: {
        name: supplier,
        balance: Math.max(0, oldAdvanceBalance - appliedAdvance + extraAdvance),
        transactions,
      },
    };

    // -----------------------------------
    // UPDATE PRODUCT STOCK
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
        const existingProduct = updatedProducts[existingIndex];

        const previousStock = toNumber(existingProduct.stock);
        const newStock = previousStock + item.quantity;
        const oldPurchasePrice = toNumber(existingProduct.purchasePrice);

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
          note: `Purchase from ${supplier} · Invoice ${invoice}`,
          date: createdAt,
        });

        selectedItems[index].productId = existingProduct.id;
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

        selectedItems[index].productId = newProduct.id;
      }
    });

    // -----------------------------------
    // SAVE ALL UPDATES
    // -----------------------------------

    const updatedPurchases = [newPurchase, ...purchases];

    setProducts(updatedProducts);
    setSupplierAdvances(updatedSupplierAdvances);
    setPurchases(updatedPurchases);

    try {
      const oldHistory = readLocalStorage(STOCK_HISTORY_KEY, []);

      localStorage.setItem(
        STOCK_HISTORY_KEY,
        JSON.stringify([...stockActivities, ...oldHistory]),
      );
    } catch (error) {
      console.error("Stock history error:", error);
    }

    setCurrentPage(1);
    setShowModal(false);

    setFormData(getInitialForm(generateInvoiceNumber(updatedPurchases)));
  };

  // -----------------------------------
  // STATUS STYLE
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
  // STAT CARDS
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

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => handlePrintPurchase()}
            disabled={purchases.length === 0}
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
            statusFilter === card.filter && (card.filter !== "All" || !search);

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

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="whitespace-nowrap rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left">
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
                <th className="px-6 py-4">Actions</th>
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
                      {formatCurrency(getPurchaseBalance(purchase))}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusStyle(purchase.status)}`}
                      >
                        {purchase.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handlePrintPurchase(purchase)}
                          title="Print This Purchase"
                          className="rounded-lg bg-emerald-50 p-2 text-emerald-600 transition hover:bg-emerald-100"
                        >
                          <Printer size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedPurchase(purchase)}
                          title="View Purchase Details"
                          className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                        >
                          <Eye size={17} />
                        </button>
                      </div>
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1 || totalPages === 0}
              title="Previous Page"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={17} />
            </button>

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
                                  existingProduct
                                    ? `Current: ${existingProduct.sellingPrice || 0}`
                                    : "Enter selling price"
                                }
                                className="purchase-input"
                              />
                            </div>

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

                  {formData.supplier.trim() && (
                    <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-blue-800">
                            Available Supplier Advance
                          </p>

                          <p className="mt-1 text-xs text-blue-600">
                            Existing advance for this supplier.
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
                      placeholder="Enter payment amount"
                      className="purchase-input paid-amount-input"
                    />

                    <p className="mt-1 text-xs text-slate-400">
                      Enter the actual cash amount paid to the supplier. Extra
                      payment will become advance.
                    </p>
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

                {/* NOTICE */}
                <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <AlertCircle size={19} className="shrink-0 text-blue-600" />

                  <p className="text-xs leading-5 text-blue-700">
                    Saving this purchase will automatically increase inventory
                    stock. New product names will be added to your product list.
                    Supplier advances will also be adjusted automatically.
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
                  disabled={purchaseTotal <= 0}
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

              {/* PRINT BUTTON */}
              <button
                type="button"
                onClick={() => handlePrintPurchase(selectedPurchase)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Printer size={18} />
                Print This Purchase
              </button>
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

        /* Remove number spinner only from Paid Amount */
        .paid-amount-input::-webkit-inner-spin-button,
        .paid-amount-input::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .paid-amount-input {
          -moz-appearance: textfield;
          appearance: textfield;
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
