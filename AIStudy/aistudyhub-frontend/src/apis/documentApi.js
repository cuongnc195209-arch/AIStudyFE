import api from "./api";

// Danh sách môn học cố định (mã môn theo chương trình FPT) dùng cho dropdown chọn môn khi upload
export const SUBJECT_OPTIONS = [
  { value: "PRF192", label: "PRF192" },
  { value: "MAE101", label: "MAE101" },
  { value: "CSI104", label: "CSI104" },
  { value: "CEA201", label: "CEA201" },
  { value: "PRO192", label: "PRO192" },
  { value: "MAD101", label: "MAD101" },
  { value: "OSG202", label: "OSG202" },
  { value: "CSD201", label: "CSD201" },
  { value: "DBI202", label: "DBI202" },
  { value: "LAB211", label: "LAB211" },
  { value: "PRJ301", label: "PRJ301" },
  { value: "MAS291", label: "MAS291" },
  { value: "SWR302", label: "SWR302" },
  { value: "SWT301", label: "SWT301" },
  { value: "PRN212", label: "PRN212" },
  { value: "OTHER", label: "OTHER" },
];

const SUBJECT_LABEL_BY_CODE = SUBJECT_OPTIONS.reduce((map, item) => {
  map[item.value] = item.label;
  return map;
}, {});

export function getSubjectLabel(subjectCode) {
  if (!subjectCode) {
    return "Chưa phân loại";
  }

  return SUBJECT_LABEL_BY_CODE[subjectCode] || subjectCode;
}

// Chuẩn hoá mã môn nhập vào — nếu không khớp mã nào trong SUBJECT_OPTIONS thì gán "OTHER"
function normalizeSubjectCode(subjectCode) {
  if (!subjectCode) {
    return "";
  }

  const value = String(subjectCode).trim().toUpperCase();

  const exists = SUBJECT_OPTIONS.some((item) => item.value === value);

  return exists ? value : "OTHER";
}

// Tách tên file gốc từ header Content-Disposition mà backend trả về khi tải file

export async function getDocuments() {
  return api.get("/v1/documents/all");
}

export async function getPublicDocuments() {
  return api.get("/v1/documents/public");
}

export async function searchDocuments(searchText = "") {
  return api.get("/v1/documents/search", {
    name: searchText || "",
  });
}

export async function getDocumentById(documentId) {
  return api.get(`/v1/documents/${documentId}`);
}

// Upload tài liệu mới — validate ở client trước khi gửi FormData lên backend
export async function createDocument(payload = {}) {
  const file = payload.file;
  const description = String(payload.description || "").trim();
  const subjectCode = normalizeSubjectCode(payload.subjectCode);

  if (!file) {
    throw new Error("Vui lòng chọn file để upload");
  }

  if (!description) {
    throw new Error("Vui lòng nhập mô tả tài liệu");
  }

  if (!subjectCode) {
    throw new Error("Vui lòng chọn môn học");
  }

  const formData = new FormData();

  formData.append("file", file);
  formData.append("description", description);
  formData.append("subjectCode", subjectCode);

  return api.post("/v1/documents", formData);
}

export async function updateDocumentName(documentId, newName) {
  return api.put(`/v1/documents/${documentId}`, null, {
    queryParams: {
      newName,
    },
  });
}

export async function deleteDocument(documentId) {
  return api.delete(`/v1/documents/${documentId}`);
}

export async function toggleDocumentPublicStatus(documentId, isPublic) {
  return api.put(`/v1/documents/${documentId}/toggle-public`, {
    isPublic: Boolean(isPublic),
  });
}

// Admin/Moderator duyệt tài liệu công khai — decision chỉ nhận ACCEPT hoặc DENY
export async function reviewDocument(documentId, decision) {
  const cleanDecision = String(decision || "")
    .trim()
    .toUpperCase();

  if (cleanDecision !== "ACCEPT" && cleanDecision !== "DENY") {
    throw new Error("Decision không hợp lệ. Chỉ dùng ACCEPT hoặc DENY.");
  }

  return api.put(`/v1/documents/${documentId}/review`, null, {
    queryParams: {
      decision: cleanDecision,
    },
  });
}

export async function previewDocumentFile(documentId) {
  if (!documentId) {
    throw new Error("Thiếu documentId");
  }

  const blob = await api.blob(`/v1/documents/${documentId}/preview-file`);

  return {
    blob,
    url: URL.createObjectURL(blob),
  };
}

export async function downloadDocumentFile(documentId) {
  if (!documentId) {
    throw new Error("Thiếu documentId");
  }

  const blob = await api.blob(`/v1/documents/${documentId}/download`);

  return {
    blob,
    url: URL.createObjectURL(blob),
  };
}

// Tải file về máy: tạo thẻ <a download> ẩn, click giả lập rồi dọn dẹp Object URL
export async function downloadDocumentToDevice(documentId) {
  const result = await downloadDocumentFile(documentId);

  const link = document.createElement("a");
  link.href = result.url;
  link.download = result.fileName || `document-${documentId}`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(result.url);
  }, 1000);

  return result;
}

export async function shareDocument(
  documentId,
  targetUserId,
  permissionType = "view",
) {
  return api.post(`/v1/documents/${documentId}/share`, null, {
    queryParams: {
      targetUserId,
      permissionType,
    },
  });
}

export async function updateDocumentSharePermission(
  documentId,
  targetUserId,
  permissionType = "view",
) {
  return api.put(`/v1/documents/${documentId}/share`, null, {
    queryParams: {
      targetUserId,
      permissionType,
    },
  });
}

// Dùng bởi ModerationPage — cùng endpoint /admin/document nhưng luôn lọc status=PENDING
export async function getPendingPublicDocuments({ page = 0, size = 10 } = {}) {
  return api.get("/admin/document", {
    status: "PENDING",
    page,
    size,
  });
}

const documentApi = {
  SUBJECT_OPTIONS,
  getSubjectLabel,

  getDocuments,
  getPublicDocuments,
  searchDocuments,
  getDocumentById,
  createDocument,
  updateDocumentName,
  deleteDocument,
  toggleDocumentPublicStatus,
  reviewDocument,
  previewDocumentFile,
  downloadDocumentFile,
  downloadDocumentToDevice,
  shareDocument,
  updateDocumentSharePermission,
  getPendingPublicDocuments,
};

export default documentApi;
