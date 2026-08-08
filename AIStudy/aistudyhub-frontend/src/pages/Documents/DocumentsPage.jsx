import { useEffect, useRef, useState } from "react";
import { renderAsync } from "docx-preview";
import AppLayout from "../../components/layout/AppLayout";
import Swal from "sweetalert2";
import {
  getDocuments,
  createDocument,
  updateDocumentInfo,
  toggleDocumentPublicStatus,
  deleteDocument,
  downloadDocumentFile,
  previewDocumentFile,
  shareDocument,
  updateDocumentSharePermission,
  searchDocuments,
} from "../../apis/documentApi";
import {
  getDocumentCategories,
  findOrCreateDocumentCategory,
} from "../../apis/documentCategoryApi";
import "./DocumentsPage.css";

// Suy ra loại file hiển thị (PDF/PPT/DOC/IMG) từ mimeType hoặc đuôi tên file —
// vì backend không trả field "ext" thống nhất, phải tự đoán từ nhiều field khác nhau
function normalizeExt(d) {
  const raw = String(d.fileType || d.ext || d.mimeType || "").toLowerCase();
  const fileName = String(d.documentName || d.name || "").toLowerCase();

  if (raw.includes("pdf") || fileName.endsWith(".pdf")) return "PDF";

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

// Chuẩn hoá 1 document thô từ backend thành object đầy đủ field UI cần (sizeMB, privacy, tags...)
function mapDoc(d) {
  const isPublic =
    d.isPublic === true ||
    d.isPublic === "true" ||
    d.is_public === true ||
    d.is_public === "true" ||
    d.public === true ||
    d.public === "true" ||
    d.privacy === "public";

  const categoryId =
    d.categoryId ||
    d.category_id ||
    d.category?.id ||
    d.category?.categoryId ||
    d.category?.category_id ||
    "";

  const categoryName =
    d.categoryName ||
    d.category_name ||
    d.category?.categoryName ||
    d.category?.name ||
    d.subjectName ||
    d.subjectCode ||
    "Chưa phân loại";

  return {
    id: d.id || d.documentId || d.document_id,
    name: d.documentName || d.name || "Untitled Document",
    ext: normalizeExt(d),
    categoryId: String(categoryId || ""),
    categoryName,
    subjectCode: categoryName,
    subject: categoryName,
    sizeMB: d.fileSize ? Number((Number(d.fileSize) / 1048576).toFixed(2)) : 0,
    fileSize: d.fileSize || 0,
    date: d.createdAt
      ? String(d.createdAt).slice(0, 10)
      : d.date || new Date().toISOString().slice(0, 10),
    tags: Array.isArray(d.tags) ? d.tags : [],
    privacy: isPublic ? "public" : "private",
    isPublic,
    downloads: d.downloads || 0,
    previewUrl: d.previewUrl || "",
    downloadUrl: d.downloadUrl || "",
    description: d.description || "",
    textContent: d.textContent || d.description || "",
    permissionType: d.permissionType || "",
  };
}

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

const ENABLE_SHARED_TAB = true;

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

// Sắp xếp danh sách tài liệu theo tiêu chí chọn ở toolbar (mới nhất/cũ nhất/tên/dung lượng)
function sortDocs(docs, sort) {
  return [...docs].sort((a, b) => {
    if (sort === "newest") return new Date(b.date) - new Date(a.date);
    if (sort === "oldest") return new Date(a.date) - new Date(b.date);
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "size") return b.sizeMB - a.sizeMB;

    return 0;
  });
}

// Modal upload tài liệu — có 4 bước (step state): chọn file -> điền form -> đang upload -> xong
function UploadModal({
  onClose,
  onSuccess,
  categories = [],
  onCategoryCreated,
}) {
  const [step, setStep] = useState("drop");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);

  const [meta, setMeta] = useState({
    categoryName: categories?.[0]?.label || categories?.[0]?.categoryName || "",
    description: "",
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

    setError("");

    setFile({
      raw: f,
      ext,
      sizeMB: Number((f.size / 1048576).toFixed(1)),
    });

    setStep("form");
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFilePick(e.dataTransfer.files[0]);
  }

  async function resolveCategoryId() {
    const categoryName = meta.categoryName.trim();

    if (!categoryName) {
      throw new Error("Vui lòng nhập môn học.");
    }

    const category = await findOrCreateDocumentCategory(
      categoryName,
      categories,
    );

    if (onCategoryCreated) {
      onCategoryCreated(category);
    }

    return category.id;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!file?.raw) {
      setError("Vui lòng chọn file để upload.");
      return;
    }

    const description = meta.description.trim();

    if (!description) {
      setError("Vui lòng nhập mô tả tài liệu trước khi upload.");
      return;
    }

    setError("");
    setStep("uploading");
    setProgress(10);

    const progressTimer = window.setInterval(() => {
      setProgress((currentProgress) => {
        if (currentProgress >= 90) {
          return currentProgress;
        }

        if (currentProgress < 55) {
          return currentProgress + 7;
        }

        if (currentProgress < 78) {
          return currentProgress + 4;
        }

        return currentProgress + 2;
      });
    }, 350);

    try {
      const categoryId = await resolveCategoryId();

      const result = await createDocument({
        file: file.raw,
        description,
        categoryId,
      });

      const saved = result?.data || result || {};
      const savedId = saved.id || saved.documentId || saved.document_id;

      if (!savedId) {
        throw new Error("Không thể lưu tài liệu. Vui lòng thử lại.");
      }

      let savedForUi = saved;

      if (meta.privacy === "public") {
        const toggleResult = await toggleDocumentPublicStatus(savedId, true);

        savedForUi = toggleResult?.data ||
          toggleResult || {
            ...saved,
            isPublic: false,
            status: "PENDING",
          };
      }

      window.clearInterval(progressTimer);
      setProgress(100);
      setStep("done");

      setTimeout(() => {
        onSuccess(mapDoc(savedForUi));
      }, 600);
    } catch (err) {
      window.clearInterval(progressTimer);

      console.error("Upload failed:", err);

      setProgress(0);
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
              onClick={() => inputRef.current?.click()}
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

              <p className="drop-hint">PDF, DOCX, PPTX, JPG, PNG</p>

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
              <div>
                <label>
                  Môn học <span className="required">*</span>
                </label>

                <input
                  list="upload-category-options"
                  value={meta.categoryName}
                  onChange={(e) =>
                    setMeta((m) => ({
                      ...m,
                      categoryName: e.target.value,
                    }))
                  }
                  placeholder="Ví dụ: ERD123, SWP391, English"
                  required
                />

                <datalist id="upload-category-options">
                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.label || category.categoryName}
                    />
                  ))}
                </datalist>
              </div>

              <div>
                <label>Quyền riêng tư</label>

                <select
                  value={meta.privacy}
                  onChange={(e) =>
                    setMeta((m) => ({
                      ...m,
                      privacy: e.target.value,
                    }))
                  }
                >
                  <option value="private">🔒 Riêng tư</option>
                  <option value="public">🌐 Gửi duyệt công khai</option>
                </select>
              </div>

              <div className="fg-full">
                <label>
                  Mô tả <span className="required">*</span>
                </label>

                <textarea
                  value={meta.description}
                  onChange={(e) =>
                    setMeta((m) => ({
                      ...m,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Mô tả ngắn về tài liệu..."
                  rows={3}
                  required
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

            <div className="upload-progress-track">
              <div
                className="upload-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="upload-progress-percent">{Math.round(progress)}%</p>
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

// Modal sửa tên tài liệu, mô tả, môn học và trạng thái công khai
function EditModal({
  doc,
  onClose,
  onSave,
  categories = [],
  onCategoryCreated,
}) {
  const [meta, setMeta] = useState({
    name: doc.name,
    description: doc.description || "",
    categoryName: doc.categoryName || doc.subject || "",
    tags: doc.tags.join(", "),
    privacy: doc.privacy,
  });

  async function handleSubmit(e) {
    e.preventDefault();

    const name = meta.name.trim();
    const categoryName = meta.categoryName.trim();

    if (!name || !categoryName) {
      return;
    }

    const category = await findOrCreateDocumentCategory(
      categoryName,
      categories,
    );

    if (onCategoryCreated) {
      onCategoryCreated(category);
    }

    onSave({
      ...doc,
      name,
      description: meta.description.trim(),
      categoryId: category.id,
      categoryName: category.label || category.categoryName,
      subject: category.label || category.categoryName,
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

            <div className="fg-full">
              <label>
                Môn học <span className="required">*</span>
              </label>

              <input
                list="edit-category-options"
                value={meta.categoryName}
                onChange={(e) =>
                  setMeta((m) => ({ ...m, categoryName: e.target.value }))
                }
                placeholder="Ví dụ: ERD123, SWP391, English"
                required
              />

              <datalist id="edit-category-options">
                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.label || category.categoryName}
                  />
                ))}
              </datalist>
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

            <div>
              <label>Quyền riêng tư</label>
              <select
                value={meta.privacy}
                onChange={(e) =>
                  setMeta((m) => ({ ...m, privacy: e.target.value }))
                }
              >
                <option value="private">🔒 Riêng tư</option>
                <option value="public">🌐 Gửi duyệt công khai</option>
              </select>
            </div>

            <div>
              <label>Tags</label>
              <input
                value={meta.tags}
                onChange={(e) =>
                  setMeta((m) => ({ ...m, tags: e.target.value }))
                }
                placeholder="Nhập tag, cách nhau bằng dấu phẩy"
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ShareModal({ doc, onClose, onSubmit }) {
  const [targetUserId, setTargetUserId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await onSubmit(doc.id, targetUserId.trim(), "view");
    } catch (err) {
      setError(err?.message || "Chia sẻ thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal modal--sm">
        <div className="modal-header">
          <h2>Chia sẻ tài liệu</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <p className="delete-confirm-text">
            Chia sẻ <strong>"{doc.name}"</strong> cho người dùng khác
          </p>

          <div className="form-grid">
            <div className="fg-full">
              <label>
                User ID người nhận <span className="required">*</span>
              </label>
              <input
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="Dán User ID người nhận"
                required
              />
            </div>
          </div>

          {error && <p className="upload-error">⚠️ {error}</p>}

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Đang chia sẻ..." : "🔗 Chia sẻ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal xác nhận xoá tài liệu — component riêng, không dùng chung ConfirmModal của khu vực Admin
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

// Modal xem trước tài liệu — mỗi loại file render 1 kiểu khác nhau:
// ảnh => <img>, PDF => <iframe>, DOC/DOCX => convert sang HTML bằng thư viện docx-preview (renderAsync bên dưới)
function PreviewModal({ doc, previewUrl, previewBlob, previewError, onClose }) {
  const isImage = doc.ext === "IMG";
  const isPdf = doc.ext === "PDF";
  const isDoc = doc.ext === "DOC";

  const docxContainerRef = useRef(null);
  const [docxError, setDocxError] = useState("");

  useEffect(() => {
    if (!isDoc || !previewBlob || !docxContainerRef.current) return;

    let cancelled = false;

    renderAsync(previewBlob, docxContainerRef.current, undefined, {
      ignoreWidth: true,
    }).catch(() => {
      if (!cancelled) {
        setDocxError(
          "Không thể hiển thị nội dung file này. Vui lòng tải xuống để xem.",
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isDoc, previewBlob]);

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
              overflow: isDoc ? "auto" : "hidden",
              minHeight: "200px",
              maxHeight: isDoc ? "70vh" : undefined,
              display: isDoc ? "block" : "flex",
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
            ) : isDoc ? (
              docxError ? (
                <p style={{ color: "#ef4444", padding: "32px" }}>{docxError}</p>
              ) : (
                <div
                  ref={docxContainerRef}
                  className="docx-preview-container"
                  style={{ padding: "16px", background: "#fff", width: "100%" }}
                />
              )
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

// Thẻ tài liệu dạng lưới (view "grid"). readOnly=true khi ở tab "được chia sẻ" => ẩn nút sửa/chia sẻ/xoá
function DocCard({
  doc,
  readOnly,
  onEdit,
  onDelete,
  onPreview,
  onDownload,
  onShare,
}) {
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
          {readOnly ? (
            <span className="badge-shared">
              🔗 {doc.permissionType === "edit" ? "Chỉnh sửa" : "Chỉ xem"}
            </span>
          ) : doc.privacy === "public" ? (
            <span className="badge-public">🌐 Công khai</span>
          ) : (
            <span className="badge-private">🔒 Riêng tư</span>
          )}
        </div>
      </div>

      <p className="doc-card-name">{doc.name}</p>
      <p className="doc-card-subject">{doc.subject}</p>

      <div className="doc-card-tags">
        {doc.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="tag">
            {tag}
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

        {(!readOnly || doc.permissionType === "edit") && (
          <button
            className="card-action-btn"
            title="Tải xuống"
            onClick={() => onDownload(doc)}
          >
            ⬇️
          </button>
        )}

        {!readOnly && (
          <>
            <button
              className="card-action-btn"
              title="Chỉnh sửa"
              onClick={() => onEdit(doc)}
            >
              ✏️
            </button>

            <button
              className="card-action-btn"
              title="Chia sẻ"
              onClick={() => onShare(doc)}
            >
              🔗
            </button>

            <button
              className="card-action-btn card-action-btn--del"
              title="Xóa"
              onClick={() => onDelete(doc)}
            >
              🗑️
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Hàng tài liệu dạng danh sách (view "list") — cùng logic với DocCard, chỉ khác layout hiển thị
function DocRow({
  doc,
  readOnly,
  onEdit,
  onDelete,
  onPreview,
  onDownload,
  onShare,
}) {
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
        {doc.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>

      <span className="doc-list-size">{sizeLabel(doc.sizeMB)}</span>
      <span className="doc-list-date">{relativeDate(doc.date)}</span>

      <div className="doc-list-privacy">
        {readOnly ? (
          <span className="badge-shared">
            🔗 {doc.permissionType === "edit" ? "Chỉnh sửa" : "Chỉ xem"}
          </span>
        ) : doc.privacy === "public" ? (
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

        {(!readOnly || doc.permissionType === "edit") && (
          <button
            className="row-action-btn"
            title="Tải xuống"
            onClick={() => onDownload(doc)}
          >
            ⬇️
          </button>
        )}

        {!readOnly && (
          <>
            <button
              className="row-action-btn"
              title="Chỉnh sửa"
              onClick={() => onEdit(doc)}
            >
              ✏️
            </button>

            <button
              className="row-action-btn"
              title="Chia sẻ"
              onClick={() => onShare(doc)}
            >
              🔗
            </button>

            <button
              className="row-action-btn row-action-btn--del"
              title="Xóa"
              onClick={() => onDelete(doc)}
            >
              🗑️
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Component chính, export riêng (không default) để DashboardPage cũng nhúng lại được ở dưới phần thống kê.
// Quản lý toàn bộ state: 2 tab (tài liệu của tôi / được chia sẻ), tìm kiếm, lọc, sort, và 5 modal thao tác.
export function DocumentsSection() {
  const [tab, setTab] = useState("mine");
  const [docs, setDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);

  const [sharedDocs, setSharedDocs] = useState([]);
  const [loadingShared, setLoadingShared] = useState(false);
  const [sharedError, setSharedError] = useState("");

  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("Tất cả");
  const [fileType, setFileType] = useState("Tất cả");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("grid");

  const [showUpload, setShowUpload] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [deleteDoc, setDeleteDoc] = useState(null);
  const [shareDoc, setShareDoc] = useState(null);

  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewBlob, setPreviewBlob] = useState(null);
  const [previewError, setPreviewError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const list = await getDocumentCategories({ page: 0, size: 500 });

        if (!cancelled) {
          setCategories(list);
        }
      } catch (err) {
        console.error("Load categories error:", err);
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

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

  useEffect(() => {
    if (!ENABLE_SHARED_TAB || loadingDocs) return;

    // (trả về mọi tài liệu user có quyền truy cập) rồi tự lọc ra những cái KHÔNG public và KHÔNG phải của mình
    async function loadSharedDocuments() {
      try {
        setLoadingShared(true);
        setSharedError("");

        const accessibleResult = await searchDocuments("");
        const accessibleData = accessibleResult?.data || accessibleResult || [];

        const ownedIds = new Set(docs.map((doc) => doc.id));

        const shared = (Array.isArray(accessibleData) ? accessibleData : [])
          .map(mapDoc)
          .filter((doc) => !doc.isPublic && !ownedIds.has(doc.id));

        setSharedDocs(shared);
      } catch (err) {
        console.error("Load shared documents error:", err);
        setSharedError("Không thể tải danh sách tài liệu được chia sẻ.");
      } finally {
        setLoadingShared(false);
      }
    }

    loadSharedDocuments();
  }, [docs, loadingDocs]);

  const activeTab = ENABLE_SHARED_TAB ? tab : "mine";
  const activeDocs = activeTab === "mine" ? docs : sharedDocs;
  const activeLoading = activeTab === "mine" ? loadingDocs : loadingShared;
  const activeError = activeTab === "mine" ? error : sharedError;

  const subjectFilters = [
    "Tất cả",
    ...Array.from(
      new Set(
        [
          ...categories.map((category) => category.label),
          ...activeDocs.map((doc) => doc.subject),
        ].filter(Boolean),
      ),
    ),
  ];

  const filtered = sortDocs(
    activeDocs.filter((doc) => {
      const q = search.toLowerCase();

      const matchSearch =
        !q ||
        doc.name.toLowerCase().includes(q) ||
        doc.subject.toLowerCase().includes(q) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(q));

      const matchSubject = subject === "Tất cả" || doc.subject === subject;
      const matchType = fileType === "Tất cả" || doc.ext === fileType;

      return matchSearch && matchSubject && matchType;
    }),
    sort,
  );

  const totalSize = activeDocs
    .reduce((sum, doc) => sum + doc.sizeMB, 0)
    .toFixed(1);

  function handleUploadSuccess(newDoc) {
    setDocs((prev) => [newDoc, ...prev]);
    setShowUpload(false);
  }

  async function handleEditSave(updated) {
    try {
      const oldDoc = docs.find((doc) => doc.id === updated.id);

      const result = await updateDocumentInfo(updated.id, {
        documentName: updated.name,
        description: updated.description,
        categoryId: updated.categoryId,
      });

      let data = result?.data || result || updated;

      if (oldDoc && oldDoc.privacy !== updated.privacy) {
        const toggleResult = await toggleDocumentPublicStatus(
          updated.id,
          updated.privacy === "public",
        );

        data = toggleResult?.data ||
          toggleResult || {
            ...data,
            isPublic: updated.privacy === "public",
          };
      }

      const mapped = data && typeof data === "object" ? mapDoc(data) : updated;

      setDocs((prev) =>
        prev.map((doc) =>
          doc.id === updated.id
            ? {
                ...doc,
                ...mapped,
                name: updated.name,
                description: updated.description,
                categoryId: updated.categoryId,
                subject: updated.subject,
                tags: updated.tags,
                privacy: updated.privacy,
                isPublic: updated.privacy === "public",
              }
            : doc,
        ),
      );

      setEditDoc(null);
      showToast({
        icon: "success",
        title: "Cập nhật thành công",
        text: "Thông tin tài liệu đã được lưu.",
      });
    } catch (err) {
      console.error("Update document error:", err);
      showToast({
        icon: "error",
        title: "Cập nhật thất bại",
        text: err?.message || "Vui lòng thử lại.",
      });
    }
  }

  // Nếu tài liệu đã share cho user này trước đó, backend trả lỗi 400 "đã được chia sẻ"
  // => tự động fallback sang gọi API update quyền thay vì báo lỗi cho người dùng
  async function handleShareSubmit(id, targetUserId, permissionType) {
    try {
      await shareDocument(id, targetUserId, permissionType);
    } catch (err) {
      const alreadyShared =
        err?.status === 400 &&
        String(err?.message || "").includes("đã được chia sẻ");

      if (!alreadyShared) throw err;

      await updateDocumentSharePermission(id, targetUserId, permissionType);
    }

    setShareDoc(null);
  }

  async function handleDeleteConfirm(id) {
    try {
      await deleteDocument(id);

      setDocs((prev) => prev.filter((doc) => doc.id !== id));
      setSharedDocs((prev) => prev.filter((doc) => doc.id !== id));
      setDeleteDoc(null);
      showToast({
        icon: "success",
        title: "Đã xóa tài liệu",
        text: "Tài liệu đã được xóa khỏi danh sách.",
      });
    } catch (err) {
      console.error("Delete document error:", err);
      showToast({
        icon: "error",
        title: "Xóa thất bại",
        text: err?.message || "Vui lòng thử lại.",
      });
    }
  }

  async function handlePreview(doc) {
    setPreviewDoc(doc);
    setPreviewUrl("");
    setPreviewBlob(null);
    setPreviewError("");

    try {
      const result = await previewDocumentFile(doc.id);

      setPreviewUrl(result.url || URL.createObjectURL(result));
      setPreviewBlob(result.blob || result);
    } catch (err) {
      console.error("Preview document error:", err);
      setPreviewError("Không thể tải nội dung xem trước.");
    }
  }

  async function handleDownload(doc) {
    try {
      const result = await downloadDocumentFile(doc.id);
      const fileUrl = result.url || URL.createObjectURL(result);

      const link = document.createElement("a");
      link.href = fileUrl;
      link.download =
        result.fileName || `${doc.name || "document"}.${doc.ext || "file"}`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => {
        URL.revokeObjectURL(fileUrl);
      }, 1000);

      showToast({
        icon: "success",
        title: "Đang tải tài liệu",
        text: doc.name || "Tệp đã được gửi tới trình duyệt.",
      });
    } catch (err) {
      console.error("Download document error:", err);
      showToast({
        icon: "error",
        title: "Không thể tải tài liệu",
        text:
          err?.message ||
          "Hãy kiểm tra file có tồn tại trên Supabase Storage không.",
      });
    }
  }

  return (
    <>
      <div className="docs-page">
        {ENABLE_SHARED_TAB && (
          <div className="docs-tabs">
            <button
              className={`docs-tab${tab === "mine" ? " docs-tab--active" : ""}`}
              onClick={() => setTab("mine")}
            >
              📁 Tài liệu của tôi
            </button>

            <button
              className={`docs-tab${tab === "shared" ? " docs-tab--active" : ""}`}
              onClick={() => setTab("shared")}
            >
              🔗 Được chia sẻ với tôi
            </button>
          </div>
        )}

        {activeLoading && (
          <div className="docs-empty">
            <div className="empty-icon">⏳</div>
            <p className="empty-title">Đang tải tài liệu...</p>
          </div>
        )}

        {!activeLoading && activeError && (
          <div className="docs-empty">
            <div className="empty-icon">⚠️</div>
            <p className="empty-title" style={{ color: "#ef4444" }}>
              {activeError}
            </p>
          </div>
        )}

        {!activeLoading && !activeError && (
          <>
            <div className="docs-header">
              <div>
                <h1 className="docs-title">
                  {activeTab === "mine"
                    ? "Tài liệu của tôi"
                    : "Được chia sẻ với tôi"}
                </h1>
                <p className="docs-sub">
                  {activeDocs.length} tài liệu · {totalSize} MB
                </p>
              </div>

              {activeTab === "mine" && (
                <button
                  className="btn-primary btn-upload"
                  onClick={() => setShowUpload(true)}
                >
                  ⬆️ Upload tài liệu
                </button>
              )}
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
                  {subjectFilters.map((item) => (
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
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
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

            {filtered.length > 0 ? (
              view === "grid" ? (
                <div className="docs-grid">
                  {filtered.map((doc) => (
                    <DocCard
                      key={doc.id}
                      doc={doc}
                      readOnly={activeTab === "shared"}
                      onEdit={setEditDoc}
                      onDelete={setDeleteDoc}
                      onShare={setShareDoc}
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
                      readOnly={activeTab === "shared"}
                      onEdit={setEditDoc}
                      onDelete={setDeleteDoc}
                      onShare={setShareDoc}
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
                  {activeDocs.length === 0
                    ? "Chưa có tài liệu nào"
                    : "Không tìm thấy tài liệu phù hợp"}
                </p>

                <p className="empty-sub">
                  {activeDocs.length === 0
                    ? activeTab === "mine"
                      ? "Bắt đầu bằng cách upload tài liệu đầu tiên của bạn"
                      : "Chưa có tài liệu nào được chia sẻ với bạn"
                    : "Thử thay đổi từ khóa hoặc bộ lọc"}
                </p>

                {activeTab === "mine" && activeDocs.length === 0 && (
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
          categories={categories}
          onClose={() => setShowUpload(false)}
          onSuccess={handleUploadSuccess}
          onCategoryCreated={(category) => {
            setCategories((prev) => {
              const existed = prev.some((item) => item.id === category.id);
              return existed ? prev : [...prev, category];
            });
          }}
        />
      )}

      {editDoc && (
        <EditModal
          doc={editDoc}
          categories={categories}
          onClose={() => setEditDoc(null)}
          onSave={handleEditSave}
          onCategoryCreated={(category) => {
            setCategories((prev) => {
              const existed = prev.some((item) => item.id === category.id);
              return existed ? prev : [...prev, category];
            });
          }}
        />
      )}

      {shareDoc && (
        <ShareModal
          doc={shareDoc}
          onClose={() => setShareDoc(null)}
          onSubmit={handleShareSubmit}
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
          previewBlob={previewBlob}
          previewError={previewError}
          onClose={() => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);

            setPreviewDoc(null);
            setPreviewUrl("");
            setPreviewBlob(null);
            setPreviewError("");
          }}
        />
      )}
    </>
  );
}

// Trang /documents thật sự chỉ là DocumentsSection bọc trong AppLayout
export default function DocumentsPage() {
  return (
    <AppLayout>
      <DocumentsSection />
    </AppLayout>
  );
}
