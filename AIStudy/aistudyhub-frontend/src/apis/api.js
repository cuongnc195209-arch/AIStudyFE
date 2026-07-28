import Swal from "sweetalert2";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:8080/api" : "/api")
).replace(/\/+$/, "");

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";

const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/refresh",
  "/auth/logout",
  "/auth/verify-email",
  "/auth/resend-verification",
  "/v1/documents/public",
  "/email/test",
  "/reports/reasons",
];

let isRedirectingToLogin = false;

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAuthTokens({ accessToken, refreshToken }) {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function clearAuthStorage() {
  clearAuthTokens();
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

function isPublicPath(endpoint) {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return PUBLIC_PATHS.some((path) => cleanEndpoint.startsWith(path));
}

function normalizeQueryParams(options = {}) {
  return options.queryParams || options.params || undefined;
}

function buildUrl(endpoint, queryParams) {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const url = new URL(
    `${API_BASE_URL}${cleanEndpoint}`,
    window.location.origin,
  );

  if (queryParams && typeof queryParams === "object") {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, value);
      }
    });
  }

  return url.toString();
}

function isTokenExpiredResponse(status, responseData) {
  const message = String(
    responseData?.message || responseData?.error || responseData?.detail || "",
  ).toLowerCase();

  if (status === 401) {
    return true;
  }

  if (
    status === 403 &&
    (message.includes("jwt") ||
      message.includes("token") ||
      message.includes("expired") ||
      message.includes("unauthorized") ||
      message.includes("authentication"))
  ) {
    return true;
  }

  return false;
}

function redirectToLoginBecauseTokenExpired() {
  if (isRedirectingToLogin) {
    return;
  }

  isRedirectingToLogin = true;

  clearAuthTokens();

  const currentPath = window.location.pathname;

  if (currentPath === "/login") {
    return;
  }

  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "warning",
    title: "Phiên đăng nhập đã hết hạn",
    text: "Vui lòng đăng nhập lại để tiếp tục.",
    showConfirmButton: false,
    timer: 2200,
    timerProgressBar: true,
  });

  window.setTimeout(() => {
    window.location.href = "/login";
  }, 900);
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const text = await response.text();

    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  if (contentType.includes("text/")) {
    return response.text();
  }

  return response.blob();
}

function unwrapResponse(data) {
  if (
    data &&
    typeof data === "object" &&
    Object.prototype.hasOwnProperty.call(data, "data") &&
    Object.prototype.hasOwnProperty.call(data, "success")
  ) {
    return data.data;
  }

  return data;
}

export async function rawRequest(endpoint, options = {}) {
  const {
    method = "GET",
    body,
    headers = {},
    skipAuth = false,
    unwrap = false,
  } = options;

  const queryParams = normalizeQueryParams(options);
  const url = buildUrl(endpoint, queryParams);
  const token = getAccessToken();

  const finalHeaders = {
    Accept: "application/json",
    ...headers,
  };

  const shouldAttachToken = !skipAuth && !isPublicPath(endpoint) && token;

  if (shouldAttachToken) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const isFormData = body instanceof FormData;

  if (body !== undefined && body !== null && !isFormData) {
    finalHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    body:
      body === undefined || body === null
        ? undefined
        : isFormData
          ? body
          : JSON.stringify(body),
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    if (isTokenExpiredResponse(response.status, data)) {
      redirectToLoginBecauseTokenExpired();
    }

    const message =
      data?.message ||
      data?.error ||
      data?.detail ||
      `Request failed with status ${response.status}`;

    const error = new Error(message);
    error.status = response.status;
    error.data = data;

    throw error;
  }

  return unwrap ? unwrapResponse(data) : data;
}

const api = {
  get(endpoint, queryParamsOrOptions = {}) {
    const hasOptions =
      queryParamsOrOptions.queryParams ||
      queryParamsOrOptions.params ||
      queryParamsOrOptions.headers ||
      queryParamsOrOptions.skipAuth;

    const options = hasOptions
      ? queryParamsOrOptions
      : { queryParams: queryParamsOrOptions };

    return rawRequest(endpoint, {
      method: "GET",
      ...options,
      unwrap: true,
    });
  },

  post(endpoint, body, options = {}) {
    return rawRequest(endpoint, {
      method: "POST",
      body,
      ...options,
      unwrap: true,
    });
  },

  put(endpoint, body, options = {}) {
    return rawRequest(endpoint, {
      method: "PUT",
      body,
      ...options,
      unwrap: true,
    });
  },

  patch(endpoint, body, options = {}) {
    return rawRequest(endpoint, {
      method: "PATCH",
      body,
      ...options,
      unwrap: true,
    });
  },

  delete(endpoint, options = {}) {
    return rawRequest(endpoint, {
      method: "DELETE",
      ...options,
      unwrap: true,
    });
  },

  blob(endpoint, options = {}) {
    return rawRequest(endpoint, {
      method: "GET",
      ...options,
      headers: {
        Accept: "application/octet-stream",
        ...(options.headers || {}),
      },
      unwrap: false,
    });
  },
};

export default api;
