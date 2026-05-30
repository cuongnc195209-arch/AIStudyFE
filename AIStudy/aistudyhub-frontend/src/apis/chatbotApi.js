import { request } from './api'

export function sendMessage(message) {
  return request('/chatbot', {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}
