import { useAuthStore } from "../store/authStore";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const quickLinks = [
  { to: "/users", label: "User Management", permission: "user_view", desc: "View and manage users" },
  { to: "/sub-admins", label: "Sub Admins", permission: "sub_admin_view", desc: "Manage sub-admin accounts" },
  { to: "/animals", label: "Animals", permission: "animal_view", desc: "Manage animal types" },
  { to: "/rescues", label: "Rescues", permission: "rescue_view", desc: "View rescue operations" },
];

export default function Home() {
  const { admin, hasPermission } = useAuthStore();

  const available = quickLinks.filter((l) => hasPermission(l.permission));

  return (
    <div className="max-w-2xl mx-auto py-12 space-y-8">
      <div className="text-center">
        <img src="/logo.jpg" alt="Logo" className="w-24 h-24 rounded-2xl shadow-lg shadow-amber-200 mb-4 mx-auto object-cover" />
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {admin?.full_name || "Admin"}</h1>
        <p className="text-slate-500 mt-1">Select a section to get started.</p>
      </div>

      {available.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {available.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="group bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-amber-700 transition-colors">{link.label}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{link.desc}</p>
                </div>
                <ArrowRight size={18} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
          <p className="text-slate-500">No modules are accessible with your current permissions.</p>
          <p className="text-sm text-slate-400 mt-1">Contact your admin to get access.</p>
        </div>
      )}
    </div>
  );
}
