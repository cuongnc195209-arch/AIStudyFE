import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthStorage } from "../../apis/api";
import "./AdminLayout.css";

// 6 mục menu admin — mỗi id khớp với 1 key trong SECTION_MAP của AdminDashboardPage.jsx
// Lưu ý: comment "tạm ẩn" ở mục config đã lỗi thời — mục này thực tế KHÔNG bị ẩn, vẫn hiện bình thường
const NAV_ITEMS = [
  { id: "overview", icon: "📊", label: "Tổng quan" },
  { id: "users", icon: "👥", label: "Người dùng" },
  { id: "documents", icon: "📁", label: "Tài liệu" },
  { id: "reports", icon: "🚩", label: "Báo cáo" },
  { id: "chat", icon: "💬", label: "Chat AI" },
  { id: "stats", icon: "📈", label: "Thống kê" },
  { id: "config", icon: "⚙️", label: "Cấu hình hệ thống" },
];

// Layout riêng cho khu vực /admin/*. Khác AppLayout ở chỗ dùng button + callback onNavigate
// thay vì <NavLink to>, vì admin không có route con riêng — section active nằm ở state của AdminDashboardPage
export default function AdminLayout({ activeSection, onNavigate, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  // Giống hệt logic đăng xuất ở AppLayout 
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
