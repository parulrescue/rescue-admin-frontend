import { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { logout as logoutApi } from "../api/auth";
import {
  LayoutDashboard,
  Home,
  Users,
  ShieldCheck,
  ClipboardList,
  BookOpen,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Dog,
  MapPin,
} from "lucide-react";

const allNavItems = [
  { to: "/", label: "Dashboard", altLabel: "Home", icon: LayoutDashboard, altIcon: Home, permission: "dashboard_view", alwaysShow: true },
  { to: "/users", label: "User Management", icon: Users, permission: "user_view" },
  { to: "/sub-admins", label: "Sub Admins", icon: ShieldCheck, permission: "sub_admin_view" },
  { to: "/animals", label: "Animals", icon: Dog, permission: "animal_view" },
  { to: "/rescues", label: "Rescues", icon: ClipboardList, permission: "rescue_view" },
  { to: "/to-addresses", label: "To Addresses", icon: MapPin, permission: "rescue_view" },
  { to: "/ledger", label: "Admin Ledger", icon: BookOpen, permission: "__admin_only__" },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, logout, permissions } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = admin?.role === "admin";

  const hasDashboard = isAdmin || permissions.includes("dashboard_view");

  const navItems = allNavItems
    .filter((item) => {
      if (item.alwaysShow) return true;
      if (!item.permission) return true;
      if (item.permission === "__admin_only__") return isAdmin;
      if (isAdmin) return true;
      return permissions.includes(item.permission);
    })
    .map((item) => {
      if (item.alwaysShow && !hasDashboard) {
        return { ...item, label: item.altLabel || item.label, icon: item.altIcon || item.icon };
      }
      return item;
    });

  const handleLogout = async () => {
    try { await logoutApi(); } catch { }
    logout();
    navigate("/login");
  };

  const currentLabel = navItems.find((item) => {
    if (item.to === "/") return location.pathname === "/";
    return location.pathname.startsWith(item.to);
  })?.label || "Dashboard";

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-slate-900">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out fixed h-full z-20 ${isSidebarOpen ? "w-64" : "w-20"
          }`}
      >
        <div className={`p-6 flex items-center gap-3 border-b justify-center border-slate-100  ${isSidebarOpen ? "p-2" : "py-2 p-0"}`}>
          <img src="/logo.jpg" alt="Logo" className={` rounded-xl object-cover flex-shrink-0 ${isSidebarOpen ? "w-24 h-24" : "w-14 h-14"}`} />
          {/* {isSidebarOpen && (
            <span className="font-bold text-xl tracking-tight">AnimalAdmin</span>
          )} */}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${active
                    ? "bg-amber-50 text-amber-700 font-medium"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                <Icon size={20} className={active ? "text-amber-600" : ""} />
                {isSidebarOpen && <span>{label}</span>}
                {isSidebarOpen && active && (
                  <ChevronRight size={16} className="ml-auto" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          />
          <aside className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 md:hidden flex flex-col shadow-2xl">
            <div className="p-6 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img src="/logo.jpg" alt="Logo" className="w-24 h-24 rounded-xl object-cover" />
                <span className="font-bold text-xl tracking-tight">AnimalAdmin</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-900">
                <X size={24} />
              </button>
            </div>
            <nav className="flex-1 py-6 px-4 space-y-2">
              {navItems.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${active
                        ? "bg-amber-50 text-amber-700 font-semibold"
                        : "text-slate-500 hover:bg-slate-50"
                      }`}
                  >
                    <Icon size={22} />
                    <span className="text-lg">{label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ${isSidebarOpen ? "md:ml-64" : "md:ml-20"}`}>
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg md:hidden"
            >
              <Menu size={20} />
            </button>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:block p-2 text-slate-500 hover:bg-slate-50 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold text-slate-800">{currentLabel}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-slate-900">{admin?.full_name || "Admin"}</span>
              <span className="text-xs text-slate-500 capitalize">{admin?.role?.replace("_", " ") || "Admin"}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-100 border-2 border-white shadow-sm flex items-center justify-center text-amber-700 font-bold">
              {admin?.full_name?.[0]?.toUpperCase() || "A"}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
