import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import Sidebar from "./Sidebar";

function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex-1 flex flex-col">
        <header className="h-16 flex items-center justify-between px-6 bg-primary text-white shadow">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/10 transition"
            >
              ☰
            </button>
            <h1 className="font-semibold text-lg">Abira Net</h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span>
              {user.nama_lengkap}{" "}
              <span className="px-2 py-0.5 rounded-full bg-accent text-xs ml-1">
                {user.role.toUpperCase()}
              </span>
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded bg-danger text-white text-xs hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;

