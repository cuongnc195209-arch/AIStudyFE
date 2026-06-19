import { request } from "./api";

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

export function createDocument(file, metadata = {}) {
  const formData = new FormData();
  formData.append("file", file);
  if (metadata.documentName) formData.append("documentName", metadata.documentName);

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

export function updateDocumentName(documentId, newName) {
  return updateDocument(documentId, newName);
}

export function deleteDocument(id) {
  return request(`/v1/documents/${id}`, {
    method: "DELETE",
  });
}
