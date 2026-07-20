import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import AppLayout from "../../components/layout/AppLayout";
import {
  getPendingPublicDocuments,
  reviewDocument,
} from "../../apis/documentApi";
import "../Admin/AdminDashboardPage.css";

const PAGE_SIZE = 9999;

// Bóc list ra khỏi response backend — thử nhiều hình dạng khác nhau (mảng thẳng, {content}, {data}, {data.content})
function getListFromResponse(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.content)) return res.content;
  if (Array.isArray(res?.data?.content)) return res.data.content;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

function formatFileSize(bytes) {
  const value = Number(bytes || 0);

  if (!value) return "—";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(0)} KB`;

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("vi-VN");
}

// Chuẩn hoá status tài liệu — bỏ các tiền tố STATUS_/PUBLIC_ mà backend có thể trả kèm
function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .replace(/^STATUS_/, "")
    .replace(/^PUBLIC_/, "")
    .toUpperCase();
}

function getDocStatus(d) {
  return normalizeStatus(
    d.status ||
      d.publicStatus ||
      d.statusPublicDoc ||
      d.statusPublic ||
      d.reviewStatus ||
      d.approvalStatus ||
      d.documentStatus,
  );
}

function mapPendingDocument(d, index = 0) {
  const documentId = d.documentId || d.id || d.document_id || d.uuid;
  const name = d.documentName || d.name || d.title || "Untitled";
  const createdAt = d.createdAt || d.created_at || d.uploadedAt || d.sharedAt;
  const status = getDocStatus(d);

  return {
    id: documentId || `${name}-${createdAt || index}`,
    documentId,
    name,
    owner:
      d.userFullName ||
      d.ownerName ||
      d.uploadedBy ||
      d.userName ||
      d.fullName ||
      d.userEmail ||
      d.email ||
      "—",
    subject: d.subjectCode || d.subject || d.categoryName || "—",
    fileType: String(d.fileType || d.ext || "FILE").toUpperCase(),
    fileSize: formatFileSize(d.fileSize),
    createdAt,
    status: status || "UNKNOWN",
    description: d.description || "",
  };
}

export default function ModerationPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  // PAGE_SIZE = 9999 => coi như lấy hết 1 lần, không phân trang thật ở đây
  const fetchPendingDocuments = useCallback(async () => {
    const res = await getPendingPublicDocuments({
      page: 0,
      size: PAGE_SIZE,
    });

    const list = getListFromResponse(res);

    /*
      Quan trọng:
      API đã gọi /api/admin/document?status=PENDING
      nên BE đã lọc pending rồi.
      FE không filter thêm .filter(isPendingDocument),
      vì nếu BE chưa trả status đúng field thì FE sẽ tự xóa hết danh sách.
    */
    return list
      .filter((doc) => getDocStatus(doc) === "PENDING")
      .map((doc, index) => mapPendingDocument(doc, index));
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchPendingDocuments()
      .then((pendingDocs) => {
        if (cancelled) return;

        setDocuments(pendingDocs);
        setError("");
      })
      .catch((err) => {
        if (cancelled) return;

        console.error("Load pending documents error:", err);
        setDocuments([]);
        setError(err?.message || "Không thể tải danh sách tài liệu chờ duyệt.");
      })
      .finally(() => {
        if (cancelled) return;

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

    if (!q) return documents;

    return documents.filter((doc) => {
      return (
        doc.name.toLowerCase().includes(q) ||
        doc.owner.toLowerCase().includes(q) ||
        doc.subject.toLowerCase().includes(q) ||
        doc.fileType.toLowerCase().includes(q) ||
        doc.status.toLowerCase().includes(q)
      );
    });
  }, [documents, search]);

  // Duyệt/từ chối tài liệu: luôn hỏi xác nhận bằng SweetAlert2 trước khi gọi API,
  // sau khi thành công thì xoá tài liệu đó khỏi danh sách local (không cần load lại toàn bộ)
  async function handleReview(doc, decision) {
    if (!doc.documentId) {
      await Swal.fire({
        title: "Thiếu thông tin tài liệu",
        text: "BE chưa trả documentId nên không thể duyệt tài liệu này.",
        icon: "error",
        confirmButtonText: "Đóng",
        confirmButtonColor: "#2563eb",
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

    if (!result.isConfirmed) return;

    setProcessingId(doc.id);

    try {
      await reviewDocument(doc.documentId, decision);

      setDocuments((prev) => prev.filter((item) => item.id !== doc.id));

      await Swal.fire({
        title: isAccept ? "Đã duyệt tài liệu" : "Đã từ chối tài liệu",
        text: isAccept
          ? "Tài liệu đã được chấp nhận và có thể hiển thị công khai."
          : "Tài liệu đã bị từ chối.",
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#2563eb",
        timer: 1800,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error("Review document error:", err);

      await Swal.fire({
        title: "Thao tác thất bại",
        text: err?.message || "Không thể duyệt tài liệu. Vui lòng thử lại.",
        icon: "error",
        confirmButtonText: "Đóng",
        confirmButtonColor: "#2563eb",
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
                placeholder="Tìm tài liệu, người gửi, môn học..."
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
                  <th>Môn học</th>
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
                        <div className="td-ext">{doc.fileType}</div>

                        <div>
                          <p className="td-docname">{doc.name}</p>

                          {doc.description && (
                            <p className="td-email">{doc.description}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="td-secondary">{doc.owner}</td>
                    <td className="td-secondary">{doc.subject}</td>
                    <td className="td-secondary">{doc.fileType}</td>
                    <td className="td-secondary">{doc.fileSize}</td>
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
