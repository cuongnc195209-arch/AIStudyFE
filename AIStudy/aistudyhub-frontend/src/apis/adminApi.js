import { request } from './api'

export function getAdminAccounts() {
  return request('/admin/account', { method: 'GET' })
}
