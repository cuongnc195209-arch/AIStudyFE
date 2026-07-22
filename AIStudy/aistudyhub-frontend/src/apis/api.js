// Lớp fetch wrapper trung tâm — mọi file apis/xxxApi.js khác đều gọi qua đây.
// Base URL lấy từ biến môi trường VITE_API_BASE_URL, fallback về backend chạy local.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";

// Các endpoint không cần gắn Bearer token (lúc gọi các API này thường chưa có token)
const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/resend-verification",
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

// Từ đây là nhóm hàm đọc/ghi thông tin đăng nhập vào localStorage

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

export function clearAuthStorage() {
  clearAuthTokens();
}

export function removeAuthStorage() {
  clearAuthTokens();
}

// Hàm "vạn năng" nhận response backend ở nhiều hình dạng khác nhau
// (accessToken / token / access_token...) rồi tự dò field đúng để lưu —
// vì response backend chưa chuẩn hoá 100% field name.
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

  // Không có user.role trong localStorage => tự decode phần payload của JWT
  // (JWT gồm 3 phần base64 cách nhau bởi dấu ".", phần giữa là payload) để lấy role ra
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

// Ghép API_BASE_URL + path, tự thêm query params (bỏ qua giá trị undefined/null/rỗng)
function buildUrl(path, queryParams) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(
    `${API_BASE_URL}${normalizedPath}`,
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

// Nếu response backend có dạng { data: ... } thì tự "bóc vỏ" lấy phần data ra,
// để chỗ gọi API không phải viết result.data ở khắp nơi.
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

// Hàm trung tâm gọi fetch — mọi request JSON đều đi qua đây.
export async function request(path, options = {}) {
  const {
    method = "GET",
    body,
    headers = {},
    queryParams,
    raw = false, // raw:true => trả nguyên response, không tự unwrap "data"
  } = options;

  const url = buildUrl(path, queryParams);
  const finalHeaders = { ...headers };

  // Tự gắn Bearer token nếu path không nằm trong danh sách công khai
  if (!isPublicPath(path)) {
    const token = getAccessToken();

    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  // Nếu body không phải FormData (upload file) thì coi là JSON thường => set Content-Type
  // (FormData thì để trình duyệt tự set Content-Type kèm boundary, không được set tay)
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

  // status 4xx/5xx => ném Error kèm .status và .body để chỗ gọi phân biệt loại lỗi
  // (ví dụ LoginPage kiểm tra message có chứa "banned" để hiện thông báo khoá tài khoản)
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

// Biến thể riêng cho file nhị phân (preview/download tài liệu) — không parse JSON,
// trả về { blob, contentType, contentDisposition } để chỗ gọi tự tạo Object URL.
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

// Shorthand object — các file apis/xxxApi.js khác gọi api.get/post/... thay vì gọi request() trực tiếp
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
