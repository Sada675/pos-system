import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Warehouse,
  ShoppingBag,
  Users,
  Truck,
  Wallet,
  ChartNoAxesCombined,
  Settings,
  LogOut,
  ChevronLeft,
  Menu
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/" },
  { name: "Point of Sale", icon: ShoppingCart, path: "/pos" },
  { name: "Products", icon: Package, path: "/products" },
  { name: "Categories", icon: Layers, path: "/categories" },
  { name: "Inventory", icon: Warehouse, path: "/inventory" },
  { name: "Purchases", icon: ShoppingBag, path: "/purchases" },
  { name: "Customers", icon: Users, path: "/customers" },
  { name: "Suppliers", icon: Truck, path: "/suppliers" },
  { name: "Expenses", icon: Wallet, path: "/expenses" },
  { name: "Reports", icon: ChartNoAxesCombined, path: "/reports" },
];

function Sidebar({ collapsed, setCollapsed }) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 85 : 260 }}
      transition={{ duration: 0.3 }}
      className="fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-slate-200 bg-white"
    >
      {/* Logo */}
      <div className="flex h-20 items-center justify-between border-b border-slate-100 px-5">

        <div className="flex items-center gap-3 overflow-hidden">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Warehouse size={23} />
          </div>

          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                SteelFlow
              </h1>
              <p className="text-[10px] font-medium tracking-widest text-slate-400">
                POS MANAGEMENT
              </p>
            </div>
          )}

        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:block"
        >
          {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </button>

      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-6">

        {!collapsed && (
          <p className="mb-4 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Main Menu
          </p>
        )}

        <nav className="space-y-1">

          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === "/"}
                title={collapsed ? item.name : ""}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                      : "text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                  }`
                }
              >
                <Icon size={20} className="shrink-0" />

                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}

        </nav>

      </div>

      {/* Bottom */}
      <div className="border-t border-slate-100 p-3">

        <NavLink
          to="/settings"
          title={collapsed ? "Settings" : ""}
          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-500 transition hover:bg-slate-100"
        >
          <Settings size={20} />
          {!collapsed && "Settings"}
        </NavLink>

        <button className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-500 transition hover:bg-red-50">
          <LogOut size={20} />
          {!collapsed && "Logout"}
        </button>

      </div>

    </motion.aside>
  );
}

export default Sidebar;