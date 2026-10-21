
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  CheckSquare,
  Folder,
  Home as HomeIcon,
  Users,
  UsersRound,
  Hexagon,
  LogOut,
  Sparkles,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", icon: HomeIcon, path: "/home" },
  { name: "Users", icon: UsersRound, path: "/home/users" },
  { name: "Speciality", icon: Sparkles, path: "/home/speciality" },
  { name: "Teams", icon: Users, path: "/home/teams" },
  { name: "Projects", icon: Folder },
  { name: "Tasks", icon: CheckSquare },
  { name: "Organization", icon: Hexagon },
];

const formatRole = (role = "EMPLOYEE") =>
  role
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const AdminSidebar = ({ user = {}, activeNav, onNavigate }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  return (
    <aside className="flex w-[260px] shrink-0 flex-col bg-[#0e2038] px-4 py-6 text-white max-md:w-[76px] max-md:px-2">
      {/* Logo */}
      <div className="mb-10 flex items-center gap-3 px-3">
        <Activity
          className="h-9 w-9 shrink-0 text-blue-400"
          strokeWidth={2.7}
        />

        <span className="text-[27px] font-bold tracking-tight max-md:hidden">
          FlowTenant
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navigation.map(({ name, icon: Icon, path }) => (
          <button
            key={name}
            type="button"
            onClick={() => {
              onNavigate?.(name);
              if (path) navigate(path);
            }}
            title={name}
            className={`flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-[17px] font-medium transition-colors max-md:justify-center max-md:px-2 ${
              activeNav === name
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-200 hover:bg-slate-700/70 hover:text-white"
            }`}
          >
            <Icon size={22} strokeWidth={1.9} />
            <span className="max-md:hidden">{name}</span>
          </button>
        ))}
      </nav>

      {/* Logged-in user */}
      <div className="mt-8 border-t border-slate-700 pt-5">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700">
            <UsersRound size={27} />
          </div>

          <div className="min-w-0 max-md:hidden">
            <p className="truncate font-semibold">
              {user.name || "User"}
            </p>

            <p className="text-sm text-slate-400">
              {formatRole(user.role)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          title="Logout"
          className="mt-5 flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-[17px] font-medium text-slate-200 transition-colors hover:bg-slate-700/70 hover:text-white max-md:justify-center max-md:px-2"
        >
          <LogOut size={22} strokeWidth={1.9} />
          <span className="max-md:hidden">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
