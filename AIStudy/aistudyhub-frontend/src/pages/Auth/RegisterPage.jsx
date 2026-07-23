import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../../apis/authApi";
import "./AuthPage.css";
import Swal from "sweetalert2";

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
      const email = registerData.email.trim().toLowerCase();

      const result = await register({
        fullName: registerData.name.trim(),
        email,
        password: registerData.password,
        role: "CUSTOMER",
      });

      console.log("Register result:", result);

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Đăng ký thành công",
        text: "Vui lòng kiểm tra email để lấy mã OTP.",
        showConfirmButton: false,
        timer: 2200,
        timerProgressBar: true,
      });

      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
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
      <div className="auth-container">
        <div className="auth-promo-panel">
          <div className="grid-pattern" />
          <div className="floating-orb floating-orb-1" />
          <div className="floating-orb floating-orb-2" />
          <div className="floating-orb floating-orb-3" />

          <div className="promo-content">
            <div className="promo-badge">
              <span className="badge-dot" />
              Miễn phí cho sinh viên
            </div>

            <h2>
              Bắt đầu hành trình
              <br />
              học tập thông minh
            </h2>

            <p>
              Tham gia cùng hàng nghìn sinh viên đang sử dụng AI Study Hub để
              nâng cao hiệu quả học tập mỗi ngày.
            </p>

            <div className="features-list">
              <div className="feature-item">
                <div className="feature-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div className="feature-text">
                  <h4>Miễn phí cho sinh viên</h4>
                  <p>Sử dụng đầy đủ tính năng không giới hạn</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 8V4H8" />
                    <rect width="16" height="12" x="4" y="8" rx="2" />
                    <path d="M2 14h2" />
                    <path d="M20 14h2" />
                    <path d="M15 13v2" />
                    <path d="M9 13v2" />
                  </svg>
                </div>
                <div className="feature-text">
                  <h4>AI Chat không giới hạn</h4>
                  <p>Hỏi đáp unlimited với trợ lý AI thông minh</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                    <polyline points="13 2 13 9 20 9" />
                  </svg>
                </div>
                <div className="feature-text">
                  <h4>Tài liệu không giới hạn</h4>
                  <p>Lưu trữ và quản lý tài liệu tùy thích</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="form-content">
            <div className="form-header">
              <div className="form-logo">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
              <h2>Tạo tài khoản</h2>
              <p>Điền thông tin để bắt đầu hành trình</p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="auth-form">
              <div className="form-group">
                <label>Họ và tên</label>
                <div className="input-with-icon">
                  <span className="input-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    name="name"
                    value={registerData.name}
                    onChange={handleRegisterChange}
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email sinh viên</label>
                <div className="input-with-icon">
                  <span className="input-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    placeholder="student@edu.vn"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Mật khẩu</label>
                <div className="password-input-wrapper has-icon">
                  <span className="input-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    placeholder="Tối thiểu 8 ký tự"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Xác nhận mật khẩu</label>
                <div className="password-input-wrapper has-icon">
                  <span className="input-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={registerData.confirmPassword}
                    onChange={handleRegisterChange}
                    placeholder="Nhập lại mật khẩu"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <label className="checkbox-label terms-checkbox">
                <span className="checkbox-custom">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={registerData.agreeTerms}
                    onChange={handleRegisterChange}
                    required
                  />
                  <span className="checkmark">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                </span>
                <span>
                  Tôi đồng ý với <a href="#">Điều khoản sử dụng</a> và{" "}
                  <a href="#">Chính sách bảo mật</a>
                </span>
              </label>

              {error && (
                <div className="error-message">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
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
                      Đang đăng ký...
                    </>
                  ) : (
                    <>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                        <line x1="20" y1="8" x2="20" y2="14" />
                        <line x1="23" y1="11" x2="17" y2="11" />
                      </svg>
                      Tạo tài khoản
                    </>
                  )}
                </span>
              </button>

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
