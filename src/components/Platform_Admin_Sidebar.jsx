
import React from "react";
import { LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

const navigationItems = [
  { name: "Dashboard", path: "/platform/dashboard" },
  { name: "Organizations", path: "/platform/organizations" },
  { name: "Invitations", path: "/platform/invitations" },
  { name: "Users", path: "/platform/users" },
];

const Platform_Admin_Sidebar = ({ activeItem = "Organizations" }) => {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");

  let user = {};
  try {
    user = storedUser ? JSON.parse(storedUser) : {};
  } catch {
    user = {};
  }

  const initial = user.name?.charAt(0)?.toUpperCase() || "A";

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col bg-slate-900 text-white">
      {/* Brand */}
      <div className="px-7 py-6">
        <h1 className="text-xl font-bold tracking-tight">
          FlowTenant
        </h1>
      </div>

      {/* Navigation */}
      <nav className="mt-2 flex-1 space-y-1 px-4">
        {navigationItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `block rounded-xl px-3.5 py-3 text-sm font-medium transition ${
                activeItem === item.name || isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Logged-in user */}
      <div className="border-t border-slate-800 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-600 text-sm font-semibold">
            {initial}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {user.name || "Admin"}
            </p>
            <p className="text-xs text-slate-400">
              {user.role === "PLATFORM_ADMIN"
                ? "Platform Admin"
                : user.role || "Administrator"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Platform_Admin_Sidebar;
