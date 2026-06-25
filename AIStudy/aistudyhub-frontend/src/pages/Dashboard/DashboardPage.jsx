import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import { getDocuments } from "../../apis/documentApi";
import "./DashboardPage.css";

const EXT_COLOR = {
  PDF: "#ef4444",
  PPT: "#f97316",
  DOC: "#3b82f6",
  DOCX: "#3b82f6",
  IMG: "#10b981",
};

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (diff < 1) return "Vừa xong";
  if (diff < 60) return `${diff} phút trước`;
  if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`;
  const days = Math.floor(diff / 1440);
  if (days === 1) return "Hôm qua";
  return `${days} ngày trước`;
}

function getRecentChats() {
  try {
    const sessions = JSON.parse(localStorage.getItem("chatSessions")) || [];
    return sessions
      .filter((s) => s.messages && s.messages.length > 0)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 3)
      .map((s) => {
        const firstUserMsg = s.messages.find((m) => m.role === "user");
        return {
          id: s.id,
          question: firstUserMsg?.content || s.name,
          doc: s.docs?.length > 0 ? s.docs[0].name : null,
          time: timeAgo(s.updatedAt),
        };
      });
  } catch {
    return [];
  }
}


function formatSize(bytes) {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function sizeLabel(mb) {
  return mb >= 1 ? `${mb} MB` : `${(mb * 1024).toFixed(0)} KB`;
}

function getChatSessionCount() {
  try {
    const sessions = JSON.parse(localStorage.getItem("chatSessions")) || [];
    return sessions.length;
  } catch {
    return 0;
  }
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [recentChats, setRecentChats] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  useEffect(() => {
    setRecentChats(getRecentChats());
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      setLoadingDocs(true);
      const result = await getDocuments();
      const data = result?.data || result || [];
      const mapped = (Array.isArray(data) ? data : []).map((d) => ({
        id: d.id || d.documentId || d.document_id,
        name: d.documentName || d.name || "Untitled",
        ext: (d.fileType || d.ext || "PDF").toUpperCase(),
        subject: d.subject || "Tài liệu",
        fileSize: d.fileSize || 0,
        sizeMB: d.fileSize ? Number((d.fileSize / 1048576).toFixed(2)) : 0,
        date: d.createdAt || d.date || new Date().toISOString(),
      }));
      setDocs(mapped);
    } catch (err) {
      console.error("Dashboard load docs error:", err);
    } finally {
      setLoadingDocs(false);
    }
  }

  const totalBytes = docs.reduce((s, d) => s + d.fileSize, 0);
  const chatCount = getChatSessionCount();
  const recentDocs = [...docs]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);

  const oneWeekAgo = new Date(Date.now() - 7 * 86400000);
  const docsThisWeek = docs.filter((d) => new Date(d.date) >= oneWeekAgo).length;

  const STATS = [
    {
      icon: "📁",
      label: "Tài liệu",
      value: `${docs.length}`,
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
  ];
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? "Chào buổi sáng"
      : hour < 18
        ? "Chào buổi chiều"
        : "Chào buổi tối";

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const displayName = storedUser.fullName || storedUser.name || storedUser.email || 'Người dùng'
  const initials = displayName.includes('@')
    ? displayName[0].toUpperCase()
    : displayName.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()

  return (
    <AppLayout>
      <div className="dashboard">
        {/* ── Top bar ── */}
        <div className="dash-topbar">
          <div className="dash-greeting">
            <h1>{greeting}, {displayName} 👋</h1>
            <p>Hôm nay bạn muốn học gì?</p>
          </div>
          <div className="dash-topbar-right">
            <button className="notif-btn" title="Thông báo">
              🔔
              <span className="notif-badge">3</span>
            </button>
            <div className="user-chip">
              <div className="user-avatar">{initials}</div>
              <div className="user-info">
                <span className="user-name">{displayName}</span>
                <span className="user-plan">Gói miễn phí</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Upgrade banner ── */}
        <div className="upgrade-banner">
          <div className="upgrade-text">
            <span className="upgrade-icon">⚡</span>
            <div>
              <strong>Nâng cấp lên Premium</strong>
              <span>
                {" "}
                — Tăng dung lượng lên 50 GB, AI không giới hạn, tài liệu độc
                quyền
              </span>
            </div>
          </div>
          <button className="upgrade-btn" onClick={() => navigate("/courses")}>
            Xem gói Premium →
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="stats-grid">
          {STATS.map((s) => (
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

        {/* ── Quick actions ── */}
        <div className="section-header">
          <h2 className="section-title">Thao tác nhanh</h2>
        </div>
        <div className="quick-actions">
          <button
            className="qa-card qa-upload"
            onClick={() => navigate("/documents")}
          >
            <div className="qa-icon-wrap">⬆️</div>
            <span className="qa-label">Upload Tài liệu</span>
            <span className="qa-desc">Thêm tài liệu mới</span>
          </button>
          <button
            className="qa-card qa-chat"
            onClick={() => navigate("/chatbot")}
          >
            <div className="qa-icon-wrap">🤖</div>
            <span className="qa-label">Hỏi AI Chatbot</span>
            <span className="qa-desc">Hỏi về tài liệu của bạn</span>
          </button>
          <button
            className="qa-card qa-forum"
            onClick={() => navigate("/forum")}
          >
            <div className="qa-icon-wrap">🗣️</div>
            <span className="qa-label">Vào Diễn đàn</span>
            <span className="qa-desc">Trao đổi với sinh viên</span>
          </button>
        </div>

        {/* ── Two-column main grid ── */}
        <div className="dash-grid">
          {/* Recent documents */}
          <div className="dash-card">
            <div className="dash-card-head">
              <h2>Tài liệu gần đây</h2>
              <button
                className="see-all-btn"
                onClick={() => navigate("/documents")}
              >
                Xem tất cả →
              </button>
            </div>
            <div className="doc-list">
              {recentDocs.length > 0 ? (
                recentDocs.map((doc) => (
                  <div key={doc.id} className="doc-row">
                    <div className="doc-ext" style={{ background: EXT_COLOR[doc.ext] || "#6b7280" }}>
                      {doc.ext}
                    </div>
                    <div className="doc-meta">
                      <p className="doc-name">{doc.name}</p>
                      <p className="doc-sub">
                        {doc.subject} · {sizeLabel(doc.sizeMB)}
                      </p>
                    </div>
                    <div className="doc-right">
                      <span className="doc-date">{timeAgo(doc.date)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: "center", color: "#888", padding: 16 }}>
                  {loadingDocs ? "Đang tải..." : "Chưa có tài liệu nào"}
                </p>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="dash-col-right">
            {/* Recent AI chats */}
            <div className="dash-card">
              <div className="dash-card-head">
                <h2>Lịch sử Chat AI</h2>
                <button
                  className="see-all-btn"
                  onClick={() => navigate("/chatbot")}
                >
                  Xem tất cả →
                </button>
              </div>
              <div className="chat-list">
                {recentChats.length > 0 ? (
                  recentChats.map((chat) => (
                    <div key={chat.id} className="chat-row" onClick={() => navigate("/chatbot")} style={{ cursor: "pointer" }}>
                      <div className="chat-ai-dot">AI</div>
                      <div className="chat-meta">
                        <p className="chat-question">{chat.question}</p>
                        {chat.doc && <p className="chat-doc">📄 {chat.doc}</p>}
                      </div>
                      <span className="chat-time">{chat.time}</span>
                    </div>
                  ))
                ) : (
                  <p style={{ textAlign: "center", color: "#888", padding: 16 }}>
                    Chưa có cuộc trò chuyện nào
                  </p>
                )}
              </div>
              <button
                className="new-chat-btn"
                onClick={() => navigate("/chatbot")}
              >
                + Bắt đầu chat mới
              </button>
            </div>

            {/* Forum activity */}
            <div className="dash-card">
              <div className="dash-card-head">
                <h2>Hoạt động Forum</h2>
                <button
                  className="see-all-btn"
                  onClick={() => navigate("/forum")}
                >
                  Xem tất cả →
                </button>
              </div>
              <div className="activity-list">
                <p style={{ textAlign: "center", color: "#888", padding: 16 }}>
                  Chưa có hoạt động nào
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
