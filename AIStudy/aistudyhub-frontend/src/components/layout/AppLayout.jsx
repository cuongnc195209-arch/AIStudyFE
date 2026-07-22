import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { clearAuthTokens } from "../../apis/api";
import { getDocuments } from "../../apis/documentApi";
import { getTotalQuota } from "../../apis/storageApi";
import "./AppLayout.css";

const GB = 1073741824;
const DEFAULT_FREE_QUOTA = 5 * GB;
const DEFAULT_PREMIUM_QUOTA = 10 * GB;

const NAV_ITEMS = [
  { to: "/dashboard", icon: "⊞", label: "Tổng quan" },
  { to: "/chatbot", icon: "💬", label: "AI Chatbot" },
  { to: "/forum", icon: "📚", label: "Cộng đồng" },
];

const PREMIUM_ITEM = { to: "/premium", icon: "⚡", label: "Nâng cấp Premium" };

const MODERATION_ITEM = {
  to: "/moderation",
  icon: "🛡️",
  label: "Kiểm duyệt Tài liệu",
};

const REPORT_ITEM = {
  to: "/reports",
  icon: "🚩",
  label: "Báo cáo Tài liệu",
};

function getCurrentRole() {
  return (localStorage.getItem("role") || "")
    .replace("ROLE_", "")
    .toUpperCase();
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function isPremiumUser(user) {
  const plan = String(
    user?.membership ||
      user?.plan ||
      user?.subscriptionPlan ||
      user?.memberType ||
      "",
  ).toUpperCase();

  return Boolean(
    user?.isPremium ||
    user?.memberId ||
    plan === "PREMIUM" ||
    plan.includes("PREMIUM"),
  );
}

function formatStorage(bytes) {
  const size = Number(bytes || 0);

  if (!size) return "0 KB";
  if (size < 1048576) return `${(size / 1024).toFixed(0)} KB`;
  if (size < 1073741824) return `${(size / 1048576).toFixed(1)} MB`;

  return `${(size / 1073741824).toFixed(1)} GB`;
}

function normalizeQuotaToBytes(value, user) {
  const quota = Number(value || 0);

  if (Number.isFinite(quota) && quota > 0) {
    /*
     * BE trả 5 hoặc 10 nghĩa là GB.
     * BE trả số lớn thì hiểu là bytes.
     */
    if (quota <= 1000) {
      return quota * GB;
    }

    return quota;
  }

  return isPremiumUser(user) ? DEFAULT_PREMIUM_QUOTA : DEFAULT_FREE_QUOTA;
}

export default function AppLayout({ children }) {
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [usedBytes, setUsedBytes] = useState(null);
  const [quotaBytes, setQuotaBytes] = useState(DEFAULT_FREE_QUOTA);

  const [role] = useState(getCurrentRole);
  const [currentUser] = useState(getStoredUser);

  useEffect(() => {
    let cancelled = false;

    getDocuments()
      .then((res) => {
        if (cancelled) return;

        const list = res?.data || res || [];
        const arr = Array.isArray(list) ? list : [];

        const total = arr.reduce(
          (sum, document) => sum + (Number(document.fileSize) || 0),
          0,
        );

        setUsedBytes(total);
      })
      .catch((err) => {
        console.error("Load documents for storage error:", err);

        if (!cancelled) {
          setUsedBytes(0);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadQuota() {
      try {
        const total = await getTotalQuota();

        if (!cancelled) {
          setQuotaBytes(normalizeQuotaToBytes(total, currentUser));
        }
      } catch (err) {
        console.error("Load sidebar quota error:", err);

        if (!cancelled) {
          setQuotaBytes(normalizeQuotaToBytes(null, currentUser));
        }
      }
    }

    loadQuota();

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      // Sau này có API logout thì gọi ở đây.
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuthTokens();

      localStorage.removeItem("user");
      localStorage.removeItem("role");

      navigate("/login", { replace: true });
    }
  };

  const storagePercent =
    usedBytes !== null && quotaBytes > 0
      ? Math.min(100, (usedBytes / quotaBytes) * 100)
      : 0;

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
                <span className="sidebar-link-label">
                  {MODERATION_ITEM.label}
                </span>
              )}
            </NavLink>
          )}

          {role === "MODERATOR" && (
            <NavLink
              to={REPORT_ITEM.to}
              className={({ isActive }) =>
                `sidebar-link${isActive ? " sidebar-link--active" : ""}`
              }
              title={collapsed ? REPORT_ITEM.label : undefined}
            >
              <span className="sidebar-link-icon">{REPORT_ITEM.icon}</span>

              {!collapsed && (
                <span className="sidebar-link-label">{REPORT_ITEM.label}</span>
              )}
            </NavLink>
          )}

          <NavLink
            to={PREMIUM_ITEM.to}
            className={({ isActive }) =>
              `sidebar-link sidebar-link--premium${
                isActive ? " sidebar-link--active" : ""
              }`
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
                    ? `${formatStorage(usedBytes)} / ${formatStorage(quotaBytes)}`
                    : "Đang tải..."}
                </span>
              </div>

              <div className="storage-track">
                <div
                  className="storage-fill"
                  style={{
                    width: `${storagePercent}%`,
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
