export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.example.com'

export async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || 'API request failed')
  }

  return response.json()
}
