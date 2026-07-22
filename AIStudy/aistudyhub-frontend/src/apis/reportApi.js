import api from "./api";

export const REPORT_REASON_OPTIONS = [
  {
    code: "SPAM_OR_MISLEADING",
    description: "Spam hoặc thông tin sai lệch",
  },
  {
    code: "INAPPROPRIATE_CONTENT",
    description: "Nội dung không phù hợp, đồi trụy, bạo lực",
  },
  {
    code: "COPYRIGHT_VIOLATION",
    description: "Vi phạm bản quyền / Bản quyền thuộc về tác giả khác",
  },
  {
    code: "WRONG_SUBJECT_OR_CATEGORY",
    description: "Sai môn học hoặc danh mục",
  },
  {
    code: "CORRUPTED_OR_UNREADABLE",
    description: "File hỏng, lỗi font, không đọc được",
  },
  {
    code: "OTHER",
    description: "Lý do khác",
  },
];

export async function createDocumentReport({
  documentId,
  reason,
  description = "",
}) {
  if (!documentId) {
    throw new Error("Thiếu documentId để báo cáo tài liệu");
  }

  if (!reason) {
    throw new Error("Vui lòng chọn lý do báo cáo");
  }

  if (reason === "OTHER" && !String(description || "").trim()) {
    throw new Error("Vui lòng nhập mô tả khi chọn lý do khác");
  }

  return api.post("/reports", null, {
    queryParams: {
      documentId,
      reason,
      description: String(description || "").trim(),
    },
  });
}

export async function getPendingDocumentReports() {
  return api.get("/reports/pending");
}

export async function processDocumentReport({
  reportId,
  status,
  adminNote = "",
}) {
  if (!reportId) {
    throw new Error("Thiếu reportId");
  }

  const cleanStatus = String(status || "")
    .trim()
    .toUpperCase();

  if (cleanStatus !== "RESOLVED" && cleanStatus !== "REJECTED") {
    throw new Error("Status chỉ được dùng RESOLVED hoặc REJECTED");
  }

  return api.put(`/reports/${reportId}/process`, null, {
    queryParams: {
      status: cleanStatus,
      adminNote,
    },
  });
}

const reportApi = {
  REPORT_REASON_OPTIONS,
  createDocumentReport,
  getPendingDocumentReports,
  processDocumentReport,
};

export default reportApi;
