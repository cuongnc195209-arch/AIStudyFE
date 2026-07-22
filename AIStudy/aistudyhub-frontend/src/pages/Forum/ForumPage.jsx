import { useEffect, useRef, useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import Swal from "sweetalert2";
import { renderAsync } from "docx-preview";
import {
  getPublicDocuments,
  previewDocumentFile,
  downloadDocumentFile,
} from "../../apis/documentApi";
import "./ForumPage.css";
import {
  createDocumentReport,
  REPORT_REASON_OPTIONS,
} from "../../apis/reportApi";

const SUBJECTS = [
  "Tất cả",
  "PRF192",
  "MAE101",
  "CSI104",
  "CEA201",
  "PRO192",
  "MAD101",
  "OSG202",
  "CSD201",
  "DBI202",
  "LAB211",
  "PRJ301",
  "MAS291",
  "SWR302",
  "SWT301",
  "PRN212",
  "OTHER",
];

const FILE_TYPES = ["Tất cả", "PDF", "PPT", "DOC", "IMG"];

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "downloads", label: "Tải nhiều" },
];

const EXT_COLOR = {
  PDF: "#ef4444",
  PPT: "#f97316",
  PPTX: "#f97316",
  DOC: "#3b82f6",
  DOCX: "#3b82f6",
  IMG: "#10b981",
  JPG: "#10b981",
  JPEG: "#10b981",
  PNG: "#10b981",
};

const HOT_TAGS = [
  "OOP",
  "SQL",
  "React",
  "AI",
  "Đề thi",
  "Slide",
  "Thuật toán",
  "Node.js",
  "Docker",
  "Git",
];

function showToast({ icon = "success", title, text }) {
  Swal.fire({
    toast: true,
    position: "top-end",
    icon,
    title,
    text,
    showConfirmButton: false,
    timer: 2200,
    timerProgressBar: true,
  });
}

function normalizeExt(d) {
  const raw = String(d.fileType || d.ext || d.mimeType || "").toLowerCase();
  const fileName = String(d.documentName || d.name || "").toLowerCase();

  if (raw.includes("pdf") || fileName.endsWith(".pdf")) {
    return "PDF";
  }

  if (
    raw.includes("ppt") ||
    raw.includes("powerpoint") ||
    raw.includes("presentation") ||
    fileName.endsWith(".ppt") ||
    fileName.endsWith(".pptx")
  ) {
    return "PPT";
  }

  if (
    raw.includes("doc") ||
    raw.includes("word") ||
    raw.includes("msword") ||
    fileName.endsWith(".doc") ||
    fileName.endsWith(".docx")
  ) {
    return "DOC";
  }

  if (
    raw.includes("image") ||
    raw.includes("png") ||
    raw.includes("jpg") ||
    raw.includes("jpeg") ||
    fileName.endsWith(".png") ||
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg")
  ) {
    return "IMG";
  }

  return String(d.ext || d.fileType || "PDF").toUpperCase();
}

function isPublicDocument(d) {
  return (
    d.isPublic === true ||
    d.isPublic === "true" ||
    d.is_public === true ||
    d.is_public === "true" ||
    d.public === true ||
    d.public === "true" ||
    d.privacy === "public"
  );
}

function resolveAuthorName(d) {
  return (
    d.userFullName ||
    d.ownerName ||
    d.fullName ||
    d.authorName ||
    d.uploaderName ||
    d.userName ||
    d.owner ||
    d.author ||
    d.userEmail ||
    d.email ||
    "Ẩn danh"
  );
}

function resolveSubject(d) {
  return (
    d.subjectCode || d.subject || d.categoryName || d.category || "Tài liệu"
  );
}

function mapDoc(d) {
  const isPublic = isPublicDocument(d);
  const ext = normalizeExt(d);
  const author = resolveAuthorName(d);

  return {
    id: d.id || d.documentId || d.document_id,
    name: d.documentName || d.name || "Untitled",
    ext,
    subject: resolveSubject(d),
    sizeMB: d.fileSize ? Number((Number(d.fileSize) / 1048576).toFixed(2)) : 0,
    fileSize: d.fileSize || 0,
    date: d.createdAt
      ? String(d.createdAt).slice(0, 10)
      : d.date || new Date().toISOString().slice(0, 10),
    tags: Array.isArray(d.tags) ? d.tags : [],
    privacy: isPublic ? "public" : "private",
    isPublic,
    downloads: d.downloads || d.downloadCount || 0,
    description: d.description || d.textContent || "",
    author,
    authorAvatar: d.authorAvatar || getInitials(author),
  };
}

function sizeLabel(mb) {
  if (!mb || Number(mb) <= 0) {
    return "0 KB";
  }

  return mb >= 1 ? `${mb} MB` : `${(mb * 1024).toFixed(0)} KB`;
}

function relativeDate(dateStr, nowTime) {
  const time = new Date(dateStr).getTime();

  if (Number.isNaN(time)) {
    return "";
  }

  const diff = Math.floor((nowTime - time) / 86400000);

  if (diff <= 0) {
    return "Hôm nay";
  }

  if (diff === 1) {
    return "Hôm qua";
  }

  if (diff < 7) {
    return `${diff} ngày trước`;
  }

  if (diff < 30) {
    return `${Math.floor(diff / 7)} tuần trước`;
  }

  return new Date(dateStr).toLocaleDateString("vi-VN");
}

function getInitials(name) {
  if (!name) {
    return "?";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .slice(-2)
    .join("")
    .toUpperCase();
}

function ReportModal({ doc, onClose, onSubmit }) {
  const [reason, setReason] = useState(REPORT_REASON_OPTIONS[0].code);
  const [detail, setDetail] = useState("");

  const selectedReason = REPORT_REASON_OPTIONS.find(
    (item) => item.code === reason,
  );

  function handleSubmit(e) {
    e.preventDefault();

    if (reason === "OTHER" && !detail.trim()) {
      showToast({
        icon: "warning",
        title: "Thiếu mô tả",
        text: "Khi chọn lý do khác, bạn cần nhập mô tả chi tiết.",
      });

      return;
    }

    onSubmit({
      documentId: doc.id,
      reason,
      description: detail,
    });
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal modal--sm">
        <div className="modal-header">
          <h2>🚩 Báo cáo tài liệu</h2>

          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <p
            style={{
              margin: "0 0 12px",
              fontSize: "0.86rem",
              color: "#6b7280",
            }}
          >
            Báo cáo: <strong>{doc.name}</strong>
          </p>

          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: "block",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "#374151",
                marginBottom: 6,
              }}
            >
              Lý do
            </label>

            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                fontSize: "0.87rem",
              }}
            >
              {REPORT_REASON_OPTIONS.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.description}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: "block",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "#374151",
                marginBottom: 6,
              }}
            >
              Chi tiết {selectedReason?.code === "OTHER" ? "*" : ""}
            </label>

            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={3}
              placeholder="Mô tả thêm vấn đề của tài liệu..."
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                fontSize: "0.87rem",
                fontFamily: "inherit",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div className="modal-footer" style={{ padding: 0 }}>
            <button type="button" className="btn-cancel" onClick={onClose}>
              Hủy
            </button>

            <button type="submit" className="btn-danger">
              🚩 Gửi báo cáo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DocDetailModal({ doc, nowTime, onClose, onReport }) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewBlob, setPreviewBlob] = useState(null);
  const [previewError, setPreviewError] = useState("");
  const [docxError, setDocxError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const docxContainerRef = useRef(null);

  const ext = String(doc.ext || "").toUpperCase();

  const isImage = ["IMG", "JPG", "JPEG", "PNG"].includes(ext);
  const isPdf = ext === "PDF";
  const isDoc = ext === "DOC" || ext === "DOCX";

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!showPreview || !isDoc || !previewBlob || !docxContainerRef.current) {
      return;
    }

    let cancelled = false;

    setDocxError("");
    docxContainerRef.current.innerHTML = "";

    renderAsync(previewBlob, docxContainerRef.current, undefined, {
      ignoreWidth: true,
      ignoreHeight: true,
      className: "docx",
    }).catch(() => {
      if (!cancelled) {
        setDocxError(
          "Không thể hiển thị file Word này. Nếu đây là file .doc cũ, vui lòng tải xuống để xem.",
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [showPreview, isDoc, previewBlob]);

  async function handlePreview() {
    setShowPreview(true);
    setPreviewUrl("");
    setPreviewBlob(null);
    setPreviewError("");
    setDocxError("");

    try {
      const result = await previewDocumentFile(doc.id);

      const blob = result?.blob instanceof Blob ? result.blob : result;
      const url = result?.url || URL.createObjectURL(blob);

      setPreviewBlob(blob);
      setPreviewUrl(url);
    } catch (err) {
      setPreviewError(err?.message || "Không thể tải xem trước tài liệu.");
    }
  }

  async function handleDownload() {
    try {
      const result = await downloadDocumentFile(doc.id);

      const blob = result?.blob instanceof Blob ? result.blob : result;
      const url = result?.url || URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;
      a.download =
        result?.fileName || `${doc.name}.${String(doc.ext).toLowerCase()}`;

      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      showToast({
        icon: "error",
        title: "Không thể tải tài liệu",
        text: err?.message || "Vui lòng thử lại sau.",
      });
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal modal--lg modal--post">
        <div className="modal-header">
          <div className="post-detail-cats">
            <span
              className="doc-ext-badge"
              style={{ background: EXT_COLOR[doc.ext] || "#6b7280" }}
            >
              {doc.ext}
            </span>

            <span className="post-subject-badge">
              {doc.subject || "Tài liệu"}
            </span>
          </div>

          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="post-detail-body">
          <h2 className="post-detail-title">{doc.name}</h2>

          <div className="post-detail-meta">
            <div className="post-author-chip">
              <div className="author-avatar">
                {doc.authorAvatar || getInitials(doc.author)}
              </div>

              <div>
                <p className="author-name">{doc.author || "Ẩn danh"}</p>
                <p className="post-time">{relativeDate(doc.date, nowTime)}</p>
              </div>
            </div>

            <div className="post-detail-stats">
              <span>{sizeLabel(doc.sizeMB)}</span>
              <span>⬇️ {doc.downloads || 0}</span>
            </div>
          </div>

          {doc.description && (
            <div className="post-detail-content">
              {doc.description.split("\n").map((line, index) => (
                <p key={index} className="content-line">
                  {line}
                </p>
              ))}
            </div>
          )}

          {doc.tags?.length > 0 && (
            <div className="post-tags-row">
              {doc.tags.map((tag) => (
                <span key={tag} className="tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {showPreview && (
            <div
              style={{
                margin: "16px 0",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                background: "#f9fafb",
                overflow: isDoc ? "auto" : "hidden",
                minHeight: 220,
                maxHeight: isDoc ? "60vh" : undefined,
                display: isDoc ? "block" : "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {previewError ? (
                <p style={{ color: "#ef4444", padding: 32 }}>{previewError}</p>
              ) : !previewUrl ? (
                <p style={{ color: "#6b7280", padding: 32 }}>
                  Đang tải xem trước...
                </p>
              ) : isImage ? (
                <img
                  src={previewUrl}
                  alt={doc.name}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "55vh",
                    objectFit: "contain",
                  }}
                />
              ) : isPdf ? (
                <iframe
                  src={previewUrl}
                  title={doc.name}
                  style={{
                    width: "100%",
                    height: "55vh",
                    border: "none",
                  }}
                />
              ) : isDoc ? (
                docxError ? (
                  <p style={{ color: "#ef4444", padding: 32 }}>{docxError}</p>
                ) : (
                  <div
                    ref={docxContainerRef}
                    className="docx-preview-container"
                    style={{
                      padding: 16,
                      background: "#ffffff",
                      width: "100%",
                    }}
                  />
                )
              ) : (
                <p style={{ color: "#6b7280", padding: 32 }}>
                  Loại file này chưa hỗ trợ xem trước. Vui lòng tải xuống để xem
                  tài liệu.
                </p>
              )}
            </div>
          )}

          <div className="post-detail-actions">
            {!showPreview && (
              <button className="action-btn" onClick={handlePreview}>
                👁️ Xem trước
              </button>
            )}

            <button className="action-btn" onClick={handleDownload}>
              ⬇️ Tải xuống
            </button>

            <button
              className="action-btn action-btn--report"
              onClick={() => onReport(doc)}
            >
              🚩 Báo cáo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PublicDocCard({ doc, nowTime, onOpen }) {
  return (
    <div className="post-card" onClick={() => onOpen(doc)}>
      <div className="post-card-top">
        <div className="post-cats">
          <span
            className="doc-ext-badge"
            style={{ background: EXT_COLOR[doc.ext] || "#6b7280" }}
          >
            {doc.ext}
          </span>

          <span className="post-subject-badge">{doc.subject}</span>

          {!doc.isPublic && (
            <span className="post-shared-badge">🔗 Chia sẻ riêng</span>
          )}
        </div>

        <span className="post-time">{relativeDate(doc.date, nowTime)}</span>
      </div>

      <h3 className="post-title">{doc.name}</h3>

      {doc.description && (
        <p className="post-excerpt">
          {doc.description.slice(0, 120)}
          {doc.description.length > 120 ? "..." : ""}
        </p>
      )}

      {doc.tags.length > 0 && (
        <div className="post-tags-row">
          {doc.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag">
              #{tag}
            </span>
          ))}

          {doc.tags.length > 3 && (
            <span className="tag tag--more">+{doc.tags.length - 3}</span>
          )}
        </div>
      )}

      <div className="post-card-footer">
        <div className="post-author">
          <div className="author-avatar author-avatar--sm">
            {doc.authorAvatar || getInitials(doc.author)}
          </div>

          <span className="author-name-sm">{doc.author || "Ẩn danh"}</span>
        </div>

        <div className="post-stats">
          <span className="stat-btn">⬇️ {doc.downloads || 0}</span>
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
  const [nowTime] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;

    async function fetchPublicDocs() {
      try {
        const result = await getPublicDocuments();
        const data = result?.data || result || [];

        if (cancelled) {
          return;
        }

        const publicDocs = Array.isArray(data) ? data.map(mapDoc) : [];

        setDocs(publicDocs);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error("Load public docs error:", err);
        setDocs([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPublicDocs();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = [...docs]
    .filter((doc) => {
      const q = search.toLowerCase();

      const matchSearch =
        !q ||
        doc.name.toLowerCase().includes(q) ||
        doc.subject.toLowerCase().includes(q) ||
        doc.description.toLowerCase().includes(q) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(q));

      const matchSubject = subject === "Tất cả" || doc.subject === subject;
      const matchType = fileType === "Tất cả" || doc.ext === fileType;

      return matchSearch && matchSubject && matchType;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.date) - new Date(a.date);
      }

      if (sortBy === "oldest") {
        return new Date(a.date) - new Date(b.date);
      }

      if (sortBy === "downloads") {
        return b.downloads - a.downloads;
      }

      return 0;
    });

  async function handleReport(submission) {
    try {
      await createDocumentReport({
        documentId: submission.documentId,
        reason: submission.reason,
        description: submission.description,
      });

      showToast({
        icon: "success",
        title: "Đã gửi báo cáo",
        text: "Báo cáo của bạn đã được gửi tới Admin/Moderator.",
      });

      setReportDoc(null);
    } catch (err) {
      console.error("Create report error:", err);

      showToast({
        icon: "error",
        title: "Không thể gửi báo cáo",
        text: err?.message || err?.data?.message || "Vui lòng thử lại sau.",
      });
    }
  }

  return (
    <AppLayout>
      <div className="forum-page">
        <div className="forum-header">
          <div>
            <h1 className="forum-title">Tài liệu cộng đồng</h1>

            <p className="forum-sub">
              {docs.length} tài liệu công khai · Khám phá và chia sẻ tài liệu
              học tập
            </p>
          </div>
        </div>

        <div className="forum-layout">
          <div className="forum-feed">
            <div className="forum-toolbar">
              <div className="search-wrap">
                <span className="search-icon">🔍</span>

                <input
                  className="search-input"
                  type="text"
                  placeholder="Tìm tài liệu theo tên, môn học, tag..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                {search && (
                  <button
                    className="search-clear"
                    onClick={() => setSearch("")}
                  >
                    ✕
                  </button>
                )}
              </div>

              <select
                className="filter-select"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                {SUBJECTS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <select
                className="filter-select"
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
              >
                {FILE_TYPES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <select
                className="filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {(search || subject !== "Tất cả" || fileType !== "Tất cả") && (
              <p
                className="results-label"
                style={{
                  margin: "0 0 12px",
                  fontSize: "0.86rem",
                  color: "#6b7280",
                }}
              >
                Tìm thấy <strong>{filtered.length}</strong> tài liệu
                {search && (
                  <>
                    {" "}
                    cho "<em>{search}</em>"
                  </>
                )}{" "}
                <button
                  className="clear-filters"
                  onClick={() => {
                    setSearch("");
                    setSubject("Tất cả");
                    setFileType("Tất cả");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#0066ff",
                    cursor: "pointer",
                    fontSize: "0.84rem",
                    fontWeight: 600,
                  }}
                >
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
                  <PublicDocCard
                    key={doc.id}
                    doc={doc}
                    nowTime={nowTime}
                    onOpen={setDetailDoc}
                  />
                ))}
              </div>
            ) : (
              <div className="forum-empty">
                <div className="empty-icon">📭</div>

                <p className="empty-title">
                  {docs.length === 0
                    ? "Chưa có tài liệu công khai"
                    : "Không tìm thấy tài liệu phù hợp"}
                </p>

                <p className="empty-sub">
                  {docs.length === 0
                    ? "Hãy upload tài liệu công khai đầu tiên từ trang Tổng quan!"
                    : "Thử thay đổi từ khóa hoặc bộ lọc"}
                </p>
              </div>
            )}
          </div>

          <aside className="forum-sidebar">
            <div className="sidebar-widget">
              <h3 className="widget-title">Loại file</h3>

              <div className="widget-categories">
                {FILE_TYPES.map((item) => (
                  <button
                    key={item}
                    className={`widget-cat-btn${
                      fileType === item ? " widget-cat-btn--active" : ""
                    }`}
                    onClick={() =>
                      setFileType(item === fileType ? "Tất cả" : item)
                    }
                  >
                    {item !== "Tất cả" && (
                      <span
                        className="widget-cat-dot"
                        style={{ background: EXT_COLOR[item] || "#6b7280" }}
                      />
                    )}

                    {item}

                    <span className="widget-cat-count">
                      {item === "Tất cả"
                        ? docs.length
                        : docs.filter((doc) => doc.ext === item).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="sidebar-widget">
              <h3 className="widget-title">Tag nổi bật</h3>

              <div className="post-tags-row">
                {HOT_TAGS.map((tag) => (
                  <button
                    key={tag}
                    className="tag"
                    onClick={() => setSearch(tag)}
                  >
                    #{tag}
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
          nowTime={nowTime}
          onClose={() => setDetailDoc(null)}
          onReport={(doc) => {
            setDetailDoc(null);
            setReportDoc(doc);
          }}
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
