import api from "./api";

export async function getDocuments() {
  return api.get("/v1/documents/all");
}

export async function getPublicDocuments() {
  return api.get("/v1/documents/public");
}

export async function getAllowedFileTypes() {
  return api.get("/v1/documents/file-type");
}

export async function searchDocuments(searchText = "") {
  return api.get("/v1/documents/search", {
    name: searchText || "",
  });
}

export async function getDocumentById(documentId) {
  return api.get(`/v1/documents/${documentId}`);
}

export async function createDocument(payload = {}) {
  const file = payload.file;
  const description = String(payload.description || "").trim();
  const categoryId = String(payload.categoryId || "").trim();

  if (!file) {
    throw new Error("Vui lòng chọn file để upload");
  }

  if (!description) {
    throw new Error("Vui lòng nhập mô tả tài liệu");
  }

  if (!categoryId) {
    throw new Error("Vui lòng chọn môn học");
  }

  const formData = new FormData();

  formData.append("file", file);
  formData.append("description", description);
  formData.append("categoryId", categoryId);

  return api.post("/v1/documents", formData);
}

export async function updateDocumentInfo(documentId, payload = {}) {
  if (!documentId) {
    throw new Error("Thiếu mã tài liệu");
  }

  const documentName = String(
    payload.documentName || payload.name || "",
  ).trim();
  const description = String(payload.description || "").trim();
  const categoryId = String(payload.categoryId || "").trim();

  if (!documentName) {
    throw new Error("Vui lòng nhập tên tài liệu");
  }

  if (!categoryId) {
    throw new Error("Vui lòng chọn môn học");
  }

  return api.put(`/v1/documents/${documentId}`, {
    documentName,
    description,
    categoryId,
  });
}

export async function replaceDocumentFile(documentId, file) {
  if (!documentId) {
    throw new Error("Thiếu mã tài liệu");
  }

  if (!file) {
    throw new Error("Vui lòng chọn file để thay thế");
  }

  const formData = new FormData();
  formData.append("file", file);

  return api.put(`/v1/documents/${documentId}/file`, formData);
}

export async function updateDocumentName(documentId, newName) {
  if (!documentId) {
    throw new Error("Thiếu mã tài liệu");
  }

  const cleanName = String(newName || "").trim();

  if (!cleanName) {
    throw new Error("Vui lòng nhập tên tài liệu");
  }

  return api.put(`/v1/documents/${documentId}`, null, {
    queryParams: {
      newName: cleanName,
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

export async function reviewDocument(documentId, decision) {
  const cleanDecision = String(decision || "")
    .trim()
    .toUpperCase();

  if (cleanDecision !== "ACCEPT" && cleanDecision !== "DENY") {
    throw new Error("Quyết định không hợp lệ");
  }

  return api.put(`/v1/documents/${documentId}/review`, null, {
    queryParams: {
      decision: cleanDecision,
    },
  });
}

export async function previewDocumentFile(documentId) {
  if (!documentId) {
    throw new Error("Thiếu mã tài liệu");
  }

  const blob = await api.blob(`/v1/documents/${documentId}/preview-file`);

  return {
    blob,
    url: URL.createObjectURL(blob),
  };
}

export async function downloadDocumentFile(documentId) {
  if (!documentId) {
    throw new Error("Thiếu mã tài liệu");
  }

  const blob = await api.blob(`/v1/documents/${documentId}/download`);

  return {
    blob,
    url: URL.createObjectURL(blob),
  };
}

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

export async function getPendingPublicDocuments({ page = 0, size = 10 } = {}) {
  return api.get("/admin/document", {
    status: "PENDING",
    page,
    size,
  });
}

const documentApi = {
  getDocuments,
  getPublicDocuments,
  getAllowedFileTypes,
  searchDocuments,
  getDocumentById,
  createDocument,
  replaceDocumentFile,
  updateDocumentInfo,
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
