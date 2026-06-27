import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { clearAuthStorage } from "../../apis/api";
import { getStorageUsage } from "../../apis/storageApi";
import "./AppLayout.css";

const NAV_ITEMS = [
  { to: "/dashboard", icon: "⊞", label: "Tổng quan" },
  { to: "/chatbot", icon: "💬", label: "AI Chatbot" },
  { to: "/forum", icon: "📚", label: "Cộng đồng" },
  { to: "/courses", icon: "🎓", label: "Khóa học" },
];

function formatGB(bytes) {
  if (!bytes && bytes !== 0) return "0.0";
  return (Number(bytes) / 1073741824).toFixed(1);
}

function getStoragePercent(storageUsage) {
  if (!storageUsage) return "0%";

  const percentage = storageUsage.percentageUsed;

  if (typeof percentage === "string") {
    return percentage.includes("%") ? percentage : `${percentage}%`;
  }

  if (typeof percentage === "number") {
    return `${Math.min(100, Math.max(0, percentage))}%`;
  }

  return "0%";
}

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [storageUsage, setStorageUsage] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function loadStorageUsage() {
      try {
        const result = await getStorageUsage();
        const data = result?.data || result;

        if (!cancelled) {
          setStorageUsage(data);
        }
      } catch (err) {
        console.error("Load storage usage error:", err);
      }
    }

    loadStorageUsage();

    return () => {
      cancelled = true;
    };
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
        </nav>

        <div className="sidebar-footer">
          {!collapsed && (
            <div className="sidebar-storage">
              <div className="storage-row">
                <span className="storage-label">Dung lượng</span>

                <span className="storage-value">
                  {storageUsage
                    ? `${formatGB(storageUsage.usedQuota)} / ${formatGB(
                        storageUsage.totalQuota,
                      )} GB`
                    : "Đang tải..."}
                </span>
              </div>

              <div className="storage-track">
                <div
                  className="storage-fill"
                  style={{
                    width: getStoragePercent(storageUsage),
                  }}
                />
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
