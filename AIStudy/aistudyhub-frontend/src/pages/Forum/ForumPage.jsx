import { useState, useEffect } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { getPublicDocuments, getDocuments, previewDocumentFile, downloadDocumentFile } from "../../apis/documentApi";
import "./ForumPage.css";

const SUBJECTS = ["Tất cả", "Lập trình Web", "Cơ sở dữ liệu", "Trí tuệ nhân tạo", "Mạng máy tính", "Giải tích", "Vật lý đại cương"];
const FILE_TYPES = ["Tất cả", "PDF", "PPT", "DOC", "IMG"];
const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "rating", label: "Đánh giá cao" },
  { value: "downloads", label: "Tải nhiều" },
];
const EXT_COLOR = { PDF: "#ef4444", PPT: "#f97316", DOC: "#3b82f6", DOCX: "#3b82f6", IMG: "#10b981", JPEG: "#10b981", PNG: "#10b981" };
const HOT_TAGS = ["OOP", "SQL", "React", "AI", "Đề thi", "Slide", "Thuật toán", "Node.js", "Docker", "Git"];
const REPORT_REASONS = ["Nội dung vi phạm bản quyền", "Nội dung không phù hợp", "Spam hoặc quảng cáo", "Thông tin sai lệch", "Khác"];

function mapDoc(d) {
  return {
    id: d.id || d.documentId || d.document_id,
    name: d.documentName || d.name || "Untitled",
    ext: (d.fileType || d.ext || "PDF").toUpperCase(),
    subject: d.subject || "Tài liệu",
    sizeMB: d.fileSize ? Number((d.fileSize / 1048576).toFixed(2)) : 0,
    fileSize: d.fileSize || 0,
    date: d.createdAt ? d.createdAt.slice(0, 10) : d.date || new Date().toISOString().slice(0, 10),
    tags: Array.isArray(d.tags) ? d.tags : [],
    privacy: d.privacy || "public",
    downloads: d.downloads || 0,
    description: d.description || d.textContent || "",
    author: d.authorName || d.uploaderName || "Ẩn danh",
    authorAvatar: d.authorAvatar || null,
    rating: d.averageRating || 0,
    ratingCount: d.ratingCount || 0,
    commentCount: d.commentCount || 0,
  };
}

function sizeLabel(mb) {
  return mb >= 1 ? `${mb} MB` : `${(mb * 1024).toFixed(0)} KB`;
}

function relativeDate(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (diff === 0) return "Hôm nay";
  if (diff === 1) return "Hôm qua";
  if (diff < 7) return `${diff} ngày trước`;
  if (diff < 30) return `${Math.floor(diff / 7)} tuần trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase();
}

function StarRating({ value, onChange, readonly = false, size = 20 }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-rating" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= (hover || value) ? "star--filled" : ""} ${readonly ? "star--readonly" : ""}`}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function ReportModal({ doc, onClose, onSubmit }) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [detail, setDetail] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ docId: doc.id, reason, detail });
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--sm">
        <div className="modal-header">
          <h2>🚩 Báo cáo tài liệu</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          <p style={{ margin: "0 0 12px", fontSize: "0.86rem", color: "#6b7280" }}>
            Báo cáo: <strong>{doc.name}</strong>
          </p>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: 6 }}>Lý do</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: "0.87rem" }}>
              {REPORT_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: 6 }}>Chi tiết (tùy chọn)</label>
            <textarea value={detail} onChange={(e) => setDetail(e.target.value)} rows={3} placeholder="Mô tả thêm..." style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: "0.87rem", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
          </div>
          <div className="modal-footer" style={{ padding: 0 }}>
            <button type="button" className="btn-cancel" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-danger">🚩 Gửi báo cáo</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DocDetailModal({ doc, onClose, onRate, onReport }) {
  const [comments, setComments] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`doc-comments-${doc.id}`)) || [];
    } catch { return []; }
  });
  const [commentInput, setCommentInput] = useState("");
  const [myRating, setMyRating] = useState(() => {
    try {
      return Number(localStorage.getItem(`doc-rating-${doc.id}`)) || 0;
    } catch { return 0; }
  });
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userName = storedUser.fullName || storedUser.name || storedUser.email || "Bạn";

  function handleAddComment() {
    const text = commentInput.trim();
    if (!text) return;
    const newComment = {
      id: Date.now(),
      author: userName,
      avatar: getInitials(userName),
      content: text,
      time: "Vừa xong",
      likes: 0,
      liked: false,
    };
    const updated = [...comments, newComment];
    setComments(updated);
    localStorage.setItem(`doc-comments-${doc.id}`, JSON.stringify(updated));
    setCommentInput("");
  }

  function toggleLikeComment(id) {
    const updated = comments.map((c) => c.id === id ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 } : c);
    setComments(updated);
    localStorage.setItem(`doc-comments-${doc.id}`, JSON.stringify(updated));
  }

  function handleRate(stars) {
    setMyRating(stars);
    localStorage.setItem(`doc-rating-${doc.id}`, stars);
    onRate?.(doc.id, stars);
  }

  async function handlePreview() {
    setShowPreview(true);
    setPreviewUrl("");
    setPreviewError("");
    try {
      const blob = await previewDocumentFile(doc.id);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch {
      setPreviewError("Không thể tải xem trước.");
    }
  }

  async function handleDownload() {
    try {
      const blob = await downloadDocumentFile(doc.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.name}.${doc.ext.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Không thể tải tài liệu.");
    }
  }

  const isImage = ["IMG", "JPEG", "PNG"].includes(doc.ext);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--lg modal--post">
        <div className="modal-header">
          <div className="post-detail-cats">
            <span className="doc-ext-badge" style={{ background: EXT_COLOR[doc.ext] || "#6b7280" }}>{doc.ext}</span>
            <span className="post-subject-badge">{doc.subject}</span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="post-detail-body">
          <h2 className="post-detail-title">{doc.name}</h2>

          <div className="post-detail-meta">
            <div className="post-author-chip">
              <div className="author-avatar">{doc.authorAvatar || getInitials(doc.author)}</div>
              <div>
                <p className="author-name">{doc.author}</p>
                <p className="post-time">{relativeDate(doc.date)}</p>
              </div>
            </div>
            <div className="post-detail-stats">
              <span>{sizeLabel(doc.sizeMB)}</span>
              <span>💬 {comments.length}</span>
              <span>⬇️ {doc.downloads}</span>
            </div>
          </div>

          {doc.description && (
            <div className="post-detail-content">
              {doc.description.split("\n").map((line, i) => <p key={i} className="content-line">{line}</p>)}
            </div>
          )}

          {doc.tags.length > 0 && (
            <div className="post-tags-row">
              {doc.tags.map((t) => <span key={t} className="tag">#{t}</span>)}
            </div>
          )}

          {showPreview && (
            <div style={{ margin: "16px 0", border: "1px solid #e5e7eb", borderRadius: 12, background: "#f9fafb", overflow: "hidden", minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {previewError ? (
                <p style={{ color: "#ef4444", padding: 32 }}>{previewError}</p>
              ) : !previewUrl ? (
                <p style={{ color: "#6b7280", padding: 32 }}>Đang tải xem trước...</p>
              ) : isImage ? (
                <img src={previewUrl} alt={doc.name} style={{ maxWidth: "100%", maxHeight: "50vh", objectFit: "contain" }} />
              ) : (
                <iframe src={previewUrl} title={doc.name} style={{ width: "100%", height: "50vh", border: "none" }} />
              )}
            </div>
          )}

          <div className="post-detail-actions">
            {!showPreview && <button className="action-btn" onClick={handlePreview}>👁️ Xem trước</button>}
            <button className="action-btn" onClick={handleDownload}>⬇️ Tải xuống</button>
            <button className="action-btn action-btn--report" onClick={() => onReport(doc)}>🚩 Báo cáo</button>
          </div>

          <div className="rating-section">
            <h3 className="comments-title">Đánh giá tài liệu</h3>
            <div className="rating-row">
              <StarRating value={myRating} onChange={handleRate} size={24} />
              <span className="rating-label">
                {myRating > 0 ? `Bạn đã đánh giá ${myRating}/5 sao` : "Nhấn để đánh giá"}
              </span>
            </div>
            {doc.ratingCount > 0 && (
              <p className="rating-avg">Trung bình: {doc.rating.toFixed(1)}/5 ({doc.ratingCount} đánh giá)</p>
            )}
          </div>

          <div className="comments-section">
            <h3 className="comments-title">Bình luận ({comments.length})</h3>
            {comments.length === 0 && <p className="no-comments">Chưa có bình luận. Hãy là người đầu tiên!</p>}
            {comments.map((cm) => (
              <div key={cm.id} className="comment-item">
                <div className="comment-avatar">{cm.avatar}</div>
                <div className="comment-body">
                  <div className="comment-header">
                    <span className="comment-author">{cm.author}</span>
                    <span className="comment-time">{cm.time}</span>
                  </div>
                  <p className="comment-text">{cm.content}</p>
                  <button className={`comment-like-btn${cm.liked ? " liked" : ""}`} onClick={() => toggleLikeComment(cm.id)}>
                    ❤️ {cm.likes}
                  </button>
                </div>
              </div>
            ))}
            <div className="add-comment">
              <div className="comment-avatar own-avatar">{getInitials(userName)}</div>
              <div className="comment-input-wrap">
                <textarea
                  className="comment-textarea"
                  rows={2}
                  placeholder="Viết bình luận..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                />
                <button className="comment-send-btn" onClick={handleAddComment} disabled={!commentInput.trim()}>Gửi</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PublicDocCard({ doc, onOpen }) {
  return (
    <div className="post-card" onClick={() => onOpen(doc)}>
      <div className="post-card-top">
        <div className="post-cats">
          <span className="doc-ext-badge" style={{ background: EXT_COLOR[doc.ext] || "#6b7280" }}>{doc.ext}</span>
          <span className="post-subject-badge">{doc.subject}</span>
        </div>
        <span className="post-time">{relativeDate(doc.date)}</span>
      </div>

      <h3 className="post-title">{doc.name}</h3>
      {doc.description && <p className="post-excerpt">{doc.description.slice(0, 120)}{doc.description.length > 120 ? "..." : ""}</p>}

      {doc.tags.length > 0 && (
        <div className="post-tags-row">
          {doc.tags.slice(0, 3).map((t) => <span key={t} className="tag">#{t}</span>)}
          {doc.tags.length > 3 && <span className="tag tag--more">+{doc.tags.length - 3}</span>}
        </div>
      )}

      <div className="doc-card-rating-row">
        <StarRating value={Math.round(doc.rating)} readonly size={14} />
        {doc.ratingCount > 0 && <span className="rating-count">({doc.ratingCount})</span>}
      </div>

      <div className="post-card-footer">
        <div className="post-author">
          <div className="author-avatar author-avatar--sm">{doc.authorAvatar || getInitials(doc.author)}</div>
          <span className="author-name-sm">{doc.author}</span>
        </div>
        <div className="post-stats">
          <span className="stat-btn">💬 {doc.commentCount}</span>
          <span className="stat-btn">⬇️ {doc.downloads}</span>
          <span className="stat-btn">{sizeLabel(doc.sizeMB)}</span>
        </div>
      </div>
    </div>
  );
}

export default function ForumPage() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("Tất cả");
  const [fileType, setFileType] = useState("Tất cả");
  const [sortBy, setSortBy] = useState("newest");
  const [detailDoc, setDetailDoc] = useState(null);
  const [reportDoc, setReportDoc] = useState(null);

  useEffect(() => {
    loadPublicDocs();
  }, []);

  async function loadPublicDocs() {
    try {
      setLoading(true);
      let result;
      try {
        result = await getPublicDocuments();
      } catch {
        result = await getDocuments();
      }
      const data = result?.data || result || [];
      setDocs((Array.isArray(data) ? data : []).map(mapDoc));
    } catch (err) {
      console.error("Load public docs error:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = [...docs]
    .filter((d) => {
      const q = search.toLowerCase();
      const matchSearch = !q || d.name.toLowerCase().includes(q) || d.subject.toLowerCase().includes(q) || d.description.toLowerCase().includes(q) || d.tags.some((t) => t.toLowerCase().includes(q));
      const matchSubject = subject === "Tất cả" || d.subject === subject;
      const matchType = fileType === "Tất cả" || d.ext === fileType;
      return matchSearch && matchSubject && matchType;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.date) - new Date(a.date);
      if (sortBy === "oldest") return new Date(a.date) - new Date(b.date);
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "downloads") return b.downloads - a.downloads;
      return 0;
    });

  function handleReport(submission) {
    console.log("Report submitted:", submission);
    alert("Đã gửi báo cáo. Cảm ơn bạn!");
    setReportDoc(null);
  }

  function handleRate(docId, stars) {
    setDocs((prev) => prev.map((d) => d.id === docId ? { ...d, rating: stars, ratingCount: d.ratingCount + 1 } : d));
  }

  return (
    <AppLayout>
      <div className="forum-page">
        <div className="forum-header">
          <div>
            <h1 className="forum-title">Tài liệu cộng đồng</h1>
            <p className="forum-sub">{docs.length} tài liệu công khai · Khám phá và chia sẻ tài liệu học tập</p>
          </div>
        </div>

        <div className="forum-layout">
          <div className="forum-feed">
            <div className="forum-toolbar">
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input className="search-input" type="text" placeholder="Tìm tài liệu theo tên, môn học, tag..." value={search} onChange={(e) => setSearch(e.target.value)} />
                {search && <button className="search-clear" onClick={() => setSearch("")}>✕</button>}
              </div>
              <select className="filter-select" value={subject} onChange={(e) => setSubject(e.target.value)}>
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
              <select className="filter-select" value={fileType} onChange={(e) => setFileType(e.target.value)}>
                {FILE_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
              <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {(search || subject !== "Tất cả" || fileType !== "Tất cả") && (
              <p className="results-label" style={{ margin: "0 0 12px", fontSize: "0.86rem", color: "#6b7280" }}>
                Tìm thấy <strong>{filtered.length}</strong> tài liệu
                {search && <> cho "<em>{search}</em>"</>}{" "}
                <button className="clear-filters" onClick={() => { setSearch(""); setSubject("Tất cả"); setFileType("Tất cả"); }} style={{ background: "none", border: "none", color: "#0066ff", cursor: "pointer", fontSize: "0.84rem", fontWeight: 600 }}>
                  Xóa bộ lọc
                </button>
              </p>
            )}

            {loading ? (
              <div className="forum-empty">
                <div className="empty-icon">⏳</div>
                <p className="empty-title">Đang tải tài liệu...</p>
              </div>
            ) : filtered.length > 0 ? (
              <div className="posts-list">
                {filtered.map((doc) => (
                  <PublicDocCard key={doc.id} doc={doc} onOpen={setDetailDoc} />
                ))}
              </div>
            ) : (
              <div className="forum-empty">
                <div className="empty-icon">📭</div>
                <p className="empty-title">{docs.length === 0 ? "Chưa có tài liệu công khai" : "Không tìm thấy tài liệu phù hợp"}</p>
                <p className="empty-sub">{docs.length === 0 ? "Hãy upload tài liệu công khai đầu tiên từ trang Tổng quan!" : "Thử thay đổi từ khóa hoặc bộ lọc"}</p>
              </div>
            )}
          </div>

          <aside className="forum-sidebar">
            <div className="sidebar-widget">
              <h3 className="widget-title">Loại file</h3>
              <div className="widget-categories">
                {FILE_TYPES.map((t) => (
                  <button
                    key={t}
                    className={`widget-cat-btn${fileType === t ? " widget-cat-btn--active" : ""}`}
                    onClick={() => setFileType(t === fileType ? "Tất cả" : t)}
                  >
                    {t !== "Tất cả" && <span className="widget-cat-dot" style={{ background: EXT_COLOR[t] || "#6b7280" }} />}
                    {t}
                    <span className="widget-cat-count">{t === "Tất cả" ? docs.length : docs.filter((d) => d.ext === t).length}</span>
                  </button>
                ))}
              </div>
            </div>

<div className="sidebar-widget widget-cta">
              <div className="cta-icon">📤</div>
              <h3>Chia sẻ tài liệu?</h3>
              <p>Upload tài liệu công khai để giúp đỡ các bạn sinh viên khác</p>
            </div>

          </aside>
        </div>
      </div>

      {detailDoc && (
        <DocDetailModal
          doc={detailDoc}
          onClose={() => setDetailDoc(null)}
          onRate={handleRate}
          onReport={(doc) => { setDetailDoc(null); setReportDoc(doc); }}
        />
      )}

      {reportDoc && (
        <ReportModal
          doc={reportDoc}
          onClose={() => setReportDoc(null)}
          onSubmit={handleReport}
        />
      )}
    </AppLayout>
  );
}
