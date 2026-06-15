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

export function updateDocumentName(id, newName) {
  return updateDocument(id, newName);
}

export function deleteDocument(id) {
  return request(`/v1/documents/${id}`, {
    method: "DELETE",
  });
}
