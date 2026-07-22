import { useEffect, useState } from "react";
import {
  getUsers,
  getAdminDocuments,
  getAdminStorage,
  getAdminChats,
} from "../../../apis/adminApi";
import { mapUser } from "../shared/mappers";

function formatStorage(bytes) {
  if (!bytes) return "0 B";
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(0)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(0)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

// Trang tổng quan admin: gộp 4 API khác nhau bằng Promise.allSettled để dù 1 API lỗi
// vẫn hiện được các thẻ thống kê còn lại (thay vì cả trang trắng). Doanh thu chưa có API nên luôn hiện "—".
export default function OverviewSection() {
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalDocs, setTotalDocs] = useState(0);
  const [storageUsed, setStorageUsed] = useState(null);
  const [totalAiMessages, setTotalAiMessages] = useState(0);

  useEffect(() => {
    // allSettled thay vì Promise.all — nếu 1 API lỗi thì các API khác vẫn tính được, không throw dừng hết
    Promise.allSettled([
      getUsers({ size: 9999 }),
      getAdminDocuments({ size: 9999 }),
      getAdminStorage({ size: 9999 }),
      getAdminChats({ size: 9999 }),
    ]).then(([usersRes, docsRes, storageRes, chatsRes]) => {
      if (usersRes.status === "fulfilled") {
        const res = usersRes.value;
        const list = res?.content || res?.data || res || [];
        const mapped = Array.isArray(list)
          ? list.map((u, index) => mapUser(u, index))
          : [];
        const nonAdmin = mapped.filter((u) => u.role !== "ADMIN");

        setTotalUsers(res?.totalElements || nonAdmin.length);
        setRecentUsers(nonAdmin.slice(0, 5));
      }

      if (docsRes.status === "fulfilled") {
        const res = docsRes.value;
        const data = res?.content || res?.data || res || [];
        const docList = Array.isArray(data) ? data : [];
        setTotalDocs(res?.totalElements || docList.length);
      }

      if (storageRes.status === "fulfilled") {
        const res = storageRes.value;
        const list = res?.content || res?.data || res || [];
        const totalBytes = Array.isArray(list)
          ? list.reduce((sum, item) => sum + (item.usedQuota || 0), 0)
          : null;
        setStorageUsed(totalBytes);
      }

      if (chatsRes.status === "fulfilled") {
        const res = chatsRes.value;
        const rawList = res?.content || res?.data || res || [];
        setTotalAiMessages(Array.isArray(rawList) ? rawList.length : 0);
      }

      setLoading(false);
    });
  }, []);

  const STATS = [
    {
      icon: "👥",
      label: "Tổng người dùng",
      value: loading ? "..." : totalUsers.toLocaleString(),
      color: "blue",
    },
    {
      icon: "📁",
      label: "Tài liệu hệ thống",
      value: loading ? "..." : totalDocs.toLocaleString(),
      color: "purple",
    },
    {
      icon: "💾",
      label: "Lưu trữ đã dùng",
      value: loading
        ? "..."
        : storageUsed != null
          ? formatStorage(storageUsed)
          : "—",
      color: "orange",
    },
    {
      icon: "💰",
      label: "Doanh thu tháng",
      value: "—",
      color: "green",
    },
    {
      icon: "💬",
      label: "Câu hỏi AI",
      value: loading ? "..." : totalAiMessages.toLocaleString(),
      color: "teal",
    },
  ];

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <h2>Tổng quan hệ thống</h2>
        <p>Cập nhật lần cuối: {new Date().toLocaleString("vi-VN")}</p>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid">
        {STATS.map((s) => (
          <div key={s.label} className={`admin-stat-card astat-${s.color}`}>
            <div className="astat-icon">{s.icon}</div>
            <div className="astat-body">
              <div className="astat-value">{s.value}</div>
              <div className="astat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="overview-grid">
        {/* Recent registrations */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h3>Đăng ký gần đây</h3>
            <span className="card-meta">
              {recentUsers.length} người dùng mới
            </span>
          </div>
          <div className="mini-table">
            {recentUsers.map((u, index) => (
              <div
                key={u.id || u.email || `recent-user-${index}`}
                className="mini-row"
              >
                <div className="mini-avatar">
                  {u.name
                    .split(" ")
                    .map((w) => w[0])
                    .slice(-2)
                    .join("")}
                </div>
                <div className="mini-info">
                  <p className="mini-name">{u.name}</p>
                  <p className="mini-email">{u.email}</p>
                </div>
                <span
                  className="plan-badge"
                  style={{
                    background: u.role === "ADMIN" ? "#7c3aed20" : "#6b728020",
                    color: u.role === "ADMIN" ? "#7c3aed" : "#6b7280",
                  }}
                >
                  {u.role === "ADMIN" ? "Admin" : "User"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
