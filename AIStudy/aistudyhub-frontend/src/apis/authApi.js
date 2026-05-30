import { request } from './api'

export function login(credentials) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function register(data) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
