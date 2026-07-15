import api from "./api";

function appendIfPresent(formData, key, value) {
  if (value !== undefined && value !== null && value !== "") {
    formData.append(key, value);
  }
}

function normalizeCategories(categories) {
  if (!categories) {
    return [];
  }

  if (Array.isArray(categories)) {
    return categories.filter(Boolean);
  }

  return [categories].filter(Boolean);
}

function normalizeCreateDocumentPayload(firstArg, secondArg) {
  /**
   * Hỗ trợ các kiểu gọi:
   *
   * createDocument({
   *   file,
   *   description,
   *   textContent,
   *   categories
   * })
   *
   * createDocument(file, {
   *   description,
   *   textContent,
   *   categories
   * })
   *
   * createDocument({
   *   file,
   *   data: {
   *     description,
   *     subject,
   *     categories
   *   }
   * })
   */
  let payload;

  if (firstArg instanceof File || firstArg instanceof Blob) {
    payload = {
      ...(secondArg || {}),
      file: firstArg,
    };
  } else {
    payload = firstArg || {};
  }

  const nestedData = payload.data || payload.formData || payload.values || {};

  const file = payload.file || nestedData.file || null;

  const description =
    payload.description ||
    payload.documentDescription ||
    payload.desc ||
    payload.note ||
    nestedData.description ||
    nestedData.documentDescription ||
    nestedData.desc ||
    nestedData.note ||
    "";

  const textContent =
    payload.textContent ||
    payload.content ||
    nestedData.textContent ||
    nestedData.content ||
    description;

  const categoryNames =
    payload.categoryNames ||
    payload.categories ||
    payload.subject ||
    payload.subjectName ||
    payload.course ||
    nestedData.categoryNames ||
    nestedData.categories ||
    nestedData.subject ||
    nestedData.subjectName ||
    nestedData.course ||
    [];

  return {
    file,
    description,
    textContent,
    categoryNames,
  };
}

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

  /**
   * Gắn thêm metadata vào chính Blob.
   * Như vậy FE cũ gọi URL.createObjectURL(result) vẫn chạy,
   * FE mới gọi result.url / result.blob cũng vẫn chạy.
   */
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

export async function getAllDocuments() {
  return getDocuments();
}

export async function getMyDocuments() {
  return getDocuments();
}

export async function getPublicDocuments() {
  return api.get("/v1/documents/public");
}

export async function searchDocuments(searchText = "") {
  return api.get("/v1/documents/search", {
    name: searchText || "",
  });
}

export async function searchAndFilterDocuments(searchText = "") {
  return searchDocuments(searchText);
}

export async function getDocumentById(documentId) {
  return api.get(`/v1/documents/${documentId}`);
}

export async function getDocumentDetail(documentId) {
  return getDocumentById(documentId);
}

export async function createDocument(firstArg, secondArg) {
  const payload = normalizeCreateDocumentPayload(firstArg, secondArg);

  if (!payload.file) {
    throw new Error("Vui lòng chọn file để upload");
  }

  const description = String(payload.description || "").trim();

  if (!description) {
    throw new Error("Vui lòng nhập mô tả tài liệu");
  }

  const formData = new FormData();

  formData.append("file", payload.file);
  formData.append("description", description);

  appendIfPresent(formData, "textContent", payload.textContent || description);

  normalizeCategories(payload.categoryNames).forEach((category) => {
    formData.append("categories", category);
  });

  return api.post("/v1/documents", formData);
}

export async function uploadDocument(firstArg, secondArg) {
  return createDocument(firstArg, secondArg);
}

export async function updateDocumentName(documentId, newName) {
  return api.put(`/v1/documents/${documentId}`, null, {
    queryParams: {
      newName,
    },
  });
}

export async function updateDocument(documentId, payload) {
  const newName =
    typeof payload === "string"
      ? payload
      : payload?.newName || payload?.documentName || payload?.name;

  return updateDocumentName(documentId, newName);
}

export async function deleteDocument(documentId) {
  return api.delete(`/v1/documents/${documentId}`);
}

export async function toggleDocumentPublicStatus(documentId, isPublic) {
  return api.put(`/v1/documents/${documentId}/toggle-public`, {
    isPublic: Boolean(isPublic),
  });
}

export async function updateDocumentVisibility(documentId, isPublic) {
  return toggleDocumentPublicStatus(documentId, isPublic);
}

export async function togglePublicStatus(documentId, isPublic) {
  return toggleDocumentPublicStatus(documentId, isPublic);
}

export async function updateDocumentPublicStatus(documentId, isPublic) {
  return api.put(`/v1/documents/${documentId}/public-status`, null, {
    queryParams: {
      isPublic: Boolean(isPublic),
    },
  });
}

export async function reviewDocument(documentId, decision) {
  return api.put(`/v1/documents/${documentId}/review`, null, {
    queryParams: {
      decision,
    },
  });
}

export async function approvePublicRequest(documentId, decision) {
  return reviewDocument(documentId, decision);
}

export async function acceptDocumentPublicRequest(documentId) {
  return reviewDocument(documentId, "ACCEPT");
}

export async function denyDocumentPublicRequest(documentId) {
  return reviewDocument(documentId, "DENY");
}

export async function previewDocument(documentId) {
  const response = await api.blob(`/v1/documents/${documentId}/preview-file`);
  return createBlobResult(response, `preview-${documentId}`);
}

export async function previewDocumentFile(documentId) {
  return previewDocument(documentId);
}

export async function getDocumentPreviewBlob(documentId) {
  return previewDocument(documentId);
}

export async function downloadDocument(documentId) {
  const response = await api.blob(`/v1/documents/${documentId}/download`);
  return createBlobResult(response, `document-${documentId}`);
}

export async function downloadDocumentFile(documentId) {
  return downloadDocument(documentId);
}

export async function getDocumentDownloadBlob(documentId) {
  return downloadDocument(documentId);
}

export async function downloadDocumentToDevice(documentId) {
  const result = await downloadDocument(documentId);

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

export async function updateSharePermission(
  documentId,
  targetUserId,
  permissionType = "view",
) {
  return updateDocumentSharePermission(
    documentId,
    targetUserId,
    permissionType,
  );
}

export async function getSharedDocuments() {
  return searchDocuments("");
}

export async function getPendingPublicDocuments() {
  return api.get("/admin/documents", {
    status: "PENDING",
  });
}

const documentApi = {
  getDocuments,
  getAllDocuments,
  getMyDocuments,
  getPublicDocuments,
  searchDocuments,
  searchAndFilterDocuments,
  getDocumentById,
  getDocumentDetail,
  createDocument,
  uploadDocument,
  updateDocumentName,
  updateDocument,
  deleteDocument,
  toggleDocumentPublicStatus,
  updateDocumentVisibility,
  togglePublicStatus,
  updateDocumentPublicStatus,
  reviewDocument,
  approvePublicRequest,
  acceptDocumentPublicRequest,
  denyDocumentPublicRequest,
  previewDocument,
  previewDocumentFile,
  getDocumentPreviewBlob,
  downloadDocument,
  downloadDocumentFile,
  getDocumentDownloadBlob,
  downloadDocumentToDevice,
  shareDocument,
  updateDocumentSharePermission,
  updateSharePermission,
  getSharedDocuments,
  getPendingPublicDocuments,
};

export default documentApi;
