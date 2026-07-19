import { Navigate } from "react-router-dom";

function normalizeRole(role) {
  return String(role || "")
    .replace("ROLE_", "")
    .toUpperCase();
}

export default function PrivateRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("accessToken");
  const role = normalizeRole(localStorage.getItem("role"));

  const normalizedAllowedRoles = Array.isArray(allowedRoles)
    ? allowedRoles.map(normalizeRole)
    : null;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (normalizedAllowedRoles && !normalizedAllowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
