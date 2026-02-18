import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type SidebarProps = {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
};

type MenuItem = {
  to: string;
  label: string;
  icon: string;
};

const adminMenu: MenuItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/maps", label: "View Maps", icon: "map" },
  { to: "/pelanggan", label: "Kelola Pelanggan", icon: "people" },
  { to: "/paket", label: "Kelola Paket", icon: "inventory" },
  { to: "/users", label: "Kelola User", icon: "manage_accounts" },
  { to: "/upload-pembayaran", label: "Upload Pembayaran", icon: "upload" },
  { to: "/bts", label: "Kelola BTS", icon: "cell_tower" },
];

const pegawaiMenu: MenuItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/maps", label: "View Maps", icon: "map" },
  { to: "/upload-pembayaran", label: "Upload Pembayaran", icon: "upload" },
];

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const { user } = useAuth();
  if (!user) return null;

  const menu = user.role === "admin" ? adminMenu : pegawaiMenu;

  return (
    <aside
      className={`bg-primary text-white flex flex-col transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary font-bold">
              A
            </div>
            <div className="text-sm font-semibold leading-tight">
              Abira Net
              <div className="text-[11px] text-white/70">Projek Rumah</div>
            </div>
          </div>
        )}
        <button
          className="hidden md:inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 transition"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>
      <nav className="flex-1 mt-4 space-y-1">
        {menu.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-accent text-white"
                  : "text-white/80 hover:bg-white/10"
              }`
            }
          >
            <span className="material-icons text-base">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

