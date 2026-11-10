import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useProducts } from "../context/ProductsContext";

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
} from "lucide-react";

const categories = [
  "All",
  "Steel Rods",
  "Pipes",
  "Sheets",
  "Angles",
  "Beams",
  "Other",
];

const formatCurrency = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 2,
  })}`;

const getToday = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
};

function POS() {
  // Shared Products Context
  const { products } = useProducts();

  // Convert Products page data into POS format
  const posProducts = useMemo(
    () =>
      products.map((product) => ({
        ...product,
        price: Number(product.sellingPrice) || 0,
        stock: Number(product.stock) || 0,
      })),
    [products],
  );

  // Search & Category
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // Customer Information
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [saleDate, setSaleDate] = useState(getToday());

  // Cart
  const [cart, setCart] = useState([]);

  // Billing
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  // Invoice
  const [completedSale, setCompletedSale] = useState(null);
  const [invoiceCounter, setInvoiceCounter] = useState(1);

  // Filter Products
  const filteredProducts = posProducts.filter((product) => {
    const matchesSearch =
      product.name?.toLowerCase().includes(search.toLowerCase()) ||
      product.size?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      activeCategory === "All" || product.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  // Calculations
  const subtotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart],
  );

  const discountValue = Math.min(Math.max(Number(discount) || 0, 0), subtotal);

  const grandTotal = subtotal - discountValue;

  const paid = Math.min(Math.max(Number(paidAmount) || 0, 0), grandTotal);

  const balance = grandTotal - paid;

  const paymentStatus = balance <= 0 ? "Paid" : paid > 0 ? "Partial" : "Unpaid";

  // Add Product To Cart
  const addToCart = (product) => {
    if (product.stock <= 0) {
      alert("This product is out of stock.");
      return;
    }

    setCart((previousCart) => {
      const existingItem = previousCart.find((item) => item.id === product.id);

      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          alert("You cannot add more than available stock.");
          return previousCart;
        }

        return previousCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                price: product.price,
                stock: product.stock,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      return [
        ...previousCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  };

  // Update Quantity
  const updateQuantity = (id, value) => {
    const product = posProducts.find((item) => item.id === id);
    const newQuantity = Number(value);

    if (!product || !Number.isFinite(newQuantity)) return;

    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }

    if (newQuantity > product.stock) {
      alert(`Only ${product.stock} ${product.unit} available.`);
    }

    setCart((previousCart) =>
      previousCart.map((item) =>
        item.id === id
          ? {
              ...item,
              price: product.price,
              stock: product.stock,
              quantity: Math.min(newQuantity, product.stock),
            }
          : item,
      ),
    );
  };

  // Remove Product
  const removeFromCart = (id) => {
    setCart((previousCart) => previousCart.filter((item) => item.id !== id));
  };

  // Reset Current Sale
  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setPaidAmount("");
    setCustomerName("");
    setCustomerPhone("");
    setSaleDate(getToday());
    setPaymentMethod("Cash");
    setCompletedSale(null);
  };

  // Add More Sale
  const handleAddMoreSale = () => {
    setCompletedSale(null);
  };

  // Complete Sale
  const handleCheckout = () => {
    if (!customerName.trim()) {
      alert("Please enter customer name.");
      return;
    }

    if (cart.length === 0) {
      alert("Please add products to the cart first.");
      return;
    }

    if (!saleDate) {
      alert("Please select sale date.");
      return;
    }

    if (Number(discount) < 0) {
      alert("Discount cannot be negative.");
      return;
    }

    if (discountValue > subtotal) {
      alert("Discount cannot exceed subtotal.");
      return;
    }

    if (Number(paidAmount) < 0) {
      alert("Received amount cannot be negative.");
      return;
    }

    if (Number(paidAmount) > grandTotal) {
      alert("Received amount cannot exceed the grand total.");
      return;
    }

    // Verify latest stock before checkout
    for (const item of cart) {
      const latestProduct = posProducts.find(
        (product) => product.id === item.id,
      );

      if (!latestProduct) {
        alert(`${item.name} is no longer available in inventory.`);
        return;
      }

      if (item.quantity > latestProduct.stock) {
        alert(
          `Insufficient stock for ${item.name}. Available: ${latestProduct.stock} ${latestProduct.unit}.`,
        );
        return;
      }
    }

    const invoiceNumber = `INV-${String(invoiceCounter).padStart(5, "0")}`;

    const sale = {
      invoiceNumber,
      customerName: customerName.trim(),
      customerPhone,
      saleDate,
      items: [...cart],
      subtotal,
      discount: discountValue,
      grandTotal,
      paid,
      balance,
      paymentMethod,
      paymentStatus,
      createdAt: new Date().toLocaleString(),
    };

    setCompletedSale(sale);
    setInvoiceCounter((previous) => previous + 1);
  };

  // Print Invoice
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
                    <td>${escapeHTML(item.size)}</td>
                    <td>${item.quantity} ${escapeHTML(item.unit)}</td>
                    <td>${formatCurrency(item.price)}</td>
                    <td>${formatCurrency(item.price * item.quantity)}</td>
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
            <span>Received</span>
            <strong>${formatCurrency(sale.paid)}</strong>
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
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <RotateCcw size={17} />
          New Sale / Reset
        </button>
      </div>

      {/* CUSTOMER DETAILS */}
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
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="03XX XXXXXXX"
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
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
        <div className="space-y-5 xl:col-span-2">
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

          {/* PRODUCT TITLE */}
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

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Package size={24} />
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-medium text-slate-400">
                      {product.category}
                    </p>

                    <h3 className="mt-1 font-bold text-slate-800">
                      {product.name}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Size: {product.size || "N/A"}
                    </p>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
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
                          product.stock <= product.minStock
                            ? "text-red-500"
                            : "text-slate-700"
                        }`}
                      >
                        {product.stock} {product.unit}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => addToCart(product)}
                    disabled={
                      product.stock <= 0 ||
                      (cartItem?.quantity ?? 0) >= product.stock
                    }
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Plus size={17} />

                    {product.stock <= 0
                      ? "Out of Stock"
                      : isInCart
                        ? "Add More"
                        : "Add to Cart"}
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
            {/* CART HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ShoppingCart size={20} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-800">Current Order</h2>

                  <p className="text-xs text-slate-500">
                    {cart.length} different items
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCart([])}
                disabled={cart.length === 0}
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
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-1">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
                        >
                          <Minus size={14} />
                        </button>

                        <input
                          type="number"
                          min="0.01"
                          max={
                            posProducts.find(
                              (product) => product.id === item.id,
                            )?.stock || 0
                          }
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.id, e.target.value)
                          }
                          className="w-14 text-center text-sm font-semibold outline-none"
                        />

                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          disabled={
                            item.quantity >=
                            (posProducts.find(
                              (product) => product.id === item.id,
                            )?.stock || 0)
                          }
                          className="rounded-md p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <p className="text-sm font-bold text-slate-800">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>

                    <p className="mt-1 text-right text-[11px] text-slate-400">
                      Quantity in {item.unit}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* BILLING */}
            <div className="space-y-3 border-t border-slate-100 bg-slate-50 p-5">
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
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-28 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-sm outline-none focus:border-blue-500"
                />
              </div>

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
                  Received Amount (Rs.)
                </label>

                <input
                  id="paidAmount"
                  type="number"
                  min="0"
                  max={grandTotal}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="Enter received amount"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                <div className="mt-3 flex justify-between text-sm">
                  <span className="text-slate-500">Remaining Balance</span>

                  <span className="font-bold text-red-500">
                    {formatCurrency(balance)}
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

              {/* COMPLETE SALE */}
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                <CheckCircle2 size={19} />
                Complete Sale
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS / INVOICE MODAL */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="my-6 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 size={35} />
            </div>

            <h2 className="mt-4 text-center text-xl font-bold text-slate-800">
              Sale Completed!
            </h2>

            <p className="mt-1 text-center text-sm text-slate-500">
              Invoice generated successfully.
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
                  {completedSale.invoiceNumber}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer</span>

                  <strong className="text-slate-800">
                    {completedSale.customerName}
                  </strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Phone Number</span>

                  <strong>{completedSale.customerPhone || "N/A"}</strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Sale Date</span>

                  <strong>
                    {new Date(completedSale.saleDate).toLocaleString()}
                  </strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Total Products</span>

                  <strong>{completedSale.items.length}</strong>
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
                  <span className="font-bold text-slate-800">Grand Total</span>

                  <strong className="text-lg text-blue-600">
                    {formatCurrency(completedSale.grandTotal)}
                  </strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Received Amount</span>

                  <strong className="text-green-600">
                    {formatCurrency(completedSale.paid)}
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

                  <strong>{completedSale.paymentMethod}</strong>
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
                    {completedSale.paymentStatus}
                  </strong>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={printInvoice}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Printer size={17} />
                Print Invoice
              </button>

              <button
                onClick={handleAddMoreSale}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Plus size={17} />
                Add More Sale
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Escape customer data before inserting it into printable HTML.
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

export default POS;
