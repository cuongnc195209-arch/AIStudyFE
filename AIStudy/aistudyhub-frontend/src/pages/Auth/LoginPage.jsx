import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, getProfile } from "../../apis/authApi";
import "./AuthPage.css";

export default function LoginPage() {
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLoginChange = (e) => {
    const { name, value, type, checked } = e.target;

    setLoginData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await login({
        email: loginData.email,
        password: loginData.password,
      });

      console.log("Login result:", result);

      // authApi.login đã tự lưu token vào localStorage rồi, nhưng ở đây vẫn tự đọc lại result
      // để lấy token/role/user một cách "phòng thủ" vì response backend không phải lúc nào cũng cùng hình dạng
      const authData = result.data || result;

      const accessToken =
        authData.accessToken ||
        authData.token ||
        authData.jwt ||
        authData.access_token;

      const refreshToken = authData.refreshToken || authData.refresh_token;

      if (!accessToken) {
        throw new Error("Backend không trả về accessToken/token");
      }

      localStorage.setItem("accessToken", accessToken);

      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      // Login xong chỉ có token, chưa chắc có đủ thông tin user (tên, role) => gọi thêm getProfile()
      // để lấy hồ sơ đầy đủ. Nếu lỗi thì vẫn tiếp tục login bình thường (chỉ thiếu displayName/role chính xác).
      let profileData = {};

      try {
        const profileResult = await getProfile();
        console.log("Profile result:", profileResult);

        profileData = profileResult.data || profileResult;
      } catch (profileError) {
        console.error("Get profile error:", profileError);
      }

      const rawUser =
        profileData.user ||
        profileData.profile ||
        profileData.userProfile ||
        profileData ||
        {};

      const fullName =
        rawUser.fullName ||
        rawUser.name ||
        rawUser.full_name ||
        rawUser.displayName ||
        rawUser.username ||
        loginData.email;

      const role =
        rawUser.role ||
        rawUser.userRole ||
        authData.role ||
        authData.userRole ||
        "CUSTOMER";

      const userId =
        rawUser.id ||
        rawUser.userId ||
        rawUser.user_id ||
        authData.id ||
        authData.userId ||
        authData.user_id;

      const user = {
        ...rawUser,
        id: userId,
        email: rawUser.email || loginData.email,
        fullName,
        role,
      };

      console.log("Saved user object:", user);

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", role);

      // Điều hướng theo role: ADMIN vào thẳng /admin, các role còn lại (kể cả MODERATOR) vào /dashboard
      if (role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else if (role === "MODERATOR") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      console.error("Login error:", err);

      // Dò message lỗi để phân biệt "tài khoản bị khoá" với "sai mật khẩu" — backend không có mã lỗi riêng biệt
      const msg = err?.message || err?.error || err?.data?.message || "";
      const msgLower = msg.toLowerCase();
      if (msgLower.includes("banned") || msgLower.includes("locked") || msgLower.includes("disabled")) {
        setError("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
      } else {
        setError("Sai email hoặc mật khẩu. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-form-panel">
          <div className="form-content">
            <div className="form-header">
              <div className="form-logo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <div>
                <h2>AI Study Hub</h2>
                <p>Quản lý học tập thông minh</p>
              </div>
            </div>

            <div className="form-title">
              <h3>Chào mừng trở lại!</h3>
              <p>Đăng nhập để tiếp tục hành trình học tập</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="auth-form">
              <div className="form-group">
                <label>Email</label>
                <div className="input-with-icon">
                  <span className="input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    placeholder="student@edu.vn"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Mật khẩu</label>
                <div className="password-input-wrapper has-icon">
                  <span className="input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    placeholder="Nhập mật khẩu"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="form-footer">
                <label className="checkbox-label">
                  <span className="checkbox-custom">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={loginData.rememberMe}
                      onChange={handleLoginChange}
                    />
                    <span className="checkmark">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  </span>
                  Ghi nhớ đăng nhập
                </label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={() => navigate("/forgot-password")}
                >
                  Quên mật khẩu?
                </button>
              </div>

              {error && (
                <div className="error-message">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                <span className="btn-content">
                  {loading ? (
                    <>
                      <span className="spinner" />
                      Đang đăng nhập...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        <polyline points="10 17 15 12 10 7" />
                        <line x1="15" y1="12" x2="3" y2="12" />
                      </svg>
                      Đăng nhập
                    </>
                  )}
                </span>
              </button>

              <div className="divider">hoặc</div>

              <div className="social-buttons" style={{ gridTemplateColumns: "1fr" }}>
                <button type="button" className="social-button google-button">
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Đăng nhập với Google
                </button>
              </div>

              <p className="login-footer">
                Chưa có tài khoản?{" "}
                <button
                  type="button"
                  className="tab-link"
                  onClick={() => navigate("/register")}
                >
                  Đăng ký ngay
                </button>
              </p>
            </form>
          </div>
        </div>

        <div className="auth-promo-panel">
          <div className="grid-pattern" />
          <div className="floating-orb floating-orb-1" />
          <div className="floating-orb floating-orb-2" />
          <div className="floating-orb floating-orb-3" />

          <div className="promo-content">
            <div className="promo-badge">
              <span className="badge-dot" />
              Nền tảng học tập #1 Việt Nam
            </div>

            <h2>
              Quản lý tài liệu
              <br />
              với sức mạnh AI
            </h2>

            <p>
              Lưu trữ, tìm kiếm và hỏi đáp hiệu quả hơn với trợ lý AI thông minh.
              Nâng tầm trải nghiệm học tập của bạn.
            </p>

            <div className="benefits-list">
              <div className="benefit-item">
                <div className="benefit-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                  </svg>
                </div>
                <div className="benefit-text">
                  <h4>Quản lý tài liệu tập trung</h4>
                  <p>Lưu trữ và sắp xếp tài liệu học tập một cách thông minh</p>
                </div>
              </div>

              <div className="benefit-item">
                <div className="benefit-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div className="benefit-text">
                  <h4>AI Chat Assistant</h4>
                  <p>Hỏi đáp nhanh chóng về tài liệu với trợ lý AI</p>
                </div>
              </div>

              <div className="benefit-item">
                <div className="benefit-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <div className="benefit-text">
                  <h4>Tìm kiếm thông minh</h4>
                  <p>Tìm kiếm nhanh chóng trong hàng trăm tài liệu</p>
                </div>
              </div>
            </div>

            <div className="users-stat">
              <div className="user-avatars">
                <span className="avatar" style={{ background: "linear-gradient(135deg, #f472b6, #ec4899)" }} />
                <span className="avatar" style={{ background: "linear-gradient(135deg, #60a5fa, #3b82f6)" }} />
                <span className="avatar" style={{ background: "linear-gradient(135deg, #34d399, #10b981)" }} />
                <span className="avatar" style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }} />
              </div>
              <p>
                <strong>2,500+ sinh viên</strong> đang sử dụng AI Study Hub
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
