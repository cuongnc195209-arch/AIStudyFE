import { request } from "./api";

export function getDocuments() {
  return request("/v1/documents", {
    method: "GET",
  });
}

export function createDocument(data) {
  return request("/v1/documents", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateDocumentName(documentId, newName) {
  return request(
    `/v1/documents/${documentId}?newName=${encodeURIComponent(newName)}`,
    {
      method: "PUT",
    },
  );
}

export function deleteDocument(documentId) {
  return request(`/v1/documents/${documentId}`, {
    method: "DELETE",
  });
}
