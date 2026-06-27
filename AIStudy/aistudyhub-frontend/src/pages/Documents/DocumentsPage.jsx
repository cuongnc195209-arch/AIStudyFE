import { useEffect, useRef, useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  downloadDocumentFile,
} from "../../apis/documentApi";
import "./DocumentsPage.css";

/* ── Mapper dữ liệu từ Backend sang UI ── */
function mapDoc(d) {
  return {
    id: d.id || d.documentId || d.document_id,
    name: d.documentName || d.name || "Untitled Document",
    ext: (d.fileType || d.ext || "PDF").toUpperCase(),
    subject: d.subject || "Tài liệu",
    sizeMB: d.fileSize ? Number((d.fileSize / 1048576).toFixed(2)) : 0,
    fileSize: d.fileSize || 0,
    date: d.createdAt
      ? d.createdAt.slice(0, 10)
      : d.date || new Date().toISOString().slice(0, 10),
    tags: Array.isArray(d.tags) ? d.tags : [],
    privacy: d.privacy || "private",
    downloads: d.downloads || 0,
    previewUrl: d.previewUrl || "",
    downloadUrl: d.downloadUrl || "",
    description: d.description || "",
    textContent: d.textContent || d.description || "",
  };
}

/* ── Hằng số ── */
const SUBJECTS = [
  "Tất cả",
  "Lập trình Web",
  "Cơ sở dữ liệu",
  "Trí tuệ nhân tạo",
  "Mạng máy tính",
  "Giải tích",
  "Vật lý đại cương",
];

const FILE_TYPES = ["Tất cả", "PDF", "PPT", "DOC", "IMG"];

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "name", label: "Tên A→Z" },
  { value: "size", label: "Dung lượng" },
];

const ALLOWED_TYPES = {
  "application/pdf": "PDF",
  "application/vnd.ms-powerpoint": "PPT",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "PPT",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOC",
  "image/jpeg": "IMG",
  "image/png": "IMG",
};

const EXT_COLOR = {
  PDF: "#ef4444",
  PPT: "#f97316",
  DOC: "#3b82f6",
  IMG: "#10b981",
};

/* ── Helpers ── */
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

function sortDocs(docs, sort) {
  return [...docs].sort((a, b) => {
    if (sort === "newest") return new Date(b.date) - new Date(a.date);
    if (sort === "oldest") return new Date(a.date) - new Date(b.date);
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "size") return b.sizeMB - a.sizeMB;
    return 0;
  });
}

/* ── Upload Modal ── */
function UploadModal({ onClose, onSuccess }) {
  const [step, setStep] = useState("drop");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [meta, setMeta] = useState({
    name: "",
    subject: SUBJECTS[1],
    description: "",
    tags: "",
    privacy: "private",
  });

  const inputRef = useRef();

  function handleFilePick(f) {
    if (!f) return;

    const ext = ALLOWED_TYPES[f.type];

    if (!ext) {
      setError(
        "Định dạng không hỗ trợ. Chỉ chấp nhận PDF, DOCX, PPTX, JPG, PNG.",
      );
      return;
    }

    if (f.size > 50 * 1024 * 1024) {
      setError("File vượt quá 50 MB.");
      return;
    }

    setError("");
    setFile({
      raw: f,
      ext,
      sizeMB: Number((f.size / 1048576).toFixed(1)),
    });

    setMeta((m) => ({
      ...m,
      name: f.name.replace(/\.[^.]+$/, ""),
    }));

    setStep("form");
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFilePick(e.dataTransfer.files[0]);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!meta.name.trim() || !file) return;

    const description = meta.description.trim();

    if (!description) {
      setError("Vui lòng nhập mô tả tài liệu trước khi upload.");
      return;
    }

    setError("");
    setStep("uploading");
    setProgress(40);

    try {
      const result = await createDocument({
        file: file.raw,
        data: {
          documentName: meta.name.trim(),
          fileType: file.ext,
          fileSize: file.raw.size,
          description: description,
          textContent: description,
        },
      });

      const saved = result?.data || result || {};
      const savedId = saved.id || saved.documentId || saved.document_id;

      if (!savedId) {
        throw new Error("Backend chưa trả về documentId sau khi tạo tài liệu.");
      }

      setProgress(100);
      setStep("done");

      setTimeout(() => {
        onSuccess(mapDoc(saved));
      }, 600);
    } catch (err) {
      console.error("Upload failed:", err);
      setStep("form");
      setError(err?.message || "Upload thất bại. Vui lòng thử lại.");
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-header">
          <h2>{step === "done" ? "Upload thành công!" : "Upload Tài liệu"}</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {step === "drop" && (
          <div className="modal-body">
            <div
              className={`drop-zone${dragOver ? " drop-zone--over" : ""}`}
              onClick={() => inputRef.current.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div className="drop-icon">📂</div>
              <p className="drop-title">Kéo thả file vào đây</p>
              <p className="drop-sub">
                hoặc <span className="drop-link">chọn từ máy tính</span>
              </p>
              <p className="drop-hint">
                PDF, DOCX, PPTX, JPG, PNG · Tối đa 50 MB
              </p>

              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                style={{ display: "none" }}
                onChange={(e) => handleFilePick(e.target.files[0])}
              />
            </div>

            {error && <p className="upload-error">⚠️ {error}</p>}
          </div>
        )}

        {step === "form" && (
          <form className="modal-body" onSubmit={handleSubmit}>
            <div className="selected-file">
              <div
                className="doc-ext"
                style={{ background: EXT_COLOR[file.ext] || "#6b7280" }}
              >
                {file.ext}
              </div>

              <div>
                <p className="sf-name">{file.raw.name}</p>
                <p className="sf-size">{file.sizeMB} MB</p>
              </div>

              <button
                type="button"
                className="sf-change"
                onClick={() => setStep("drop")}
              >
                Đổi file
              </button>
            </div>

            <div className="form-grid">
              <div className="fg-full">
                <label>
                  Tên tài liệu <span className="required">*</span>
                </label>
                <input
                  value={meta.name}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, name: e.target.value }))
                  }
                  placeholder="Nhập tên tài liệu"
                  required
                />
              </div>

              <div>
                <label>
                  Môn học <span className="required">*</span>
                </label>
                <select
                  value={meta.subject}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, subject: e.target.value }))
                  }
                >
                  {SUBJECTS.slice(1).map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>Quyền riêng tư</label>
                <select
                  value={meta.privacy}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, privacy: e.target.value }))
                  }
                >
                  <option value="private">🔒 Riêng tư</option>
                  <option value="public">🌐 Công khai</option>
                </select>
              </div>

              <div className="fg-full">
                <label>Tag, cách nhau bằng dấu phẩy</label>
                <input
                  value={meta.tags}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, tags: e.target.value }))
                  }
                  placeholder="ví dụ: lý thuyết, ôn tập, chương 1"
                />
              </div>

              <div className="fg-full">
                <label>Mô tả</label>
                <textarea
                  value={meta.description}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, description: e.target.value }))
                  }
                  placeholder="Mô tả ngắn về tài liệu..."
                  rows={3}
                />
              </div>
            </div>

            {error && <p className="upload-error">⚠️ {error}</p>}

            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Hủy
              </button>
              <button type="submit" className="btn-primary">
                ⬆️ Xác nhận Upload
              </button>
            </div>
          </form>
        )}

        {step === "uploading" && (
          <div className="modal-body upload-progress-wrap">
            <div className="upload-progress-icon">📤</div>
            <p className="up-title">Đang upload tài liệu...</p>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="up-percent">{Math.round(progress)}%</p>
          </div>
        )}

        {step === "done" && (
          <div className="modal-body upload-done-wrap">
            <div className="done-icon">✅</div>
            <p className="done-title">Upload thành công!</p>
            <p className="done-sub">Tài liệu đã được lưu vào hệ thống.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Edit Modal ── */
function EditModal({ doc, onClose, onSave }) {
  const [meta, setMeta] = useState({
    name: doc.name,
    subject: doc.subject,
    tags: doc.tags.join(", "),
    privacy: doc.privacy,
  });

  function handleSubmit(e) {
    e.preventDefault();

    onSave({
      ...doc,
      name: meta.name.trim(),
      subject: meta.subject,
      tags: meta.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      privacy: meta.privacy,
    });
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-header">
          <h2>Chỉnh sửa tài liệu</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="fg-full">
              <label>
                Tên tài liệu <span className="required">*</span>
              </label>
              <input
                value={meta.name}
                onChange={(e) =>
                  setMeta((m) => ({ ...m, name: e.target.value }))
                }
                required
              />
            </div>

            <div>
              <label>Môn học</label>
              <select
                value={meta.subject}
                onChange={(e) =>
                  setMeta((m) => ({ ...m, subject: e.target.value }))
                }
              >
                {SUBJECTS.slice(1).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Quyền riêng tư</label>
              <select
                value={meta.privacy}
                onChange={(e) =>
                  setMeta((m) => ({ ...m, privacy: e.target.value }))
                }
              >
                <option value="private">🔒 Riêng tư</option>
                <option value="public">🌐 Công khai</option>
              </select>
            </div>

            <div className="fg-full">
              <label>Tag</label>
              <input
                value={meta.tags}
                onChange={(e) =>
                  setMeta((m) => ({ ...m, tags: e.target.value }))
                }
                placeholder="tag1, tag2, tag3"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              💾 Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Delete Confirm ── */
function DeleteConfirm({ doc, onClose, onConfirm }) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal modal--sm">
        <div className="modal-header">
          <h2>Xóa tài liệu</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="delete-confirm-icon">🗑️</div>
          <p className="delete-confirm-text">
            Bạn có chắc muốn xóa tài liệu <strong>"{doc.name}"</strong>?
          </p>
          <p className="delete-confirm-sub">
            Tài liệu sẽ bị xóa vĩnh viễn và không thể khôi phục.
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Hủy
          </button>
          <button className="btn-danger" onClick={() => onConfirm(doc.id)}>
            Xóa tài liệu
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Preview Modal: hiển thị nội dung file thật ── */
function PreviewModal({ doc, previewUrl, previewError, onClose }) {
  const isImage = doc.ext === "IMG";
  const isPdf = doc.ext === "PDF";

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" style={{ maxWidth: "800px", width: "90vw" }}>
        <div className="modal-header">
          <h2>Xem trước tài liệu</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="selected-file">
            <div
              className="doc-ext"
              style={{ background: EXT_COLOR[doc.ext] || "#6b7280" }}
            >
              {doc.ext}
            </div>

            <div>
              <p className="sf-name">{doc.name}</p>
              <p className="sf-size">{sizeLabel(doc.sizeMB)}</p>
            </div>
          </div>

          <div
            style={{
              marginTop: "16px",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              background: "#f9fafb",
              overflow: "hidden",
              minHeight: "200px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {previewError ? (
              <p style={{ color: "#ef4444", padding: "32px" }}>
                {previewError}
              </p>
            ) : !previewUrl ? (
              <p style={{ color: "#6b7280", padding: "32px" }}>
                Đang tải xem trước...
              </p>
            ) : isImage ? (
              <img
                src={previewUrl}
                alt={doc.name}
                style={{
                  maxWidth: "100%",
                  maxHeight: "70vh",
                  objectFit: "contain",
                }}
              />
            ) : isPdf ? (
              <iframe
                src={previewUrl}
                title={doc.name}
                style={{ width: "100%", height: "70vh", border: "none" }}
              />
            ) : (
              <iframe
                src={previewUrl}
                title={doc.name}
                style={{ width: "100%", height: "70vh", border: "none" }}
              />
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Document Card ── */
function DocCard({ doc, onEdit, onDelete, onPreview, onDownload }) {
  return (
    <div className="doc-card">
      <div className="doc-card-top">
        <div
          className="doc-card-ext"
          style={{ background: EXT_COLOR[doc.ext] || "#6b7280" }}
        >
          {doc.ext}
        </div>

        <div className="doc-card-privacy">
          {doc.privacy === "public" ? (
            <span className="badge-public">🌐 Công khai</span>
          ) : (
            <span className="badge-private">🔒 Riêng tư</span>
          )}
        </div>
      </div>

      <p className="doc-card-name">{doc.name}</p>
      <p className="doc-card-subject">{doc.subject}</p>

      <div className="doc-card-tags">
        {doc.tags.slice(0, 2).map((t) => (
          <span key={t} className="tag">
            {t}
          </span>
        ))}
        {doc.tags.length > 2 && (
          <span className="tag tag--more">+{doc.tags.length - 2}</span>
        )}
      </div>

      <div className="doc-card-footer">
        <span className="doc-card-meta">
          {sizeLabel(doc.sizeMB)} · {relativeDate(doc.date)}
        </span>

        {doc.downloads > 0 && (
          <span className="doc-card-dl">⬇️ {doc.downloads}</span>
        )}
      </div>

      <div className="doc-card-actions">
        <button
          className="card-action-btn"
          title="Xem trước"
          onClick={() => onPreview(doc)}
        >
          👁️ Xem
        </button>

        <button
          className="card-action-btn"
          title="Tải xuống"
          onClick={() => onDownload(doc)}
        >
          ⬇️
        </button>

        <button
          className="card-action-btn"
          title="Chỉnh sửa"
          onClick={() => onEdit(doc)}
        >
          ✏️
        </button>

        <button
          className="card-action-btn card-action-btn--del"
          title="Xóa"
          onClick={() => onDelete(doc)}
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

/* ── Document Row ── */
function DocRow({ doc, onEdit, onDelete, onPreview, onDownload }) {
  return (
    <div className="doc-list-row">
      <div
        className="doc-ext-sm"
        style={{ background: EXT_COLOR[doc.ext] || "#6b7280" }}
      >
        {doc.ext}
      </div>

      <div className="doc-list-info">
        <p className="doc-list-name">{doc.name}</p>
        <p className="doc-list-sub">{doc.subject}</p>
      </div>

      <div className="doc-list-tags">
        {doc.tags.slice(0, 3).map((t) => (
          <span key={t} className="tag">
            {t}
          </span>
        ))}
      </div>

      <span className="doc-list-size">{sizeLabel(doc.sizeMB)}</span>
      <span className="doc-list-date">{relativeDate(doc.date)}</span>

      <div className="doc-list-privacy">
        {doc.privacy === "public" ? (
          <span className="badge-public">🌐</span>
        ) : (
          <span className="badge-private">🔒</span>
        )}
      </div>

      <div className="doc-list-actions">
        <button
          className="row-action-btn"
          title="Xem trước"
          onClick={() => onPreview(doc)}
        >
          👁️
        </button>

        <button
          className="row-action-btn"
          title="Tải xuống"
          onClick={() => onDownload(doc)}
        >
          ⬇️
        </button>

        <button
          className="row-action-btn"
          title="Chỉnh sửa"
          onClick={() => onEdit(doc)}
        >
          ✏️
        </button>

        <button
          className="row-action-btn row-action-btn--del"
          title="Xóa"
          onClick={() => onDelete(doc)}
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function DocumentsPage() {
  const [docs, setDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("Tất cả");
  const [fileType, setFileType] = useState("Tất cả");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("grid");
  const [showUpload, setShowUpload] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [deleteDoc, setDeleteDoc] = useState(null);

  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewContent, setPreviewContent] = useState("");
  const [previewError, setPreviewError] = useState("");

  useEffect(() => {
    async function loadDocuments() {
      try {
        setLoadingDocs(true);
        setError("");

        const result = await getDocuments();
        const data = result?.data || result || [];

        setDocs(Array.isArray(data) ? data.map(mapDoc) : []);
      } catch (err) {
        console.error("Load documents error:", err);
        setError("Không thể tải danh sách tài liệu.");
      } finally {
        setLoadingDocs(false);
      }
    }

    loadDocuments();
  }, []);

  const filtered = sortDocs(
    docs.filter((d) => {
      const q = search.toLowerCase();

      const matchSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.subject.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q));

      const matchSubject = subject === "Tất cả" || d.subject === subject;
      const matchType = fileType === "Tất cả" || d.ext === fileType;

      return matchSearch && matchSubject && matchType;
    }),
    sort,
  );

  const totalSize = docs.reduce((s, d) => s + d.sizeMB, 0).toFixed(1);

  function handleUploadSuccess(newDoc) {
    setDocs((prev) => [newDoc, ...prev]);
    setShowUpload(false);
  }

  async function handleEditSave(updated) {
    try {
      const result = await updateDocument(updated.id, updated.name);
      const data = result?.data || result;

      setDocs((prev) =>
        prev.map((d) => (d.id === updated.id ? mapDoc(data) : d)),
      );

      setEditDoc(null);
    } catch (err) {
      console.error("Update document error:", err);
      alert("Cập nhật thất bại. Vui lòng thử lại.");
    }
  }

  async function handleDeleteConfirm(id) {
    try {
      await deleteDocument(id);

      setDocs((prev) => prev.filter((d) => d.id !== id));
      setDeleteDoc(null);
    } catch (err) {
      console.error("Delete document error:", err);
      alert("Xóa thất bại. Vui lòng thử lại.");
    }
  }

  async function handlePreview(doc) {
    setPreviewDoc(doc);
    setPreviewUrl("");
    setPreviewError("");

    try {
      const blob = await previewDocumentFile(doc.id);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      console.error("Preview document error:", err);
      setPreviewError("Không thể tải nội dung xem trước.");
    }
  }

  async function handleDownload(doc) {
    try {
      const blob = await downloadDocumentFile(doc.id);
      const fileURL = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = fileURL;
      a.download = `${doc.name || "document"}.${doc.ext || "file"}`;
      document.body.appendChild(a);
      a.click();

      a.remove();
      URL.revokeObjectURL(fileURL);
    } catch (err) {
      console.error("Download document error:", err);
      alert(
        "Không thể tải tài liệu. Hãy kiểm tra file có tồn tại trên Supabase Storage không.",
      );
    }
  }

  return (
    <AppLayout>
      <div className="docs-page">
        {loadingDocs && (
          <div className="docs-empty">
            <div className="empty-icon">⏳</div>
            <p className="empty-title">Đang tải tài liệu...</p>
          </div>
        )}

        {!loadingDocs && error && (
          <div className="docs-empty">
            <div className="empty-icon">⚠️</div>
            <p className="empty-title" style={{ color: "#ef4444" }}>
              {error}
            </p>
          </div>
        )}

        {!loadingDocs && !error && (
          <>
            <div className="docs-header">
              <div>
                <h1 className="docs-title">Tài liệu của tôi</h1>
                <p className="docs-sub">
                  {docs.length} tài liệu · {totalSize} MB đã dùng
                </p>
              </div>

              <button
                className="btn-primary btn-upload"
                onClick={() => setShowUpload(true)}
              >
                ⬆️ Upload tài liệu
              </button>
            </div>

            <div className="docs-toolbar">
              <div className="search-wrap">
                <span className="search-icon">🔍</span>

                <input
                  className="search-input"
                  type="text"
                  placeholder="Tìm theo tên, môn học, tag..."
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

              <div className="filter-group">
                <select
                  className="filter-select"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  {SUBJECTS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>

                <select
                  className="filter-select"
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value)}
                >
                  {FILE_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>

                <select
                  className="filter-select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="view-toggle">
                <button
                  className={`view-btn${
                    view === "grid" ? " view-btn--active" : ""
                  }`}
                  onClick={() => setView("grid")}
                  title="Dạng lưới"
                >
                  ⊞
                </button>

                <button
                  className={`view-btn${
                    view === "list" ? " view-btn--active" : ""
                  }`}
                  onClick={() => setView("list")}
                  title="Dạng danh sách"
                >
                  ☰
                </button>
              </div>
            </div>

            {(search || subject !== "Tất cả" || fileType !== "Tất cả") && (
              <p className="results-label">
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
                >
                  Xóa bộ lọc
                </button>
              </p>
            )}

            {filtered.length > 0 ? (
              view === "grid" ? (
                <div className="docs-grid">
                  {filtered.map((doc) => (
                    <DocCard
                      key={doc.id}
                      doc={doc}
                      onEdit={setEditDoc}
                      onDelete={setDeleteDoc}
                      onPreview={handlePreview}
                      onDownload={handleDownload}
                    />
                  ))}
                </div>
              ) : (
                <div className="docs-list">
                  <div className="docs-list-header">
                    <span style={{ gridColumn: "1 / 3" }}>Tài liệu</span>
                    <span>Tag</span>
                    <span>Kích thước</span>
                    <span>Ngày</span>
                    <span>Quyền</span>
                    <span>Thao tác</span>
                  </div>

                  {filtered.map((doc) => (
                    <DocRow
                      key={doc.id}
                      doc={doc}
                      onEdit={setEditDoc}
                      onDelete={setDeleteDoc}
                      onPreview={handlePreview}
                      onDownload={handleDownload}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="docs-empty">
                <div className="empty-icon">📭</div>

                <p className="empty-title">
                  {docs.length === 0
                    ? "Chưa có tài liệu nào"
                    : "Không tìm thấy tài liệu phù hợp"}
                </p>

                <p className="empty-sub">
                  {docs.length === 0
                    ? "Bắt đầu bằng cách upload tài liệu đầu tiên của bạn"
                    : "Thử thay đổi từ khóa hoặc bộ lọc"}
                </p>

                {docs.length === 0 && (
                  <button
                    className="btn-primary"
                    onClick={() => setShowUpload(true)}
                  >
                    ⬆️ Upload ngay
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {editDoc && (
        <EditModal
          doc={editDoc}
          onClose={() => setEditDoc(null)}
          onSave={handleEditSave}
        />
      )}

      {deleteDoc && (
        <DeleteConfirm
          doc={deleteDoc}
          onClose={() => setDeleteDoc(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {previewDoc && (
        <PreviewModal
          doc={previewDoc}
          previewUrl={previewUrl}
          previewError={previewError}
          onClose={() => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewDoc(null);
            setPreviewUrl("");
            setPreviewError("");
          }}
        />
      )}
    </AppLayout>
  );
}
