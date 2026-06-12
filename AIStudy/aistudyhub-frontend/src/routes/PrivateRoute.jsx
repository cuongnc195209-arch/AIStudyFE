import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("accessToken");

  const storedRole = localStorage.getItem("role");
  const role = storedRole ? storedRole.replace("ROLE_", "").toUpperCase() : "";

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const normalizedAllowedRoles = allowedRoles.map((r) =>
      r.replace("ROLE_", "").toUpperCase(),
    );

    if (!normalizedAllowedRoles.includes(role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}
