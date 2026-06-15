import { request } from './api'

function getUserId() {
  return JSON.parse(localStorage.getItem('user') || '{}').id || ''
}

function xHeader() {
  return { 'X-User-Id': getUserId() }
}

// GET /api/v1/documents/all/{userId}
export function getDocuments() {
  const uid = getUserId()
  return request(`/v1/documents/all/${uid}`, {
    method: 'GET',
    headers: xHeader(),
  })
}

// GET /api/v1/documents/{id}
export function getDocumentById(id) {
  return request(`/v1/documents/${id}`, {
    method: 'GET',
    headers: xHeader(),
  })
}

export function getDocumentById(id) {
  return request(`/v1/documents/${id}`, {
    method: "GET",
  });
}

// POST /api/v1/documents — body: { documentName, fileType, previewUrl, downloadUrl, fileSize }
export function createDocument(data) {
  return request('/v1/documents', {
    method: 'POST',
    headers: xHeader(),
    body: JSON.stringify(data),
  })
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
