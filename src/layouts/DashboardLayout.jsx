import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";

function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />

          <div className="relative h-full w-[260px]">
            <Sidebar collapsed={false} setCollapsed={() => {}} />

            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-6 rounded-lg bg-white p-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main
        className={`min-h-screen transition-all duration-300 ${
          collapsed ? "lg:ml-[85px]" : "lg:ml-[260px]"
        }`}
      >
        <Navbar setMobileOpen={setMobileOpen} />

        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
