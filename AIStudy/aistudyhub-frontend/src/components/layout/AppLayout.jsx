import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { clearAuthStorage } from "../../apis/api";
import { getDocuments } from "../../apis/documentApi";
import "./AppLayout.css";

const NAV_ITEMS = [
  { to: "/dashboard", icon: "⊞", label: "Tổng quan" },
  { to: "/chatbot", icon: "💬", label: "AI Chatbot" },
  { to: "/forum", icon: "📚", label: "Cộng đồng" },
];

const PREMIUM_ITEM = { to: "/premium", icon: "⚡", label: "Nâng cấp Premium" };
const MODERATION_ITEM = { to: "/moderation", icon: "🛡️", label: "Kiểm duyệt Forum" };

function getCurrentRole() {
  return (localStorage.getItem("role") || "").toUpperCase();
}

function formatStorage(bytes) {
  if (!bytes || bytes === 0) return "0 KB";
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(1)} GB`;
}

const TOTAL_QUOTA = 5 * 1073741824; // 5 GB

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [usedBytes, setUsedBytes] = useState(null);
  const [role] = useState(getCurrentRole);

  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    getDocuments()
      .then(res => {
        if (cancelled) return;
        const list = res?.data || res || [];
        const arr = Array.isArray(list) ? list : [];
        const total = arr.reduce((s, d) => s + (d.fileSize || 0), 0);
        setUsedBytes(total);
      })
      .catch(err => {
        console.error("Load documents for storage error:", err);
        setUsedBytes(0);
      });

    return () => { cancelled = true; };
  }, []);

  const handleLogout = async () => {
    try {
      // Nếu sau này có API logout thì gọi ở đây
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

          {role === "MODERATOR" && (
            <NavLink
              to={MODERATION_ITEM.to}
              className={({ isActive }) =>
                `sidebar-link${isActive ? " sidebar-link--active" : ""}`
              }
              title={collapsed ? MODERATION_ITEM.label : undefined}
            >
              <span className="sidebar-link-icon">{MODERATION_ITEM.icon}</span>

              {!collapsed && (
                <span className="sidebar-link-label">{MODERATION_ITEM.label}</span>
              )}
            </NavLink>
          )}

          <NavLink
            to={PREMIUM_ITEM.to}
            className={({ isActive }) =>
              `sidebar-link sidebar-link--premium${isActive ? " sidebar-link--active" : ""}`
            }
            title={collapsed ? PREMIUM_ITEM.label : undefined}
          >
            <span className="sidebar-link-icon">{PREMIUM_ITEM.icon}</span>

            {!collapsed && (
              <span className="sidebar-link-label">{PREMIUM_ITEM.label}</span>
            )}
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          {!collapsed && (
            <div className="sidebar-storage">
              <div className="storage-row">
                <span className="storage-label">Dung lượng</span>

                <span className="storage-value">
                  {usedBytes !== null
                    ? `${formatStorage(usedBytes)} / 5 GB`
                    : "Đang tải..."}
                </span>
              </div>

              <div className="storage-track">
                <div
                  className="storage-fill"
                  style={{
                    width: usedBytes !== null ? `${Math.min(100, (usedBytes / TOTAL_QUOTA) * 100)}%` : "0%",
                  }}
                />
              </div>
            </div>
          )}

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
