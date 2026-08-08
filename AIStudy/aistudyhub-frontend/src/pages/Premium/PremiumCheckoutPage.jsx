import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import AppLayout from "../../components/layout/AppLayout";
import {
  cancelPremiumPayment,
  confirmPremiumPayment,
  createPremiumPayment,
} from "../../apis/memberApi";
import "../Settings/SettingsPage.css";
import "./PremiumCheckoutPage.css";

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function formatCurrency(value) {
  const amount = Number(value || 0);

  if (amount === 0) {
    return "0đ";
  }

  return amount.toLocaleString("vi-VN") + "₫";
}

function savePremiumUser() {
  const currentUser = getCurrentUser();

  const newUser = {
    ...currentUser,
    membership: "PREMIUM",
    plan: "PREMIUM",
    subscriptionPlan: "PREMIUM",
    memberStatus: "ACTIVE",
    isPremium: true,
  };

  localStorage.setItem("user", JSON.stringify(newUser));
  localStorage.setItem("role", newUser.role || currentUser.role || "CUSTOMER");

  window.dispatchEvent(new Event("auth:user-updated"));
  window.dispatchEvent(new Event("storage"));
}

export default function PremiumCheckoutPage() {
  const navigate = useNavigate();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  const user = getCurrentUser();

  useEffect(() => {
    let cancelled = false;

    async function loadPayment() {
      setLoading(true);
      setError("");

      try {
        const result = await createPremiumPayment();

        if (cancelled) {
          return;
        }

        setPayment(result);
      } catch (err) {
        if (!cancelled) {
          console.error("Create premium transaction error:", err);
          setError(
            err?.message ||
              err?.data?.message ||
              "Không thể tạo mã QR Premium.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPayment();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleConfirmTransaction() {
    if (!payment?.orderCode) {
      setError("Thiếu mã giao dịch.");
      return;
    }

    setConfirming(true);
    setError("");

    try {
      const result = await confirmPremiumPayment(payment.orderCode);

      setPayment((current) => ({
        ...current,
        ...result,
      }));

      const status = String(result?.status || "").toUpperCase();

      if (result?.isPremium || status === "MANUAL_CONFIRMED") {
        savePremiumUser();

        await Swal.fire({
          icon: "success",
          title: "Xác nhận thành công",
          text: "Tài khoản Premium đã được kích hoạt. Email thông báo đã được gửi về tài khoản của bạn.",
          confirmButtonText: "Về trang chủ",
        });

        navigate("/dashboard", {
          replace: true,
          state: {
            paymentSuccess: true,
          },
        });

        return;
      }

      Swal.fire({
        icon: "info",
        title: "Chưa thể xác nhận",
        text:
          result?.message ||
          "Vui lòng kiểm tra lại thông tin giao dịch rồi thử lại.",
        confirmButtonText: "Đóng",
      });
    } catch (err) {
      console.error("Confirm premium transaction error:", err);

      Swal.fire({
        icon: "error",
        title: "Không thể xác nhận giao dịch",
        text:
          err?.message ||
          err?.data?.message ||
          "Vui lòng kiểm tra lại thông tin giao dịch rồi thử lại.",
        confirmButtonText: "Đóng",
      });
    } finally {
      setConfirming(false);
    }
  }

  async function handleCancelTransaction() {
    if (!payment?.orderCode) {
      navigate("/premium");
      return;
    }

    setCancelling(true);

    try {
      await cancelPremiumPayment(payment.orderCode);
    } catch (err) {
      console.error("Cancel premium transaction error:", err);
    } finally {
      setCancelling(false);
      navigate("/premium");
    }
  }

  const qrUrl = payment?.qrCode || payment?.checkoutUrl;

  return (
    <AppLayout>
      <div className="premium-checkout-page">
        <div className="premium-checkout-header">
          <button
            className="premium-back-btn"
            type="button"
            onClick={() => navigate("/premium")}
          >
            ← Quay lại
          </button>

          <div>
            <h1>Premium Checkout</h1>
            <p>Quét mã QR Techcombank để hoàn tất giao dịch Premium</p>
          </div>
        </div>

        <div className="premium-checkout-card">
          <div className="premium-checkout-left">
            <div className="premium-plan-summary">
              <span className="premium-plan-badge">Premium</span>

              <h2>Gói Premium 30 ngày</h2>

              <p>
                Mở khóa dung lượng Premium, tăng giới hạn token AI/ngày và
                upload file lớn hơn.
              </p>

              <div className="premium-price-box">
                <span>Giá gói Premium</span>
                <strong>
                  {formatCurrency(payment?.displayPrice || 99000)}
                </strong>
              </div>

              <div className="premium-payment-info">
                <div>
                  <span>Ngân hàng</span>
                  <strong>{payment?.bankName || "Techcombank"}</strong>
                </div>

                <div>
                  <span>Số tài khoản</span>
                  <strong>{payment?.accountNumber || "Đang tải..."}</strong>
                </div>

                <div>
                  <span>Chủ tài khoản</span>
                  <strong>{payment?.accountName || "Đang tải..."}</strong>
                </div>

                <div>
                  <span>Giá trị QR</span>
                  <strong>{formatCurrency(payment?.amount || 0)}</strong>
                </div>

                <div>
                  <span>Nội dung chuyển khoản</span>
                  <strong>{payment?.transferContent || "Đang tạo..."}</strong>
                </div>

                <div>
                  <span>Email nhận thông báo</span>
                  <strong>{user?.email || "Email tài khoản"}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="premium-checkout-right">
            <div className="premium-qr-box">
              {qrUrl ? (
                <img src={qrUrl} alt="Techcombank QR Premium" />
              ) : (
                <div className="premium-qr-placeholder">
                  {loading ? "Đang tạo QR..." : "Chưa có QR"}
                </div>
              )}

              <p>
                Quét QR bằng ứng dụng ngân hàng và nhập đúng nội dung giao dịch
                được hiển thị trên màn hình.
              </p>
            </div>

            {error && <p className="premium-payment-error">⚠️ {error}</p>}

            <button
              className="premium-confirm-btn"
              type="button"
              onClick={handleConfirmTransaction}
              disabled={loading || confirming || !payment?.orderCode}
            >
              {confirming ? "Đang xác nhận..." : "Xác nhận giao dịch"}
            </button>

            <button
              className="premium-cancel-btn"
              type="button"
              onClick={handleCancelTransaction}
              disabled={confirming || cancelling}
            >
              {cancelling ? "Đang hủy..." : "Hủy"}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
