import {
  Search,
  Bell,
  ChevronDown,
  Menu
} from "lucide-react";

function Navbar({ setMobileOpen }) {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl md:px-8">

      {/* Left */}
      <div className="flex items-center gap-3">

        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu size={22} />
        </button>

        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Welcome Back!
          </h2>
          <p className="hidden text-xs text-slate-400 sm:block">
            Here's what's happening with your business today.
          </p>
        </div>

      </div>

      {/* Right */}
      <div className="flex items-center gap-3">

        {/* Search */}
        <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
          <Search size={17} className="text-slate-400" />

          <input
            type="text"
            placeholder="Search anything..."
            className="w-40 bg-transparent text-sm outline-none lg:w-52"
          />
        </div>

        {/* Notifications */}
        <button className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600">
          <Bell size={19} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {/* Profile */}
        <div className="flex cursor-pointer items-center gap-2 border-l border-slate-200 pl-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700">
            A
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-800">
              Admin User
            </p>
            <p className="text-xs text-slate-400">
              Administrator
            </p>
          </div>

          <ChevronDown size={16} className="hidden text-slate-400 sm:block" />

        </div>

      </div>

    </header>
  );
}

export default Navbar;