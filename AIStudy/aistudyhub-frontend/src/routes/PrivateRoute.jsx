import { Navigate } from "react-router-dom";

// Chuẩn hoá role về dạng thống nhất: "admin" / "ROLE_ADMIN" / "Admin" đều thành "ADMIN"
// (Spring Security ở backend hay trả role kèm tiền tố ROLE_)
function normalizeRole(role) {
  return String(role || "")
    .replace("ROLE_", "")
    .toUpperCase();
}

// Component gác cổng: bọc quanh 1 page, chặn truy cập nếu chưa đăng nhập hoặc không đúng role.
// Lưu ý: đây chỉ là chặn ở UI (đọc localStorage), không thay thế cho việc kiểm tra quyền ở backend.
export default function PrivateRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("accessToken");
  const role = normalizeRole(localStorage.getItem("role"));

  // allowedRoles là tuỳ chọn — không truyền nghĩa là chỉ cần đăng nhập, không giới hạn role
  const normalizedAllowedRoles = Array.isArray(allowedRoles)
    ? allowedRoles.map(normalizeRole)
    : null;

  // Chưa có token => chưa đăng nhập, đá về trang login
  // "replace" để không lưu lại trang bị chặn trong history (bấm back không quay lại được)
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Có đăng nhập nhưng role không nằm trong danh sách cho phép => đá về dashboard (không phải login)
  if (normalizedAllowedRoles && !normalizedAllowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Hợp lệ => render page thật sự được truyền vào
  return children;
}
