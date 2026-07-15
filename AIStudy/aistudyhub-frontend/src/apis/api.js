const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";

const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/refresh",
  "/v1/documents/public",
];

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getAuthToken() {
  return getAccessToken();
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAccessToken(token) {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
}

export function setRefreshToken(token) {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }
}

export function setAuthTokens({ accessToken, refreshToken }) {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function getCurrentUser() {
  const rawUser = localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

export function clearAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Alias cho FE cũ.
 * AppLayout.jsx đang import clearAuthStorage.
 */
export function clearAuthStorage() {
  clearAuthTokens();
}

export function removeAuthStorage() {
  clearAuthTokens();
}

/**
 * Alias cho FE cũ nếu có nơi lưu cả token + user.
 */
export function setAuthStorage(authData = {}) {
  const accessToken =
    authData.accessToken || authData.token || authData.access_token || null;

  const refreshToken = authData.refreshToken || authData.refresh_token || null;

  const user = authData.user || authData.profile || authData.data?.user || null;

  if (accessToken) {
    setAccessToken(accessToken);
  }

  if (refreshToken) {
    setRefreshToken(refreshToken);
  }

  if (user) {
    setCurrentUser(user);
  }

  return {
    accessToken,
    refreshToken,
    user,
  };
}

export function getAuthStorage() {
  return {
    accessToken: getAccessToken(),
    refreshToken: getRefreshToken(),
    user: getCurrentUser(),
  };
}

export function getCurrentUserRole() {
  const user = getCurrentUser();

  if (user?.role) {
    return String(user.role).replace("ROLE_", "").toUpperCase();
  }

  const token = getAccessToken();

  if (!token) {
    return null;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    return payload?.role
      ? String(payload.role).replace("ROLE_", "").toUpperCase()
      : null;
  } catch {
    return null;
  }
}

function isPublicPath(path) {
  return PUBLIC_PATHS.some((publicPath) => path.startsWith(publicPath));
}

function buildUrl(path, queryParams) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${normalizedPath}`);

  if (queryParams && typeof queryParams === "object") {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, value);
      }
    });
  }

  return url.toString();
}

function isFormData(body) {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function extractErrorMessage(errorBody, fallbackMessage) {
  if (!errorBody) {
    return fallbackMessage;
  }

  if (typeof errorBody === "string") {
    return errorBody;
  }

  if (typeof errorBody.message === "string") {
    return errorBody.message;
  }

  if (typeof errorBody.error === "string") {
    return errorBody.error;
  }

  if (typeof errorBody.data === "string") {
    return errorBody.data;
  }

  return fallbackMessage;
}

export function unwrapApiResponse(responseBody) {
  if (
    responseBody &&
    typeof responseBody === "object" &&
    Object.prototype.hasOwnProperty.call(responseBody, "data")
  ) {
    return responseBody.data;
  }

  return responseBody;
}

export async function request(path, options = {}) {
  const {
    method = "GET",
    body,
    headers = {},
    queryParams,
    raw = false,
  } = options;

  const url = buildUrl(path, queryParams);
  const finalHeaders = { ...headers };

  if (!isPublicPath(path)) {
    const token = getAccessToken();

    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  if (body && !isFormData(body) && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    body:
      body &&
      !isFormData(body) &&
      finalHeaders["Content-Type"] === "application/json"
        ? JSON.stringify(body)
        : body,
  });

  const responseBody = await parseResponse(response);

  if (!response.ok) {
    const message = extractErrorMessage(
      responseBody,
      `Request failed with status ${response.status}`,
    );

    const error = new Error(message);
    error.status = response.status;
    error.body = responseBody;
    throw error;
  }

  return raw ? responseBody : unwrapApiResponse(responseBody);
}

export async function rawRequest(path, options = {}) {
  return request(path, {
    ...options,
    raw: true,
  });
}

export async function blobRequest(path, options = {}) {
  const { method = "GET", headers = {}, queryParams } = options;

  const url = buildUrl(path, queryParams);
  const finalHeaders = { ...headers };

  if (!isPublicPath(path)) {
    const token = getAccessToken();

    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
  });

  if (!response.ok) {
    const responseBody = await parseResponse(response);

    const message = extractErrorMessage(
      responseBody,
      `Request failed with status ${response.status}`,
    );

    const error = new Error(message);
    error.status = response.status;
    error.body = responseBody;
    throw error;
  }

  const blob = await response.blob();

  return {
    blob,
    contentType: response.headers.get("content-type"),
    contentDisposition: response.headers.get("content-disposition"),
  };
}

export const api = {
  get: (path, queryParams) =>
    request(path, {
      method: "GET",
      queryParams,
    }),

  post: (path, body, options = {}) =>
    request(path, {
      method: "POST",
      body,
      ...options,
    }),

  put: (path, body, options = {}) =>
    request(path, {
      method: "PUT",
      body,
      ...options,
    }),

  patch: (path, body, options = {}) =>
    request(path, {
      method: "PATCH",
      body,
      ...options,
    }),

  delete: (path, options = {}) =>
    request(path, {
      method: "DELETE",
      ...options,
    }),

  raw: rawRequest,
  blob: blobRequest,
};

export default api;
