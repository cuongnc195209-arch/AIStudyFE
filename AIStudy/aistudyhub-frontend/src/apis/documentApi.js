import { request } from "./api";

export function getDocuments() {
  return request("/v1/documents", {
    method: "GET",
  });
}

<<<<<<< Updated upstream
=======
export function getDocumentById(id) {
  return request(`/v1/documents/${id}`, {
    method: "GET",
  });
}

>>>>>>> Stashed changes
export function createDocument(data) {
  return request("/v1/documents", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

<<<<<<< Updated upstream
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
=======
export function updateDocument(id, newName) {
  return request(`/v1/documents/${id}?newName=${encodeURIComponent(newName)}`, {
    method: "PUT",
  });
}

export function deleteDocument(id) {
  return request(`/v1/documents/${id}`, {
>>>>>>> Stashed changes
    method: "DELETE",
  });
}
