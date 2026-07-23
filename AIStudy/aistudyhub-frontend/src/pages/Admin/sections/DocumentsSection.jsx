import { useEffect, useMemo, useRef, useState } from "react";
import { renderAsync } from "docx-preview";
import { getAdminDocuments, reviewDocument } from "../../../apis/adminApi";
import {
  deleteDocument,
  downloadDocumentFile,
  previewDocumentFile,
} from "../../../apis/documentApi";

const DOCUMENTS_PAGE_SIZE = 8;

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
  FILE: "#64748b",
};

function normalizeExt(fileType) {
  const raw = String(fileType || "FILE").toUpperCase();

  if (raw.includes("PDF")) return "PDF";
  if (raw.includes("DOC")) return "DOC";
  if (raw.includes("PPT")) return "PPT";
  if (["JPG", "JPEG", "PNG", "IMG"].some((item) => raw.includes(item))) {
    return "IMG";
  }

  return raw || "FILE";
}

function normalizeStatus(status, isPublic) {
  const rawStatus = String(status || "")
    .trim()
    .toUpperCase();

  if (rawStatus === "PENDING") return "PENDING";
  if (rawStatus === "SUCCESS") return "SUCCESS";
  if (
    rawStatus === "DENY" ||
    rawStatus === "DENIED" ||
    rawStatus === "REJECTED"
  ) {
    return "DENY";
  }

  if (isPublic) return "SUCCESS";

  return "DEFAULT";
}

function getStatusMeta(status) {
  if (status === "PENDING") {
    return {
      label: "Chờ duyệt",
      icon: "⏳",
      className: "admin-doc-status-pending",
    };
  }

  if (status === "SUCCESS") {
    return {
      label: "Đã duyệt",
      icon: "✅",
      className: "admin-doc-status-success",
    };
  }

  if (status === "DENY") {
    return {
      label: "Từ chối",
      icon: "❌",
      className: "admin-doc-status-deny",
    };
  }

  return {
    label: "Riêng tư",
    icon: "🔒",
    className: "admin-doc-status-default",
  };
}

function getPrivacyMeta(doc) {
  if (doc.privacy === "public") {
    return {
      label: "Công khai",
      icon: "🌐",
      className: "admin-doc-privacy-public",
    };
  }

  return {
    label: "Riêng tư",
    icon: "🔒",
    className: "admin-doc-privacy-private",
  };
}

function getSizeLabel(fileSize) {
  const size = Number(fileSize || 0);

  if (!size) return "—";

  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function getListFromResponse(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.content)) return res.content;
  if (Array.isArray(res?.data?.content)) return res.data.content;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("vi-VN");
}

function getOwnerName(document) {
  return (
    document.userFullName ||
    document.ownerName ||
    document.fullName ||
    document.authorName ||
    document.uploaderName ||
    document.userName ||
    document.userEmail ||
    document.email ||
    document.owner ||
    "—"
  );
}

function mapDocAdmin(document, index = 0) {
  const isPublic =
    document.isPublic === true ||
    document.is_public === true ||
    document.public === true;

  const status = normalizeStatus(
    document.status ||
      document.publicStatus ||
      document.statusPublicDoc ||
      document.status_public_doc,
    isPublic,
  );

  const fileType = document.fileType || document.ext || document.extension;
  const ext = normalizeExt(fileType);

  const documentName =
    document.documentName || document.name || document.title || "Untitled";

  const createdAt =
    document.createdAt || document.created_at || document.date || "";

  const documentId =
    document.documentId ||
    document.id ||
    document.document_id ||
    `${documentName}-${createdAt || index}`;

  return {
    id: documentId,
    documentId,
    name: documentName,
    ext,
    owner: getOwnerName(document),
    subject:
      document.subjectCode ||
      document.subject ||
      document.categoryName ||
      "Tài liệu",
    fileSize: document.fileSize || document.file_size || 0,
    size: getSizeLabel(document.fileSize || document.file_size),
    date: createdAt,
    privacy: isPublic ? "public" : "private",
    status,
    previewUrl: document.previewUrl || document.preview_url || "",
    downloadUrl: document.downloadUrl || document.download_url || "",
  };
}

function getFileName(doc) {
  const lowerName = String(doc.name || "").toLowerCase();
  const lowerExt = String(doc.ext || "").toLowerCase();

  if (lowerName.endsWith(`.${lowerExt}`)) {
    return doc.name;
  }

  return `${doc.name}.${lowerExt}`;
}

function ConfirmBox({ confirm, onCancel, onConfirm }) {
  if (!confirm) return null;

  const isDelete = confirm.action === "delete";
  const isAccept = confirm.decision === "ACCEPT";

  const title = isDelete
    ? "Xóa tài liệu"
    : isAccept
      ? "Duyệt tài liệu"
      : "Từ chối tài liệu";

  const description = isDelete
    ? `Xóa vĩnh viễn "${confirm.doc.name}" khỏi hệ thống?`
    : isAccept
      ? `Duyệt tài liệu "${confirm.doc.name}" và hiển thị công khai?`
      : `Từ chối tài liệu "${confirm.doc.name}"?`;

  return (
    <div className="admin-modal-overlay">
      <div className="admin-confirm-box">
        <div className="admin-confirm-icon">
          {isDelete ? "🗑️" : isAccept ? "✅" : "❌"}
        </div>

        <h3>{title}</h3>
        <p>{description}</p>

        <div className="admin-confirm-actions">
          <button className="admin-light-btn" onClick={onCancel}>
            Hủy
          </button>

          <button
            className={
              isDelete || !isAccept ? "admin-danger-btn" : "admin-ok-btn"
            }
            onClick={onConfirm}
          >
            {isDelete ? "Xóa" : isAccept ? "Duyệt" : "Từ chối"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewModal({ doc, url, blob, loading, error, onClose, onDownload }) {
  const docxContainerRef = useRef(null);
  const [docxError, setDocxError] = useState("");

  const ext = String(doc?.ext || "").toUpperCase();

  const isPdf = ext === "PDF";
  const isImage = ["IMG", "JPG", "JPEG", "PNG"].includes(ext);
  const isDoc = ext === "DOC" || ext === "DOCX";

  useEffect(() => {
    if (!doc || !isDoc || !blob || !docxContainerRef.current || loading) {
      return;
    }

    let cancelled = false;

    setDocxError("");
    docxContainerRef.current.innerHTML = "";

    renderAsync(blob, docxContainerRef.current, undefined, {
      ignoreWidth: true,
      ignoreHeight: true,
      className: "docx",
    }).catch(() => {
      if (!cancelled) {
        setDocxError(
          "Không thể hiển thị file Word này. Nếu là file .doc cũ, hãy tải xuống để xem.",
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [doc, isDoc, blob, loading]);

  if (!doc) return null;

  return (
    <div className="admin-modal-overlay">
      <div className="admin-preview-modal">
        <div className="admin-preview-header">
          <div>
            <div className="admin-preview-badges">
              <span
                className="admin-doc-ext"
                style={{ background: EXT_COLOR[doc.ext] || "#64748b" }}
              >
                {doc.ext}
              </span>

              <span className="admin-preview-subject">{doc.subject}</span>
            </div>

            <h3>{doc.name}</h3>

            <p>
              Chủ sở hữu: <strong>{doc.owner}</strong> · {doc.size}
            </p>
          </div>

          <button className="admin-preview-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="admin-preview-body">
          {loading && (
            <div className="admin-preview-state">
              <span className="admin-preview-spinner" />
              <p>Đang tải xem trước...</p>
            </div>
          )}

          {!loading && error && (
            <div className="admin-preview-state admin-preview-error">
              <div>⚠️</div>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && url && isPdf && (
            <iframe
              className="admin-preview-frame"
              src={url}
              title={doc.name}
            />
          )}

          {!loading && !error && url && isImage && (
            <div className="admin-preview-image-wrap">
              <img src={url} alt={doc.name} />
            </div>
          )}

          {!loading && !error && isDoc && (
            <>
              {docxError ? (
                <div className="admin-preview-state admin-preview-error">
                  <div>⚠️</div>
                  <p>{docxError}</p>
                </div>
              ) : (
                <div ref={docxContainerRef} className="admin-preview-docx" />
              )}
            </>
          )}

          {!loading && !error && url && !isPdf && !isImage && !isDoc && (
            <div className="admin-preview-state">
              <div>📄</div>
              <p>
                Loại file này chưa hỗ trợ xem trực tiếp. Hãy tải xuống để xem.
              </p>
            </div>
          )}
        </div>

        <div className="admin-preview-footer">
          <button className="admin-light-btn" onClick={onClose}>
            Đóng
          </button>

          <button className="admin-primary-btn" onClick={() => onDownload(doc)}>
            ⬇️ Tải xuống
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DocumentsSection({ onToast }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [extFilter, setExtFilter] = useState("Tất cả");
  const [statusFilter, setStatusFilter] = useState("");

  const [confirm, setConfirm] = useState(null);
  const [page, setPage] = useState(1);

  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewBlob, setPreviewBlob] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  async function loadDocuments() {
    setLoading(true);

    try {
      const res = await getAdminDocuments({
        size: 9999,
        status: statusFilter || undefined,
      });

      const data = getListFromResponse(res);

      setDocs(data.map((document, index) => mapDocAdmin(document, index)));
    } catch (err) {
      console.error("Load admin docs error:", err);
      onToast?.(`Lỗi tải tài liệu: ${err?.message || "Không thể tải dữ liệu"}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchDocuments() {
      setLoading(true);

      try {
        const res = await getAdminDocuments({
          size: 9999,
          status: statusFilter || undefined,
        });

        const data = getListFromResponse(res);

        if (cancelled) {
          return;
        }

        setDocs(data.map((document, index) => mapDocAdmin(document, index)));
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error("Load admin docs error:", err);
        onToast?.(
          `Lỗi tải tài liệu: ${err?.message || "Không thể tải dữ liệu"}`,
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchDocuments();

    return () => {
      cancelled = true;
    };
  }, [statusFilter]);
  const filtered = useMemo(() => {
    return docs.filter((doc) => {
      const q = search.toLowerCase().trim();

      const matchSearch =
        !q ||
        doc.name.toLowerCase().includes(q) ||
        doc.owner.toLowerCase().includes(q) ||
        doc.subject.toLowerCase().includes(q) ||
        doc.ext.toLowerCase().includes(q) ||
        doc.status.toLowerCase().includes(q);

      const matchExt = extFilter === "Tất cả" || doc.ext === extFilter;
      const matchStatus = !statusFilter || doc.status === statusFilter;

      return matchSearch && matchExt && matchStatus;
    });
  }, [docs, search, extFilter, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / DOCUMENTS_PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages);

  const paginated = filtered.slice(
    (currentPage - 1) * DOCUMENTS_PAGE_SIZE,
    currentPage * DOCUMENTS_PAGE_SIZE,
  );

  const pendingCount = docs.filter((doc) => doc.status === "PENDING").length;
  const publicCount = docs.filter((doc) => doc.status === "SUCCESS").length;
  const denyCount = docs.filter((doc) => doc.status === "DENY").length;

  function handleSearchChange(value) {
    setSearch(value);
    setPage(1);
  }

  function handleExtFilterChange(value) {
    setExtFilter(value);
    setPage(1);
  }

  function handleStatusFilterChange(value) {
    setStatusFilter(value);
    setPage(1);
  }

  function closePreview() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewDoc(null);
    setPreviewUrl("");
    setPreviewBlob(null);
    setPreviewLoading(false);
    setPreviewError("");
  }

  async function handleView(doc) {
    setPreviewDoc(doc);
    setPreviewLoading(true);
    setPreviewError("");
    setPreviewBlob(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }

    try {
      const result = await previewDocumentFile(doc.id);

      const blob = result?.blob instanceof Blob ? result.blob : result;

      if (!(blob instanceof Blob)) {
        throw new Error("BE không trả về file hợp lệ để xem trước.");
      }

      const objectUrl = result?.url || URL.createObjectURL(blob);

      setPreviewBlob(blob);
      setPreviewUrl(objectUrl);
    } catch (err) {
      console.error("Preview document error:", err);

      setPreviewError(
        err?.message ||
          "Không thể xem trước tài liệu. Kiểm tra quyền truy cập hoặc endpoint preview.",
      );
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleDownload(doc) {
    try {
      const result = await downloadDocumentFile(doc.id);

      const blob = result?.blob instanceof Blob ? result.blob : result;

      if (!(blob instanceof Blob)) {
        throw new Error("BE không trả về file hợp lệ để tải xuống.");
      }

      const objectUrl = result?.url || URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = result?.fileName || getFileName(doc);

      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (err) {
      console.error("Download document error:", err);
      onToast?.(
        `Không thể tải tài liệu: ${err?.message || "Vui lòng thử lại"}`,
      );
    }
  }

  async function handleDelete(doc) {
    try {
      await deleteDocument(doc.id);

      setDocs((currentDocs) =>
        currentDocs.filter((item) => item.id !== doc.id),
      );

      onToast?.(`Đã xóa tài liệu "${doc.name}"`);
    } catch (err) {
      console.error("Delete document error:", err);
      onToast?.(`Xóa tài liệu thất bại: ${err?.message || "Vui lòng thử lại"}`);
    }
  }

  async function handleReview(doc, decision) {
    try {
      await reviewDocument(doc.id, decision);

      const newStatus = decision === "ACCEPT" ? "SUCCESS" : "DENY";

      setDocs((currentDocs) =>
        currentDocs.map((item) =>
          item.id === doc.id
            ? {
                ...item,
                status: newStatus,
                privacy: decision === "ACCEPT" ? "public" : "private",
              }
            : item,
        ),
      );

      onToast?.(
        decision === "ACCEPT"
          ? `Đã duyệt tài liệu "${doc.name}". Email thông báo đã được gửi.`
          : `Đã từ chối tài liệu "${doc.name}". Email thông báo đã được gửi.`,
      );
    } catch (err) {
      console.error("Review document error:", err);
      onToast?.(`Thao tác thất bại: ${err?.message || "Vui lòng thử lại"}`);
    }
  }

  async function doConfirmAction() {
    if (!confirm) return;

    const { action, doc, decision } = confirm;

    if (action === "delete") {
      await handleDelete(doc);
    }

    if (action === "review") {
      await handleReview(doc, decision);
    }

    setConfirm(null);
  }

  return (
    <div className="admin-section admin-docs-section">
      <div className="admin-section-head admin-docs-head">
        <div>
          <h2>Quản lý tài liệu</h2>

          <p>
            {docs.length} tài liệu · {pendingCount} chờ duyệt · {publicCount} đã
            duyệt · {denyCount} từ chối
          </p>
        </div>

        <button
          className="admin-light-btn"
          type="button"
          onClick={loadDocuments}
          disabled={loading}
        >
          🔄 Tải lại
        </button>
      </div>

      <div className="admin-docs-stat-grid">
        <div className="admin-doc-stat admin-doc-stat-total">
          <span>📚</span>
          <div>
            <strong>{docs.length}</strong>
            <p>Tổng tài liệu</p>
          </div>
        </div>

        <div className="admin-doc-stat admin-doc-stat-pending">
          <span>⏳</span>
          <div>
            <strong>{pendingCount}</strong>
            <p>Chờ duyệt</p>
          </div>
        </div>

        <div className="admin-doc-stat admin-doc-stat-public">
          <span>🌐</span>
          <div>
            <strong>{publicCount}</strong>
            <p>Công khai</p>
          </div>
        </div>

        <div className="admin-doc-stat admin-doc-stat-deny">
          <span>❌</span>
          <div>
            <strong>{denyCount}</strong>
            <p>Từ chối</p>
          </div>
        </div>
      </div>

      <div className="admin-docs-toolbar">
        <div className="admin-search-wrap admin-doc-search">
          <span className="admin-search-icon">🔍</span>

          <input
            className="admin-search"
            placeholder="Tìm tên tài liệu, chủ sở hữu, môn học, loại file..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />

          {search && (
            <button
              className="admin-search-clear"
              onClick={() => handleSearchChange("")}
            >
              ✕
            </button>
          )}
        </div>

        <select
          className="admin-select"
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="SUCCESS">Đã duyệt</option>
          <option value="DENY">Từ chối</option>
          <option value="DEFAULT">Riêng tư</option>
        </select>

        <select
          className="admin-select"
          value={extFilter}
          onChange={(e) => handleExtFilterChange(e.target.value)}
        >
          {["Tất cả", "PDF", "PPT", "DOC", "IMG"].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>

      <div className="admin-docs-board">
        {loading ? (
          <div className="admin-docs-empty">
            <div className="admin-preview-spinner" />
            <p>Đang tải tài liệu...</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="admin-docs-empty">
            <div>📭</div>
            <p>Không tìm thấy tài liệu phù hợp.</p>
          </div>
        ) : (
          paginated.map((doc) => {
            const statusMeta = getStatusMeta(doc.status);
            const privacyMeta = getPrivacyMeta(doc);

            return (
              <article
                key={doc.id}
                className={`admin-doc-card admin-doc-card--${doc.status.toLowerCase()}`}
              >
                <div className="admin-doc-main">
                  <div
                    className="admin-doc-ext"
                    style={{ background: EXT_COLOR[doc.ext] || "#64748b" }}
                  >
                    {doc.ext}
                  </div>

                  <div className="admin-doc-info">
                    <h3 title={doc.name}>{doc.name}</h3>

                    <div className="admin-doc-meta">
                      <span>👤 {doc.owner}</span>
                      <span>📘 {doc.subject}</span>
                      <span>📦 {doc.size}</span>
                      <span>📅 {formatDate(doc.date)}</span>
                    </div>
                  </div>
                </div>

                <div className="admin-doc-tags">
                  <span className={`admin-doc-status ${statusMeta.className}`}>
                    {statusMeta.icon} {statusMeta.label}
                  </span>

                  <span
                    className={`admin-doc-privacy ${privacyMeta.className}`}
                  >
                    {privacyMeta.icon} {privacyMeta.label}
                  </span>
                </div>

                <div className="admin-doc-actions">
                  <button
                    className="admin-action-btn admin-action-view"
                    type="button"
                    onClick={() => handleView(doc)}
                  >
                    👁️ Xem
                  </button>

                  <button
                    className="admin-action-btn admin-action-download"
                    type="button"
                    onClick={() => handleDownload(doc)}
                  >
                    ⬇️ Tải
                  </button>

                  {doc.status === "PENDING" && (
                    <>
                      <button
                        className="admin-action-btn admin-action-accept"
                        type="button"
                        onClick={() =>
                          setConfirm({
                            action: "review",
                            doc,
                            decision: "ACCEPT",
                          })
                        }
                      >
                        ✅ Duyệt
                      </button>

                      <button
                        className="admin-action-btn admin-action-deny"
                        type="button"
                        onClick={() =>
                          setConfirm({
                            action: "review",
                            doc,
                            decision: "DENY",
                          })
                        }
                      >
                        ❌ Từ chối
                      </button>
                    </>
                  )}

                  <button
                    className="admin-action-btn admin-action-delete"
                    type="button"
                    onClick={() =>
                      setConfirm({
                        action: "delete",
                        doc,
                      })
                    }
                  >
                    🗑️ Xóa
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      {!loading && filtered.length > DOCUMENTS_PAGE_SIZE && (
        <div className="admin-docs-pagination">
          <button
            className="admin-light-btn"
            disabled={currentPage <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            ← Trước
          </button>

          <span>
            Trang {currentPage} / {totalPages}
          </span>

          <button
            className="admin-light-btn"
            disabled={currentPage >= totalPages}
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
          >
            Sau →
          </button>
        </div>
      )}

      <ConfirmBox
        confirm={confirm}
        onCancel={() => setConfirm(null)}
        onConfirm={doConfirmAction}
      />

      <PreviewModal
        doc={previewDoc}
        url={previewUrl}
        blob={previewBlob}
        loading={previewLoading}
        error={previewError}
        onClose={closePreview}
        onDownload={handleDownload}
      />
    </div>
  );
}
