import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PrivateRoute from "./components/PrivateRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Users from "./pages/Users";
import SubAdmins from "./pages/SubAdmins";
// Roles page removed — permissions assigned directly to sub-admins
import Animals from "./pages/Animals";
import Rescues from "./pages/Rescues";
import RescueDetail from "./pages/RescueDetail";
import ToAddresses from "./pages/ToAddresses";
import Ledger from "./pages/Ledger";
import { useAuthStore } from "./store/authStore";

function DashboardOrHome() {
  const { hasPermission } = useAuthStore();
  return hasPermission("dashboard_view") ? <Dashboard /> : <Home />;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<DashboardOrHome />} />
              <Route path="/users" element={<Users />} />
              <Route path="/sub-admins" element={<SubAdmins />} />
              {/* Roles page removed — permissions assigned directly to sub-admins */}
              <Route path="/animals" element={<Animals />} />
              <Route path="/rescues" element={<Rescues />} />
              <Route path="/rescues/:id" element={<RescueDetail />} />
              <Route path="/to-addresses" element={<ToAddresses />} />
              <Route path="/ledger" element={<Ledger />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  );
}
