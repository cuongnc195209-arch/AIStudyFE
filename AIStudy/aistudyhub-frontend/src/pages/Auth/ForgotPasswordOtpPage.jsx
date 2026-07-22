import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { forgotPassword, resetPassword } from "../../apis/authApi";
import "./AuthPage.css";

const OTP_LENGTH = 6;

export default function ForgotPasswordOtpPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");

  const [otpValues, setOtpValues] = useState(
    Array.from({ length: OTP_LENGTH }, () => ""),
  );

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");

  const otp = useMemo(() => otpValues.join(""), [otpValues]);

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);

    setOtpValues((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    if (digit && index < OTP_LENGTH - 1) {
      const nextInput = document.getElementById(`reset-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      const prevInput = document.getElementById(`reset-otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pasted) return;

    setOtpValues(
      Array.from({ length: OTP_LENGTH }, (_, index) => pasted[index] || ""),
    );

    const lastIndex = Math.min(pasted.length, OTP_LENGTH) - 1;
    const targetInput = document.getElementById(`reset-otp-${lastIndex}`);
    targetInput?.focus();
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Vui lòng nhập email để nhận OTP.");
      return;
    }

    setSending(true);

    try {
      await forgotPassword(cleanEmail);

      await Swal.fire({
        title: "Đã gửi OTP",
        text: "Vui lòng kiểm tra email để lấy mã đặt lại mật khẩu.",
        icon: "success",
        confirmButtonText: "Tiếp tục",
        confirmButtonColor: "#2563eb",
      });

      setStep(2);
      setOtpValues(Array.from({ length: OTP_LENGTH }, () => ""));

      setTimeout(() => {
        document.getElementById("reset-otp-0")?.focus();
      }, 100);
    } catch (err) {
      setError(
        err?.message ||
          err?.error ||
          err?.data?.message ||
          "Không thể gửi OTP đặt lại mật khẩu.",
      );
    } finally {
      setSending(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (otp.length !== OTP_LENGTH) {
      setError("Vui lòng nhập đủ 6 số OTP.");
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setResetting(true);

    try {
      await resetPassword({
        token: otp,
        newPassword,
      });

      await Swal.fire({
        title: "Đổi mật khẩu thành công",
        text: "Bạn có thể đăng nhập bằng mật khẩu mới.",
        icon: "success",
        confirmButtonText: "Đăng nhập",
        confirmButtonColor: "#2563eb",
      });

      navigate("/login");
    } catch (err) {
      setError(
        err?.message ||
          err?.error ||
          err?.data?.message ||
          "OTP không hợp lệ hoặc đã hết hạn.",
      );
    } finally {
      setResetting(false);
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
              Khôi phục truy cập
            </div>

            <h2>
              Đặt lại mật khẩu
              <br />
              an toàn qua email
            </h2>

            <p>
              Nhận mã OTP trong email và tạo mật khẩu mới để tiếp tục sử dụng AI
              Study Hub.
            </p>

            <div className="features-list">
              <div className="feature-item">
                <div className="feature-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div className="feature-text">
                  <h4>Bảo mật tài khoản</h4>
                  <p>Mã OTP giúp xác nhận đúng chủ sở hữu email</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 2v6h-6" />
                    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                    <path d="M3 22v-6h6" />
                    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                  </svg>
                </div>
                <div className="feature-text">
                  <h4>Khôi phục nhanh</h4>
                  <p>Đổi mật khẩu mới sau khi xác nhận OTP thành công</p>
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
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>

              <div>
                <h2>AI Study Hub</h2>
                <p>Khôi phục mật khẩu</p>
              </div>
            </div>

            <div className="form-title">
              <h2>{step === 1 ? "Quên mật khẩu" : "Nhập mã OTP"}</h2>
              <p>
                {step === 1
                  ? "Nhập email tài khoản để nhận mã OTP."
                  : "Nhập OTP và tạo mật khẩu mới cho tài khoản."}
              </p>
            </div>

            {step === 1 && (
              <form onSubmit={handleSendOtp} className="auth-form">
                <div className="form-group">
                  <label>Email</label>
                  <div className="input-with-icon">
                    <span className="input-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-10 6L2 7" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Nhập email tài khoản"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="error-message">
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="submit-button"
                  disabled={sending}
                >
                  <span className="btn-content">
                    {sending ? (
                      <>
                        <span className="spinner" />
                        Đang gửi OTP...
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
                        >
                          <path d="M22 2 11 13" />
                          <path d="m22 2-7 20-4-9-9-4Z" />
                        </svg>
                        Gửi mã OTP
                      </>
                    )}
                  </span>
                </button>

                <p className="register-footer">
                  Nhớ mật khẩu?{" "}
                  <button
                    type="button"
                    className="tab-link"
                    onClick={() => navigate("/login")}
                  >
                    Đăng nhập
                  </button>
                </p>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleResetPassword} className="auth-form">
                <div className="otp-email-hint">
                  OTP đã được gửi đến <strong>{email}</strong>
                </div>

                <div className="form-group">
                  <label>Mã OTP</label>
                  <div className="otp-box-group" onPaste={handleOtpPaste}>
                    {otpValues.map((value, index) => (
                      <input
                        key={index}
                        id={`reset-otp-${index}`}
                        className="otp-box"
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={value}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      />
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Mật khẩu mới</label>
                  <div className="password-input-wrapper has-icon">
                    <span className="input-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect width="18" height="11" x="3" y="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Tối thiểu 8 ký tự"
                      required
                    />
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
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </span>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="error-message">
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="submit-button"
                  disabled={resetting}
                >
                  <span className="btn-content">
                    {resetting ? (
                      <>
                        <span className="spinner" />
                        Đang đặt lại...
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
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        Đặt lại mật khẩu
                      </>
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  className="auth-secondary-button"
                  onClick={handleSendOtp}
                  disabled={sending}
                >
                  {sending ? "Đang gửi lại..." : "Gửi lại mã OTP"}
                </button>

                <p className="register-footer">
                  Nhớ mật khẩu?{" "}
                  <button
                    type="button"
                    className="tab-link"
                    onClick={() => navigate("/login")}
                  >
                    Đăng nhập
                  </button>
                </p>
              </form>
            )}

            <div className="auth-bottom-link">
              <Link to="/">Quay về trang chủ</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
