import { useMemo, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useProducts } from "../context/ProductsContext";
import { useSales } from "../context/SalesContext";
import { useCustomers } from "../context/CustomersContext";

import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Wallet,
  Package,
  CheckCircle2,
  Printer,
  RotateCcw,
  User,
  Phone,
  CalendarDays,
  Receipt,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ==================================================
// HELPERS
// ==================================================

const formatCurrency = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 2,
  })}`;

const getToday = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
};

const validDecimal = (value) => /^\d*\.?\d*$/.test(value);

const escapeHTML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });

// ==================================================
// INVOICE NUMBER GENERATOR
// FORMAT: DDMMYY + DAILY SEQUENCE
// EXAMPLE: 13112601
// ==================================================

const getInvoiceDatePrefix = (dateValue) => {
  if (!dateValue) {
    throw new Error("Invoice date is required.");
  }

  const datePart = String(dateValue).split("T")[0];

  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    throw new Error("Invalid invoice date.");
  }

  const [year, month, day] = datePart.split("-");

  const date = new Date(Number(year), Number(month) - 1, Number(day));

  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    throw new Error("Invalid calendar date.");
  }

  return `${day}${month}${year.slice(-2)}`;
};

const generateInvoiceNumber = (existingSales, saleDate) => {
  const prefix = getInvoiceDatePrefix(saleDate);

  const existingNumbers = (existingSales || [])
    .map((sale) => String(sale.invoiceNumber || ""))
    .filter((number) => new RegExp(`^${prefix}\\d{2,}$`).test(number))
    .map((number) => Number(number.slice(prefix.length)))
    .filter((sequence) => Number.isSafeInteger(sequence) && sequence > 0);

  const highestSequence =
    existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;

  const nextSequence = highestSequence + 1;

  if (!Number.isSafeInteger(nextSequence)) {
    throw new Error("Invoice sequence limit reached.");
  }

  return `${prefix}${String(nextSequence).padStart(2, "0")}`;
};

// ==================================================
// CUSTOMER NAME VALIDATION
// ==================================================

const validateCustomerName = (name) => {
  const value = String(name || "").trim();

  if (!value) {
    return "Customer name is required.";
  }

  if (value.length < 2) {
    return "Customer name must contain at least 2 characters.";
  }

  if (value.length > 60) {
    return "Customer name cannot exceed 60 characters.";
  }

  // English and Urdu letters supported.
  const validNamePattern = /^[\p{L}][\p{L}\p{M} .'-]*$/u;

  if (!validNamePattern.test(value)) {
    return "Please enter a valid customer name. Numbers and special characters are not allowed.";
  }

  const letterCount = [...value].filter((char) => /\p{L}/u.test(char)).length;

  if (letterCount < 2) {
    return "Please enter a valid customer name.";
  }

  return null;
};

// ==================================================
// PAKISTAN PHONE NORMALIZATION
// ==================================================

const normalizePakistanPhone = (phone) => {
  let value = String(phone || "").replace(/[\s()-]/g, "");

  if (value.startsWith("+92")) {
    value = "0" + value.slice(3);
  } else if (value.startsWith("0092")) {
    value = "0" + value.slice(4);
  } else if (value.startsWith("92")) {
    value = "0" + value.slice(2);
  }

  return value;
};

// ==================================================
// PAKISTAN MOBILE VALIDATION
// ==================================================

const validatePakistanPhone = (phone) => {
  if (!String(phone || "").trim()) {
    return null;
  }

  const normalized = normalizePakistanPhone(phone);

  if (!/^03[0-9]{9}$/.test(normalized)) {
    return "Enter a valid Pakistani mobile number (03XXXXXXXXX).";
  }

  return null;
};

// ==================================================
// POS COMPONENT
// ==================================================

function POS() {
  const { products, setProducts } = useProducts();

  const { sales, addSale, updateSale } = useSales();

  const { customers, addOrUpdateCustomer, updateCustomerAfterSale } =
    useCustomers();

  // ==================================================
  // PRODUCT DATA
  // ==================================================

  const posProducts = useMemo(
    () =>
      products.map((product) => ({
        ...product,
        price: Number(product.sellingPrice) || 0,
        stock: Number(product.stock) || 0,
        minStock: Number(product.minStock) || 0,
      })),
    [products],
  );

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(products.map((product) => product.category).filter(Boolean)),
    ];

    return ["All", ...uniqueCategories];
  }, [products]);

  // ==================================================
  // SEARCH & FILTER
  // ==================================================

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  const filteredProducts = useMemo(() => {
    return posProducts.filter((product) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        String(product.name || "")
          .toLowerCase()
          .includes(searchText) ||
        String(product.size || "")
          .toLowerCase()
          .includes(searchText) ||
        String(product.category || "")
          .toLowerCase()
          .includes(searchText);

      const matchesCategory =
        activeCategory === "All" || product.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [posProducts, search, activeCategory]);

  // ==================================================
  // PAGINATION
  // ==================================================

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const safeTotalPages = Math.max(1, totalPages);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const startProduct = filteredProducts.length === 0 ? 0 : startIndex + 1;

  const endProduct = Math.min(
    startIndex + itemsPerPage,
    filteredProducts.length,
  );

  useEffect(() => {
    if (currentPage > safeTotalPages) {
      setCurrentPage(safeTotalPages);
    }
  }, [currentPage, safeTotalPages]);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, safeTotalPages)));
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // ==================================================
  // CUSTOMER
  // ==================================================

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [saleDate, setSaleDate] = useState(getToday());

  // ==================================================
  // CART
  // ==================================================

  const [cart, setCart] = useState([]);

  // ==================================================
  // BILLING
  // ==================================================

  const [discount, setDiscount] = useState("0");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  // ==================================================
  // INVOICE STATE
  // ==================================================

  const [completedSale, setCompletedSale] = useState(null);
  const [wasInvoiceUpdated, setWasInvoiceUpdated] = useState(false);

  const [editingSale, setEditingSale] = useState(null);

  const [isProcessing, setIsProcessing] = useState(false);

  const productsSectionRef = useRef(null);

  // ==================================================
  // CALCULATIONS
  // ==================================================

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total + Number(item.price) * (Number(item.quantity) || 0),
        0,
      ),
    [cart],
  );

  const discountInput = Number(discount) || 0;

  const discountValue = Math.min(Math.max(discountInput, 0), subtotal);

  const grandTotal = Math.max(0, subtotal - discountValue);

  const receivedAmount = Math.max(Number(paidAmount) || 0, 0);

  const paid = Math.min(receivedAmount, grandTotal);

  const balance = Math.max(grandTotal - receivedAmount, 0);

  const changeReturned = Math.max(receivedAmount - grandTotal, 0);

  const paymentStatus = balance <= 0 ? "Paid" : paid > 0 ? "Partial" : "Unpaid";

  const totalItems = cart.reduce(
    (total, item) => total + (Number(item.quantity) || 0),
    0,
  );

  // ==================================================
  // ADD TO CART
  // ==================================================

  const addToCart = (product) => {
    if (product.stock <= 0) {
      alert("This product is out of stock.");
      return;
    }

    setCart((previousCart) => {
      const existingItem = previousCart.find((item) => item.id === product.id);

      if (existingItem) {
        const currentQuantity = Number(existingItem.quantity) || 0;

        const initialQuantity = Number(existingItem.initialQuantity) || 0;

        const maximumQuantity = product.stock + initialQuantity;

        if (currentQuantity + 1 > maximumQuantity) {
          alert(
            `Maximum available quantity is ${maximumQuantity} ${product.unit}.`,
          );

          return previousCart;
        }

        return previousCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: currentQuantity + 1,
                price: product.price,
                stock: product.stock,
              }
            : item,
        );
      }

      return [
        ...previousCart,
        {
          ...product,
          quantity: 1,
          initialQuantity: 0,
        },
      ];
    });
  };

  // ==================================================
  // UPDATE QUANTITY
  // ==================================================

  const updateQuantity = (id, value) => {
    if (value !== "" && !validDecimal(value)) return;

    setCart((previousCart) =>
      previousCart.map((item) =>
        item.id === id ? { ...item, quantity: value } : item,
      ),
    );
  };

  // ==================================================
  // QUANTITY VALIDATION
  // ==================================================

  const handleQuantityBlur = (id) => {
    setCart((previousCart) =>
      previousCart.map((item) => {
        if (item.id !== id) return item;

        const product = posProducts.find((product) => product.id === id);

        const quantity = Number(item.quantity);

        const initialQuantity = Number(item.initialQuantity) || 0;

        const maximumQuantity = (product?.stock || 0) + initialQuantity;

        if (!Number.isFinite(quantity) || quantity <= 0) {
          return {
            ...item,
            quantity: initialQuantity || 1,
          };
        }

        if (quantity > maximumQuantity) {
          alert(
            `Maximum available quantity is ${maximumQuantity} ${item.unit}.`,
          );

          return {
            ...item,
            quantity: maximumQuantity,
          };
        }

        return {
          ...item,
          quantity,
        };
      }),
    );
  };

  // ==================================================
  // INCREASE QUANTITY
  // ==================================================

  const increaseQuantity = (id) => {
    setCart((previousCart) =>
      previousCart.map((item) => {
        if (item.id !== id) return item;

        const product = posProducts.find((product) => product.id === id);

        const maximumQuantity =
          (product?.stock || 0) + (Number(item.initialQuantity) || 0);

        const nextQuantity = Number(item.quantity || 0) + 1;

        if (nextQuantity > maximumQuantity) {
          alert(
            `Maximum available quantity is ${maximumQuantity} ${item.unit}.`,
          );

          return item;
        }

        return {
          ...item,
          quantity: nextQuantity,
        };
      }),
    );
  };

  // ==================================================
  // DECREASE QUANTITY
  // ==================================================

  const decreaseQuantity = (id) => {
    setCart((previousCart) =>
      previousCart.map((item) => {
        if (item.id !== id) return item;

        const nextQuantity = Number(item.quantity) - 1;

        if (nextQuantity <= 0) return item;

        return {
          ...item,
          quantity: nextQuantity,
        };
      }),
    );
  };

  // ==================================================
  // REMOVE PRODUCT
  // ==================================================

  const removeFromCart = (id) => {
    setCart((previousCart) => previousCart.filter((item) => item.id !== id));
  };

  // ==================================================
  // RESET POS
  // ==================================================

  const clearCart = () => {
    if (isProcessing) return;

    setCart([]);

    setDiscount("0");
    setPaidAmount("");

    setCustomerName("");
    setCustomerPhone("");

    setSaleDate(getToday());

    setPaymentMethod("Cash");

    setSearch("");
    setActiveCategory("All");

    setCurrentPage(1);

    setCompletedSale(null);
    setWasInvoiceUpdated(false);
    setEditingSale(null);
  };

  // ==================================================
  // EDIT EXISTING INVOICE
  // ==================================================

  const handleAddMoreItems = () => {
    if (!completedSale) return;

    const sale = completedSale;

    const restoredCart = sale.items.map((item) => {
      const latestProduct = posProducts.find(
        (product) => product.id === item.id,
      );

      return {
        ...item,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 0,
        stock: latestProduct?.stock || 0,
        minStock: latestProduct?.minStock || 0,
        initialQuantity: Number(item.quantity) || 0,
      };
    });

    setCart(restoredCart);

    setCustomerName(sale.customerName || "");
    setCustomerPhone(sale.customerPhone || "");

    setSaleDate(sale.saleDate || getToday());

    setDiscount(String(sale.discount || 0));

    setPaidAmount(String(sale.amountReceived ?? sale.paid ?? 0));

    setPaymentMethod(sale.paymentMethod || "Cash");

    setEditingSale(sale);

    setCompletedSale(null);

    setSearch("");
    setActiveCategory("All");
    setCurrentPage(1);

    requestAnimationFrame(() => {
      productsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const handleCloseInvoice = () => {
    setCompletedSale(null);
  };

  // ==================================================
  // CUSTOMER AUTOFILL
  // ==================================================

  const handlePhoneChange = (value) => {
    setCustomerPhone(value);

    const normalizedPhone = normalizePakistanPhone(value);

    const existingCustomer = customers?.find(
      (customer) => normalizePakistanPhone(customer.phone) === normalizedPhone,
    );

    if (existingCustomer) {
      setCustomerName(existingCustomer.name || "");
    }
  };

  // ==================================================
  // CHECKOUT
  // ==================================================

  const handleCheckout = () => {
    if (isProcessing) return;

    // CUSTOMER NAME VALIDATION

    const nameError = validateCustomerName(customerName);

    if (nameError) {
      alert(nameError);
      return;
    }

    // CUSTOMER PHONE VALIDATION

    const phoneError = validatePakistanPhone(customerPhone);

    if (phoneError) {
      alert(phoneError);
      return;
    }

    // DATE VALIDATION

    if (!saleDate) {
      alert("Please select sale date and time.");
      return;
    }

    try {
      getInvoiceDatePrefix(saleDate);
    } catch (error) {
      alert(error.message);
      return;
    }

    // CART VALIDATION

    if (cart.length === 0) {
      alert("Please add products to the cart first.");
      return;
    }

    if (
      cart.some(
        (item) =>
          !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0,
      )
    ) {
      alert("Please enter a valid quantity.");
      return;
    }

    // DISCOUNT VALIDATION

    if (
      !Number.isFinite(Number(discount)) ||
      discountInput < 0 ||
      discountInput > subtotal
    ) {
      alert("Please enter a valid discount.");
      return;
    }

    // PRICE VALIDATION

    if (
      cart.some(
        (item) =>
          !Number.isFinite(Number(item.price)) || Number(item.price) < 0,
      )
    ) {
      alert("Invalid product price detected.");
      return;
    }

    // STOCK VALIDATION

    for (const item of cart) {
      const latestProduct = products.find((product) => product.id === item.id);

      if (!latestProduct) {
        alert(`${item.name} is no longer available.`);
        return;
      }

      const currentStock = Number(latestProduct.stock) || 0;

      const oldQuantity = Number(item.initialQuantity) || 0;

      const newQuantity = Number(item.quantity);

      const additionalQuantity = newQuantity - oldQuantity;

      if (additionalQuantity > currentStock) {
        alert(
          `Insufficient stock for ${item.name}.\nAvailable additional stock: ${currentStock} ${item.unit}.`,
        );

        return;
      }
    }

    setIsProcessing(true);

    try {
      // INVOICE NUMBER

      // Existing invoice keeps its original number.
      // New invoice gets a date-based sequential number.

      const invoiceNumber = editingSale
        ? editingSale.invoiceNumber
        : generateInvoiceNumber(sales, saleDate);

      // NORMALIZED CUSTOMER PHONE

      const normalizedPhone = customerPhone.trim()
        ? normalizePakistanPhone(customerPhone)
        : "";

      // SALE OBJECT

      const sale = {
        id: editingSale?.id || Date.now(),

        invoiceNumber,

        customerName: customerName.trim(),

        customerPhone: normalizedPhone,

        saleDate,

        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          size: item.size,
          unit: item.unit,
          price: Number(item.price),
          quantity: Number(item.quantity),
          total: Number(item.price) * Number(item.quantity),
        })),

        subtotal,

        discount: discountValue,

        grandTotal,

        paid,

        amountReceived: receivedAmount,

        changeReturned,

        balance,

        paymentMethod,

        paymentStatus,

        totalItems,

        createdAt: editingSale?.createdAt || new Date().toISOString(),

        updatedAt: new Date().toISOString(),
      };

      // ==================================================
      // SAVE NEW SALE
      // ==================================================

      if (!editingSale) {
        const savedSale = addSale(sale) || sale;

        addOrUpdateCustomer(savedSale);

        setWasInvoiceUpdated(false);

        setCompletedSale(savedSale);
      } else {
        // ==================================================
        // UPDATE EXISTING SALE
        // ==================================================

        const oldSale = editingSale;

        updateSale(oldSale.id, sale);

        updateCustomerAfterSale(oldSale, sale);

        setWasInvoiceUpdated(true);

        setCompletedSale(sale);
      }

      // ==================================================
      // INVENTORY UPDATE
      // ==================================================

      setProducts((previousProducts) =>
        previousProducts.map((product) => {
          const oldItem = editingSale?.items?.find(
            (item) => item.id === product.id,
          );

          const newItem = cart.find((item) => item.id === product.id);

          const oldQuantity = Number(oldItem?.quantity) || 0;

          const newQuantity = Number(newItem?.quantity) || 0;

          const difference = newQuantity - oldQuantity;

          if (difference === 0) return product;

          return {
            ...product,
            stock: (Number(product.stock) || 0) - difference,
          };
        }),
      );

      setEditingSale(null);
    } catch (error) {
      console.error("Checkout error:", error);

      alert(error.message || "Something went wrong while completing the sale.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ==================================================
  // PRINT INVOICE
  // ==================================================

  const printInvoice = () => {
    if (!completedSale) return;

    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      alert("Please allow pop-ups to print the invoice.");
      return;
    }

    const sale = completedSale;

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${escapeHTML(sale.invoiceNumber)}</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            padding: 35px;
            color: #1e293b;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
          }

          h1 {
            color: #2563eb;
            margin: 0;
          }

          .info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 25px 0;
            padding: 18px;
            background: #f8fafc;
            border-radius: 8px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 25px;
          }

          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
          }

          th {
            background: #eff6ff;
          }

          .totals {
            width: 320px;
            margin-left: auto;
            margin-top: 25px;
          }

          .row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
          }

          .grand {
            border-top: 2px solid #2563eb;
            font-size: 20px;
            font-weight: bold;
            padding-top: 15px;
          }

          .footer {
            text-align: center;
            margin-top: 50px;
            color: #64748b;
          }

          @media print {
            body {
              padding: 10px;
            }
          }
        </style>
      </head>

      <body>

        <div class="header">
          <div>
            <h1>STEEL STORE</h1>
            <p>Sales & Billing Invoice</p>
          </div>

          <div>
            <h2>${escapeHTML(sale.invoiceNumber)}</h2>
            <p>${escapeHTML(new Date(sale.saleDate).toLocaleString())}</p>
          </div>
        </div>

        <div class="info">
          <div>
            <strong>Customer Name:</strong>
            ${escapeHTML(sale.customerName)}
          </div>

          <div>
            <strong>Phone:</strong>
            ${escapeHTML(sale.customerPhone || "N/A")}
          </div>

          <div>
            <strong>Payment Method:</strong>
            ${escapeHTML(sale.paymentMethod)}
          </div>

          <div>
            <strong>Payment Status:</strong>
            ${escapeHTML(sale.paymentStatus)}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Size</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            ${sale.items
              .map(
                (item) => `
                  <tr>
                    <td>${escapeHTML(item.name)}</td>
                    <td>${escapeHTML(item.size || "N/A")}</td>
                    <td>
                      ${escapeHTML(item.quantity)}
                      ${escapeHTML(item.unit)}
                    </td>
                    <td>${formatCurrency(item.price)}</td>
                    <td>${formatCurrency(item.total)}</td>
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>

        <div class="totals">

          <div class="row">
            <span>Subtotal</span>
            <strong>${formatCurrency(sale.subtotal)}</strong>
          </div>

          <div class="row">
            <span>Discount</span>
            <strong>${formatCurrency(sale.discount)}</strong>
          </div>

          <div class="row grand">
            <span>Grand Total</span>
            <strong>${formatCurrency(sale.grandTotal)}</strong>
          </div>

          <div class="row">
            <span>Amount Received</span>
            <strong>${formatCurrency(sale.amountReceived)}</strong>
          </div>

          <div class="row">
            <span>Amount Applied</span>
            <strong>${formatCurrency(sale.paid)}</strong>
          </div>

          <div class="row">
            <span>Change Returned</span>
            <strong>${formatCurrency(sale.changeReturned)}</strong>
          </div>

          <div class="row">
            <span>Remaining Balance</span>
            <strong>${formatCurrency(sale.balance)}</strong>
          </div>

        </div>

        <div class="footer">
          <h3>Thank You For Your Business!</h3>
          <p>Please keep this invoice for your records.</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>

      </body>
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
  };

  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Sales Management
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-800">
            Point of Sale
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage customers, products, payments and invoices.
          </p>
        </div>

        <button
          onClick={clearCart}
          disabled={isProcessing}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RotateCcw size={17} />
          New Sale / Reset
        </button>
      </div>

      {/* CUSTOMER INFORMATION */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <User size={22} />
          </div>

          <div>
            <h2 className="font-bold text-slate-800">Customer Information</h2>

            <p className="text-xs text-slate-500">
              Enter customer details for this sale.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Customer Name *
            </label>

            <div className="relative">
              <User
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={customerName}
                maxLength={60}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Phone Number
            </label>

            <div className="relative">
              <Phone
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="03XX XXXXXXX"
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <p className="mt-1 text-[11px] text-slate-400">
              Pakistani mobile number (optional).
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Sale Date & Time *
            </label>

            <div className="relative">
              <CalendarDays
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="datetime-local"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>
      </div>

      {/* MAIN POS */}

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        {/* PRODUCTS */}

        <div
          ref={productsSectionRef}
          className="min-w-0 space-y-5 scroll-mt-6 xl:col-span-2"
        >
          {/* SEARCH */}

          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search products by name or size..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {/* CATEGORIES */}

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  setCurrentPage(1);
                }}
                className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  activeCategory === category
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* PRODUCT HEADING */}

          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Available Products
              </h2>

              <p className="text-sm text-slate-500">
                Select products to add them to your order.
              </p>
            </div>

            <span className="shrink-0 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">
              {filteredProducts.length} Products
            </span>
          </div>

          {/* PRODUCT LIST */}

          <div className="flex flex-col gap-3">
            {paginatedProducts.map((product, index) => {
              const cartItem = cart.find((item) => item.id === product.id);

              const isInCart = Boolean(cartItem);

              const isOutOfStock = product.stock <= 0;

              const isLowStock =
                product.stock > 0 && product.stock <= product.minStock;

              const currentQuantity = Number(cartItem?.quantity) || 0;

              const initialQuantity = Number(cartItem?.initialQuantity) || 0;

              const maximumQuantity = product.stock + initialQuantity;

              const isCartLimitReached =
                isInCart && currentQuantity >= maximumQuantity;

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: Math.min(index * 0.02, 0.2),
                  }}
                  className={`rounded-2xl border bg-white p-4 transition hover:shadow-md ${
                    isInCart
                      ? "border-amber-300 bg-amber-50/30"
                      : "border-slate-200 hover:border-blue-200"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {/* DETAILS */}

                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                          isOutOfStock
                            ? "bg-red-50 text-red-500"
                            : isInCart
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        <Package size={23} />
                      </div>

                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            {product.category || "Other"}
                          </span>

                          {isOutOfStock ? (
                            <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold text-red-600">
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                              Low Stock
                            </span>
                          ) : isInCart ? (
                            <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold text-green-700">
                              Selected
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                              In Stock
                            </span>
                          )}
                        </div>

                        <h3 className="truncate font-bold text-slate-800">
                          {product.name}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          Size: {product.size || "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* PRICE AND STOCK */}

                    <div className="grid grid-cols-2 gap-3 sm:w-52 sm:shrink-0">
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="text-[11px] font-medium text-slate-400">
                          Price / {product.unit}
                        </p>

                        <p className="mt-1 text-sm font-bold text-blue-600">
                          {formatCurrency(product.price)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="text-[11px] font-medium text-slate-400">
                          Available Stock
                        </p>

                        <p
                          className={`mt-1 text-sm font-bold ${
                            isOutOfStock
                              ? "text-red-600"
                              : isLowStock
                                ? "text-amber-600"
                                : "text-slate-700"
                          }`}
                        >
                          {product.stock} {product.unit}
                        </p>
                      </div>
                    </div>

                    {/* ADD TO CART */}

                    <div className="flex items-center gap-3 sm:w-44 sm:shrink-0 sm:flex-col sm:items-stretch">
                      {isInCart && (
                        <p className="text-xs font-semibold text-amber-700 sm:text-center">
                          In Order: {currentQuantity} {product.unit}
                        </p>
                      )}

                      <button
                        onClick={() => addToCart(product)}
                        disabled={isOutOfStock || isCartLimitReached}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-full ${
                          isInCart
                            ? "bg-amber-500 hover:bg-amber-600"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        {isOutOfStock ? (
                          "Out of Stock"
                        ) : isCartLimitReached ? (
                          "Stock Limit Reached"
                        ) : isInCart ? (
                          <>
                            <Plus size={16} />
                            Add More
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={16} />
                            Add to Cart
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* PAGINATION */}

          {filteredProducts.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap text-sm text-slate-500">
                      Rows per page:
                    </span>

                    <select
                      value={itemsPerPage}
                      onChange={handleItemsPerPageChange}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      {[6, 8, 12, 24, 48].map((number) => (
                        <option key={number} value={number}>
                          {number}
                        </option>
                      ))}
                    </select>
                  </div>

                  <p className="text-sm text-slate-500">
                    Showing{" "}
                    <span className="font-bold text-blue-600">
                      {startProduct} - {endProduct}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-slate-800">
                      {filteredProducts.length}
                    </span>{" "}
                    products
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1,
                  ).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => goToPage(page)}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold transition ${
                        currentPage === page
                          ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* EMPTY STATE */}

          {filteredProducts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
              <Package size={35} className="mx-auto text-slate-300" />

              <p className="mt-3 font-semibold text-slate-600">
                No products found
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Try another search or category.
              </p>
            </div>
          )}
        </div>

        {/* CART AND BILLING */}

        <div className="min-w-0 space-y-5">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* CART HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ShoppingCart size={20} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-800">
                    {editingSale ? "Update Invoice" : "Current Order"}
                  </h2>

                  <p className="text-xs text-slate-500">
                    {cart.length} different items
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCart([])}
                disabled={
                  cart.length === 0 || Boolean(editingSale) || isProcessing
                }
                className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-40"
              >
                Clear
              </button>
            </div>

            {/* CART ITEMS */}

            <div className="min-h-[180px] space-y-4 p-5">
              {cart.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-center">
                  <ShoppingCart size={35} className="text-slate-300" />

                  <p className="mt-3 font-semibold text-slate-500">
                    Your cart is empty
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Add products to start a sale.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">
                          {item.name}
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatCurrency(item.price)} / {item.unit}
                        </p>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        disabled={isProcessing}
                        className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* QUANTITY */}

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                          Quantity ({item.unit})
                        </label>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => decreaseQuantity(item.id)}
                            disabled={
                              Number(item.quantity) <= 0.01 || isProcessing
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Minus size={15} />
                          </button>

                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.quantity}
                            disabled={isProcessing}
                            onChange={(e) =>
                              updateQuantity(item.id, e.target.value)
                            }
                            onBlur={() => handleQuantityBlur(item.id)}
                            onWheel={(e) => e.currentTarget.blur()}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.currentTarget.blur();
                              }
                            }}
                            className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />

                          <button
                            type="button"
                            onClick={() => increaseQuantity(item.id)}
                            disabled={
                              Number(item.quantity) >=
                                Number(item.stock) +
                                  Number(item.initialQuantity || 0) ||
                              isProcessing
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-slate-400">Item Total</p>

                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {formatCurrency(
                            item.price * (Number(item.quantity) || 0),
                          )}
                        </p>
                      </div>
                    </div>

                    <p className="mt-2 text-right text-[11px] text-slate-400">
                      Available additional stock: {item.stock} {item.unit}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* BILLING */}

            <div className="space-y-3 border-t border-slate-100 bg-slate-50 p-5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Quantity</span>

                <span className="font-semibold text-slate-700">
                  {totalItems}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>

                <span className="font-semibold text-slate-700">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              {/* DISCOUNT */}

              <div className="flex items-center justify-between gap-3 text-sm">
                <label htmlFor="discount" className="text-slate-500">
                  Discount (Rs.)
                </label>

                <input
                  id="discount"
                  type="text"
                  inputMode="decimal"
                  value={discount}
                  disabled={isProcessing}
                  onChange={(e) => {
                    if (validDecimal(e.target.value)) {
                      setDiscount(e.target.value);
                    }
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-28 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* GRAND TOTAL */}

              <div className="flex justify-between border-t border-dashed border-slate-300 pt-3">
                <span className="font-bold text-slate-800">Grand Total</span>

                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(grandTotal)}
                </span>
              </div>

              {/* PAYMENT METHOD */}

              <div className="pt-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Payment Method
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: "Cash", icon: Banknote },
                    { name: "Bank", icon: CreditCard },
                    { name: "Credit", icon: Wallet },
                  ].map((method) => {
                    const Icon = method.icon;

                    return (
                      <button
                        key={method.name}
                        type="button"
                        onClick={() => setPaymentMethod(method.name)}
                        disabled={isProcessing}
                        className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-semibold transition ${
                          paymentMethod === method.name
                            ? "border-blue-500 bg-blue-50 text-blue-600"
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        <Icon size={18} />
                        {method.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AMOUNT RECEIVED */}

              <div>
                <label
                  htmlFor="paidAmount"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Amount Received (Rs.)
                </label>

                <input
                  id="paidAmount"
                  type="text"
                  inputMode="decimal"
                  value={paidAmount}
                  disabled={isProcessing}
                  onChange={(e) => {
                    if (validDecimal(e.target.value)) {
                      setPaidAmount(e.target.value);
                    }
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="Enter amount received"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                {/* BALANCE */}

                <div className="mt-3 flex items-center justify-between rounded-lg bg-red-50 px-3 py-2.5">
                  <div>
                    <span className="block text-sm font-medium text-red-700">
                      Remaining Balance
                    </span>

                    <span className="text-[11px] text-red-500">
                      Amount customer still owes
                    </span>
                  </div>

                  <span className="font-bold text-red-600">
                    {formatCurrency(balance)}
                  </span>
                </div>

                {/* CHANGE */}

                <div className="mt-2 flex items-center justify-between rounded-lg bg-green-50 px-3 py-2.5">
                  <div>
                    <span className="block text-sm font-medium text-green-700">
                      Change to Return
                    </span>

                    <span className="text-[11px] text-green-600">
                      Extra money received
                    </span>
                  </div>

                  <span className="font-bold text-green-700">
                    {formatCurrency(changeReturned)}
                  </span>
                </div>

                {/* PAYMENT STATUS */}

                <div className="mt-3 flex items-center justify-between rounded-xl bg-white p-3">
                  <span className="text-xs font-semibold text-slate-500">
                    Payment Status
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      paymentStatus === "Paid"
                        ? "bg-green-100 text-green-700"
                        : paymentStatus === "Partial"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {paymentStatus}
                  </span>
                </div>
              </div>

              {/* CHECKOUT */}

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || isProcessing}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                {isProcessing ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={19} />

                    {editingSale ? "Update Existing Invoice" : "Complete Sale"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS MODAL */}

      <AnimatePresence>
        {completedSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
                y: 15,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                y: 15,
              }}
              transition={{ duration: 0.2 }}
              className="my-auto w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              {/* SUCCESS HEADER */}

              <div className="relative border-b border-green-100 bg-green-50 px-6 py-7 text-center">
                <button
                  onClick={handleCloseInvoice}
                  className="absolute right-4 top-4 rounded-full bg-white p-2 text-slate-500 shadow-sm transition hover:bg-red-50 hover:text-red-600"
                >
                  <X size={19} />
                </button>

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 ring-8 ring-green-100/50">
                  <CheckCircle2 size={35} />
                </div>

                <h2 className="mt-5 text-2xl font-bold text-slate-800">
                  {wasInvoiceUpdated ? "Invoice Updated!" : "Sale Completed!"}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {wasInvoiceUpdated
                    ? "Your invoice has been updated successfully."
                    : "Your sale has been completed successfully."}
                </p>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-green-200 bg-white px-4 py-2 text-xs font-bold text-green-700">
                  <CheckCircle2 size={14} />
                  {completedSale.paymentStatus || "Unpaid"}
                </div>
              </div>

              {/* INVOICE SUMMARY */}

              <div className="p-6">
                {/* INVOICE NUMBER */}

                <div className="mb-5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                      <Receipt size={22} />
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Invoice Number
                      </p>

                      <p className="mt-1 font-bold text-slate-800">
                        {completedSale.invoiceNumber || "N/A"}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700">
                    {completedSale.paymentMethod || "Cash"}
                  </span>
                </div>

                {/* CUSTOMER DETAILS */}

                <div className="mb-5">
                  <h3 className="mb-3 text-sm font-bold text-slate-800">
                    Customer Details
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-100 p-3">
                      <p className="text-xs text-slate-400">Customer Name</p>

                      <p className="mt-1 truncate text-sm font-semibold text-slate-700">
                        {completedSale.customerName || "Walk-in Customer"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-100 p-3">
                      <p className="text-xs text-slate-400">Phone Number</p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {completedSale.customerPhone || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-slate-100 p-3">
                    <p className="text-xs text-slate-400">Sale Date</p>

                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {completedSale.saleDate
                        ? new Date(completedSale.saleDate).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>

                {/* PAYMENT SUMMARY */}

                <div>
                  <h3 className="mb-3 text-sm font-bold text-slate-800">
                    Payment Summary
                  </h3>

                  <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Total Products</span>

                      <span className="font-semibold text-slate-700">
                        {completedSale.items?.length || 0}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Total Quantity</span>

                      <span className="font-semibold text-slate-700">
                        {completedSale.totalItems ??
                          completedSale.items?.reduce(
                            (sum, item) => sum + (Number(item.quantity) || 0),
                            0,
                          ) ??
                          0}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Subtotal</span>

                      <span className="font-semibold text-slate-700">
                        {formatCurrency(completedSale.subtotal)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Discount</span>

                      <span className="font-semibold text-red-500">
                        - {formatCurrency(completedSale.discount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-3">
                      <span className="font-bold text-slate-800">
                        Grand Total
                      </span>

                      <span className="text-xl font-bold text-blue-600">
                        {formatCurrency(completedSale.grandTotal)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="rounded-xl bg-green-50 p-3">
                        <p className="text-xs text-green-600">
                          Amount Received
                        </p>

                        <p className="mt-1 font-bold text-green-700">
                          {formatCurrency(
                            completedSale.amountReceived ?? completedSale.paid,
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl bg-red-50 p-3">
                        <p className="text-xs text-red-600">
                          Remaining Balance
                        </p>

                        <p className="mt-1 font-bold text-red-600">
                          {formatCurrency(completedSale.balance)}
                        </p>
                      </div>
                    </div>

                    {Number(completedSale.changeReturned) > 0 && (
                      <div className="flex justify-between rounded-lg bg-blue-50 px-3 py-2 text-sm">
                        <span className="text-blue-700">Change Returned</span>

                        <strong className="text-blue-700">
                          {formatCurrency(completedSale.changeReturned)}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* ACTION BUTTONS */}

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    onClick={handleCloseInvoice}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    <X size={17} />
                    Close
                  </button>

                  <button
                    onClick={printInvoice}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
                  >
                    <Printer size={18} />
                    Print Invoice
                  </button>
                </div>

                {/* EDIT INVOICE */}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default POS;
