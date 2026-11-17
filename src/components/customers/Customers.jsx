import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useCustomers } from "../../context/CustomersContext";
import { useSales } from "../../context/SalesContext";

import {
  Users,
  UserPlus,
  Search,
  Phone,
  ShoppingBag,
  Wallet,
  Trash2,
  X,
  Eye,
  Receipt,
  MapPin,
  Mail,
  ChevronRight,
  AlertCircle,
  UserRound,
} from "lucide-react";

import CustomerDetails from "./CustomerDetails";
/* =========================================
   HELPERS
========================================= */

const formatCurrency = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date) => {
  if (!date) return "N/A";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "N/A";

  return parsedDate.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "N/A";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "N/A";

  return parsedDate.toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalizePhone = (phone) => {
  let value = String(phone || "").replace(/\D/g, "");

  if (value.startsWith("0092")) {
    value = `0${value.slice(4)}`;
  } else if (value.startsWith("92")) {
    value = `0${value.slice(2)}`;
  }

  return value;
};

const normalizeName = (name) =>
  String(name || "")
    .trim()
    .toLowerCase();

const escapeHTML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return entities[char];
  });

/* =========================================
   VALIDATION
========================================= */

const validateCustomerName = (name) => {
  const value = String(name || "").trim();

  if (!value) return "Customer name is required.";

  if (value.length < 2) {
    return "Name must contain at least 2 characters.";
  }

  if (value.length > 60) {
    return "Name cannot exceed 60 characters.";
  }

  const nameRegex = /^[\p{L}\p{M}]+(?:[ .'-][\p{L}\p{M}]+)*$/u;

  if (!nameRegex.test(value)) {
    return "Only letters, spaces, dots, apostrophes and hyphens are allowed.";
  }

  return "";
};

const validateCustomerPhone = (phone) => {
  if (!String(phone || "").trim()) return "";

  const normalized = normalizePhone(phone);

  if (!/^03\d{9}$/.test(normalized)) {
    return "Enter a valid Pakistani mobile number (03XXXXXXXXX).";
  }

  return "";
};

/* =========================================
   REUSABLE STAT CARD
========================================= */

function StatCard({ item, index }) {
  const Icon = item.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="group rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {item.title}
          </p>

          <h3 className="mt-3 break-words text-xl font-bold tracking-tight text-slate-800">
            {item.value}
          </h3>

          {item.subtitle && (
            <p className="mt-1.5 text-xs text-slate-400">{item.subtitle}</p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.color}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================
   SECTION HEADING
========================================= */

function SectionHeading({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={20} />
        </div>

        <div>
          <h2 className="font-bold text-slate-800">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>

      {action}
    </div>
  );
}

/* =========================================
   MAIN COMPONENT
========================================= */

function Customers() {
  const { customers = [], addCustomer, deleteCustomer } = useCustomers();

  const { sales = [] } = useSales();

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [errors, setErrors] = useState({
    name: "",
    phone: "",
  });

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  /* =========================================
     CUSTOMER SALES
  ========================================= */

  const getCustomerSales = (customer) => {
    if (!customer) return [];

    const customerPhone = normalizePhone(customer.phone);
    const customerName = normalizeName(customer.name);

    return sales
      .filter((sale) => {
        const salePhone = normalizePhone(sale.customerPhone);
        const saleName = normalizeName(sale.customerName);

        if (customerPhone) {
          return salePhone === customerPhone;
        }

        return !salePhone && customerName === saleName;
      })
      .sort((a, b) => {
        const dateA = new Date(a.saleDate || a.createdAt || 0).getTime();

        const dateB = new Date(b.saleDate || b.createdAt || 0).getTime();

        return dateB - dateA;
      });
  };

  /* =========================================
     CUSTOMER SUMMARY
  ========================================= */

  const getCustomerSummary = (customer) => {
    const customerSales = getCustomerSales(customer);

    const totalPurchases = customerSales.reduce(
      (total, sale) => total + Number(sale.grandTotal || 0),
      0,
    );

    const totalPaid = customerSales.reduce(
      (total, sale) => total + Number(sale.paid || 0),
      0,
    );

    const outstanding = customerSales.reduce(
      (total, sale) => total + Number(sale.balance || 0),
      0,
    );

    const totalItems = customerSales.reduce(
      (total, sale) =>
        total +
        (sale.items || []).reduce(
          (sum, item) => sum + Number(item.quantity || 0),
          0,
        ),
      0,
    );

    return {
      customerSales,
      totalOrders: customerSales.length,
      totalPurchases,
      totalPaid,
      outstanding,
      totalItems,
      lastPurchase:
        customerSales[0]?.saleDate || customerSales[0]?.createdAt || null,
    };
  };

  /* =========================================
     FILTER CUSTOMERS
  ========================================= */

  const filteredCustomers = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    return customers
      .filter((customer) => {
        const searchableText = `
          ${customer.name || ""}
          ${customer.phone || ""}
          ${customer.email || ""}
        `.toLowerCase();

        return searchableText.includes(searchText);
      })
      .sort((a, b) => {
        const dateA = new Date(a.lastPurchase || a.createdAt || 0).getTime();

        const dateB = new Date(b.lastPurchase || b.createdAt || 0).getTime();

        return dateB - dateA;
      });
  }, [customers, search]);

  /* =========================================
     GLOBAL STATS
  ========================================= */

  const totalPurchases = sales.reduce(
    (total, sale) => total + Number(sale.grandTotal || 0),
    0,
  );

  const totalOutstanding = sales.reduce(
    (total, sale) => total + Number(sale.balance || 0),
    0,
  );

  const stats = [
    {
      title: "Total Customers",
      value: customers.length,
      subtitle: "Registered customers",
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Total Purchases",
      value: formatCurrency(totalPurchases),
      subtitle: "Combined purchase value",
      icon: ShoppingBag,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Outstanding Balance",
      value: formatCurrency(totalOutstanding),
      subtitle: "Pending customer payments",
      icon: Wallet,
      color: "bg-orange-50 text-orange-600",
    },
    {
      title: "Total Orders",
      value: sales.length,
      subtitle: "All completed sales",
      icon: Receipt,
      color: "bg-violet-50 text-violet-600",
    },
  ];

  /* =========================================
     FORM HANDLING
  ========================================= */

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      email: "",
      address: "",
    });

    setErrors({
      name: "",
      phone: "",
    });
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === "name") {
      setErrors((prev) => ({
        ...prev,
        name: validateCustomerName(value),
      }));
    }

    if (field === "phone") {
      const phoneError = validateCustomerPhone(value);
      const normalized = normalizePhone(value);

      const duplicate =
        normalized &&
        customers.some(
          (customer) => normalizePhone(customer.phone) === normalized,
        );

      setErrors((prev) => ({
        ...prev,
        phone:
          phoneError ||
          (duplicate ? "This phone number is already registered." : ""),
      }));
    }
  };

  /* =========================================
     SUBMIT CUSTOMER
  ========================================= */

  const handleSubmit = (e) => {
    e.preventDefault();

    const nameError = validateCustomerName(form.name);
    const phoneError = validateCustomerPhone(form.phone);

    const normalizedPhone = normalizePhone(form.phone);

    const phoneExists =
      normalizedPhone &&
      customers.some(
        (customer) => normalizePhone(customer.phone) === normalizedPhone,
      );

    const newErrors = {
      name: nameError,
      phone:
        phoneError ||
        (phoneExists ? "This phone number is already registered." : ""),
    };

    setErrors(newErrors);

    if (newErrors.name || newErrors.phone) return;

    const customerData = {
      ...form,
      name: form.name.trim(),
      phone: normalizedPhone,
      email: form.email.trim(),
      address: form.address.trim(),
    };

    const result = addCustomer(customerData);

    if (!result?.success) {
      alert(result?.message || "Unable to add customer. Please try again.");

      return;
    }

    resetForm();
    setShowModal(false);
  };

  /* =========================================
     CUSTOMER ACTIONS
  ========================================= */

  const openCustomerDetails = (customer) => {
    setSelectedCustomer(customer);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const closeCustomerDetails = () => {
    setSelectedCustomer(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = (e, customer) => {
    e.stopPropagation();

    const confirmed = window.confirm(
      `Are you sure you want to delete ${customer.name}?`,
    );

    if (!confirmed) return;

    deleteCustomer(customer.id);

    if (selectedCustomer?.id === customer.id) {
      setSelectedCustomer(null);
    }
  };

  /* =========================================
     CUSTOMER DETAIL PAGE
  ========================================= */

  if (selectedCustomer) {
    const customer =
      customers.find((item) => item.id === selectedCustomer.id) ||
      selectedCustomer;
    return (
      <CustomerDetails
        customer={customer}
        sales={sales}
        onBack={closeCustomerDetails}
      />
    );
  }

  /* =========================================
     CUSTOMERS LIST PAGE
  ========================================= */

  return (
    <div className="space-y-7 pb-8">
      {/* PAGE HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
            <Users size={15} />
            Customer Management
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-800">
            Customers
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage customer profiles and monitor purchase activity.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700"
        >
          <UserPlus size={18} />
          Add Customer
        </button>
      </div>

      {/* GLOBAL STATS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item, index) => (
          <StatCard key={item.title} item={item} index={index} />
        ))}
      </div>

      {/* CUSTOMERS TABLE */}

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        {/* TABLE HEADER */}

        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 md:flex-row md:items-center">
          <div>
            <h2 className="font-bold text-slate-800">All Customers</h2>

            <p className="mt-1 text-xs text-slate-400">
              View and manage your registered customers
            </p>
          </div>

          <div className="relative w-full md:max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone or email..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </div>
        </div>

        {/* TABLE */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Phone Number</th>
                <th className="px-6 py-4">Orders</th>
                <th className="px-6 py-4">Total Purchases</th>
                <th className="px-6 py-4">Outstanding</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((customer, index) => {
                const summary = getCustomerSummary(customer);

                return (
                  <motion.tr
                    key={customer.id || index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.025 }}
                    onClick={() => openCustomerDetails(customer)}
                    className="cursor-pointer transition hover:bg-blue-50/50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">
                          {customer.name?.charAt(0)?.toUpperCase() || "C"}
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-slate-700">
                            {customer.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {summary.totalOrders > 0
                              ? "Returning customer"
                              : "Registered customer"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Phone size={14} className="text-slate-400" />
                        {customer.phone || "N/A"}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex min-w-9 items-center justify-center rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-600">
                        {summary.totalOrders}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm font-bold text-slate-700">
                      {formatCurrency(summary.totalPurchases)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-bold ${
                          summary.outstanding > 0
                            ? "text-orange-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {formatCurrency(summary.outstanding)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openCustomerDetails(customer);
                          }}
                          title="View Customer"
                          className="rounded-lg bg-blue-50 p-2.5 text-blue-600 transition hover:bg-blue-100"
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          onClick={(e) => handleDelete(e, customer)}
                          title="Delete Customer"
                          className="rounded-lg bg-red-50 p-2.5 text-red-500 transition hover:bg-red-100"
                        >
                          <Trash2 size={17} />
                        </button>

                        <ChevronRight size={18} className="text-slate-300" />
                      </div>
                    </td>
                  </motion.tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <Users size={25} />
                    </div>

                    <h3 className="mt-3 font-semibold text-slate-700">
                      No Customers Found
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      Try another search or add a new customer.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* TABLE FOOTER */}

        <div className="flex flex-col justify-between gap-2 border-t border-slate-100 px-5 py-4 text-xs text-slate-400 sm:flex-row sm:items-center">
          <span>
            Showing {filteredCustomers.length} of {customers.length} customers
          </span>

          <span>Select a customer to view complete purchase history.</span>
        </div>
      </div>

      {/* ADD CUSTOMER MODAL */}

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
          >
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
              onClick={(e) => e.stopPropagation()}
              className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            >
              {/* MODAL HEADER */}

              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                    <UserPlus size={22} />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      Add New Customer
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Enter customer information.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="rounded-lg bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"
                >
                  <X size={19} />
                </button>
              </div>

              {/* FORM */}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* NAME */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Customer Name <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <UserRound
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      value={form.name}
                      maxLength={60}
                      onChange={(e) =>
                        handleFieldChange("name", e.target.value)
                      }
                      onBlur={() =>
                        setErrors((prev) => ({
                          ...prev,
                          name: validateCustomerName(form.name),
                        }))
                      }
                      placeholder="Enter full name"
                      className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition focus:ring-4 ${
                        errors.name
                          ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-50"
                          : "border-slate-200 focus:border-blue-500 focus:ring-blue-50"
                      }`}
                    />
                  </div>

                  {errors.name ? (
                    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
                      <AlertCircle size={13} />
                      {errors.name}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-slate-400">
                      English and Urdu names are supported.
                    </p>
                  )}
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
                      value={form.phone}
                      maxLength={16}
                      onChange={(e) =>
                        handleFieldChange("phone", e.target.value)
                      }
                      onBlur={() => {
                        const phoneError = validateCustomerPhone(form.phone);

                        const normalized = normalizePhone(form.phone);

                        const duplicate =
                          normalized &&
                          customers.some(
                            (customer) =>
                              normalizePhone(customer.phone) === normalized,
                          );

                        setErrors((prev) => ({
                          ...prev,
                          phone:
                            phoneError ||
                            (duplicate
                              ? "This phone number is already registered."
                              : ""),
                        }));
                      }}
                      placeholder="03XX XXXXXXX"
                      className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none transition focus:ring-4 ${
                        errors.phone
                          ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-50"
                          : "border-slate-200 focus:border-blue-500 focus:ring-blue-50"
                      }`}
                    />
                  </div>

                  {errors.phone ? (
                    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
                      <AlertCircle size={13} />
                      {errors.phone}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-slate-400">
                      Pakistani mobile number. Example: 03001234567
                    </p>
                  )}
                </div>

                {/* EMAIL */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email Address
                  </label>

                  <div className="relative">
                    <Mail
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="example@email.com"
                      className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                </div>

                {/* ADDRESS */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Address
                  </label>

                  <div className="relative">
                    <MapPin
                      size={17}
                      className="absolute left-3 top-3.5 text-slate-400"
                    />

                    <textarea
                      rows="3"
                      value={form.address}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      placeholder="Enter customer address"
                      className="w-full resize-none rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                </div>

                {/* BUTTONS */}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={!!errors.name || !!errors.phone}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <UserPlus size={17} />
                    Save Customer
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Customers;
