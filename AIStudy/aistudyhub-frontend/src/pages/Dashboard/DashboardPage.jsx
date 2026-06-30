import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import { getDocuments } from "../../apis/documentApi";
import { DocumentsSection } from "../Documents/DocumentsPage";
import "./DashboardPage.css";

function formatSize(bytes) {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;

  return `${bytes} B`;
}

function getChatSessionCount() {
  try {
    const sessions = JSON.parse(localStorage.getItem("chatSessions")) || [];
    return sessions.length;
  } catch {
    return 0;
  }
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const [nowTime] = useState(() => Date.now());
  const [currentHour] = useState(() => new Date().getHours());
  const [storedUser] = useState(() => getStoredUser());
  const [chatCount] = useState(() => getChatSessionCount());

  const [docCount, setDocCount] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [docsThisWeek, setDocsThisWeek] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchDocStats() {
      try {
        const result = await getDocuments();
        const data = result?.data || result || [];
        const list = Array.isArray(data) ? data : [];

        if (cancelled) return;

        setDocCount(list.length);
        setTotalBytes(list.reduce((s, d) => s + (Number(d.fileSize) || 0), 0));

        const oneWeekAgo = nowTime - 7 * 86400000;

        setDocsThisWeek(
          list.filter((d) => {
            const t = new Date(d.createdAt || d.date || 0).getTime();
            return t >= oneWeekAgo;
          }).length,
        );
      } catch (err) {
        if (!cancelled) {
          console.error("Dashboard load doc stats error:", err);
        }
      }
    }

    fetchDocStats();

    return () => {
      cancelled = true;
    };
  }, [nowTime]);

  const stats = useMemo(
    () => [
      {
        icon: "📁",
        label: "Tài liệu",
        value: `${docCount}`,
        sub: docsThisWeek > 0 ? `+${docsThisWeek} tuần này` : "Tuần này",
        color: "blue",
      },
      {
        icon: "💾",
        label: "Dung lượng",
        value: formatSize(totalBytes),
        sub: `${((totalBytes / (5 * 1073741824)) * 100).toFixed(0)}% / 5 GB`,
        color: "purple",
      },
      {
        icon: "💬",
        label: "Phiên Chat AI",
        value: `${chatCount}`,
        sub: "Tổng cộng",
        color: "green",
      },
    ],
    [docCount, docsThisWeek, totalBytes, chatCount],
  );

  const greeting =
    currentHour < 12
      ? "Chào buổi sáng"
      : currentHour < 18
        ? "Chào buổi chiều"
        : "Chào buổi tối";

  const displayName =
    storedUser.fullName || storedUser.name || storedUser.email || "Người dùng";

  const initials = displayName.includes("@")
    ? displayName[0].toUpperCase()
    : displayName
        .split(" ")
        .map((w) => w[0])
        .slice(-2)
        .join("")
        .toUpperCase();

  return (
    <AppLayout>
      <div className="dashboard">
        <div className="dash-topbar">
          <div className="dash-greeting">
            <h1>
              {greeting}, {displayName} 👋
            </h1>
            <p>Hôm nay bạn muốn học gì?</p>
          </div>

          <div className="dash-topbar-right">
            <button className="notif-btn" title="Thông báo">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="notif-badge">3</span>
              <span className="notif-ping" />
            </button>

            <div className="user-chip-wrapper">
              <div className="user-chip">
                <div className="user-avatar">
                  <span>{initials}</span>
                  <span className="avatar-status" />
                </div>
                <div className="user-info">
                  <span className="user-name">{displayName}</span>
                  <span className="user-plan">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    Miễn phí
                  </span>
                </div>
                <svg
                  className="user-chip-arrow"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              <div className="user-dropdown">
                <div className="user-dropdown-header">
                  <div
                    className="user-avatar"
                    style={{
                      width: 44,
                      height: 44,
                      fontSize: "1rem",
                      borderRadius: 12,
                    }}
                  >
                    <span>{initials}</span>
                  </div>
                  <div>
                    <div className="dropdown-name">{displayName}</div>
                    <div className="dropdown-email">
                      {storedUser?.email || ""}
                    </div>
                  </div>
                </div>

                <div className="user-dropdown-divider" />

                <button
                  className="user-dropdown-item"
                  onClick={() => navigate("/settings")}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Hồ sơ cá nhân
                </button>

                <button
                  className="user-dropdown-item"
                  onClick={() => navigate("/courses")}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  Nâng cấp Premium
                  <span className="dropdown-upgrade-badge">PRO</span>
                </button>

                <div className="user-dropdown-divider" />

                <button
                  className="user-dropdown-item user-dropdown-logout"
                  onClick={() => {
                    localStorage.clear();
                    navigate("/login", { replace: true });
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="upgrade-banner">
          <div className="upgrade-text">
            <span className="upgrade-icon">⚡</span>
            <div>
              <strong>Nâng cấp lên Premium</strong>
              <span>
                {" "}
                — Tăng dung lượng lên 10 GB, AI không giới hạn, tài liệu độc
                quyền
              </span>
            </div>
          </div>

          <button className="upgrade-btn" onClick={() => navigate("/courses")}>
            Xem gói Premium →
          </button>
        </div>

        <div className="stats-grid">
          {stats.map((s) => (
            <div key={s.label} className={`stat-card stat-${s.color}`}>
              <div className="stat-icon-wrap">{s.icon}</div>
              <div className="stat-body">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-sub">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <DocumentsSection />
      </div>
    </AppLayout>
  );
}
