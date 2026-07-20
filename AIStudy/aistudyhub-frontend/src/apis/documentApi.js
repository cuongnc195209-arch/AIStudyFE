import api from "./api";

// Danh sách môn học cố định (mã môn theo chương trình FPT) dùng cho dropdown chọn môn khi upload
export const SUBJECT_OPTIONS = [
  { value: "PRF192", label: "Lập trình cơ bản" },
  { value: "MAE101", label: "Toán cao cấp" },
  { value: "CEA201", label: "Tin học đại cương" },
  { value: "CSI104", label: "Nhập môn khoa học máy tính" },
  { value: "PRO192", label: "Lập trình hướng đối tượng" },
  { value: "MAD101", label: "Toán rời rạc" },
  { value: "OSG202", label: "Hệ điều hành" },
  { value: "CSD201", label: "Cấu trúc dữ liệu và giải thuật" },
  { value: "DBI202", label: "Cơ sở dữ liệu" },
  { value: "LAB211", label: "Java Lab" },
  { value: "PRJ301", label: "Lập trình Web" },
  { value: "MAS291", label: "Xác suất thống kê" },
  { value: "SWR302", label: "Yêu cầu phần mềm" },
  { value: "SWT301", label: "Kiểm thử phần mềm" },
  { value: "PRN212", label: ".NET / C#" },
  { value: "OTHER", label: "Khác" },
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
function getFileNameFromDisposition(
  contentDisposition,
  fallbackName = "document",
) {
  if (!contentDisposition) {
    return fallbackName;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);

  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const normalMatch = contentDisposition.match(/filename="?([^"]+)"?/i);

  if (normalMatch?.[1]) {
    return normalMatch[1];
  }

  return fallbackName;
}

// Biến response blob thô thành object tiện dùng: tạo sẵn Object URL để hiện ảnh/PDF/tải xuống
function createBlobResult(response, fallbackName = "document") {
  const blob = response?.blob instanceof Blob ? response.blob : response;

  if (!(blob instanceof Blob)) {
    throw new Error("Không nhận được dữ liệu file hợp lệ từ server");
  }

  const fileName = getFileNameFromDisposition(
    response?.contentDisposition,
    fallbackName,
  );

  const url = URL.createObjectURL(blob);

  blob.blob = blob;
  blob.url = url;
  blob.contentType = response?.contentType || blob.type;
  blob.contentDisposition = response?.contentDisposition || null;
  blob.fileName = fileName;

  return blob;
}

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
  const response = await api.blob(`/v1/documents/${documentId}/preview-file`);
  return createBlobResult(response, `preview-${documentId}`);
}

export async function downloadDocumentFile(documentId) {
  const response = await api.blob(`/v1/documents/${documentId}/download`);
  return createBlobResult(response, `document-${documentId}`);
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
