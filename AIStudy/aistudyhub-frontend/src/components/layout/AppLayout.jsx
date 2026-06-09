import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { clearAuthStorage } from "../../apis/api";
import "./AppLayout.css";

const NAV_ITEMS = [
  { to: "/dashboard", icon: "⊞", label: "Tổng quan" },
  { to: "/documents", icon: "📁", label: "Tài liệu" },
  { to: "/chatbot", icon: "💬", label: "AI Chatbot" },
  { to: "/forum", icon: "🗣️", label: "Diễn đàn" },
  { to: "/courses", icon: "🎓", label: "Khóa học" },
];

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Nếu có gọi API logout thì gọi ở đây
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuthStorage();
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className={`app-layout ${collapsed ? "layout-collapsed" : ""}`}>
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo-icon">📋</div>
          {!collapsed && (
            <span className="sidebar-logo-text">AI Study Hub</span>
          )}
          <button
            className="sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Mở rộng" : "Thu gọn"}
          >
            {collapsed ? "›" : "‹"}
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-link${isActive ? " sidebar-link--active" : ""}`
              }
              title={collapsed ? item.label : undefined}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {!collapsed && (
                <span className="sidebar-link-label">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {!collapsed && (
            <div className="sidebar-storage">
              <div className="storage-row">
                <span className="storage-label">Dung lượng</span>
                <span className="storage-value">2.4 / 5 GB</span>
              </div>
              <div className="storage-track">
                <div className="storage-fill" style={{ width: "48%" }} />
              </div>
            </div>
          )}

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `sidebar-link${isActive ? " sidebar-link--active" : ""}`
            }
            title={collapsed ? "Cài đặt" : undefined}
          >
            <span className="sidebar-link-icon">⚙️</span>
            {!collapsed && <span className="sidebar-link-label">Cài đặt</span>}
          </NavLink>

          <button
            className="sidebar-link sidebar-logout"
            onClick={handleLogout}
            title={collapsed ? "Đăng xuất" : undefined}
          >
            <span className="sidebar-link-icon">🚪</span>
            {!collapsed && (
              <span className="sidebar-link-label">Đăng xuất</span>
            )}
          </button>
        </div>
      </aside>

      <main className="app-main">{children}</main>
    </div>
  );
}
