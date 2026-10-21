
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles }) => {
  const location = useLocation();

  const token = localStorage.getItem("accessToken");
  const storedUser = localStorage.getItem("user");

  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  // Not logged in
  if (!token || !user) {
    return (
      <Navigate
        to="/"
        replace
        state={{ from: location }}
      />
    );
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "PLATFORM_ADMIN") {
      return <Navigate to="/platform/organizations" replace />;
    }

    if (
      ["ORGANIZATION_ADMIN", "MANAGER", "EMPLOYEE"].includes(user.role)
    ) {
      return <Navigate to="/home" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
