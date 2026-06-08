import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../../apis/authApi";
import "./AuthPage.css";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegisterChange = (e) => {
    const { name, value, type, checked } = e.target;

    setRegisterData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!registerData.agreeTerms) {
      setError("Bạn cần đồng ý với điều khoản sử dụng.");
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (registerData.password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        fullName: registerData.name,
        email: registerData.email,
        password: registerData.password,
        role: "CUSTOMER",
      });

      console.log("Register result:", result);

      alert("Đăng ký thành công. Vui lòng đăng nhập.");
      navigate("/login");
    } catch (err) {
      console.error("Register error:", err);

      setError(
        err?.message ||
          err?.error ||
          err?.data?.message ||
          "Đăng ký thất bại. Kiểm tra Backend hoặc dữ liệu nhập.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-container register-container">
        <div className="auth-promo-panel register-promo">
          <div className="promo-content">
            <div className="promo-icon">📖</div>

            <h2>
              Bắt đầu hành trình
              <br />
              học tập thông minh
            </h2>

            <p>Tham gia cùng hàng nghìn sinh viên đang sử dụng AI Study Hub</p>

            <div className="features-list">
              <div className="feature-item">
                <div className="feature-icon">💡</div>
                <div className="feature-text">
                  <h4>Miễn phí cho sinh viên</h4>
                  <p>Sử dụng đầy đủ tính năng</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">🤖</div>
                <div className="feature-text">
                  <h4>AI Chat không giới hạn</h4>
                  <p>Hỏi đáp unlimited</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">📁</div>
                <div className="feature-text">
                  <h4>Tài liệu không giới hạn</h4>
                  <p>Lưu trữ tài liệu tùy thích</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-form-panel register-form-panel">
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
              <h2>Tạo tài khoản</h2>
              <p>Điền thông tin để bắt đầu</p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="auth-form">
              <div className="form-group">
                <label>Họ và tên</label>
                <input
                  type="text"
                  name="name"
                  value={registerData.name}
                  onChange={handleRegisterChange}
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email sinh viên</label>
                <input
                  type="email"
                  name="email"
                  value={registerData.email}
                  onChange={handleRegisterChange}
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
                    value={registerData.password}
                    onChange={handleRegisterChange}
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

              <div className="form-group">
                <label>Xác nhận mật khẩu</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={registerData.confirmPassword}
                    onChange={handleRegisterChange}
                    placeholder="••••••••"
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    👁️
                  </button>
                </div>
              </div>

              <label className="checkbox-label terms-checkbox">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={registerData.agreeTerms}
                  onChange={handleRegisterChange}
                  required
                />
                Tôi đồng ý với <a href="#">Điều khoản sử dụng</a> và{" "}
                <a href="#">Chính sách bảo mật</a>
              </label>

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
                {loading ? "ĐANG ĐĂNG KÝ..." : "ĐĂNG KÝ"}
              </button>

              <div className="divider">Hoặc đăng ký với</div>

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

              <p className="register-footer">
                Đã có tài khoản?{" "}
                <button
                  type="button"
                  className="tab-link"
                  onClick={() => navigate("/login")}
                >
                  Đăng nhập
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
