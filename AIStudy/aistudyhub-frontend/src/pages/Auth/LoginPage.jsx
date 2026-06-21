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

      // Backend của bạn trả dạng ApiResponse<AuthResponse>
      // Thường token sẽ nằm trong result.data
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

      if (role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else if (role === "MODERATOR") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      console.error("Login error:", err);

      const msg = err?.message || err?.error || err?.data?.message || "";
      const isLocked = msg.toLowerCase().includes("locked") || msg.toLowerCase().includes("banned") || msg.toLowerCase().includes("khóa");
      if (err?.status === 403 && isLocked) {
        setError("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
      } else {
        setError(msg && msg !== "API request failed" ? msg : "Sai email hoặc mật khẩu. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-container login-container">
        <div className="auth-form-panel">
          <div className="form-content">
            <div className="form-header">
              <div className="form-logo">
                <span>📋</span>
              </div>
              <div>
                <h2>AI Study Hub</h2>
                <p>Quản lý học tập thông minh</p>
              </div>
            </div>

            <div className="form-title">
              <h3>Chào mừng trở lại!</h3>
              <p>Đăng nhập để trợ lúc học tập</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="auth-form">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  placeholder="student@edu.vn"
                  required
                />
              </div>

              <div className="form-group">
                <label>Mật khẩu</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    👁️
                  </button>
                </div>
              </div>

              <div className="form-footer">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={loginData.rememberMe}
                    onChange={handleLoginChange}
                  />
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
                <p
                  style={{
                    color: "red",
                    marginBottom: "12px",
                    fontSize: "14px",
                  }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                {loading ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP"}
              </button>

              <div className="divider">Hoặc đăng nhập với</div>

              <div className="social-buttons">
                <button type="button" className="social-button google-button">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </button>

                <button type="button" className="social-button facebook-button">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
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

        <div className="auth-promo-panel login-promo">
          <div className="promo-content">
            <h2>
              Quản lý tài liệu học tập
              <br />
              với sức mạnh AI
            </h2>

            <p>
              Lưu trữ, tìm kiếm và hỏi đáp hiệu quả hơn với trợ lý AI thông minh
            </p>

            <div className="benefits-list">
              <div className="benefit-item">
                <div className="benefit-icon">📚</div>
                <div className="benefit-text">
                  <h4>Quản lý tài liệu tập trung</h4>
                  <p>Lưu trữ và sắp xếp tài liệu học tập một cách thông minh</p>
                </div>
              </div>

              <div className="benefit-item">
                <div className="benefit-icon">💬</div>
                <div className="benefit-text">
                  <h4>AI Chat Assistant</h4>
                  <p>Hỏi đáp nhanh chóng về tài liệu với trợ lý AI</p>
                </div>
              </div>

              <div className="benefit-item">
                <div className="benefit-icon">🔍</div>
                <div className="benefit-text">
                  <h4>Tìm kiếm thông minh</h4>
                  <p>Tìm kiếm nhanh chóng trong hàng trăm tài liệu</p>
                </div>
              </div>
            </div>

            <div className="users-stat">
              <div className="user-avatars">
                <span className="avatar" style={{ backgroundColor: "#FF6B6B" }}>
                  👨
                </span>
                <span className="avatar" style={{ backgroundColor: "#4ECDC4" }}>
                  👩
                </span>
                <span className="avatar" style={{ backgroundColor: "#FFE66D" }}>
                  👨
                </span>
                <span className="avatar" style={{ backgroundColor: "#A8E6CF" }}>
                  👩
                </span>
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
