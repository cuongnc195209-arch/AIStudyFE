import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  getPendingDocumentReports,
  processDocumentReport,
} from "../../../apis/reportApi";
import { previewDocumentFile } from "../../../apis/documentApi";

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

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("vi-VN");
}

function normalizeReport(report) {
  return {
    id: report.id || report.reportId,
    documentId: report.documentId,
    documentName: report.documentName || "Tài liệu không tên",
    reporterName: report.reporterName || report.reporterEmail || "Người dùng",
    reason: report.reason || "OTHER",
    reasonDescription:
      report.reasonDescription ||
      report.reasonText ||
      report.reason ||
      "Lý do khác",
    description: report.description || "",
    status: report.status || "PENDING",
    adminNote: report.adminNote || "",
    createdAt: report.createdAt || report.created_at || "",
  };
}

export default function ReportsSection({ onToast }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [search, setSearch] = useState("");

  async function loadReports() {
    setLoading(true);

    try {
      const res = await getPendingDocumentReports();
      const list = getListFromResponse(res);

      setReports(list.map(normalizeReport));
    } catch (err) {
      console.error("Load reports error:", err);
      setReports([]);

      onToast?.(
        err?.message ||
          err?.data?.message ||
          "Không thể tải danh sách báo cáo.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchReports() {
      setLoading(true);

      try {
        const res = await getPendingDocumentReports();
        const list = getListFromResponse(res);

        if (!cancelled) {
          setReports(list.map(normalizeReport));
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Load reports error:", err);
          setReports([]);

          onToast?.(
            err?.message ||
              err?.data?.message ||
              "Không thể tải danh sách báo cáo.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchReports();

    return () => {
      cancelled = true;
    };
  }, [onToast]);

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      return reports;
    }

    return reports.filter((report) => {
      return (
        report.documentName.toLowerCase().includes(q) ||
        report.reporterName.toLowerCase().includes(q) ||
        report.reasonDescription.toLowerCase().includes(q) ||
        report.description.toLowerCase().includes(q)
      );
    });
  }, [reports, search]);

  async function handlePreview(report) {
    if (!report.documentId) {
      Swal.fire({
        icon: "error",
        title: "Thiếu documentId",
        text: "Không thể xem tài liệu vì BE chưa trả documentId.",
      });

      return;
    }

    try {
      const result = await previewDocumentFile(report.documentId);
      const blob = result?.blob instanceof Blob ? result.blob : result;

      if (!(blob instanceof Blob)) {
        throw new Error("BE không trả về file hợp lệ.");
      }

      const url = result?.url || URL.createObjectURL(blob);

      window.open(url, "_blank", "noopener,noreferrer");

      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (err) {
      console.error("Preview reported document error:", err);

      Swal.fire({
        icon: "error",
        title: "Không thể xem tài liệu",
        text:
          err?.message ||
          err?.data?.message ||
          "Kiểm tra quyền preview hoặc endpoint preview-file.",
      });
    }
  }

  async function handleProcess(report, status) {
    const isHidePost = status === "RESOLVED";

    const result = await Swal.fire({
      title: isHidePost ? "Ẩn bài bị báo cáo?" : "Bỏ qua báo cáo?",
      html: `
        <div style="text-align:left">
          <p><b>Tài liệu:</b> ${report.documentName}</p>
          <p><b>Lý do:</b> ${report.reasonDescription}</p>
          <p style="margin-top:10px;color:#64748b">
            ${
              isHidePost
                ? "Hành động này sẽ xử lý report và gỡ tài liệu khỏi cộng đồng."
                : "Hành động này sẽ bỏ report, tài liệu vẫn giữ nguyên."
            }
          </p>
        </div>
      `,
      input: "textarea",
      inputLabel: "Ghi chú xử lý",
      inputPlaceholder: isHidePost
        ? "Ví dụ: Tài liệu vi phạm chính sách cộng đồng."
        : "Ví dụ: Nội dung báo cáo không hợp lệ.",
      icon: isHidePost ? "warning" : "question",
      showCancelButton: true,
      confirmButtonText: isHidePost ? "Ẩn bài" : "Bỏ report",
      cancelButtonText: "Hủy",
      confirmButtonColor: isHidePost ? "#dc2626" : "#2563eb",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    setProcessingId(report.id);

    try {
      await processDocumentReport({
        reportId: report.id,
        status,
        adminNote: result.value || "",
      });

      setReports((current) => current.filter((item) => item.id !== report.id));

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: isHidePost ? "Đã ẩn bài" : "Đã bỏ report",
        text: isHidePost
          ? "Tài liệu đã được gỡ khỏi cộng đồng."
          : "Báo cáo đã được bỏ qua.",
        showConfirmButton: false,
        timer: 2200,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error("Process report error:", err);

      Swal.fire({
        icon: "error",
        title: "Thao tác thất bại",
        text: err?.message || err?.data?.message || "Không thể xử lý báo cáo.",
      });
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <section className="admin-section report-section">
      <div className="admin-section-head">
        <div>
          <h2>Báo cáo tài liệu</h2>
          <p>{reports.length} báo cáo đang chờ xử lý</p>
        </div>

        <button
          className="ta-btn ta-view"
          type="button"
          onClick={loadReports}
          disabled={loading}
        >
          🔄 Tải lại
        </button>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <span className="admin-search-icon">🔍</span>

          <input
            className="admin-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tài liệu, người báo cáo, lý do..."
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
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tài liệu</th>
              <th>Người báo cáo</th>
              <th>Lý do</th>
              <th>Mô tả</th>
              <th>Ngày báo cáo</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {filteredReports.map((report) => (
              <tr key={report.id}>
                <td>
                  <div className="td-doc">
                    <div
                      className="td-ext"
                      style={{
                        background: "#fff7ed",
                        color: "#ea580c",
                      }}
                    >
                      🚩
                    </div>

                    <div>
                      <p className="td-docname">{report.documentName}</p>
                      <p className="td-email">{report.documentId}</p>
                    </div>
                  </div>
                </td>

                <td className="td-secondary">{report.reporterName}</td>

                <td>
                  <span className="report-reason-badge">
                    {report.reasonDescription}
                  </span>
                </td>

                <td className="td-secondary">{report.description || "—"}</td>

                <td className="td-secondary">{formatDate(report.createdAt)}</td>

                <td>
                  <div className="td-actions">
                    <button
                      className="ta-btn ta-view"
                      type="button"
                      disabled={processingId === report.id}
                      onClick={() => handlePreview(report)}
                    >
                      👁️ Xem
                    </button>

                    <button
                      className="ta-btn ta-delete"
                      type="button"
                      disabled={processingId === report.id}
                      onClick={() => handleProcess(report, "RESOLVED")}
                    >
                      🚫 Ẩn bài
                    </button>

                    <button
                      className="ta-btn ta-unlock"
                      type="button"
                      disabled={processingId === report.id}
                      onClick={() => handleProcess(report, "REJECTED")}
                    >
                      ✅ Bỏ report
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && <div className="table-empty">Đang tải báo cáo...</div>}

        {!loading && filteredReports.length === 0 && (
          <div className="table-empty">
            Không có báo cáo tài liệu nào đang chờ xử lý.
          </div>
        )}
      </div>
    </section>
  );
}
