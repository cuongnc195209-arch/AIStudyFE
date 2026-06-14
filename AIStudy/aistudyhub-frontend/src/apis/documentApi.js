import { request } from "./api";

export function getDocuments() {
  return request("/v1/documents", {
    method: "GET",
  });
}

export function getDocumentById(id) {
  return request(`/v1/documents/${id}`, {
    method: "GET",
  });
}

export function createDocument(data) {
  return request("/v1/documents", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateDocument(id, newName) {
  return request(`/v1/documents/${id}?newName=${encodeURIComponent(newName)}`, {
    method: "PUT",
  });
}

// Giữ thêm hàm này để nếu file khác còn gọi updateDocumentName thì không bị lỗi
export function updateDocumentName(documentId, newName) {
  return updateDocument(documentId, newName);
}

export function deleteDocument(id) {
  return request(`/v1/documents/${id}`, {
    method: "DELETE",
  });
}
