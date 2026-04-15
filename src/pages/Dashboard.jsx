import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "../api/dashboard";
import { useAuthStore } from "../store/authStore";
import { Link } from "react-router-dom";
import { Users, ClipboardList, TrendingUp, DollarSign, ArrowUpRight } from "lucide-react";

const statusColors = {
  pending: "bg-amber-50 text-amber-700",
  in_progress: "bg-blue-50 text-blue-700",
  completed: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-700",
};

export default function Dashboard() {
  const admin = useAuthStore((s) => s.admin);
  const isAdmin = admin?.role === "admin";
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardStats,
  });

  const stats = data?.data?.data || {};

  const statCards = [
    { label: "Total Users", value: stats.total_users ?? "—", icon: Users, color: "bg-blue-500" },
    { label: "Total Rescues", value: stats.total_rescues ?? "—", icon: ClipboardList, color: "bg-amber-500" },
    { label: "Today's Rescues", value: stats.today_rescues ?? "—", icon: TrendingUp, color: "bg-indigo-500" },
    ...(isAdmin ? [{ label: "Net Balance", value: stats.net_balance != null ? `₹${Number(stats.net_balance).toLocaleString()}` : "—", icon: DollarSign, color: "bg-rose-500" }] : []),
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Welcome back, {admin?.full_name || "Admin"}</h2>
        <p className="text-slate-500">Here's what's happening with your animal rescue platform today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${card.color} text-white`}>
                <card.icon size={24} />
              </div>
              <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full text-amber-600 bg-amber-50">
                <ArrowUpRight size={14} />
                Active
              </div>
            </div>
            <div className="text-slate-500 text-sm font-medium">{card.label}</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{card.value}</div>
          </div>
        ))}
      </div>

      <div className={`grid grid-cols-1 ${isAdmin ? "lg:grid-cols-2" : ""} gap-6`}>
        {/* Recent Rescues */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Recent Rescues</h3>
            <Link to="/rescues" className="text-sm text-amber-600 hover:text-amber-700 font-medium">View all</Link>
          </div>
          {(stats.recent_rescues || []).length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <ClipboardList size={24} className="text-slate-400" />
              </div>
              <p className="text-slate-500 text-sm">No rescues yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recent_rescues.map((r) => (
                <Link key={r.id} to={`/rescues/${r.id}`} className="flex items-center justify-between hover:bg-slate-50 -mx-3 px-3 py-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-400">
                      <ClipboardList size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-900">
                        <span className="font-bold">#{r.id}</span> — {r.animal_type}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[r.status] || ""}`}>
                    {r.status?.replace("_", " ")}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Ledger — admin only */}
        {isAdmin && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Recent Transactions</h3>
            <Link to="/ledger" className="text-sm text-amber-600 hover:text-amber-700 font-medium">View all</Link>
          </div>
          {(!stats.recent_ledger || stats.recent_ledger.length === 0) ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <DollarSign size={24} className="text-slate-400" />
              </div>
              <p className="text-slate-500 text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recent_ledger.map((l) => (
                <div key={l.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${l.type === "credit" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"}`}>
                      <DollarSign size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{l.category || "Uncategorized"}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{l.description || new Date(l.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className={`font-bold ${l.type === "credit" ? "text-amber-600" : "text-red-600"}`}>
                    {l.type === "credit" ? "+" : "-"}₹{Number(l.amount).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
