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
  Menu,
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
      className="fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-white/10 bg-[#123c3a]"
    >
      {/* Logo */}
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d1e9dc] text-[#123c3a] shadow-sm">
            <Warehouse size={23} />
          </div>

          {!collapsed && (
            <div>
              <h1 className="text-base font-bold text-white">
                Yarhussain Steel
              </h1>

              <p className="text-[10px] font-medium tracking-widest text-[#a9c8b8]">
                POS MANAGEMENT
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden rounded-lg p-2 text-[#b5cec2] transition hover:bg-white/10 hover:text-white lg:block"
        >
          {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-6">
        {!collapsed && (
          <p className="mb-4 px-3 text-[11px] font-semibold uppercase tracking-widest text-[#8eafa0]">
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
                      ? "bg-[#d1e9dc] text-[#123c3a] shadow-md shadow-black/10"
                      : "text-[#d5e5de] hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={20}
                      className={`shrink-0 ${
                        isActive
                          ? "text-[#123c3a]"
                          : "text-[#a9c8b8] group-hover:text-white"
                      }`}
                    />

                    {!collapsed && <span>{item.name}</span>}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10 p-3">
        <NavLink
          to="/settings"
          title={collapsed ? "Settings" : ""}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
              isActive
                ? "bg-[#d1e9dc] text-[#123c3a]"
                : "text-[#d5e5de] hover:bg-white/10 hover:text-white"
            }`
          }
        >
          <Settings size={20} />
          {!collapsed && "Settings"}
        </NavLink>

        <button className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#f0aaa2] transition hover:bg-red-400/10 hover:text-[#ffb8af]">
          <LogOut size={20} />
          {!collapsed && "Logout"}
        </button>
      </div>
    </motion.aside>
  );
}

export default Sidebar;
