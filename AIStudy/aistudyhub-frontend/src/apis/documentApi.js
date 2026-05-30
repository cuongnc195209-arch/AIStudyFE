import { request } from './api'

export function getDocuments() {
  return request('/documents')
}
