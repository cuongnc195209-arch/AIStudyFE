import { request } from './api'

function getUserId() {
  return JSON.parse(localStorage.getItem('user') || '{}').id || ''
}

function xHeader() {
  return { 'X-User-Id': getUserId() }
}

export function getDocuments() {
  return request(`/v1/documents`, {
    method: 'GET',
    headers: xHeader(),
  })
}

export function getDocumentById(id) {
  return request(`/v1/documents/${id}`, {
    method: 'GET',
    headers: xHeader(),
  })
}

// body: { documentName, fileType, previewUrl, downloadUrl, fileSize }
export function createDocument(data) {
  return request('/v1/documents', {
    method: 'POST',
    headers: xHeader(),
    body: JSON.stringify(data),
  })
}

export function updateDocument(id, newName) {
  return request(`/v1/documents/${id}?newName=${encodeURIComponent(newName)}`, {
    method: 'PUT',
    headers: xHeader(),
  })
}

export function deleteDocument(id, fileSize) {
  const query = fileSize ? `?fileSize=${fileSize}` : ''
  return request(`/v1/documents/${id}${query}`, {
    method: 'DELETE',
    headers: xHeader(),
  })
}
