import api, {
  clearAuthTokens,
  getRefreshToken,
  rawRequest,
  setAuthTokens,
  setCurrentUser,
} from "./api";

// Chuẩn hoá response login/register
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

// Lưu token + user sau login/register
function saveAuthResponse(response) {
  const authData = normalizeAuthResponse(response);

  if (!authData) {
    return response;
  }

  // Register sau khi có email verification có thể trả accessToken = null.
  // Vì vậy chỉ lưu token khi BE thật sự trả token.
  if (authData.accessToken || authData.refreshToken) {
    setAuthTokens({
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
    });
  }

  if (authData.user) {
    setCurrentUser(authData.user);
  }

  return authData;
}

// POST /auth/login
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

// POST /auth/register
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

// GET /auth/verify-email?token=...
export async function verifyEmail(token) {
  if (!token) {
    throw new Error("Thiếu token xác thực email");
  }

  return rawRequest(`/auth/verify-email?token=${encodeURIComponent(token)}`, {
    method: "GET",
  });
}

// POST /auth/resend-verification?email=...
export async function resendVerificationEmail(email) {
  if (!email) {
    throw new Error("Thiếu email để gửi lại mã xác thực");
  }

  return rawRequest(
    `/auth/resend-verification?email=${encodeURIComponent(email)}`,
    {
      method: "POST",
    },
  );
}

// POST /auth/refresh
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

// POST /auth/logout
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

// GET /auth/me
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

// PUT /auth/profile
export async function updateProfile(profileData) {
  const profile = await api.put("/auth/profile", profileData);

  if (profile) {
    setCurrentUser(profile);
  }

  return profile;
}

// PUT /auth/change-password
export async function changePassword({ currentPassword, newPassword }) {
  return api.put("/auth/change-password", {
    currentPassword,
    newPassword,
  });
}

// POST /auth/forgot-password
// Cho phép gọi cả 2 kiểu:
// forgotPassword("abc@gmail.com")
// hoặc forgotPassword({ email: "abc@gmail.com" })
export async function forgotPassword(input) {
  const email = typeof input === "string" ? input : input?.email;

  if (!email) {
    throw new Error("Thiếu email để đặt lại mật khẩu");
  }

  return api.post("/auth/forgot-password", {
    email,
  });
}

// POST /auth/reset-password
export async function resetPassword({ token, newPassword }) {
  if (!token) {
    throw new Error("Thiếu token đặt lại mật khẩu");
  }

  if (!newPassword) {
    throw new Error("Thiếu mật khẩu mới");
  }

  return api.post("/auth/reset-password", {
    token,
    newPassword,
  });
}

// Kiểm tra đăng nhập nhanh
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
  verifyEmail,
  resendVerificationEmail,
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
