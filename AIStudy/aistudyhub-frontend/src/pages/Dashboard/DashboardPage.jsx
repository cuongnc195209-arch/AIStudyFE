import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import AppLayout from "../../components/layout/AppLayout";
import { getDocuments } from "../../apis/documentApi";
import { getTotalQuota } from "../../apis/storageApi";
import { DocumentsSection } from "../Documents/DocumentsPage";
import "./DashboardPage.css";

function formatSize(bytes) {
  const size = Number(bytes || 0);

  if (size >= 1073741824) return `${(size / 1073741824).toFixed(1)} GB`;
  if (size >= 1048576) return `${(size / 1048576).toFixed(1)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(0)} KB`;

  return `${size} B`;
}

function normalizeQuotaToBytes(value) {
  const quota = Number(value || 0);

  if (!Number.isFinite(quota) || quota <= 0) {
    return 5 * 1073741824;
  }

  /*
   * Nếu BE trả 5 hoặc 10 thì hiểu là GB.
   * Nếu BE trả số lớn như 5368709120 thì hiểu là bytes.
   */
  if (quota <= 1000) {
    return quota * 1073741824;
  }

  return quota;
}

function formatPercent(usedBytes, quotaBytes) {
  const used = Number(usedBytes || 0);
  const quota = Number(quotaBytes || 0);

  if (!quota) {
    return "0%";
  }

  const percent = (used / quota) * 100;

  if (percent > 0 && percent < 0.1) {
    return "< 0.1%";
  }

  return `${Math.min(100, percent).toFixed(1)}%`;
}

function getListFromResponse(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.content)) return result.content;
  if (Array.isArray(result?.data?.content)) return result.data.content;
  if (Array.isArray(result?.data)) return result.data;

  return [];
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function getChatSessionCount() {
  try {
    const user = getStoredUser();
    const userKey = user?.id || user?.userId || user?.email || "guest";
    const sessions =
      JSON.parse(localStorage.getItem(`chatSessions_${userKey}`)) || [];
    return Array.isArray(sessions) ? sessions.length : 0;
  } catch {
    return 0;
  }
}

function isEmailLike(value) {
  return typeof value === "string" && value.includes("@");
}

function getDisplayName(user) {
  const candidates = [
    user?.fullName,
    user?.full_name,
    user?.displayName,
    user?.name,
    user?.username,
    user?.studentName,
    user?.studentCode,
  ];

  const realName = candidates.find((value) => value && !isEmailLike(value));

  return realName || "Người dùng";
}

function getInitials(name) {
  if (!name || name === "Người dùng") {
    return "ND";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .slice(-2)
    .join("")
    .toUpperCase();
}

function checkPremium(user) {
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

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [nowTime] = useState(() => Date.now());
  const [currentHour] = useState(() => new Date().getHours());
  const [storedUser] = useState(() => getStoredUser());
  const [chatCount] = useState(() => getChatSessionCount());

  const [docCount, setDocCount] = useState(0);
  const [docsThisWeek, setDocsThisWeek] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [quotaBytes, setQuotaBytes] = useState(5 * 1073741824);

  useEffect(() => {
    if (!location.state?.paymentSuccess) {
      return;
    }

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Thanh toán thành công",
      text: "Tài khoản của bạn đã được nâng cấp Premium.",
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
    });

    window.history.replaceState({}, document.title, window.location.pathname);
  }, [location.state]);

  useEffect(() => {
    let cancelled = false;

    async function fetchDocStats() {
      try {
        const result = await getDocuments();
        const list = getListFromResponse(result);

        if (cancelled) return;

        setDocCount(list.length);

        setTotalBytes(
          list.reduce(
            (sum, document) => sum + (Number(document.fileSize) || 0),
            0,
          ),
        );

        const oneWeekAgo = nowTime - 7 * 86400000;

        setDocsThisWeek(
          list.filter((document) => {
            const time = new Date(
              document.createdAt || document.date || 0,
            ).getTime();

            return time >= oneWeekAgo;
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

  useEffect(() => {
    let cancelled = false;

    async function fetchQuota() {
      try {
        const total = await getTotalQuota();

        if (!cancelled) {
          setQuotaBytes(normalizeQuotaToBytes(total));
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Dashboard load total quota error:", err);
          setQuotaBytes(5 * 1073741824);
        }
      }
    }

    fetchQuota();

    return () => {
      cancelled = true;
    };
  }, []);

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
        sub: `${formatPercent(totalBytes, quotaBytes)} / ${formatSize(
          quotaBytes,
        )}`,
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
    [docCount, docsThisWeek, totalBytes, quotaBytes, chatCount],
  );

  const greeting =
    currentHour < 12
      ? "Chào buổi sáng"
      : currentHour < 18
        ? "Chào buổi chiều"
        : "Chào buổi tối";

  const displayName = getDisplayName(storedUser);
  const initials = getInitials(displayName);
  const isPremium = checkPremium(storedUser);

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
                    {isPremium ? "Premium" : "Miễn phí"}
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

                {!isPremium && (
                  <>
                    <div className="user-dropdown-divider" />

                    <button
                      className="user-dropdown-item"
                      onClick={() => navigate("/premium")}
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
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      Nâng cấp Premium
                    </button>
                  </>
                )}

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

        {!isPremium && (
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

            <button
              className="upgrade-btn"
              onClick={() => navigate("/premium")}
            >
              Xem gói Premium →
            </button>
          </div>
        )}

        {isPremium && (
          <div className="upgrade-banner">
            <div className="upgrade-text">
              <span className="upgrade-icon">⭐</span>

              <div>
                <strong>Bạn đang dùng Premium</strong>
                <span>
                  {" "}
                  — Dung lượng 10 GB, giới hạn AI cao hơn và upload file lớn hơn
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.label} className={`stat-card stat-${stat.color}`}>
              <div className="stat-icon-wrap">{stat.icon}</div>

              <div className="stat-body">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-sub">{stat.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <DocumentsSection />
      </div>
    </AppLayout>
  );
}
