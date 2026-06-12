import { useEffect, useState } from "react";
import { getProfile } from "../../apis/authApi";
import AdminLayout from "../../components/layout/AdminLayout";
import "./AdminDashboardPage.css";

/* ════════════════════════════════
   MOCK DATA
════════════════════════════════ */
const MOCK_USERS = [
  {
    id: 1,
    name: "Nguyễn Văn A",
    email: "a@fpt.edu.vn",
    joined: "2026-01-15",
    plan: "free",
    docs: 24,
    storage: 2.4,
    status: "active",
  },
  {
    id: 2,
    name: "Trần Thị B",
    email: "b@fpt.edu.vn",
    joined: "2026-02-03",
    plan: "premium",
    docs: 87,
    storage: 18.2,
    status: "active",
  },
  {
    id: 3,
    name: "Lê Văn C",
    email: "c@gmail.com",
    joined: "2026-02-18",
    plan: "free",
    docs: 6,
    storage: 0.7,
    status: "locked",
  },
  {
    id: 4,
    name: "Phạm Thị D",
    email: "d@fpt.edu.vn",
    joined: "2026-03-01",
    plan: "group",
    docs: 45,
    storage: 9.1,
    status: "active",
  },
  {
    id: 5,
    name: "Hoàng Văn E",
    email: "e@gmail.com",
    joined: "2026-03-14",
    plan: "free",
    docs: 3,
    storage: 0.3,
    status: "active",
  },
  {
    id: 6,
    name: "Vũ Thị F",
    email: "f@fpt.edu.vn",
    joined: "2026-04-05",
    plan: "premium",
    docs: 62,
    storage: 12.8,
    status: "active",
  },
  {
    id: 7,
    name: "Đặng Văn G",
    email: "g@gmail.com",
    joined: "2026-04-20",
    plan: "free",
    docs: 11,
    storage: 1.1,
    status: "locked",
  },
  {
    id: 8,
    name: "Bùi Thị H",
    email: "h@fpt.edu.vn",
    joined: "2026-05-02",
    plan: "free",
    docs: 8,
    storage: 0.9,
    status: "active",
  },
];

const MOCK_DOCUMENTS = [
  {
    id: 1,
    name: "Giáo trình Lập trình Web",
    ext: "PDF",
    owner: "Nguyễn Văn A",
    subject: "Lập trình Web",
    size: "4.2 MB",
    date: "2026-06-03",
    privacy: "private",
  },
  {
    id: 2,
    name: "Slide CSDL Chương 5",
    ext: "PPT",
    owner: "Trần Thị B",
    subject: "Cơ sở dữ liệu",
    size: "8.1 MB",
    date: "2026-06-02",
    privacy: "public",
  },
  {
    id: 3,
    name: "Bài tập AI - A* Search",
    ext: "DOC",
    owner: "Lê Văn C",
    subject: "Trí tuệ nhân tạo",
    size: "1.3 MB",
    date: "2026-05-31",
    privacy: "private",
  },
  {
    id: 4,
    name: "Đề thi HK2 Mạng máy tính",
    ext: "PDF",
    owner: "Phạm Thị D",
    subject: "Mạng máy tính",
    size: "2.8 MB",
    date: "2026-05-28",
    privacy: "public",
  },
  {
    id: 5,
    name: "Tóm tắt Giải tích 1",
    ext: "PDF",
    owner: "Nguyễn Văn A",
    subject: "Giải tích",
    size: "1.1 MB",
    date: "2026-05-25",
    privacy: "private",
  },
  {
    id: 6,
    name: "Hình ảnh Lab Vật lý",
    ext: "IMG",
    owner: "Hoàng Văn E",
    subject: "Vật lý đại cương",
    size: "3.4 MB",
    date: "2026-05-20",
    privacy: "private",
  },
];

const MOCK_REPORTS = [
  {
    id: 1,
    type: "post",
    title: "Chia sẻ tài liệu có bản quyền trái phép",
    author: "Đặng Văn G",
    reports: 5,
    reason: "Vi phạm bản quyền",
    time: "2 giờ trước",
    content:
      "Bài đăng chia sẻ link tải sách giáo trình có bản quyền mà không có sự cho phép của nhà xuất bản...",
  },
  {
    id: 2,
    type: "comment",
    title: "Bình luận xúc phạm trong bài hỏi đáp OOP",
    author: "Lê Văn C",
    reports: 3,
    reason: "Ngôn ngữ không phù hợp",
    time: "5 giờ trước",
    content:
      "Nội dung bình luận sử dụng từ ngữ thô tục và xúc phạm người dùng khác trong cộng đồng...",
  },
  {
    id: 3,
    type: "post",
    title: "Spam quảng cáo dịch vụ không liên quan",
    author: "Unknown",
    reports: 8,
    reason: "Spam",
    time: "1 ngày trước",
    content:
      "Bài đăng quảng cáo dịch vụ gia sư và bán tài liệu ngoài hệ thống, không liên quan đến học thuật...",
  },
];

const SUBJECTS = [
  "Lập trình Web",
  "Cơ sở dữ liệu",
  "Trí tuệ nhân tạo",
  "Mạng máy tính",
  "Giải tích",
  "Vật lý đại cương",
];

const EXT_COLOR = {
  PDF: "#ef4444",
  PPT: "#f97316",
  DOC: "#3b82f6",
  IMG: "#10b981",
};
const PLAN_COLOR = { free: "#6b7280", premium: "#0066ff", group: "#7c3aed" };
const PLAN_LABEL = { free: "Miễn phí", premium: "Premium", group: "Nhóm" };

const MONTH_USERS = [12, 19, 15, 28, 24, 38, 31, 45, 42, 58, 51, 67];
const MONTH_REVENUE = [
  0, 0, 990, 1980, 2970, 4950, 3960, 6930, 5940, 8910, 7920, 12870,
];
const MONTH_LABELS = [
  "T1",
  "T2",
  "T3",
  "T4",
  "T5",
  "T6",
  "T7",
  "T8",
  "T9",
  "T10",
  "T11",
  "T12",
];

/* ════════════════════════════════
   SHARED HELPERS
════════════════════════════════ */
function Toast({ message, type = "success", onDone }) {
  return (
    <div className={`admin-toast admin-toast--${type}`} onAnimationEnd={onDone}>
      {type === "success" ? "✅" : "⚠️"} {message}
    </div>
  );
}

function ConfirmModal({ title, desc, danger, onConfirm, onClose }) {
  return (
    <div
      className="admin-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="admin-modal admin-modal--sm">
        <div className="admin-modal-header">
          <h3>{title}</h3>
          <button className="admin-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="admin-modal-body">
          <p className="confirm-desc">{desc}</p>
        </div>
        <div className="admin-modal-footer">
          <button className="abtn-cancel" onClick={onClose}>
            Hủy
          </button>
          <button
            className={danger ? "abtn-danger" : "abtn-primary"}
            onClick={onConfirm}
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════
   SECTION: OVERVIEW
════════════════════════════════ */
function OverviewSection() {
  const STATS = [
    {
      icon: "👥",
      label: "Tổng người dùng",
      value: "2,847",
      trend: "+42 tuần này",
      trendUp: true,
      color: "blue",
    },
    {
      icon: "📁",
      label: "Tài liệu hệ thống",
      value: "18,392",
      trend: "+156 tuần này",
      trendUp: true,
      color: "purple",
    },
    {
      icon: "💾",
      label: "Lưu trữ đã dùng",
      value: "284 GB",
      trend: "/ 1 TB tổng",
      trendUp: null,
      color: "orange",
    },
    {
      icon: "💰",
      label: "Doanh thu tháng",
      value: "12.87M₫",
      trend: "+18% so với T11",
      trendUp: true,
      color: "green",
    },
    {
      icon: "💬",
      label: "Câu hỏi AI hôm nay",
      value: "1,204",
      trend: "+8% hôm qua",
      trendUp: true,
      color: "teal",
    },
    {
      icon: "🚩",
      label: "Báo cáo chờ xử lý",
      value: "3",
      trend: "Cần kiểm duyệt",
      trendUp: false,
      color: "red",
    },
  ];

  const RECENT = MOCK_USERS.slice(0, 5);

  const ALERTS = [
    {
      icon: "⚠️",
      msg: "3 bài đăng Forum bị report — cần kiểm duyệt",
      level: "warn",
      time: "2 giờ trước",
    },
    {
      icon: "💾",
      msg: "Dung lượng server đạt 28% — hệ thống ổn định",
      level: "info",
      time: "6 giờ trước",
    },
    {
      icon: "✅",
      msg: "Backup dữ liệu hoàn tất lúc 03:00 AM",
      level: "ok",
      time: "8 giờ trước",
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
              <div
                className={`astat-trend${s.trendUp === true ? " trend-up" : s.trendUp === false ? " trend-warn" : ""}`}
              >
                {s.trendUp === true ? "↑" : s.trendUp === false ? "⚠" : "•"}{" "}
                {s.trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="overview-grid">
        {/* Recent registrations */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h3>Đăng ký gần đây</h3>
            <span className="card-meta">{RECENT.length} người dùng mới</span>
          </div>
          <div className="mini-table">
            {RECENT.map((u) => (
              <div key={u.id} className="mini-row">
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
                    background: PLAN_COLOR[u.plan] + "20",
                    color: PLAN_COLOR[u.plan],
                  }}
                >
                  {PLAN_LABEL[u.plan]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h3>Cảnh báo hệ thống</h3>
          </div>
          <div className="alerts-list">
            {ALERTS.map((a, i) => (
              <div key={i} className={`alert-row alert-${a.level}`}>
                <span className="alert-icon">{a.icon}</span>
                <div className="alert-body">
                  <p className="alert-msg">{a.msg}</p>
                  <span className="alert-time">{a.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════
   SECTION: USERS
════════════════════════════════ */
function UsersSection({ onToast }) {
  const [users, setUsers] = useState(MOCK_USERS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [confirm, setConfirm] = useState(null); // { action, user }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    const matchFilter = filter === "all" || u.status === filter;
    return matchSearch && matchFilter;
  });

  function doAction() {
    const { action, user } = confirm;
    if (action === "lock")
      setUsers((us) =>
        us.map((u) => (u.id === user.id ? { ...u, status: "locked" } : u)),
      );
    if (action === "unlock")
      setUsers((us) =>
        us.map((u) => (u.id === user.id ? { ...u, status: "active" } : u)),
      );
    if (action === "delete")
      setUsers((us) => us.filter((u) => u.id !== user.id));
    onToast(
      action === "lock"
        ? `Đã khóa tài khoản ${user.name}`
        : action === "unlock"
          ? `Đã mở khóa ${user.name}`
          : `Đã xóa ${user.name}`,
    );
    setConfirm(null);
  }

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <h2>Quản lý người dùng</h2>
        <p>
          {users.length} tài khoản ·{" "}
          {users.filter((u) => u.status === "locked").length} bị khóa
        </p>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <span className="admin-search-icon">🔍</span>
          <input
            className="admin-search"
            placeholder="Tìm tên, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="admin-search-clear"
              onClick={() => setSearch("")}
            >
              ✕
            </button>
          )}
        </div>
        <div className="filter-tabs">
          {[
            ["all", "Tất cả"],
            ["active", "Đang hoạt động"],
            ["locked", "Đã khóa"],
          ].map(([v, l]) => (
            <button
              key={v}
              className={`filter-tab${filter === v ? " filter-tab--active" : ""}`}
              onClick={() => setFilter(v)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Tham gia</th>
              <th>Gói</th>
              <th>Tài liệu</th>
              <th>Dung lượng</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="td-user">
                    <div className="td-avatar">
                      {u.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(-2)
                        .join("")}
                    </div>
                    <div>
                      <p className="td-name">{u.name}</p>
                      <p className="td-email">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="td-secondary">
                  {new Date(u.joined).toLocaleDateString("vi-VN")}
                </td>
                <td>
                  <span
                    className="plan-badge"
                    style={{
                      background: PLAN_COLOR[u.plan] + "18",
                      color: PLAN_COLOR[u.plan],
                    }}
                  >
                    {PLAN_LABEL[u.plan]}
                  </span>
                </td>
                <td className="td-center">{u.docs}</td>
                <td className="td-secondary">{u.storage} GB</td>
                <td>
                  <span className={`status-badge status-${u.status}`}>
                    {u.status === "active" ? "● Hoạt động" : "● Đã khóa"}
                  </span>
                </td>
                <td>
                  <div className="td-actions">
                    {u.status === "active" ? (
                      <button
                        className="ta-btn ta-lock"
                        onClick={() => setConfirm({ action: "lock", user: u })}
                      >
                        🔒 Khóa
                      </button>
                    ) : (
                      <button
                        className="ta-btn ta-unlock"
                        onClick={() =>
                          setConfirm({ action: "unlock", user: u })
                        }
                      >
                        🔓 Mở
                      </button>
                    )}
                    <button
                      className="ta-btn ta-delete"
                      onClick={() => setConfirm({ action: "delete", user: u })}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="table-empty">Không tìm thấy người dùng</div>
        )}
      </div>

      {confirm && (
        <ConfirmModal
          title={
            confirm.action === "lock"
              ? "Khóa tài khoản"
              : confirm.action === "unlock"
                ? "Mở khóa tài khoản"
                : "Xóa tài khoản"
          }
          desc={`Bạn có chắc muốn ${confirm.action === "lock" ? "khóa" : confirm.action === "unlock" ? "mở khóa" : "xóa vĩnh viễn"} tài khoản "${confirm.user.name}"?`}
          danger={confirm.action === "delete"}
          onConfirm={doAction}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════
   SECTION: DOCUMENTS
════════════════════════════════ */
function DocumentsSection({ onToast }) {
  const [docs, setDocs] = useState(MOCK_DOCUMENTS);
  const [search, setSearch] = useState("");
  const [extFilter, setExtFilter] = useState("Tất cả");
  const [confirm, setConfirm] = useState(null);

  const filtered = docs.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.owner.toLowerCase().includes(q) ||
      d.subject.toLowerCase().includes(q);
    const matchExt = extFilter === "Tất cả" || d.ext === extFilter;
    return matchSearch && matchExt;
  });

  function handleDelete() {
    setDocs((ds) => ds.filter((d) => d.id !== confirm.id));
    onToast(`Đã xóa tài liệu "${confirm.name}"`);
    setConfirm(null);
  }

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <h2>Quản lý tài liệu</h2>
        <p>{docs.length} tài liệu trên toàn hệ thống</p>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <span className="admin-search-icon">🔍</span>
          <input
            className="admin-search"
            placeholder="Tìm tên, chủ sở hữu, môn học..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="admin-search-clear"
              onClick={() => setSearch("")}
            >
              ✕
            </button>
          )}
        </div>
        <select
          className="admin-select"
          value={extFilter}
          onChange={(e) => setExtFilter(e.target.value)}
        >
          {["Tất cả", "PDF", "PPT", "DOC", "IMG"].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tài liệu</th>
              <th>Chủ sở hữu</th>
              <th>Môn học</th>
              <th>Kích thước</th>
              <th>Ngày upload</th>
              <th>Quyền</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id}>
                <td>
                  <div className="td-doc">
                    <div
                      className="td-ext"
                      style={{ background: EXT_COLOR[d.ext] }}
                    >
                      {d.ext}
                    </div>
                    <p className="td-docname">{d.name}</p>
                  </div>
                </td>
                <td className="td-secondary">{d.owner}</td>
                <td className="td-secondary">{d.subject}</td>
                <td className="td-secondary">{d.size}</td>
                <td className="td-secondary">
                  {new Date(d.date).toLocaleDateString("vi-VN")}
                </td>
                <td>
                  <span
                    className={
                      d.privacy === "public"
                        ? "privacy-public"
                        : "privacy-private"
                    }
                  >
                    {d.privacy === "public" ? "🌐 Công khai" : "🔒 Riêng tư"}
                  </span>
                </td>
                <td>
                  <div className="td-actions">
                    <button className="ta-btn ta-view">👁️ Xem</button>
                    <button
                      className="ta-btn ta-delete"
                      onClick={() => setConfirm(d)}
                    >
                      🗑️ Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="table-empty">Không tìm thấy tài liệu</div>
        )}
      </div>

      {confirm && (
        <ConfirmModal
          title="Xóa tài liệu"
          desc={`Xóa vĩnh viễn "${confirm.name}" khỏi Cloud Storage?`}
          danger
          onConfirm={handleDelete}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════
   SECTION: FORUM (MODERATION)
════════════════════════════════ */
function ForumSection({ onToast }) {
  const [reports, setReports] = useState(MOCK_REPORTS);
  const [confirm, setConfirm] = useState(null);

  function handleKeep(id) {
    setReports((rs) => rs.filter((r) => r.id !== id));
    onToast("Đã bỏ cờ — nội dung tiếp tục hiển thị");
  }

  function handleDelete() {
    setReports((rs) => rs.filter((r) => r.id !== confirm.id));
    onToast(`Đã xóa nội dung vi phạm và cảnh báo người dùng`);
    setConfirm(null);
  }

  const TYPE_LABEL = { post: "Bài đăng", comment: "Bình luận" };
  const TYPE_COLOR = { post: "#3b82f6", comment: "#7c3aed" };

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <h2>Kiểm duyệt diễn đàn</h2>
        <p>{reports.length} nội dung đang chờ xử lý</p>
      </div>

      {reports.length === 0 ? (
        <div className="moderation-empty">
          <div className="mod-empty-icon">✅</div>
          <p className="mod-empty-title">Tất cả nội dung đã được kiểm duyệt</p>
          <p className="mod-empty-sub">
            Không còn báo cáo vi phạm nào chờ xử lý
          </p>
        </div>
      ) : (
        <div className="report-list">
          {reports.map((r) => (
            <div key={r.id} className="report-card">
              <div className="report-card-head">
                <div className="report-meta">
                  <span
                    className="report-type-badge"
                    style={{
                      background: TYPE_COLOR[r.type] + "18",
                      color: TYPE_COLOR[r.type],
                    }}
                  >
                    {TYPE_LABEL[r.type]}
                  </span>
                  <span className="report-author">👤 {r.author}</span>
                  <span className="report-time">🕐 {r.time}</span>
                </div>
                <div className="report-count-badge">🚩 {r.reports} báo cáo</div>
              </div>

              <h3 className="report-title">{r.title}</h3>
              <p className="report-reason">
                <strong>Lý do:</strong> {r.reason}
              </p>
              <div className="report-content-preview">{r.content}</div>

              <div className="report-actions">
                <button
                  className="ra-btn ra-keep"
                  onClick={() => handleKeep(r.id)}
                >
                  ✅ Giữ lại — Không vi phạm
                </button>
                <button
                  className="ra-btn ra-delete"
                  onClick={() => setConfirm(r)}
                >
                  🗑️ Xóa nội dung & Cảnh báo
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirm && (
        <ConfirmModal
          title="Xóa nội dung vi phạm"
          desc={`Xóa "${confirm.title}" và gửi cảnh báo đến người dùng "${confirm.author}"?`}
          danger
          onConfirm={handleDelete}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════
   SECTION: STATISTICS
════════════════════════════════ */
function BarChart({ data, labels, color, unit = "" }) {
  const max = Math.max(...data);
  return (
    <div className="bar-chart">
      <div className="bars">
        {data.map((v, i) => (
          <div key={i} className="bar-col">
            <div className="bar-value-label">
              {v > 0 ? (unit === "₫" ? (v / 1000).toFixed(0) + "K" : v) : ""}
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  height: max > 0 ? `${(v / max) * 100}%` : "0%",
                  background: color,
                }}
                title={`${labels[i]}: ${v}${unit}`}
              />
            </div>
            <div className="bar-label">{labels[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsSection() {
  const PLAN_DIST = [
    { label: "Miễn phí", count: 2401, pct: 84, color: "#6b7280" },
    { label: "Premium", count: 389, pct: 14, color: "#0066ff" },
    { label: "Nhóm", count: 57, pct: 2, color: "#7c3aed" },
  ];
  const DOC_TYPES = [
    { label: "PDF", count: 9842, pct: 53, color: "#ef4444" },
    { label: "PPT", count: 4218, pct: 23, color: "#f97316" },
    { label: "DOC", count: 3104, pct: 17, color: "#3b82f6" },
    { label: "IMG", count: 1228, pct: 7, color: "#10b981" },
  ];

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <h2>Thống kê & Báo cáo</h2>
        <p>Dữ liệu năm 2026</p>
      </div>

      <div className="stats-charts-grid">
        {/* Users chart */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h3>Người dùng mới theo tháng</h3>
            <span className="card-meta">Tổng 2,847 người dùng</span>
          </div>
          <BarChart data={MONTH_USERS} labels={MONTH_LABELS} color="#0066ff" />
        </div>

        {/* Revenue chart */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h3>Doanh thu theo tháng</h3>
            <span className="card-meta">Đơn vị: nghìn đồng</span>
          </div>
          <BarChart
            data={MONTH_REVENUE}
            labels={MONTH_LABELS}
            color="#059669"
            unit="₫"
          />
        </div>
      </div>

      <div className="stats-dist-grid">
        {/* Plan distribution */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h3>Phân bổ gói thành viên</h3>
          </div>
          <div className="dist-list">
            {PLAN_DIST.map((p) => (
              <div key={p.label} className="dist-row">
                <div className="dist-dot" style={{ background: p.color }} />
                <span className="dist-label">{p.label}</span>
                <div className="dist-bar-track">
                  <div
                    className="dist-bar-fill"
                    style={{ width: `${p.pct}%`, background: p.color }}
                  />
                </div>
                <span className="dist-pct">{p.pct}%</span>
                <span className="dist-count">{p.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Document types */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h3>Loại tài liệu phổ biến</h3>
          </div>
          <div className="dist-list">
            {DOC_TYPES.map((p) => (
              <div key={p.label} className="dist-row">
                <div className="dist-dot" style={{ background: p.color }} />
                <span className="dist-label">{p.label}</span>
                <div className="dist-bar-track">
                  <div
                    className="dist-bar-fill"
                    style={{ width: `${p.pct}%`, background: p.color }}
                  />
                </div>
                <span className="dist-pct">{p.pct}%</span>
                <span className="dist-count">{p.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════
   SECTION: CONFIG
════════════════════════════════ */
function ConfigSection({ onToast }) {
  const [config, setConfig] = useState({
    maxFileMB: 50,
    storagePerUserGB: 5,
    allowedFormats: ["PDF", "DOCX", "PPTX", "JPG", "PNG", "MP4"],
    maintenanceMode: false,
    maxAIQueriesPerDay: 20,
  });
  const [subjects, setSubjects] = useState(SUBJECTS);
  const [newSubject, setNewSubject] = useState("");

  const ALL_FORMATS = [
    "PDF",
    "DOCX",
    "PPTX",
    "DOC",
    "PPT",
    "JPG",
    "PNG",
    "MP4",
    "ZIP",
    "TXT",
  ];

  function toggleFormat(fmt) {
    setConfig((c) => ({
      ...c,
      allowedFormats: c.allowedFormats.includes(fmt)
        ? c.allowedFormats.filter((f) => f !== fmt)
        : [...c.allowedFormats, fmt],
    }));
  }

  function addSubject() {
    const s = newSubject.trim();
    if (s && !subjects.includes(s)) {
      setSubjects((p) => [...p, s]);
      setNewSubject("");
    }
  }

  function removeSubject(s) {
    setSubjects((p) => p.filter((x) => x !== s));
  }

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <h2>Cấu hình hệ thống</h2>
        <p>Thay đổi sẽ áp dụng ngay lập tức</p>
      </div>

      {/* Upload limits */}
      <div className="config-section">
        <h3 className="config-section-title">Giới hạn Upload & Lưu trữ</h3>
        <div className="config-grid">
          <div className="config-item">
            <label>Dung lượng tối đa mỗi file (MB)</label>
            <div className="config-input-row">
              <input
                type="number"
                min={1}
                max={500}
                value={config.maxFileMB}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, maxFileMB: +e.target.value }))
                }
              />
              <span className="config-unit">MB</span>
            </div>
            <p className="config-hint">
              Áp dụng cho tất cả người dùng gói Free và Premium
            </p>
          </div>
          <div className="config-item">
            <label>Dung lượng lưu trữ / người dùng Free (GB)</label>
            <div className="config-input-row">
              <input
                type="number"
                min={1}
                max={100}
                value={config.storagePerUserGB}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    storagePerUserGB: +e.target.value,
                  }))
                }
              />
              <span className="config-unit">GB</span>
            </div>
          </div>
          <div className="config-item">
            <label>Giới hạn câu hỏi AI / ngày (Free)</label>
            <div className="config-input-row">
              <input
                type="number"
                min={1}
                max={1000}
                value={config.maxAIQueriesPerDay}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    maxAIQueriesPerDay: +e.target.value,
                  }))
                }
              />
              <span className="config-unit">câu/ngày</span>
            </div>
          </div>
          <div className="config-item config-toggle-item">
            <label>Chế độ bảo trì</label>
            <div className="config-toggle-row">
              <button
                className={`admin-toggle${config.maintenanceMode ? " admin-toggle--on admin-toggle--danger" : ""}`}
                onClick={() =>
                  setConfig((c) => ({
                    ...c,
                    maintenanceMode: !c.maintenanceMode,
                  }))
                }
              >
                <span className="admin-toggle-thumb" />
              </button>
              <span
                className={
                  config.maintenanceMode
                    ? "toggle-on-label"
                    : "toggle-off-label"
                }
              >
                {config.maintenanceMode
                  ? "Đang bật — Người dùng không thể truy cập"
                  : "Tắt"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Allowed formats */}
      <div className="config-section">
        <h3 className="config-section-title">
          Định dạng file được phép upload
        </h3>
        <div className="format-grid">
          {ALL_FORMATS.map((fmt) => (
            <label
              key={fmt}
              className={`format-checkbox${config.allowedFormats.includes(fmt) ? " format-checkbox--checked" : ""}`}
            >
              <input
                type="checkbox"
                checked={config.allowedFormats.includes(fmt)}
                onChange={() => toggleFormat(fmt)}
              />
              {fmt}
            </label>
          ))}
        </div>
      </div>

      {/* Subject categories */}
      <div className="config-section">
        <h3 className="config-section-title">Danh sách Môn học</h3>
        <div className="subject-tags">
          {subjects.map((s) => (
            <div key={s} className="subject-tag">
              {s}
              <button
                className="subject-remove"
                onClick={() => removeSubject(s)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="add-subject-row">
          <input
            className="add-subject-input"
            placeholder="Thêm môn học mới..."
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSubject()}
          />
          <button className="abtn-primary" onClick={addSubject}>
            + Thêm
          </button>
        </div>
      </div>

      <div className="config-save-row">
        <button
          className="abtn-primary abtn-lg"
          onClick={() => onToast("Cấu hình đã được lưu và áp dụng!")}
        >
          💾 Lưu toàn bộ cấu hình
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════
   MAIN PAGE
════════════════════════════════ */
export default function AdminDashboardPage() {
  const [section, setSection] = useState("overview");
  const [toast, setToast] = useState(null);

  const [currentUser, setCurrentUser] = useState(() => {
    return JSON.parse(localStorage.getItem("user") || "{}");
  });

  useEffect(() => {
    async function loadAdminProfile() {
      try {
        const result = await getProfile();
        console.log("Admin profile result:", result);

        const profileData = result.data || result;

        const userData =
          profileData.user ||
          profileData.profile ||
          profileData.userProfile ||
          profileData;

        const newUser = {
          ...currentUser,
          ...userData,
          fullName:
            userData.fullName ||
            userData.name ||
            userData.full_name ||
            userData.displayName ||
            currentUser.fullName ||
            currentUser.name ||
            currentUser.full_name,
          email: userData.email || currentUser.email,
          role:
            userData.role ||
            currentUser.role ||
            localStorage.getItem("role") ||
            "ADMIN",
        };

        localStorage.setItem("user", JSON.stringify(newUser));
        localStorage.setItem("role", newUser.role);

        setCurrentUser(newUser);
      } catch (error) {
        console.error("Load admin profile error:", error);
      }
    }

    loadAdminProfile();
  }, []);

  const displayName =
    currentUser.fullName ||
    currentUser.name ||
    currentUser.full_name ||
    currentUser.displayName ||
    currentUser.username ||
    "Admin";

  const initials = displayName.includes("@")
    ? displayName[0].toUpperCase()
    : displayName
        .split(" ")
        .filter(Boolean)
        .map((word) => word[0])
        .slice(-2)
        .join("")
        .toUpperCase();

  const role = localStorage.getItem("role") || currentUser.role || "ADMIN";

  const roleText =
    role === "ADMIN" || role === "ROLE_ADMIN"
      ? "Quản trị viên"
      : role === "MODERATOR" || role === "ROLE_MODERATOR"
        ? "Kiểm duyệt viên"
        : "Người dùng";

  function showToast(msg) {
    setToast(msg);
  }

  const SECTION_MAP = {
    overview: <OverviewSection />,
    users: <UsersSection onToast={showToast} />,
    documents: <DocumentsSection onToast={showToast} />,
    forum: <ForumSection onToast={showToast} />,
    stats: <StatsSection />,
    config: <ConfigSection onToast={showToast} />,
  };

  return (
    <AdminLayout activeSection={section} onNavigate={setSection}>
      <div className="admin-page">
        {/* Top bar */}
        <div className="admin-topbar">
          <div className="admin-topbar-left">
            <span className="admin-breadcrumb">
              Admin ·{" "}
              {
                {
                  overview: "Tổng quan",
                  users: "Người dùng",
                  documents: "Tài liệu",
                  forum: "Kiểm duyệt Forum",
                  stats: "Thống kê",
                  config: "Cấu hình",
                }[section]
              }
            </span>
          </div>
          <div className="admin-topbar-right">
            <button className="admin-notif-btn" title="Thông báo">
              🔔<span className="admin-notif-badge">3</span>
            </button>
            <div className="admin-user-chip">
              <div className="admin-user-avatar">{initials}</div>
              <div>
                <p className="admin-user-name">{displayName}</p>
                <p className="admin-user-role">{roleText}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {SECTION_MAP[section]}
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </AdminLayout>
  );
}
