import { BASE_URL, getAccessToken, request } from "./api";

function authHeaders() {
  const token = getAccessToken();

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function requestFile(path) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `File request failed (HTTP ${response.status})`);
  }

  return await response.blob();
}

export function getDocuments() {
  return request("/v1/documents/all", {
    method: "GET",
  });
}

export function getDocumentById(id) {
  return request(`/v1/documents/${id}`, {
    method: "GET",
  });
}

export function searchDocuments(name = "", type = "") {
  const params = new URLSearchParams();

  if (name && name.trim()) {
    params.append("name", name.trim());
  }

  if (type && type !== "Tất cả") {
    params.append("type", type);
  }

  const query = params.toString();

  return request(`/v1/documents/search${query ? `?${query}` : ""}`, {
    method: "GET",
  });
}

export function getPublicDocuments() {
  return request("/v1/documents/public", {
    method: "GET",
  });
}

export function createDocument({ file, data }) {
  const formData = new FormData();

  formData.append("file", file);

  const description =
    data?.description ||
    data?.textContent ||
    data?.documentName ||
    "Không có mô tả.";

  formData.append("description", description);
  formData.append("textContent", description);

  return request("/v1/documents", {
    method: "POST",
    body: formData,
  });
}

export function updateDocument(id, newName) {
  return request(`/v1/documents/${id}?newName=${encodeURIComponent(newName)}`, {
    method: "PUT",
  });
}

export function updateDocumentVisibility(id, isPublic) {
  return request(`/v1/documents/${id}/toggle-public`, {
    method: "PUT",
    body: JSON.stringify({
      isPublic: Boolean(isPublic),
    }),
  });
}

export function deleteDocument(id) {
  return request(`/v1/documents/${id}`, {
    method: "DELETE",
  });
}

export function previewDocumentFile(id) {
  return requestFile(`/v1/documents/${id}/preview-file`);
}

export function downloadDocumentFile(id) {
  return requestFile(`/v1/documents/${id}/download`);
}

/**
 * Các hàm share này được export để DocumentsPage.jsx không bị lỗi import.
 * Nếu BE chưa có endpoint share thì khi gọi thực tế có thể trả 404/403.
 */
export function shareDocument(id, targetUserId, permissionType = "view") {
  const params = new URLSearchParams();

  params.append("targetUserId", targetUserId);
  params.append("permissionType", permissionType);

  return request(`/v1/documents/${id}/share?${params.toString()}`, {
    method: "POST",
  });
}

export function updateDocumentSharePermission(
  id,
  targetUserId,
  permissionType = "view",
) {
  const params = new URLSearchParams();

  params.append("targetUserId", targetUserId);
  params.append("permissionType", permissionType);

  return request(`/v1/documents/${id}/share?${params.toString()}`, {
    method: "PUT",
  });
}

/**
 * Nếu DocumentsPage.jsx có gọi danh sách tài liệu được chia sẻ.
 * Endpoint này cần BE hỗ trợ. Nếu BE chưa có thì sẽ lỗi API sau, nhưng không lỗi import nữa.
 */
export function getSharedDocuments() {
  return request("/v1/documents/shared", {
    method: "GET",
  });
}
