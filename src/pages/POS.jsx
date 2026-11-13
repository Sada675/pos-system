import { useMemo, useRef, useState } from "react";
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
} from "lucide-react";

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

const formatCurrency = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 2,
  })}`;

const getToday = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
};

const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(100 + Math.random() * 900);

  return `INV-${timestamp}-${random}`;
};

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

const validDecimal = (value) => /^\d*\.?\d*$/.test(value);

// --------------------------------------------------
// POS
// --------------------------------------------------

function POS() {
  const { products, setProducts } = useProducts();

  const { sales, addSale, updateSale } = useSales();

  const { customers, addOrUpdateCustomer, updateCustomerAfterSale } =
    useCustomers();

  // --------------------------------------------------
  // PRODUCTS
  // --------------------------------------------------

  const posProducts = useMemo(() => {
    return products.map((product) => ({
      ...product,
      price: Number(product.sellingPrice) || 0,
      stock: Number(product.stock) || 0,
      minStock: Number(product.minStock) || 0,
    }));
  }, [products]);

  const categories = useMemo(() => {
    const productCategories = [
      ...new Set(products.map((product) => product.category).filter(Boolean)),
    ];

    return ["All", ...productCategories];
  }, [products]);

  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredProducts = useMemo(() => {
    return posProducts.filter((product) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        product.name?.toLowerCase().includes(searchText) ||
        product.size?.toLowerCase().includes(searchText) ||
        product.category?.toLowerCase().includes(searchText);

      const matchesCategory =
        activeCategory === "All" || product.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [posProducts, search, activeCategory]);

  // --------------------------------------------------
  // CUSTOMER
  // --------------------------------------------------

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [saleDate, setSaleDate] = useState(getToday());

  // --------------------------------------------------
  // CART
  // --------------------------------------------------

  const [cart, setCart] = useState([]);

  // --------------------------------------------------
  // BILLING
  // --------------------------------------------------

  const [discount, setDiscount] = useState("0");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  // --------------------------------------------------
  // INVOICE / EDIT MODE
  // --------------------------------------------------

  const [completedSale, setCompletedSale] = useState(null);
  const [wasInvoiceUpdated, setWasInvoiceUpdated] = useState(false);
  const productsSectionRef = useRef(null);

  const [editingSale, setEditingSale] = useState(null);

  const [isProcessing, setIsProcessing] = useState(false);

  // --------------------------------------------------
  // CALCULATIONS
  // --------------------------------------------------

  const subtotal = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total + Number(item.price) * (Number(item.quantity) || 0),
      0,
    );
  }, [cart]);

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

  // --------------------------------------------------
  // ADD PRODUCT TO CART
  // --------------------------------------------------

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
            `Only ${product.stock} ${product.unit} additional stock available.`,
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

  // --------------------------------------------------
  // UPDATE QUANTITY
  // --------------------------------------------------

  const updateQuantity = (id, value) => {
    if (value !== "" && !validDecimal(value)) return;

    setCart((previousCart) =>
      previousCart.map((item) =>
        item.id === id ? { ...item, quantity: value } : item,
      ),
    );
  };

  // --------------------------------------------------
  // QUANTITY BLUR VALIDATION
  // --------------------------------------------------

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

  // --------------------------------------------------
  // INCREASE QUANTITY
  // --------------------------------------------------

  const increaseQuantity = (id) => {
    setCart((previousCart) =>
      previousCart.map((item) => {
        if (item.id !== id) return item;

        const product = posProducts.find((product) => product.id === id);

        const currentQuantity = Number(item.quantity) || 0;
        const initialQuantity = Number(item.initialQuantity) || 0;

        const maximumQuantity = (product?.stock || 0) + initialQuantity;

        const nextQuantity = currentQuantity + 1;

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

  // --------------------------------------------------
  // DECREASE QUANTITY
  // --------------------------------------------------

  const decreaseQuantity = (id) => {
    setCart((previousCart) =>
      previousCart.map((item) => {
        if (item.id !== id) return item;

        const currentQuantity = Number(item.quantity) || 0;
        const nextQuantity = currentQuantity - 1;

        if (nextQuantity < 0.01) return item;

        return {
          ...item,
          quantity: nextQuantity,
        };
      }),
    );
  };

  // --------------------------------------------------
  // REMOVE PRODUCT
  // --------------------------------------------------

  const removeFromCart = (id) => {
    setCart((previousCart) => previousCart.filter((item) => item.id !== id));
  };

  // --------------------------------------------------
  // RESET SALE
  // --------------------------------------------------

  const clearCart = () => {
    setCart([]);

    setDiscount("0");
    setPaidAmount("");

    setCustomerName("");
    setCustomerPhone("");

    setSaleDate(getToday());

    setPaymentMethod("Cash");

    setSearch("");
    setActiveCategory("All");

    setCompletedSale(null);
    setWasInvoiceUpdated(false);
    setEditingSale(null);
  };

  // --------------------------------------------------
  // ADD MORE ITEMS TO EXISTING INVOICE
  // --------------------------------------------------

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

    setPaidAmount(String(sale.amountReceived || 0));

    setPaymentMethod(sale.paymentMethod || "Cash");

    setEditingSale(sale);

    setCompletedSale(null);

    setSearch("");
    setActiveCategory("All");

    requestAnimationFrame(() => {
      productsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };
  // --------------------------------------------------
  // CLOSE INVOICE
  // --------------------------------------------------

  const handleCloseInvoice = () => {
    setCompletedSale(null);
  };

  // --------------------------------------------------
  // CHECKOUT
  // --------------------------------------------------

  const handleCheckout = () => {
    if (isProcessing) return;

    if (!customerName.trim()) {
      alert("Please enter customer name.");
      return;
    }

    if (!saleDate) {
      alert("Please select sale date.");
      return;
    }

    if (cart.length === 0) {
      alert("Please add products to the cart first.");
      return;
    }

    if (
      cart.some((item) => !Number(item.quantity) || Number(item.quantity) <= 0)
    ) {
      alert("Please enter a valid quantity for every product.");
      return;
    }

    if (discountInput < 0 || discountInput > subtotal) {
      alert("Please enter a valid discount.");
      return;
    }

    // --------------------------------------------------
    // CHECK STOCK DELTA
    // --------------------------------------------------

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
      const invoiceNumber =
        editingSale?.invoiceNumber || generateInvoiceNumber();

      const sale = {
        id: editingSale?.id || Date.now(),

        invoiceNumber,

        customerName: customerName.trim(),

        customerPhone: customerPhone.trim(),

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

      // --------------------------------------------------
      // NEW SALE
      // --------------------------------------------------

      if (!editingSale) {
        const savedSale = addSale(sale);

        addOrUpdateCustomer(savedSale || sale);

        setWasInvoiceUpdated(false);
        setCompletedSale(savedSale || sale);
      } else {
        // --------------------------------------------------
        // UPDATE EXISTING SALE
        // --------------------------------------------------

        const oldSale = editingSale;

        updateSale(oldSale.id, sale);

        updateCustomerAfterSale(oldSale, sale);

        setWasInvoiceUpdated(true);
        setCompletedSale(sale);
      }

      // --------------------------------------------------
      // UPDATE INVENTORY
      // --------------------------------------------------

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
            stock: Math.max(0, (Number(product.stock) || 0) - difference),
          };
        }),
      );

      setEditingSale(null);
    } catch (error) {
      console.error("Checkout error:", error);

      alert(
        "Something went wrong while completing the sale. Please try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // --------------------------------------------------
  // PRINT INVOICE
  // --------------------------------------------------

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
          * { box-sizing: border-box; }

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

          h1 { color: #2563eb; margin: 0; }

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

          th { background: #eff6ff; }

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
            body { padding: 10px; }
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
                    <td>${escapeHTML(item.quantity)} ${escapeHTML(item.unit)}</td>
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

  // --------------------------------------------------
  // CUSTOMER AUTOFILL
  // --------------------------------------------------

  const handlePhoneChange = (value) => {
    setCustomerPhone(value);

    const existingCustomer = customers?.find(
      (customer) => customer.phone && customer.phone.trim() === value.trim(),
    );

    if (existingCustomer) {
      setCustomerName(existingCustomer.name || "");
    }
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

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
          {/* NAME */}

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
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* PHONE */}

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
          </div>

          {/* DATE */}

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
          className="space-y-5 scroll-mt-6 xl:col-span-2"
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
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {/* CATEGORIES */}

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
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

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Available Products
              </h2>

              <p className="text-sm text-slate-500">
                Select products to add them to your order.
              </p>
            </div>

            <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">
              {filteredProducts.length} Products
            </span>
          </div>

          {/* PRODUCT CARDS */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product, index) => {
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
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`rounded-2xl border bg-white p-4 transition hover:-translate-y-1 hover:shadow-lg ${
                    isInCart
                      ? "border-amber-300 shadow-sm"
                      : "border-slate-200 hover:border-blue-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Package size={24} />
                    </div>

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
                    ) : null}
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-medium text-slate-400">
                      {product.category || "Other"}
                    </p>

                    <h3 className="mt-1 font-bold text-slate-800">
                      {product.name}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Size: {product.size || "N/A"}
                    </p>
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-xs text-slate-400">
                        Price / {product.unit}
                      </p>

                      <p className="mt-1 text-lg font-bold text-blue-600">
                        {formatCurrency(product.price)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-slate-400">Available Stock</p>

                      <p
                        className={`mt-1 text-sm font-semibold ${
                          isOutOfStock || isLowStock
                            ? "text-red-500"
                            : "text-slate-700"
                        }`}
                      >
                        {product.stock} {product.unit}
                      </p>
                    </div>
                  </div>

                  {isInCart && (
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
                      <span className="text-xs font-semibold text-amber-800">
                        In Current Order
                      </span>

                      <span className="text-sm font-bold text-amber-700">
                        {currentQuantity} {product.unit}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => addToCart(product)}
                    disabled={isOutOfStock || isCartLimitReached}
                    className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300 ${
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
                        <Plus size={17} />
                        Add More
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={17} />
                        Add to Cart
                      </>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>

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

        {/* CART & BILLING */}

        <div className="space-y-5 xl:sticky xl:top-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                disabled={cart.length === 0 || Boolean(editingSale)}
                className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-40"
              >
                Clear
              </button>
            </div>

            {/* CART ITEMS */}

            <div className="max-h-[350px] min-h-[180px] space-y-4 overflow-y-auto p-5">
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
                            disabled={Number(item.quantity) <= 0.01}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Minus size={15} />
                          </button>

                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.quantity}
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
                                Number(item.initialQuantity || 0)
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

              {/* RECEIVED AMOUNT */}

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
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.9,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.9,
              }}
              className="my-6 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            >
              {/* CLOSE */}

              <div className="flex items-center justify-end">
                <button
                  onClick={handleCloseInvoice}
                  className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                >
                  <X size={20} />
                </button>
              </div>

              {/* SUCCESS ICON */}

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                <CheckCircle2 size={35} />
              </div>

              <h2 className="mt-4 text-center text-xl font-bold text-slate-800">
                {wasInvoiceUpdated ? "Invoice Updated!" : "Sale Completed!"}
              </h2>

              <p className="mt-1 text-center text-sm text-slate-500">
                {wasInvoiceUpdated
                  ? "Your existing invoice has been updated successfully."
                  : "Invoice generated and inventory updated successfully."}
              </p>

              {/* INVOICE DETAILS */}

              <div className="mt-6 rounded-xl border border-slate-200 p-4">
                <div className="mb-4 flex items-center justify-between border-b border-dashed border-slate-200 pb-4">
                  <div className="flex items-center gap-2">
                    <Receipt className="text-blue-600" size={22} />

                    <span className="font-bold text-slate-800">
                      Invoice Details
                    </span>
                  </div>

                  <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600">
                    {completedSale.invoiceNumber || "N/A"}
                  </span>
                </div>

                <div className="max-h-[350px] space-y-3 overflow-y-auto text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Customer</span>

                    <strong className="text-right text-slate-800">
                      {completedSale.customerName || "Walk-in Customer"}
                    </strong>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Phone Number</span>

                    <strong>{completedSale.customerPhone || "N/A"}</strong>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Sale Date</span>

                    <strong className="text-right">
                      {completedSale.saleDate
                        ? new Date(completedSale.saleDate).toLocaleString()
                        : "N/A"}
                    </strong>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Products</span>

                    <strong>{completedSale.items?.length || 0}</strong>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Quantity</span>

                    <strong>
                      {completedSale.totalItems ??
                        completedSale.items?.reduce(
                          (sum, item) => sum + (Number(item.quantity) || 0),
                          0,
                        ) ??
                        0}
                    </strong>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal</span>

                    <strong>{formatCurrency(completedSale.subtotal)}</strong>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Discount</span>

                    <strong>{formatCurrency(completedSale.discount)}</strong>
                  </div>

                  <div className="flex justify-between border-t border-slate-200 pt-3">
                    <span className="font-bold text-slate-800">
                      Grand Total
                    </span>

                    <strong className="text-lg text-blue-600">
                      {formatCurrency(completedSale.grandTotal)}
                    </strong>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Received</span>

                    <strong className="text-green-600">
                      {formatCurrency(
                        completedSale.amountReceived ?? completedSale.paid,
                      )}
                    </strong>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Change Returned</span>

                    <strong className="text-green-600">
                      {formatCurrency(completedSale.changeReturned)}
                    </strong>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Remaining Balance</span>

                    <strong className="text-red-500">
                      {formatCurrency(completedSale.balance)}
                    </strong>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Method</span>

                    <strong>{completedSale.paymentMethod || "N/A"}</strong>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Status</span>

                    <strong
                      className={
                        completedSale.paymentStatus === "Paid"
                          ? "text-green-600"
                          : completedSale.paymentStatus === "Partial"
                            ? "text-amber-600"
                            : "text-red-500"
                      }
                    >
                      {completedSale.paymentStatus || "Unpaid"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* ACTIONS */}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  onClick={printInvoice}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Printer size={17} />
                  Print Invoice
                </button>

                <button
                  onClick={handleAddMoreItems}
                  className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
                >
                  <Plus size={17} />
                  Add More Items
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default POS;
