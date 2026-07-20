import api, {
  clearAuthTokens,
  getRefreshToken,
  rawRequest,
  setAuthTokens,
  setCurrentUser,
} from "./api";

// Chuẩn hoá response login/register (backend có thể trả token dưới nhiều tên field khác nhau)
// thành 1 hình dạng thống nhất { accessToken, refreshToken, user, ... }
function normalizeAuthResponse(response) {
  const authData = response?.data ? response.data : response;

  if (!authData) {
    return null;
  }

  const accessToken =
    authData.accessToken || authData.token || authData.access_token || null;

  const refreshToken = authData.refreshToken || authData.refresh_token || null;

  const user = authData.user || authData.profile || null;

  return {
    ...authData,
    accessToken,
    refreshToken,
    user,
  };
}

// Sau khi chuẩn hoá, lưu token + user vào localStorage — dùng chung cho login và register
function saveAuthResponse(response) {
  const authData = normalizeAuthResponse(response);

  if (!authData) {
    return response;
  }

  setAuthTokens({
    accessToken: authData.accessToken,
    refreshToken: authData.refreshToken,
  });

  if (authData.user) {
    setCurrentUser(authData.user);
  }

  return authData;
}

// POST /auth/login — dùng rawRequest vì cần đọc nguyên response (không unwrap) trước khi normalize
export async function login({ email, password, deviceInfo }) {
  const response = await rawRequest("/auth/login", {
    method: "POST",
    body: {
      email,
      password,
      deviceInfo: deviceInfo || navigator.userAgent,
    },
  });

  return saveAuthResponse(response);
}

export async function register({
  email,
  password,
  fullName,
  role = "CUSTOMER",
  studentCode,
  schoolName,
  department,
  assignedSubject,
}) {
  const response = await rawRequest("/auth/register", {
    method: "POST",
    body: {
      email,
      password,
      fullName,
      role,
      studentCode,
      schoolName,
      department,
      assignedSubject,
    },
  });

  return saveAuthResponse(response);
}

// POST /auth/refresh — lấy accessToken mới bằng refreshToken hiện có (chưa được gọi tự động ở đâu trong app)
export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error("Không tìm thấy refresh token");
  }

  const response = await rawRequest("/auth/refresh", {
    method: "POST",
    body: {
      refreshToken,
    },
  });

  return saveAuthResponse(response);
}

export async function logout() {
  const refreshToken = getRefreshToken();

  try {
    if (refreshToken) {
      await api.post("/auth/logout", {
        refreshToken,
      });
    }
  } finally {
    clearAuthTokens();
  }

  return true;
}

export async function getProfile() {
  const profile = await api.get("/auth/me");

  if (profile) {
    setCurrentUser(profile);
  }

  return profile;
}

export async function getMe() {
  return getProfile();
}

export async function updateProfile(profileData) {
  const profile = await api.put("/auth/profile", profileData);

  if (profile) {
    setCurrentUser(profile);
  }

  return profile;
}

export async function changePassword({ currentPassword, newPassword }) {
  return api.put("/auth/change-password", {
    currentPassword,
    newPassword,
  });
}

export async function forgotPassword(email) {
  return api.post("/auth/forgot-password", {
    email,
  });
}

export async function resetPassword({ token, newPassword }) {
  return api.post("/auth/reset-password", {
    token,
    newPassword,
  });
}

// Hàm tiện ích kiểm tra đăng nhập nhanh (không dùng ở đâu trong code hiện tại, nhưng để sẵn cho sau)
export function isLoggedIn() {
  return Boolean(localStorage.getItem("accessToken"));
}

export function getStoredUser() {
  const rawUser = localStorage.getItem("user");

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

const authApi = {
  login,
  register,
  refreshAccessToken,
  logout,
  getProfile,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  isLoggedIn,
  getStoredUser,
};

export default authApi;
