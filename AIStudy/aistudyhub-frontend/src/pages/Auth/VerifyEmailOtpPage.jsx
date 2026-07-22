import { useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import { resendVerificationEmail, verifyEmail } from "../../apis/authApi";
import "./AuthPage.css";

const OTP_LENGTH = 6;

export default function VerifyEmailOtpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const emailFromUrl = searchParams.get("email") || "";
  const tokenFromUrl = searchParams.get("token") || "";

  const otpInputRef = useRef(null);

  const [email, setEmail] = useState(emailFromUrl);
  const [otp, setOtp] = useState(() => {
    return tokenFromUrl.replace(/\D/g, "").slice(0, OTP_LENGTH);
  });

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");

  const showToast = ({ icon = "success", title, text }) => {
    Swal.fire({
      toast: true,
      position: "top-end",
      icon,
      title,
      text,
      showConfirmButton: false,
      timer: 2200,
      timerProgressBar: true,
    });
  };

  const focusOtpInput = () => {
    window.setTimeout(() => {
      const input = otpInputRef.current;

      if (!input) {
        return;
      }

      input.focus();

      const length = input.value.length;
      input.setSelectionRange(length, length);
    }, 0);
  };

  const handleOtpInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH);
    setOtp(value);
    setError("");
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();

    const pastedOtp = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pastedOtp) {
      return;
    }

    setOtp(pastedOtp);
    setError("");
    focusOtpInput();
  };

  const clearOtp = () => {
    setOtp("");
    focusOtpInput();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");

    if (otp.length !== OTP_LENGTH) {
      setError("Vui lòng nhập đủ 6 số OTP.");
      focusOtpInput();
      return;
    }

    setLoading(true);

    try {
      await verifyEmail(otp);

      showToast({
        icon: "success",
        title: "Xác thực thành công",
        text: "Bạn có thể đăng nhập ngay bây giờ.",
      });

      setTimeout(() => {
        navigate("/login");
      }, 900);
    } catch (err) {
      setError(
        err?.message ||
          err?.error ||
          err?.data?.message ||
          "OTP không hợp lệ hoặc đã hết hạn.",
      );

      clearOtp();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const cleanEmail = email.trim().toLowerCase();
    setError("");

    if (!cleanEmail) {
      setError("Vui lòng nhập email để gửi lại OTP.");
      return;
    }

    setResending(true);

    try {
      await resendVerificationEmail(cleanEmail);

      showToast({
        icon: "success",
        title: "Đã gửi lại OTP",
        text: "Vui lòng kiểm tra email của bạn.",
      });

      clearOtp();
    } catch (err) {
      setError(
        err?.message ||
          err?.error ||
          err?.data?.message ||
          "Không thể gửi lại OTP.",
      );
    } finally {
      setResending(false);
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
              Bảo mật tài khoản
            </div>

            <h2>
              Xác thực email
              <br />
              để bắt đầu học tập
            </h2>

            <p>
              Nhập mã OTP được gửi đến email của bạn để hoàn tất đăng ký tài
              khoản AI Study Hub.
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
                    <path d="M22 12.08V12a10 10 0 1 1-5.93-9.14" />
                    <path d="m9 11 3 3L22 4" />
                  </svg>
                </div>

                <div className="feature-text">
                  <h4>Xác nhận nhanh</h4>
                  <p>OTP gồm 6 số và có hiệu lực trong thời gian ngắn</p>
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
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-10 6L2 7" />
                  </svg>
                </div>

                <div className="feature-text">
                  <h4>Email xác thực</h4>
                  <p>Mã OTP được gửi trực tiếp đến email đăng ký</p>
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
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>

                <div className="feature-text">
                  <h4>An toàn hơn</h4>
                  <p>Tài khoản chỉ đăng nhập được sau khi xác thực email</p>
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
                <p>Xác thực tài khoản</p>
              </div>
            </div>

            <div className="form-title">
              <h2>Nhập mã OTP</h2>
              <p>Chúng tôi đã gửi mã xác nhận đến email của bạn</p>
            </div>

            <form onSubmit={handleVerify} className="auth-form">
              <div className="form-group">
                <label>Email</label>

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
                      <path d="m22 7-10 6L2 7" />
                    </svg>
                  </span>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email đã đăng ký"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Mã OTP</label>

                <div className="otp-visual-wrapper" onClick={focusOtpInput}>
                  <input
                    ref={otpInputRef}
                    className="otp-hidden-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={OTP_LENGTH}
                    value={otp}
                    onChange={handleOtpInputChange}
                    onPaste={handleOtpPaste}
                    onFocus={focusOtpInput}
                    autoFocus
                  />

                  <div className="otp-box-group">
                    {Array.from({ length: OTP_LENGTH }, (_, index) => (
                      <div
                        key={index}
                        className={`otp-box ${
                          otp.length === index ||
                          (otp.length === OTP_LENGTH &&
                            index === OTP_LENGTH - 1)
                            ? "otp-box-active"
                            : ""
                        }`}
                      >
                        {otp[index] || ""}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

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
                      Đang xác nhận...
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
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      Xác nhận email
                    </>
                  )}
                </span>
              </button>

              <button
                type="button"
                className="auth-secondary-button"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? "Đang gửi lại..." : "Gửi lại mã OTP"}
              </button>

              <p className="register-footer">
                Đã xác thực?{" "}
                <button
                  type="button"
                  className="tab-link"
                  onClick={() => navigate("/login")}
                >
                  Đăng nhập
                </button>
              </p>

              <div className="auth-bottom-link">
                <Link to="/register">Dùng email khác để đăng ký</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
