import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  CreditCard,
  Banknote,
  Wallet,
  Package,
  CheckCircle2,
  Printer,
  RotateCcw,
} from "lucide-react";

const products = [
  {
    id: 1,
    name: "Steel Rod 10mm",
    category: "Steel Rods",
    size: "10mm",
    unit: "KG",
    price: 285,
    stock: 1200,
  },
  {
    id: 2,
    name: "Steel Rod 12mm",
    category: "Steel Rods",
    size: "12mm",
    unit: "KG",
    price: 290,
    stock: 950,
  },
  {
    id: 3,
    name: "Steel Rod 16mm",
    category: "Steel Rods",
    size: "16mm",
    unit: "KG",
    price: 295,
    stock: 750,
  },
  {
    id: 4,
    name: "GI Pipe",
    category: "Pipes",
    size: "1 inch",
    unit: "Piece",
    price: 1800,
    stock: 85,
  },
  {
    id: 5,
    name: "Steel Pipe",
    category: "Pipes",
    size: "2 inch",
    unit: "Piece",
    price: 3200,
    stock: 60,
  },
  {
    id: 6,
    name: "Steel Sheet",
    category: "Sheets",
    size: "4 × 8 ft",
    unit: "Piece",
    price: 8500,
    stock: 45,
  },
  {
    id: 7,
    name: "Steel Angle",
    category: "Angles",
    size: "2 × 2 inch",
    unit: "Piece",
    price: 1200,
    stock: 110,
  },
  {
    id: 8,
    name: "I Beam",
    category: "Beams",
    size: "6 inch",
    unit: "Piece",
    price: 6500,
    stock: 35,
  },
];

const categories = [
  "All",
  "Steel Rods",
  "Pipes",
  "Sheets",
  "Angles",
  "Beams",
];

const formatCurrency = (amount) =>
  `Rs. ${Number(amount).toLocaleString("en-PK", {
    maximumFractionDigits: 2,
  })}`;

function POS() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [completedSale, setCompletedSale] = useState(null);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.size.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      activeCategory === "All" ||
      product.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),
    [cart]
  );

  const discountValue = Math.min(
    Math.max(Number(discount) || 0, 0),
    subtotal
  );

  const grandTotal = subtotal - discountValue;

  const paid = Math.min(
    Math.max(Number(paidAmount) || 0, 0),
    grandTotal
  );

  const balance = grandTotal - paid;

  const addToCart = (product) => {
    setCart((previousCart) => {
      const existingItem = previousCart.find(
        (item) => item.id === product.id
      );

      if (existingItem) {
        return previousCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: Math.min(
                  item.quantity + 1,
                  product.stock
                ),
              }
            : item
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

  const updateQuantity = (id, value) => {
    const product = products.find((item) => item.id === id);
    const newQuantity = Number(value);

    if (!product || !Number.isFinite(newQuantity)) return;

    setCart((previousCart) =>
      previousCart.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.min(
                Math.max(newQuantity, 0.01),
                product.stock
              ),
            }
          : item
      )
    );
  };

  const removeFromCart = (id) => {
    setCart((previousCart) =>
      previousCart.filter((item) => item.id !== id)
    );
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setPaidAmount("");
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Please add products to the cart first.");
      return;
    }

    const sale = {
      items: [...cart],
      subtotal,
      discount: discountValue,
      grandTotal,
      paid,
      balance,
      paymentMethod,
      date: new Date().toLocaleString(),
    };

    setCompletedSale(sale);
    clearCart();
  };

  const printInvoice = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Sales Management
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-800">
            Point of Sale
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create a new sale and manage customer billing.
          </p>
        </div>

        <button
          onClick={clearCart}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <RotateCcw size={17} />
          Clear Cart
        </button>
      </div>

      {/* POS Layout */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        {/* Products Section */}
        <div className="space-y-5 xl:col-span-2">
          {/* Search */}
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

          {/* Categories */}
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

          {/* Product Heading */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Available Products
              </h2>
              <p className="text-sm text-slate-500">
                Select a product to add it to your cart.
              </p>
            </div>

            <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">
              {filteredProducts.length} Products
            </span>
          </div>

          {/* Product Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product, index) => {
              const isInCart = cart.some(
                (item) => item.id === product.id
              );

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
                      Size: {product.size}
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
                      <p className="text-xs text-slate-400">Stock</p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {product.stock}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => addToCart(product)}
                    disabled={
                      product.stock <= 0 ||
                      (cart.find((item) => item.id === product.id)
                        ?.quantity ?? 0) >= product.stock
                    }
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Plus size={17} />
                    {isInCart ? "Add More" : "Add to Cart"}
                  </button>
                </motion.div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
              <Package
                size={35}
                className="mx-auto text-slate-300"
              />
              <p className="mt-3 font-semibold text-slate-600">
                No products found
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Try another search or category.
              </p>
            </div>
          )}
        </div>

        {/* Cart and Billing */}
        <div className="space-y-5 xl:sticky xl:top-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Cart Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ShoppingCart size={20} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-800">
                    Current Order
                  </h2>
                  <p className="text-xs text-slate-500">
                    {cart.length} different items
                  </p>
                </div>
              </div>

              <button
                onClick={clearCart}
                disabled={cart.length === 0}
                className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear
              </button>
            </div>

            {/* Cart Items */}
            <div className="max-h-[350px] min-h-[180px] space-y-4 overflow-y-auto p-5">
              {cart.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-center">
                  <ShoppingCart
                    size={35}
                    className="text-slate-300"
                  />
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
                            updateQuantity(
                              item.id,
                              item.quantity - 1
                            )
                          }
                          className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
                        >
                          <Minus size={14} />
                        </button>

                        <input
                          type="number"
                          min="0.01"
                          max={item.stock}
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.id, e.target.value)
                          }
                          className="w-14 text-center text-sm font-semibold outline-none"
                        />

                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.quantity + 1
                            )
                          }
                          disabled={item.quantity >= item.stock}
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

            {/* Billing */}
            <div className="space-y-3 border-t border-slate-100 bg-slate-50 p-5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-semibold text-slate-700">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <label
                  htmlFor="discount"
                  className="text-slate-500"
                >
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
                <span className="font-bold text-slate-800">
                  Grand Total
                </span>
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(grandTotal)}
                </span>
              </div>

              {/* Payment Method */}
              <div className="pt-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Payment Method
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      name: "Cash",
                      icon: Banknote,
                    },
                    {
                      name: "Bank",
                      icon: CreditCard,
                    },
                    {
                      name: "Credit",
                      icon: Wallet,
                    },
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

              {/* Paid Amount */}
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
              </div>

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

      {/* Sale Success Modal */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 size={35} />
            </div>

            <h2 className="mt-4 text-center text-xl font-bold text-slate-800">
              Sale Completed!
            </h2>

            <p className="mt-1 text-center text-sm text-slate-500">
              Your sale has been processed successfully.
            </p>

            <div className="mt-6 space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Items</span>
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
                <span className="font-bold text-slate-800">
                  Grand Total
                </span>
                <strong className="text-blue-600">
                  {formatCurrency(completedSale.grandTotal)}
                </strong>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Received</span>
                <strong>{formatCurrency(completedSale.paid)}</strong>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Remaining</span>
                <strong className="text-red-500">
                  {formatCurrency(completedSale.balance)}
                </strong>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method</span>
                <strong>{completedSale.paymentMethod}</strong>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={printInvoice}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Printer size={17} />
                Print
              </button>

              <button
                onClick={() => setCompletedSale(null)}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <X size={17} />
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default POS;