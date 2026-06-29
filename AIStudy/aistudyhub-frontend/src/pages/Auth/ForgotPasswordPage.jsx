import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../../apis/authApi";
import "./AuthPage.css";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(
        err?.message ||
          err?.data?.message ||
          "Không thể gửi email. Vui lòng thử lại."
      );
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

            {sent ? (
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 24px"
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <div className="form-title" style={{ textAlign: "center" }}>
                  <h2>Kiểm tra email của bạn</h2>
                  <p style={{ marginTop: 8 }}>
                    Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến <strong>{email}</strong>.
                    Vui lòng kiểm tra hộp thư (và thư mục spam).
                  </p>
                </div>
                <button
                  className="submit-button"
                  style={{ marginTop: 24 }}
                  onClick={() => navigate("/login")}
                >
                  <span className="btn-content">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Quay lại đăng nhập
                  </span>
                </button>
              </div>
            ) : (
              <>
                <div className="form-title">
                  <h3>Quên mật khẩu?</h3>
                  <p>Nhập email để nhận liên kết đặt lại mật khẩu</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="student@edu.vn"
                        required
                      />
                    </div>
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

                  <button type="submit" className="submit-button" disabled={loading}>
                    <span className="btn-content">
                      {loading ? (
                        <>
                          <span className="spinner" />
                          Đang gửi...
                        </>
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                          Gửi liên kết đặt lại
                        </>
                      )}
                    </span>
                  </button>

                  <p className="login-footer">
                    Nhớ mật khẩu rồi?{" "}
                    <button
                      type="button"
                      className="tab-link"
                      onClick={() => navigate("/login")}
                    >
                      Đăng nhập
                    </button>
                  </p>
                </form>
              </>
            )}
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
              Bảo mật tài khoản
            </div>

            <h2>
              Đặt lại mật khẩu
              <br />
              nhanh chóng
            </h2>

            <p>
              Chúng tôi sẽ gửi email hướng dẫn để bạn có thể đặt lại mật khẩu
              và truy cập lại tài khoản một cách an toàn.
            </p>

            <div className="benefits-list">
              <div className="benefit-item">
                <div className="benefit-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div className="benefit-text">
                  <h4>An toàn & bảo mật</h4>
                  <p>Liên kết đặt lại có thời hạn và chỉ dùng một lần</p>
                </div>
              </div>

              <div className="benefit-item">
                <div className="benefit-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div className="benefit-text">
                  <h4>Nhanh chóng</h4>
                  <p>Email đặt lại được gửi trong vài giây</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
