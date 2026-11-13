import { Search, Bell, ChevronDown, Menu } from "lucide-react";

function Navbar({ setMobileOpen }) {
  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/[0.08] bg-[#123c3a] px-4 md:px-7">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-xl border border-white/10 bg-white/[0.06] p-2.5 text-[#d5e8df] transition-all hover:bg-white/10 hover:text-white lg:hidden"
        >
          <Menu size={20} />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-white">
              Welcome Back!
            </h2>

            <span className="hidden rounded-full bg-[#d5a94f]/15 px-2 py-0.5 text-[10px] font-semibold text-[#e7c477] sm:inline-block">
              ADMIN
            </span>
          </div>

          <p className="mt-0.5 text-xs text-[#a8c5b9]">
            Here's what's happening with your business today.
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden h-10 items-center gap-2.5 rounded-xl border border-white/10 bg-white px-3.5 transition-all duration-200 focus-within:border-[#9bc9b2]/50 focus-within:ring-2 focus-within:ring-[#9bc9b2]/10 md:flex">
          <Search size={17} className="shrink-0 text-[#91b8a5]" />

          <input
            type="text"
            placeholder="Search anything..."
            className="w-40 bg-transparent text-[13px] text-white outline-none placeholder:text-[#789b8b] lg:w-52"
          />

          <span className="hidden rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-[#789b8b] lg:block">
            /
          </span>
        </div>

        {/* Mobile Search */}
        <button className="rounded-xl border border-white/10 bg-white/[0.06] p-2.5 text-[#c5ddd1] transition hover:bg-white/10 md:hidden">
          <Search size={19} />
        </button>

        {/* Notifications */}
        <button className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-[#c5ddd1] transition-all duration-200 hover:border-[#9bc9b2]/30 hover:bg-[#9bc9b2]/10 hover:text-white">
          <Bell size={19} />

          <span className="absolute right-[9px] top-[8px] h-2 w-2 rounded-full border-2 border-[#123c3a] bg-[#e7b85c]" />
        </button>

        {/* Profile */}
        <div className="flex cursor-pointer items-center gap-2.5 border-l border-white/10 pl-3 sm:pl-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#c5e3d3]/20 bg-gradient-to-br from-[#d7eee0] to-[#a5cbb5] text-sm font-bold text-[#123c3a] shadow-sm">
            A
          </div>

          <div className="hidden sm:block">
            <p className="text-[13px] font-semibold text-white">Admin User</p>

            <p className="mt-0.5 text-[11px] text-[#91b8a5]">Administrator</p>
          </div>

          <ChevronDown
            size={16}
            className="hidden text-[#91b8a5] transition-transform group-hover:text-white sm:block"
          />
        </div>
      </div>
    </header>
  );
}

export default Navbar;
