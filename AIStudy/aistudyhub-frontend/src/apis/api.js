export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export function clearAuthStorage() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  sessionStorage.clear();
}

function safeJsonParse(value, fallback = null) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function getStoredUser() {
  return safeJsonParse(localStorage.getItem("user") || "{}", {});
}

export function getAccessToken() {
  return localStorage.getItem("accessToken");
}

export function getRefreshToken() {
  return localStorage.getItem("refreshToken");
}

export function getUserId() {
  const user = getStoredUser();

  return (
    user?.id ||
    user?.userId ||
    user?.user_id ||
    user?.data?.id ||
    user?.data?.userId ||
    user?.data?.user_id ||
    null
  );
}

function normalizePath(path) {
  if (!path) return "";
  return path.startsWith("/") ? path : `/${path}`;
}

export function isPublicApi(path) {
  const normalizedPath = normalizePath(path);

  return (
    normalizedPath === "/auth/login" ||
    normalizedPath === "/auth/register" ||
    normalizedPath === "/auth/forgot-password" ||
    normalizedPath === "/auth/reset-password" ||
    normalizedPath === "/auth/refresh" ||
    normalizedPath === "/auth/logout" ||
    normalizedPath === "/v1/documents/public"
  );
}

async function parseResponseBody(response) {
  const raw = await response.text().catch(() => "");

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function request(path, options = {}) {
  const normalizedPath = normalizePath(path);
  const publicApi = isPublicApi(normalizedPath);

  const token = getAccessToken();
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(!publicApi && token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE_URL}${normalizedPath}`, {
    ...options,
    headers,
  });

  const result = await parseResponseBody(response);

  if (response.status === 401 && !publicApi) {
    clearAuthStorage();
    window.location.href = "/login";
    return;
  }

  if (!response.ok) {
    const error =
      typeof result === "object" && result !== null
        ? result
        : {
            message: result || `API request failed (HTTP ${response.status})`,
          };

    error.status = response.status;
    throw error;
  }

  return result;
}
