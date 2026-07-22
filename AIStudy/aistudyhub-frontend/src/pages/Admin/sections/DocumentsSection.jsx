import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAdminDocuments, reviewDocument } from "../../../apis/adminApi";
import { deleteDocument } from "../../../apis/documentApi";
import { ConfirmModal } from "../shared/ConfirmModal";
import { AdminPagination } from "../shared/AdminPagination";
import { EXT_COLOR } from "../shared/mockData";

const DOCUMENTS_PAGE_SIZE = 10;

function normalizeExt(fileType) {
  const rawExt = String(fileType || "PDF").toUpperCase();

  if (rawExt === "DOCX") {
    return "DOC";
  }

  if (rawExt === "PPTX") {
    return "PPT";
  }

  if (["JPG", "JPEG", "PNG"].includes(rawExt)) {
    return "IMG";
  }

  return rawExt;
}

function normalizeStatus(status, isPublic) {
  const rawStatus = String(status || "")
    .trim()
    .toUpperCase();

  if (rawStatus === "PENDING") {
    return "PENDING";
  }

  if (rawStatus === "SUCCESS") {
    return "SUCCESS";
  }

  if (
    rawStatus === "DENY" ||
    rawStatus === "DENIED" ||
    rawStatus === "REJECTED"
  ) {
    return "DENY";
  }

  if (isPublic) {
    return "SUCCESS";
  }

  return "DEFAULT";
}

function getStatusLabel(status) {
  if (status === "PENDING") {
    return "⏳ Chờ duyệt";
  }

  if (status === "SUCCESS") {
    return "✅ Đã duyệt";
  }

  if (status === "DENY") {
    return "❌ Từ chối";
  }

  return "🔒 Riêng tư";
}

function getPrivacyLabel(doc) {
  if (doc.status === "PENDING") {
    return "⏳ Chờ duyệt";
  }

  if (doc.status === "SUCCESS" || doc.privacy === "public") {
    return "🌐 Công khai";
  }

  if (doc.status === "DENY") {
    return "❌ Từ chối";
  }

  return "🔒 Riêng tư";
}

function getSizeLabel(fileSize) {
  const size = Number(fileSize || 0);

  if (!size) {
    return "—";
  }

  if (size >= 1048576) {
    return `${(size / 1048576).toFixed(1)} MB`;
  }

  return `${(size / 1024).toFixed(0)} KB`;
}

function getListFromResponse(res) {
  if (Array.isArray(res)) {
    return res;
  }

  if (Array.isArray(res?.content)) {
    return res.content;
  }

  if (Array.isArray(res?.data?.content)) {
    return res.data.content;
  }

  if (Array.isArray(res?.data)) {
    return res.data;
  }

  return [];
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

  const owner =
    document.userFullName ||
    document.ownerName ||
    document.fullName ||
    document.userEmail ||
    document.email ||
    document.owner ||
    "—";

  const subject =
    document.subjectCode ||
    document.subject ||
    document.categoryName ||
    "Tài liệu";

  const createdAt =
    document.createdAt || document.created_at || document.date || "";

  return {
    id:
      document.id ||
      document.documentId ||
      document.document_id ||
      `${documentName}-${createdAt || index}`,
    name: documentName,
    ext,
    owner,
    subject,
    size: getSizeLabel(document.fileSize || document.file_size),
    date: createdAt ? String(createdAt).slice(0, 10) : "",
    privacy: isPublic ? "public" : "private",
    status,
    previewUrl: document.previewUrl || document.preview_url || "",
    downloadUrl: document.downloadUrl || document.download_url || "",
  };
}

export default function DocumentsSection({ onToast }) {
  const onToastRef = useRef(onToast);

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [extFilter, setExtFilter] = useState("Tất cả");
  const [statusFilter, setStatusFilter] = useState("");

  const [confirm, setConfirm] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    onToastRef.current = onToast;
  }, [onToast]);

  const loadDocuments = useCallback(async () => {
    setLoading(true);

    try {
      const res = await getAdminDocuments({
        size: 9999,
        status: statusFilter,
      });

      const data = getListFromResponse(res);

      setDocs(data.map((document, index) => mapDocAdmin(document, index)));
    } catch (err) {
      console.error("Load admin docs error:", err);

      onToastRef.current?.(
        `Lỗi tải tài liệu: ${err?.message || "Không thể tải dữ liệu"}`,
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadDocuments();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDocuments]);

  const filtered = useMemo(() => {
    return docs.filter((doc) => {
      const q = search.toLowerCase().trim();

      const matchSearch =
        !q ||
        doc.name.toLowerCase().includes(q) ||
        doc.owner.toLowerCase().includes(q) ||
        doc.subject.toLowerCase().includes(q);

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

  function handleView(doc) {
    const url = doc.previewUrl || doc.downloadUrl;

    if (!url) {
      onToastRef.current?.("Tài liệu này chưa có đường dẫn xem trước");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleDelete(doc) {
    try {
      await deleteDocument(doc.id);

      setDocs((currentDocs) =>
        currentDocs.filter((item) => item.id !== doc.id),
      );

      onToastRef.current?.(`Đã xóa tài liệu "${doc.name}"`);
    } catch (err) {
      console.error("Delete document error:", err);

      onToastRef.current?.(
        `Xóa tài liệu thất bại: ${err?.message || "Vui lòng thử lại"}`,
      );
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

      onToastRef.current?.(
        decision === "ACCEPT"
          ? `Đã duyệt tài liệu "${doc.name}". Email thông báo đã được gửi.`
          : `Đã từ chối tài liệu "${doc.name}". Email thông báo đã được gửi.`,
      );
    } catch (err) {
      console.error("Review document error:", err);

      onToastRef.current?.(
        `Thao tác thất bại: ${err?.message || "Vui lòng thử lại"}`,
      );
    }
  }

  async function doConfirmAction() {
    if (!confirm) {
      return;
    }

    const { action, doc, decision } = confirm;

    if (action === "delete") {
      await handleDelete(doc);
    }

    if (action === "review") {
      await handleReview(doc, decision);
    }

    setConfirm(null);
  }

  function getConfirmTitle() {
    if (!confirm) {
      return "";
    }

    if (confirm.action === "delete") {
      return "Xóa tài liệu";
    }

    if (confirm.decision === "ACCEPT") {
      return "Duyệt tài liệu";
    }

    return "Từ chối tài liệu";
  }

  function getConfirmDescription() {
    if (!confirm) {
      return "";
    }

    if (confirm.action === "delete") {
      return `Xóa vĩnh viễn "${confirm.doc.name}" khỏi hệ thống?`;
    }

    if (confirm.decision === "ACCEPT") {
      return `Duyệt tài liệu "${confirm.doc.name}" và hiển thị công khai? Hệ thống sẽ gửi email cho chủ tài liệu và người duyệt.`;
    }

    return `Từ chối tài liệu "${confirm.doc.name}"? Hệ thống sẽ gửi email thông báo cho chủ tài liệu và người duyệt.`;
  }

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <h2>Quản lý tài liệu</h2>

        <p>
          {docs.length} tài liệu ·{" "}
          {docs.filter((doc) => doc.status === "PENDING").length} chờ duyệt
        </p>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <span className="admin-search-icon">🔍</span>

          <input
            className="admin-search"
            placeholder="Tìm tên, chủ sở hữu, môn học..."
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
          {["Tất cả", "PDF", "PPT", "DOC", "IMG"].map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
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
              <th>Trạng thái</th>
              <th>Quyền</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((doc, index) => (
              <tr key={doc.id || `${doc.name}-${doc.date}-${index}`}>
                <td>
                  <div className="td-doc">
                    <div
                      className="td-ext"
                      style={{
                        background: EXT_COLOR[doc.ext] || "#6b7280",
                      }}
                    >
                      {doc.ext}
                    </div>

                    <p className="td-docname">{doc.name}</p>
                  </div>
                </td>

                <td className="td-secondary">{doc.owner}</td>

                <td className="td-secondary">{doc.subject}</td>

                <td className="td-secondary">{doc.size}</td>

                <td className="td-secondary">
                  {doc.date
                    ? new Date(doc.date).toLocaleDateString("vi-VN")
                    : "—"}
                </td>

                <td>
                  <span className="status-badge">
                    {getStatusLabel(doc.status)}
                  </span>
                </td>

                <td>
                  <span
                    className={
                      doc.privacy === "public"
                        ? "privacy-public"
                        : "privacy-private"
                    }
                  >
                    {getPrivacyLabel(doc)}
                  </span>
                </td>

                <td>
                  <div className="td-actions">
                    <button
                      className="ta-btn ta-view"
                      onClick={() => handleView(doc)}
                    >
                      👁️ Xem
                    </button>

                    {doc.status === "PENDING" && (
                      <>
                        <button
                          className="ta-btn ta-unlock"
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
                          className="ta-btn ta-lock"
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
                      className="ta-btn ta-delete"
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && <div className="table-empty">Đang tải...</div>}

        {!loading && filtered.length === 0 && (
          <div className="table-empty">Không tìm thấy tài liệu</div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <AdminPagination
          page={currentPage}
          totalPages={totalPages}
          onChange={setPage}
        />
      )}

      {confirm && (
        <ConfirmModal
          title={getConfirmTitle()}
          desc={getConfirmDescription()}
          danger={confirm.action === "delete" || confirm.decision === "DENY"}
          onConfirm={doConfirmAction}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
