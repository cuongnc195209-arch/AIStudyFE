export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export function clearAuthStorage() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  sessionStorage.clear();
}

function getUserId() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return (
      user?.id ||
      user?.userId ||
      user?.user_id ||
      user?.data?.id ||
      user?.data?.userId ||
      user?.data?.user_id ||
      null
    );
  } catch {
    return null;
  }
}

export async function request(path, options = {}) {
  const token = localStorage.getItem("accessToken");
  const userId = getUserId();

  const isPublicAuthApi =
    path === "/auth/login" ||
    path === "/auth/register" ||
    path === "/auth/forgot-password" ||
    path === "/auth/reset-password" ||
    path === "/auth/refresh" ||
    path === "/auth/logout";

  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(!isPublicAuthApi && token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isPublicAuthApi && userId ? { "X-User-Id": userId } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const raw = await response.text().catch(() => null);
  let result;
  try {
    result = JSON.parse(raw);
  } catch {
    result = raw;
  }

  if (response.status === 401 && !isPublicAuthApi) {
    clearAuthStorage();
    window.location.href = "/login";
    return;
  }

  if (!response.ok) {
    const error = typeof result === "object" && result ? result : { message: result || "API request failed" };
    error.status = response.status;
    throw error;
  }

  return result;
}
