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

<<<<<<<<< Temporary merge branch 1
// GET /api/v1/documents/{id}
export function getDocumentById(id) {
  return request(`/v1/documents/${id}`, {
    method: 'GET',
    headers: xHeader(),
  })
}

// POST /api/v1/documents — body: { documentName, fileType, previewUrl, downloadUrl, fileSize }
=========
export function getDocumentById(id) {
  return request(`/v1/documents/${id}`, {
    method: "GET",
  });
}

>>>>>>>>> Temporary merge branch 2
export function createDocument(data) {
  return request("/v1/documents", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

<<<<<<<<< Temporary merge branch 1
// PUT /api/v1/documents/{id}?newName=...
export function updateDocument(id, newName) {
  return request(`/v1/documents/${id}?newName=${encodeURIComponent(newName)}`, {
    method: 'PUT',
    headers: xHeader(),
  })
}

// DELETE /api/v1/documents/{id}?fileSize=...
export function deleteDocument(id, fileSize) {
  return request(`/v1/documents/${id}?fileSize=${fileSize}`, {
    method: 'DELETE',
    headers: xHeader(),
  })
=========
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
>>>>>>>>> Temporary merge branch 2
}
