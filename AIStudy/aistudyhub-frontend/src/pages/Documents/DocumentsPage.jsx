<<<<<<< Updated upstream
import { useEffect, useRef, useState } from "react";
=======
import { useState, useRef, useEffect } from "react";
>>>>>>> Stashed changes
import AppLayout from "../../components/layout/AppLayout";
import {
  getDocuments,
  createDocument,
<<<<<<< Updated upstream
  updateDocumentName,
  deleteDocument,
} from "../../apis/documentApi";
import "./DocumentsPage.css";

function mapApiDoc(d) {
  return {
    id: d.documentId || d.id,
    name: d.documentName || d.name || "Untitled Document",
    ext: d.fileType || d.ext || "PDF",
    subject: d.subject || "Tài liệu",
    sizeMB: d.fileSize
      ? Number((d.fileSize / 1024 / 1024).toFixed(1))
      : d.sizeMB || 0,
    date: d.createdAt
      ? d.createdAt.slice(0, 10)
      : d.date || new Date().toISOString().slice(0, 10),
    tags: d.tags || [],
    privacy: d.privacy || "private",
    downloads: d.downloads || 0,
    previewUrl: d.previewUrl || "",
    downloadUrl: d.downloadUrl || "",
  };
}
=======
  updateDocument,
  deleteDocument,
} from "../../apis/documentApi";
import "./DocumentsPage.css";
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream

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
=======
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
      : new Date().toISOString().slice(0, 10),
    tags: Array.isArray(d.tags) ? d.tags : [],
    privacy: d.privacy || "private",
    downloads: d.downloads || 0,
    previewUrl: d.previewUrl || "",
    downloadUrl: d.downloadUrl || "",
  };
}
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
  const [step, setStep] = useState("drop");
=======
  const [step, setStep] = useState("drop"); // drop | form | uploading | done
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
  const inputRef = useRef();

  function handleFilePick(f) {
    if (!f) return;
<<<<<<< Updated upstream

    const ext = ALLOWED_TYPES[f.type];

=======
    const ext = ALLOWED_TYPES[f.type];
>>>>>>> Stashed changes
    if (!ext) {
      setError(
        "Định dạng không hỗ trợ. Chỉ chấp nhận PDF, DOCX, PPTX, JPG, PNG.",
      );
      return;
    }
<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
    if (f.size > 50 * 1024 * 1024) {
      setError("File vượt quá 50 MB.");
      return;
    }
<<<<<<< Updated upstream

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

=======
    setError("");
    setFile({ raw: f, ext, sizeMB: (f.size / 1048576).toFixed(1) });
    setMeta((m) => ({ ...m, name: f.name.replace(/\.[^.]+$/, "") }));
>>>>>>> Stashed changes
    setStep("form");
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFilePick(e.dataTransfer.files[0]);
  }

<<<<<<< Updated upstream
  function handleSubmit(e) {
    e.preventDefault();

    if (!meta.name.trim() || !file) return;

    setStep("uploading");

    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 18 + 6;

      if (p >= 100) {
        clearInterval(iv);
        setProgress(100);
        setStep("done");

        setTimeout(() => {
          onSuccess({
            name: meta.name.trim(),
            ext: file.ext,
            subject: meta.subject,
            sizeMB: file.sizeMB,
            fileSize: file.raw.size,
            date: new Date().toISOString().slice(0, 10),
            tags: meta.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            privacy: meta.privacy,
            downloads: 0,
            previewUrl: "",
            downloadUrl: "",
          });
        }, 600);
      } else {
        setProgress(Math.min(p, 95));
      }
    }, 180);
=======
  async function handleSubmit(e) {
    e.preventDefault();
    if (!meta.name.trim()) return;
    setStep("uploading");
    setProgress(40);
    try {
      const result = await createDocument({
        documentName: meta.name.trim(),
        fileType: file.ext,
        previewUrl: "",
        downloadUrl: "",
        fileSize: Math.round(parseFloat(file.sizeMB) * 1048576),
      });
      setProgress(100);
      setStep("done");
      const saved = result?.data || result || {};

      const savedId = saved.id || saved.documentId || saved.document_id;

      if (!savedId) {
        throw new Error("Backend chưa trả về documentId sau khi tạo tài liệu.");
      }

      setTimeout(() => {
        onSuccess(mapDoc(saved));
      }, 600);
    } catch (err) {
      setStep("form");
      setError(err?.message || "Upload thất bại. Vui lòng thử lại.");
    }
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
=======
        {/* Step: drop zone */}
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
=======
        {/* Step: metadata form */}
>>>>>>> Stashed changes
        {step === "form" && (
          <form className="modal-body" onSubmit={handleSubmit}>
            <div className="selected-file">
              <div
                className="doc-ext"
                style={{ background: EXT_COLOR[file.ext] }}
              >
                {file.ext}
              </div>
<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
              <div>
                <p className="sf-name">{file.raw.name}</p>
                <p className="sf-size">{file.sizeMB} MB</p>
              </div>
<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
                <label>Tag, cách nhau bằng dấu phẩy</label>
=======
                <label>Tag (cách bằng dấu phẩy)</label>
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
=======
        {/* Step: uploading */}
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
=======
        {/* Step: done */}
>>>>>>> Stashed changes
        {step === "done" && (
          <div className="modal-body upload-done-wrap">
            <div className="done-icon">✅</div>
            <p className="done-title">Upload thành công!</p>
<<<<<<< Updated upstream
            <p className="done-sub">Tài liệu đã được lưu vào hệ thống.</p>
=======
            <p className="done-sub">
              Tài liệu đã được lưu và đang được AI xử lý để hỗ trợ chatbot.
            </p>
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
            Tài liệu sẽ bị xóa vĩnh viễn và không thể khôi phục.
=======
            Tài liệu sẽ bị xóa vĩnh viễn khỏi Cloud Storage và không thể khôi
            phục.
>>>>>>> Stashed changes
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

/* ── Document Card ── */
function DocCard({ doc, onEdit, onDelete }) {
  return (
    <div className="doc-card">
      <div className="doc-card-top">
        <div
          className="doc-card-ext"
<<<<<<< Updated upstream
          style={{ background: EXT_COLOR[doc.ext] || "#6b7280" }}
        >
          {doc.ext}
        </div>

=======
          style={{ background: EXT_COLOR[doc.ext] }}
        >
          {doc.ext}
        </div>
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
        {doc.downloads > 0 && (
          <span className="doc-card-dl">⬇️ {doc.downloads}</span>
        )}
      </div>

      <div className="doc-card-actions">
<<<<<<< Updated upstream
        <button className="card-action-btn" title="Xem trước">
          👁️ Xem
        </button>

        <button className="card-action-btn" title="Tải xuống">
          ⬇️
        </button>

=======
        <button
          className="card-action-btn"
          title="Xem trước"
          onClick={() =>
            doc.previewUrl
              ? window.open(doc.previewUrl, "_blank")
              : alert("Tài liệu này chưa có link xem trước.")
          }
        >
          👁️ Xem
        </button>
        <button
          className="card-action-btn"
          title="Tải xuống"
          onClick={() =>
            doc.downloadUrl
              ? window.open(doc.downloadUrl, "_blank")
              : alert("Tài liệu này chưa có link tải xuống.")
          }
        >
          ⬇️
        </button>
>>>>>>> Stashed changes
        <button
          className="card-action-btn"
          title="Chỉnh sửa"
          onClick={() => onEdit(doc)}
        >
          ✏️
        </button>
<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
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
function DocRow({ doc, onEdit, onDelete }) {
  return (
    <div className="doc-list-row">
<<<<<<< Updated upstream
      <div
        className="doc-ext-sm"
        style={{ background: EXT_COLOR[doc.ext] || "#6b7280" }}
      >
        {doc.ext}
      </div>

=======
      <div className="doc-ext-sm" style={{ background: EXT_COLOR[doc.ext] }}>
        {doc.ext}
      </div>
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
        <button className="row-action-btn" title="Xem trước">
          👁️
        </button>

        <button className="row-action-btn" title="Tải xuống">
          ⬇️
        </button>

=======
        <button
          className="row-action-btn"
          title="Xem trước"
          onClick={() =>
            doc.previewUrl
              ? window.open(doc.previewUrl, "_blank")
              : alert("Tài liệu này chưa có link xem trước.")
          }
        >
          👁️
        </button>
        <button
          className="row-action-btn"
          title="Tải xuống"
          onClick={() =>
            doc.downloadUrl
              ? window.open(doc.downloadUrl, "_blank")
              : alert("Tài liệu này chưa có link tải xuống.")
          }
        >
          ⬇️
        </button>
>>>>>>> Stashed changes
        <button
          className="row-action-btn"
          title="Chỉnh sửa"
          onClick={() => onEdit(doc)}
        >
          ✏️
        </button>
<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
  const [loadingDocs, setLoadingDocs] = useState(false);
=======
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
>>>>>>> Stashed changes
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("Tất cả");
  const [fileType, setFileType] = useState("Tất cả");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("grid");
  const [showUpload, setShowUpload] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [deleteDoc, setDeleteDoc] = useState(null);

  useEffect(() => {
<<<<<<< Updated upstream
    async function loadDocuments() {
      try {
        setLoadingDocs(true);

        const result = await getDocuments();
        const data = result.data || result;

        setDocs(Array.isArray(data) ? data.map(mapApiDoc) : []);
      } catch (error) {
        console.error("Load documents error:", error);
        alert("Không tải được danh sách tài liệu");
      } finally {
        setLoadingDocs(false);
      }
    }

    loadDocuments();
=======
    getDocuments()
      .then((res) => {
        const list = res?.data || res || [];
        setDocs(Array.isArray(list) ? list.map(mapDoc) : []);
      })
      .catch(() => setError("Không thể tải danh sách tài liệu."))
      .finally(() => setLoading(false));
>>>>>>> Stashed changes
  }, []);

  const filtered = sortDocs(
    docs.filter((d) => {
      const q = search.toLowerCase();
<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
      const matchSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.subject.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q));
<<<<<<< Updated upstream

      const matchSubject = subject === "Tất cả" || d.subject === subject;
      const matchType = fileType === "Tất cả" || d.ext === fileType;

=======
      const matchSubject = subject === "Tất cả" || d.subject === subject;
      const matchType = fileType === "Tất cả" || d.ext === fileType;
>>>>>>> Stashed changes
      return matchSearch && matchSubject && matchType;
    }),
    sort,
  );

  const totalSize = docs.reduce((s, d) => s + d.sizeMB, 0).toFixed(1);

<<<<<<< Updated upstream
  async function handleUploadSuccess(newDoc) {
    try {
      const result = await createDocument({
        documentName: newDoc.name,
        fileType: newDoc.ext,
        previewUrl: newDoc.previewUrl || "",
        downloadUrl: newDoc.downloadUrl || "",
        fileSize:
          newDoc.fileSize || Math.round((newDoc.sizeMB || 0) * 1024 * 1024),
      });

      const created = result.data || result;

      setDocs((prev) => [mapApiDoc(created), ...prev]);
      setShowUpload(false);
    } catch (error) {
      console.error("Create document error:", error);
      alert("Upload tài liệu thất bại");
    }
=======
  function handleUploadSuccess(newDoc) {
    setDocs((prev) => [newDoc, ...prev]);
    setShowUpload(false);
>>>>>>> Stashed changes
  }

  async function handleEditSave(updated) {
    try {
<<<<<<< Updated upstream
      const result = await updateDocumentName(updated.id, updated.name);
      const data = result.data || result;

      setDocs((prev) =>
        prev.map((d) => (d.id === updated.id ? mapApiDoc(data) : d)),
      );

      setEditDoc(null);
    } catch (error) {
      console.error("Update document error:", error);
      alert("Cập nhật tài liệu thất bại");
=======
      await updateDocument(updated.id, updated.name);
      setDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setEditDoc(null);
    } catch {
      alert("Cập nhật thất bại. Vui lòng thử lại.");
>>>>>>> Stashed changes
    }
  }

  async function handleDeleteConfirm(id) {
<<<<<<< Updated upstream
    try {
      await deleteDocument(id);

      setDocs((prev) => prev.filter((d) => d.id !== id));
      setDeleteDoc(null);
    } catch (error) {
      console.error("Delete document error:", error);
      alert("Xóa tài liệu thất bại");
=======
    const doc = docs.find((d) => d.id === id);
    try {
      await deleteDocument(id, doc?.fileSize || 0);
      setDocs((prev) => prev.filter((d) => d.id !== id));
      setDeleteDoc(null);
    } catch {
      alert("Xóa thất bại. Vui lòng thử lại.");
>>>>>>> Stashed changes
    }
  }

  return (
    <AppLayout>
      <div className="docs-page">
<<<<<<< Updated upstream
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
              <button className="search-clear" onClick={() => setSearch("")}>
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
              className={`view-btn${view === "grid" ? " view-btn--active" : ""}`}
              onClick={() => setView("grid")}
              title="Dạng lưới"
            >
              ⊞
            </button>

            <button
              className={`view-btn${view === "list" ? " view-btn--active" : ""}`}
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

        {loadingDocs ? (
          <div className="docs-empty">
            <div className="empty-icon">⏳</div>
            <p className="empty-title">Đang tải tài liệu...</p>
          </div>
        ) : filtered.length > 0 ? (
          view === "grid" ? (
            <div className="docs-grid">
              {filtered.map((doc) => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  onEdit={setEditDoc}
                  onDelete={setDeleteDoc}
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
=======
        {loading && (
          <div
            style={{ textAlign: "center", padding: "60px", color: "#6b7280" }}
          >
            Đang tải tài liệu...
          </div>
        )}
        {error && (
          <div
            style={{ textAlign: "center", padding: "60px", color: "#ef4444" }}
          >
            {error}
          </div>
        )}
        {!loading && !error && (
          <>
            {/* ── Header ── */}
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

            {/* ── Search & Filter bar ── */}
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
                  className={`view-btn${view === "grid" ? " view-btn--active" : ""}`}
                  onClick={() => setView("grid")}
                  title="Dạng lưới"
                >
                  ⊞
                </button>
                <button
                  className={`view-btn${view === "list" ? " view-btn--active" : ""}`}
                  onClick={() => setView("list")}
                  title="Dạng danh sách"
                >
                  ☰
                </button>
              </div>
            </div>

            {/* ── Results count ── */}
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
>>>>>>> Stashed changes
            )}

            {/* ── Document grid ── */}
            {filtered.length > 0 ? (
              view === "grid" ? (
                <div className="docs-grid">
                  {filtered.map((doc) => (
                    <DocCard
                      key={doc.id}
                      doc={doc}
                      onEdit={setEditDoc}
                      onDelete={setDeleteDoc}
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
<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
      {editDoc && (
        <EditModal
          doc={editDoc}
          onClose={() => setEditDoc(null)}
          onSave={handleEditSave}
        />
      )}
<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
      {deleteDoc && (
        <DeleteConfirm
          doc={deleteDoc}
          onClose={() => setDeleteDoc(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </AppLayout>
  );
}
