export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export async function request(path, options = {}) {
  const token = localStorage.getItem("accessToken");

  const isPublicAuthApi =
    path === "/auth/login" ||
    path === "/auth/register" ||
    path === "/auth/forgot-password" ||
    path === "/auth/reset-password" ||
    path === "/auth/refresh";

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(!isPublicAuthApi && token
        ? { Authorization: `Bearer ${token}` }
        : {}),
      ...(options.headers || {}),
    },
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw result || { message: "API request failed" };
  }

  return result;
}
