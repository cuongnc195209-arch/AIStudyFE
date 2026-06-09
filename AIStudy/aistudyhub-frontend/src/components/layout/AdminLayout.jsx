import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { logout as logoutApi } from "../../apis/authApi";
import { clearAuthStorage } from "../../apis/api";
import "./AdminLayout.css";

const NAV_ITEMS = [
  { id: "overview", icon: "📊", label: "Tổng quan" },
  { id: "users", icon: "👥", label: "Người dùng" },
  { id: "documents", icon: "📁", label: "Tài liệu" },
  { id: "forum", icon: "🚩", label: "Kiểm duyệt Forum" },
  { id: "stats", icon: "📈", label: "Thống kê" },
  { id: "config", icon: "⚙️", label: "Cấu hình hệ thống" },
];

export default function AdminLayout({ activeSection, onNavigate, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");

    try {
      if (refreshToken) {
        await logoutApi({ refreshToken });
      }
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      clearAuthStorage();
      navigate("/login", { replace: true });
    }
  };

  return (
    <div
      className={`admin-layout${collapsed ? " admin-layout--collapsed" : ""}`}
    >
      <aside className="admin-sidebar">
        <div className="admin-sidebar-head">
          <div className="admin-logo-icon">📋</div>
          {!collapsed && (
            <div className="admin-logo-text">
              <span className="admin-logo-name">AI Study Hub</span>
              <span className="admin-badge">ADMIN</span>
            </div>
          )}
          <button
            className="admin-collapse-btn"
            onClick={() => setCollapsed((p) => !p)}
            title={collapsed ? "Mở rộng" : "Thu gọn"}
          >
            {collapsed ? "›" : "‹"}
          </button>
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`admin-nav-btn${
                activeSection === item.id ? " admin-nav-btn--active" : ""
              }`}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {!collapsed && (
                <span className="admin-nav-label">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <NavLink
            to="/dashboard"
            className="admin-nav-btn"
            title={collapsed ? "Về trang User" : undefined}
          >
            <span className="admin-nav-icon">↩️</span>
            {!collapsed && (
              <span className="admin-nav-label">Về trang User</span>
            )}
          </NavLink>

          <button
            className="admin-nav-btn admin-logout-btn"
            onClick={handleLogout}
            title={collapsed ? "Đăng xuất" : undefined}
          >
            <span className="admin-nav-icon">🚪</span>
            {!collapsed && <span className="admin-nav-label">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  );
}
