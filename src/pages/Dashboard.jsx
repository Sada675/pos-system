import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  MoreHorizontal,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import StatCard from "../components/StatCard";

const salesData = [
  { month: "Jan", sales: 35000 },
  { month: "Feb", sales: 48000 },
  { month: "Mar", sales: 42000 },
  { month: "Apr", sales: 65000 },
  { month: "May", sales: 55000 },
  { month: "Jun", sales: 85000 },
  { month: "Jul", sales: 72000 },
  { month: "Aug", sales: 98000 },
  { month: "Sep", sales: 88000 },
  { month: "Oct", sales: 115000 },
  { month: "Nov", sales: 105000 },
  { month: "Dec", sales: 135000 },
];

const transactions = [
  {
    id: "#INV-1001",
    customer: "Ahmed Khan",
    product: "Steel Rod 12mm",
    amount: "Rs. 45,000",
    status: "Paid",
  },
  {
    id: "#INV-1002",
    customer: "Usman Ali",
    product: "Steel Pipe 2 inch",
    amount: "Rs. 28,000",
    status: "Pending",
  },
  {
    id: "#INV-1003",
    customer: "Bilal Ahmad",
    product: "Steel Sheet",
    amount: "Rs. 62,000",
    status: "Paid",
  },
  {
    id: "#INV-1004",
    customer: "Hassan Shah",
    product: "Steel Angle",
    amount: "Rs. 19,500",
    status: "Pending",
  },
];

function Dashboard() {
  // Navigation function
  const navigate = useNavigate();

  return (
    <div className="space-y-8">

      {/* Page Heading */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Dashboard Overview
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor your steel business performance.
          </p>
        </div>

        {/* New Sale Button */}
        <button
          onClick={() => navigate("/pos")}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
        >
          + New Sale
        </button>
      </motion.div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Total Revenue"
          value="Rs. 845,000"
          icon={DollarSign}
          change="+12.5%"
          color="bg-blue-50 text-blue-600"
        />

        <StatCard
          title="Total Sales"
          value="248"
          icon={ShoppingCart}
          change="+8.2%"
          color="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          title="Total Products"
          value="156"
          icon={Package}
          change="+4.5%"
          color="bg-orange-50 text-orange-600"
        />

        <StatCard
          title="Total Customers"
          value="384"
          icon={Users}
          change="+10.8%"
          color="bg-purple-50 text-purple-600"
        />

      </div>

      {/* Chart and Summary */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Sales Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-2 md:p-6"
        >

          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-800">
                Sales Overview
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Monthly revenue performance
              </p>
            </div>

            <button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600">
              This Year
            </button>
          </div>

          <div className="h-[280px] w-full">

            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>

                <defs>
                  <linearGradient
                    id="salesGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#2563eb"
                      stopOpacity={0.25}
                    />

                    <stop
                      offset="95%"
                      stopColor="#2563eb"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#eef2f7"
                />

                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  tickFormatter={(value) => `${value / 1000}k`}
                />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fill="url(#salesGradient)"
                  animationDuration={1500}
                />

              </AreaChart>
            </ResponsiveContainer>

          </div>
        </motion.div>

        {/* Stock Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
        >

          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800">
              Stock Summary
            </h2>

            <MoreHorizontal className="text-slate-400" size={20} />
          </div>

          <p className="mt-2 text-xs text-slate-400">
            Current inventory status
          </p>

          <div className="mt-8 space-y-7">

            {[
              {
                name: "Steel Rods",
                percentage: 75,
                color: "bg-blue-600",
              },
              {
                name: "Steel Pipes",
                percentage: 60,
                color: "bg-emerald-500",
              },
              {
                name: "Steel Sheets",
                percentage: 35,
                color: "bg-orange-500",
              },
              {
                name: "Steel Angles",
                percentage: 85,
                color: "bg-purple-500",
              },
            ].map((item) => (
              <div key={item.name}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium text-slate-600">
                    {item.name}
                  </span>

                  <span className="font-bold text-slate-800">
                    {item.percentage}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}

          </div>

          <button
            onClick={() => navigate("/inventory")}
            className="mt-8 w-full rounded-xl bg-slate-50 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            View Inventory
          </button>

        </motion.div>

      </div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
      >

        <div className="flex items-center justify-between border-b border-slate-100 p-5 md:p-6">

          <div>
            <h2 className="font-bold text-slate-800">
              Recent Transactions
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Latest sales from your store
            </p>
          </div>

          <button
            onClick={() => navigate("/reports")}
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            View All
          </button>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[650px] text-left">

            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Invoice</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">

              {transactions.map((item) => (
                <tr
                  key={item.id}
                  className="transition hover:bg-slate-50"
                >

                  <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                    {item.id}
                  </td>

                  <td className="px-6 py-4 text-sm font-medium text-slate-700">
                    {item.customer}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-500">
                    {item.product}
                  </td>

                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                    {item.amount}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status === "Paid"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-orange-50 text-orange-600"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </motion.div>

    </div>
  );
}

export default Dashboard;
