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

export function createDocument({ file, data }) {
  const formData = new FormData();

  formData.append("file", file);

  if (data) {
    formData.append("data", JSON.stringify(data));
  }

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

export function deleteDocument(id) {
  return request(`/v1/documents/${id}`, {
    method: "DELETE",
  });
}
