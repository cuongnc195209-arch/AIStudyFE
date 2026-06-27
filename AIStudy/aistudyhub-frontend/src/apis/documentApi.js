import { BASE_URL, request } from "./api";

function getUserId() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return (
      user?.id ||
      user?.userId ||
      user?.user_id ||
      user?.data?.id ||
      user?.data?.userId ||
      user?.data?.user_id ||
      ""
    );
  } catch {
    return "";
  }
}

function authHeaders() {
  return {
    Authorization: "Bearer " + localStorage.getItem("accessToken"),
    "X-User-Id": getUserId(),
  };
}

async function requestFile(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return await res.blob();
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

  if (name) params.append("name", name);
  if (type && type !== "Tất cả") params.append("type", type);

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
    data?.description || data?.textContent || "Không có mô tả.";

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

/**
 * BE hiện tại dùng:
 * PUT /api/v1/documents/{documentId}/toggle-public
 * Body: { "isPublic": true/false }
 */
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
