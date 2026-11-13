import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useCustomers } from "../context/CustomersContext";

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
} from "lucide-react";

const formatCurrency = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK")}`;

function Customers() {
  const { customers, addCustomer, deleteCustomer } = useCustomers();

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) =>
      `${customer.name} ${customer.phone}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  }, [customers, search]);

  const totalPurchases = customers.reduce(
    (total, customer) => total + Number(customer.totalPurchases || 0),
    0,
  );

  const totalOutstanding = customers.reduce(
    (total, customer) => total + Number(customer.outstanding || 0),
    0,
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Please enter customer name.");
      return;
    }

    if (form.phone.trim()) {
      const exists = customers.some(
        (customer) => customer.phone === form.phone.trim(),
      );

      if (exists) {
        alert("Customer with this phone number already exists.");
        return;
      }
    }

    const success = addCustomer(form);

    if (!success) return;

    setForm({
      name: "",
      phone: "",
      email: "",
      address: "",
    });

    setShowModal(false);
  };

  const stats = [
    {
      title: "Total Customers",
      value: customers.length,
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Total Purchases",
      value: formatCurrency(totalPurchases),
      icon: ShoppingBag,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Outstanding Balance",
      value: formatCurrency(totalOutstanding),
      icon: Wallet,
      color: "bg-orange-50 text-orange-600",
    },
  ];

  return (
    <div className="space-y-7">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Customer Management
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-800">Customers</h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your customers and their purchase records.
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

      {/* STATISTICS */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{item.title}</p>

                  <h2 className="mt-2 text-2xl font-bold text-slate-800">
                    {item.value}
                  </h2>
                </div>

                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.color}`}
                >
                  <Icon size={23} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* CUSTOMER TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center">
          <div>
            <h2 className="font-bold text-slate-800">All Customers</h2>

            <p className="mt-1 text-xs text-slate-400">
              {customers.length} registered customers
            </p>
          </div>

          <div className="relative w-full md:max-w-xs">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Total Orders</th>
                <th className="px-6 py-4">Total Purchases</th>
                <th className="px-6 py-4">Outstanding</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="transition hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>

                      <span className="font-semibold text-slate-700">
                        {customer.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-500">
                    {customer.phone || "N/A"}
                  </td>

                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                    {customer.totalOrders}
                  </td>

                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                    {formatCurrency(customer.totalPurchases)}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`text-sm font-bold ${
                        customer.outstanding > 0
                          ? "text-red-500"
                          : "text-emerald-600"
                      }`}
                    >
                      {formatCurrency(customer.outstanding)}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        title="View Details"
                        className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              "Are you sure you want to delete this customer?",
                            )
                          ) {
                            deleteCustomer(customer.id);
                          }
                        }}
                        title="Delete Customer"
                        className="rounded-lg bg-red-50 p-2 text-red-500 hover:bg-red-100"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="py-14 text-center text-sm text-slate-400"
                  >
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD CUSTOMER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Add New Customer
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter customer information.
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                {
                  name: "name",
                  label: "Customer Name *",
                  placeholder: "Enter full name",
                },
                {
                  name: "phone",
                  label: "Phone Number",
                  placeholder: "03XX XXXXXXX",
                },
                {
                  name: "email",
                  label: "Email Address",
                  placeholder: "example@email.com",
                },
                {
                  name: "address",
                  label: "Address",
                  placeholder: "Enter address",
                },
              ].map((field) => (
                <div key={field.name}>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {field.label}
                  </label>

                  <input
                    type="text"
                    value={form[field.name]}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [field.name]: e.target.value,
                      })
                    }
                    placeholder={field.placeholder}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>
              ))}

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Save Customer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER DETAILS MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                Customer Details
              </h2>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-lg bg-slate-100 p-2"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-2xl font-bold text-blue-600">
                {selectedCustomer.name.charAt(0)}
              </div>

              <h3 className="mt-3 text-lg font-bold text-slate-800">
                {selectedCustomer.name}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                <Phone size={14} className="mr-1 inline" />
                {selectedCustomer.phone || "No phone number"}
              </p>
            </div>

            <div className="mt-6 space-y-4 rounded-xl bg-slate-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Orders</span>
                <strong>{selectedCustomer.totalOrders}</strong>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Purchases</span>
                <strong>
                  {formatCurrency(selectedCustomer.totalPurchases)}
                </strong>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Paid</span>
                <strong className="text-emerald-600">
                  {formatCurrency(selectedCustomer.totalPaid)}
                </strong>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Outstanding</span>
                <strong className="text-red-500">
                  {formatCurrency(selectedCustomer.outstanding)}
                </strong>
              </div>
            </div>

            <div className="mt-5">
              <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-800">
                <Receipt size={18} />
                Purchase Invoices
              </h3>

              <div className="space-y-2">
                {selectedCustomer.invoices?.map((invoice) => (
                  <div
                    key={invoice}
                    className="rounded-lg border border-slate-100 p-3 text-sm font-medium text-blue-600"
                  >
                    {invoice}
                  </div>
                ))}

                {selectedCustomer.invoices?.length === 0 && (
                  <p className="text-sm text-slate-400">No purchases yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;
