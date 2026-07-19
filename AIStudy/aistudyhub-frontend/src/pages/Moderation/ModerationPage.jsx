import { useCallback, useEffect, useMemo, useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import {
  getPendingPublicDocuments,
  reviewDocument,
} from "../../apis/documentApi";
import { Toast } from "../Admin/shared/Toast";
import "../Admin/AdminDashboardPage.css";

const PAGE_SIZE = 9999;

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
  if (value < 1048576) return `${(value / 1024).toFixed(0)} KB`;
  return `${(value / 1048576).toFixed(1)} MB`;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("vi-VN");
}

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

function isPendingDocument(d) {
  const status = getDocStatus(d);

  return status === "PENDING";
}

function mapPendingDocument(d, index = 0) {
  const documentId = d.documentId || d.id || d.document_id || d.uuid;
  const name = d.documentName || d.name || d.title || "Untitled";
  const createdAt = d.createdAt || d.created_at || d.uploadedAt || d.sharedAt;
  const status = getDocStatus(d) || "PENDING";

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
    status,
    description: d.description || "",
  };
}

export default function ModerationPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");

  const fetchPendingDocuments = useCallback(async () => {
    const res = await getPendingPublicDocuments({
      page: 0,
      size: PAGE_SIZE,
    });

    const list = getListFromResponse(res);

    return list
      .filter(isPendingDocument)
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
        doc.fileType.toLowerCase().includes(q)
      );
    });
  }, [documents, search]);

  async function handleReview(doc, decision) {
    if (!doc.documentId) {
      setToast("BE chưa trả documentId nên không thể duyệt tài liệu này.");
      return;
    }

    const actionText = decision === "ACCEPT" ? "duyệt" : "từ chối";

    const confirmed = window.confirm(
      `Bạn có chắc muốn ${actionText} tài liệu "${doc.name}" không?`,
    );

    if (!confirmed) return;

    setProcessingId(doc.id);

    try {
      await reviewDocument(doc.documentId, decision);

      setDocuments((prev) => prev.filter((item) => item.id !== doc.id));

      setToast(
        decision === "ACCEPT"
          ? `Đã duyệt tài liệu "${doc.name}"`
          : `Đã từ chối tài liệu "${doc.name}"`,
      );
    } catch (err) {
      console.error("Review document error:", err);
      setToast(err?.message || "Duyệt tài liệu thất bại.");
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
                      <span className="status-badge role-mod">Pending</span>
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

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </AppLayout>
  );
}
