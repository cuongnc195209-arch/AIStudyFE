import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import AppLayout from "../../components/layout/AppLayout";
import {
  getPendingPublicDocuments,
  reviewDocument,
} from "../../apis/documentApi";
import "../Admin/AdminDashboardPage.css";

const PAGE_SIZE = 9999;

function getListFromResponse(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.content)) return res.content;
  if (Array.isArray(res?.data?.content)) return res.data.content;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

function getFileIcon(fileType) {
  const type = String(fileType || "").toUpperCase();

  if (type.includes("PDF")) {
    return "📕";
  }

  if (type.includes("DOC") || type.includes("WORD")) {
    return "📘";
  }

  if (type.includes("PPT")) {
    return "📙";
  }

  if (
    type.includes("PNG") ||
    type.includes("JPG") ||
    type.includes("JPEG") ||
    type.includes("IMG")
  ) {
    return "🖼️";
  }

  return "📄";
}

function formatFileSize(size) {
  const bytes = Number(size || 0);

  if (!bytes) {
    return "—";
  }

  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  return `${Math.round(bytes / 1024)} KB`;
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("vi-VN");
}

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .replace(/^STATUS_/, "")
    .replace(/^PUBLIC_/, "")
    .toUpperCase();
}

function getDocStatus(doc) {
  return normalizeStatus(
    doc.status ||
      doc.publicStatus ||
      doc.statusPublicDoc ||
      doc.statusPublic ||
      doc.reviewStatus ||
      doc.approvalStatus ||
      doc.documentStatus,
  );
}

function getSenderName(doc) {
  return (
    doc.userFullName ||
    doc.ownerName ||
    doc.fullName ||
    doc.authorName ||
    doc.uploaderName ||
    doc.userName ||
    doc.userEmail ||
    doc.email ||
    "—"
  );
}

function mapPendingDocument(doc, index = 0) {
  const documentName = doc.documentName || doc.name || doc.title || "Untitled";

  const documentId =
    doc.documentId ||
    doc.id ||
    doc.document_id ||
    doc.documentID ||
    `${documentName}-${index}`;

  const fileType = String(
    doc.fileType || doc.ext || doc.extension || "FILE",
  ).toUpperCase();

  return {
    id: documentId,
    documentId,
    name: documentName,
    sender: getSenderName(doc),
    fileType,
    fileSize: doc.fileSize || doc.file_size || 0,
    createdAt: doc.createdAt || doc.created_at || doc.date || "",
    status: getDocStatus(doc) || "PENDING",
    description: doc.description || "",
  };
}

export default function ModerationPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

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

  const fetchPendingDocuments = useCallback(async () => {
    const res = await getPendingPublicDocuments({
      page: 0,
      size: PAGE_SIZE,
    });

    const list = getListFromResponse(res);

    const hasStatusField = list.some((doc) => getDocStatus(doc));

    const pendingList = hasStatusField
      ? list.filter((doc) => getDocStatus(doc) === "PENDING")
      : list;

    return pendingList.map((doc, index) => mapPendingDocument(doc, index));
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchPendingDocuments()
      .then((pendingDocs) => {
        if (cancelled) {
          return;
        }

        setDocuments(pendingDocs);
        setError("");
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }

        console.error("Load pending documents error:", err);
        setDocuments([]);
        setError(err?.message || "Không thể tải danh sách tài liệu chờ duyệt.");
      })
      .finally(() => {
        if (cancelled) {
          return;
        }

        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchPendingDocuments]);

  async function loadPendingDocuments() {
    setLoading(true);
    setError("");

    try {
      const pendingDocs = await fetchPendingDocuments();
      setDocuments(pendingDocs);
    } catch (err) {
      console.error("Load pending documents error:", err);
      setDocuments([]);
      setError(err?.message || "Không thể tải danh sách tài liệu chờ duyệt.");
    } finally {
      setLoading(false);
    }
  }

  const filteredDocuments = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      return documents;
    }

    return documents.filter((doc) => {
      return (
        doc.name.toLowerCase().includes(q) ||
        doc.sender.toLowerCase().includes(q) ||
        doc.fileType.toLowerCase().includes(q) ||
        doc.status.toLowerCase().includes(q)
      );
    });
  }, [documents, search]);

  async function handleReview(doc, decision) {
    if (!doc.documentId) {
      showToast({
        icon: "error",
        title: "Thiếu thông tin tài liệu",
        text: "BE chưa trả documentId nên không thể duyệt tài liệu này.",
      });

      return;
    }

    const isAccept = decision === "ACCEPT";

    const result = await Swal.fire({
      title: isAccept ? "Duyệt tài liệu?" : "Từ chối tài liệu?",
      html: `
        <div style="text-align: center;">
          <p style="font-size: 15px; margin-bottom: 8px;">
            Bạn có chắc muốn ${isAccept ? "duyệt" : "từ chối"} tài liệu này không?
          </p>
          <b style="font-size: 16px; color: #111827;">
            "${doc.name}"
          </b>
        </div>
      `,
      icon: isAccept ? "question" : "warning",
      showCancelButton: true,
      confirmButtonText: isAccept ? "Duyệt" : "Từ chối",
      cancelButtonText: "Hủy",
      confirmButtonColor: isAccept ? "#16a34a" : "#dc2626",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    setProcessingId(doc.id);

    try {
      await reviewDocument(doc.documentId, decision);

      setDocuments((prev) => prev.filter((item) => item.id !== doc.id));

      showToast({
        icon: "success",
        title: isAccept ? "Đã duyệt tài liệu" : "Đã từ chối tài liệu",
        text: isAccept
          ? "Tài liệu đã được chấp nhận công khai. Email thông báo đã được gửi."
          : "Tài liệu đã bị từ chối. Email thông báo đã được gửi.",
      });
    } catch (err) {
      console.error("Review document error:", err);

      showToast({
        icon: "error",
        title: "Thao tác thất bại",
        text: err?.message || "Không thể duyệt tài liệu. Vui lòng thử lại.",
      });
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <AppLayout>
      <div className="admin-page">
        <div className="admin-section">
          <div className="admin-section-head">
            <h2>Kiểm duyệt tài liệu</h2>

            <p>
              {documents.length} tài liệu đang chờ duyệt để hiển thị công khai
            </p>
          </div>

          <div className="admin-toolbar">
            <div className="admin-search-wrap">
              <span className="admin-search-icon">🔍</span>

              <input
                className="admin-search"
                placeholder="Tìm tài liệu, người gửi, loại file..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {search && (
                <button
                  className="admin-search-clear"
                  type="button"
                  onClick={() => setSearch("")}
                >
                  ✕
                </button>
              )}
            </div>

            <button
              className="ta-btn ta-view"
              type="button"
              onClick={loadPendingDocuments}
              disabled={loading}
            >
              🔄 Tải lại
            </button>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tài liệu</th>
                  <th>Người gửi</th>
                  <th>Loại</th>
                  <th>Kích thước</th>
                  <th>Ngày gửi</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filteredDocuments.map((doc, index) => (
                  <tr key={doc.id || `${doc.name}-${index}`}>
                    <td>
                      <div className="td-doc">
                        <div
                          className="td-ext"
                          style={{
                            background: "#f1f5f9",
                            color: "#0f172a",
                          }}
                        >
                          {getFileIcon(doc.fileType)}
                        </div>

                        <div>
                          <p className="td-docname">{doc.name}</p>

                          {doc.description && (
                            <p className="td-email">{doc.description}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="td-secondary">{doc.sender}</td>

                    <td className="td-secondary">{doc.fileType}</td>

                    <td className="td-secondary">
                      {formatFileSize(doc.fileSize)}
                    </td>

                    <td className="td-secondary">
                      {formatDate(doc.createdAt)}
                    </td>

                    <td>
                      <span className="status-badge role-mod">
                        {doc.status || "PENDING"}
                      </span>
                    </td>

                    <td>
                      <div className="td-actions">
                        <button
                          className="ta-btn ta-unlock"
                          type="button"
                          disabled={processingId === doc.id}
                          onClick={() => handleReview(doc, "ACCEPT")}
                        >
                          ✅ Accept
                        </button>

                        <button
                          className="ta-btn ta-delete"
                          type="button"
                          disabled={processingId === doc.id}
                          onClick={() => handleReview(doc, "DENY")}
                        >
                          ❌ Deny
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {loading && <div className="table-empty">Đang tải...</div>}

            {!loading && error && <div className="table-empty">{error}</div>}

            {!loading && !error && filteredDocuments.length === 0 && (
              <div className="table-empty">
                Không có tài liệu nào đang chờ duyệt.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
