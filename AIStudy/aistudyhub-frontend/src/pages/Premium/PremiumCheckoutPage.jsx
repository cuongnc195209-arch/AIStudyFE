import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import AppLayout from "../../components/layout/AppLayout";
import { upgradeToPremium } from "../../apis/memberApi";
import "../Settings/SettingsPage.css";
import "./PremiumCheckoutPage.css";

const PREMIUM_DISPLAY_PRICE = 99000;
const QR_TEST_AMOUNT = 0;

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("vi-VN") + "₫";
}

/*
 * QR test bằng VietQR.
 *
 * PREMIUM_DISPLAY_PRICE = 99.000đ: hiện trên màn hình.
 * QR_TEST_AMOUNT = 0đ: số tiền thật nhúng trong QR để test.
 *
 * Đổi BANK_ID, ACCOUNT_NO, ACCOUNT_NAME thành thông tin ngân hàng test/thật của nhóm.
 */
function buildVietQrUrl({ amount, content }) {
  const BANK_ID = "MB";
  const ACCOUNT_NO = "0123456789";
  const ACCOUNT_NAME = "AI STUDY HUB";

  const params = new URLSearchParams({
    amount: String(amount),
    addInfo: content,
    accountName: ACCOUNT_NAME,
  });

  return `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?${params.toString()}`;
}

export default function PremiumCheckoutPage() {
  const navigate = useNavigate();

  const [confirming, setConfirming] = useState(false);

  const user = getCurrentUser();

  const paymentCode = useMemo(() => {
    const userId = user?.id || user?.userId || "USER";
    return `AISTUDYHUB PREMIUM ${String(userId).slice(0, 8).toUpperCase()}`;
  }, [user]);

  const qrUrl = useMemo(
    () =>
      buildVietQrUrl({
        amount: QR_TEST_AMOUNT,
        content: paymentCode,
      }),
    [paymentCode],
  );

  async function handleConfirmPaid() {
    setConfirming(true);

    try {
      await upgradeToPremium();

      const currentUser = getCurrentUser();

      const newUser = {
        ...currentUser,
        membership: "PREMIUM",
        plan: "PREMIUM",
        subscriptionPlan: "PREMIUM",
        isPremium: true,
      };

      localStorage.setItem("user", JSON.stringify(newUser));
      localStorage.setItem(
        "role",
        newUser.role || currentUser.role || "CUSTOMER",
      );

      /*
       * Báo cho Dashboard/AppLayout biết user đã đổi gói.
       * Nhờ dòng này, ô bên phải sẽ đổi từ Miễn phí sang Premium.
       */
      window.dispatchEvent(new Event("auth:user-updated"));

      await Swal.fire({
        icon: "success",
        title: "Thanh toán thành công",
        text: "Tài khoản của bạn đã được nâng cấp lên Premium. Hóa đơn đã được gửi về email.",
        confirmButtonText: "Về trang chủ",
      });

      navigate("/dashboard", {
        replace: true,
        state: {
          paymentSuccess: true,
        },
      });
    } catch (err) {
      console.error("Upgrade premium error:", err);

      Swal.fire({
        icon: "error",
        title: "Chưa thể nâng cấp Premium",
        text:
          err?.message ||
          err?.data?.message ||
          "Vui lòng kiểm tra lại thanh toán hoặc thử lại sau.",
        confirmButtonText: "Đóng",
      });
    } finally {
      setConfirming(false);
    }
  }

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
            <h1>Thanh toán Premium</h1>
            <p>Quét mã QR để hoàn tất nâng cấp tài khoản AI Study Hub</p>
          </div>
        </div>

        <div className="premium-checkout-card">
          <div className="premium-checkout-left">
            <div className="premium-plan-summary">
              <span className="premium-plan-badge">Premium</span>

              <h2>Gói Premium 30 ngày</h2>

              <p>
                Mở khóa dung lượng 10GB, tăng giới hạn token AI/ngày và upload
                file tối đa 100MB.
              </p>

              <div className="premium-price-box">
                <span>Giá gói Premium hiển thị</span>
                <strong>{formatCurrency(PREMIUM_DISPLAY_PRICE)}</strong>
              </div>

              <div className="premium-payment-info">
                <div>
                  <span>Số tiền QR test</span>
                  <strong>{formatCurrency(QR_TEST_AMOUNT)}</strong>
                </div>

                <div>
                  <span>Nội dung chuyển khoản</span>
                  <strong>{paymentCode}</strong>
                </div>

                <div>
                  <span>Email nhận hóa đơn</span>
                  <strong>{user?.email || "Email tài khoản"}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="premium-checkout-right">
            <div className="premium-qr-box">
              <img src={qrUrl} alt="QR thanh toán Premium" />

              <p>
                Trên màn hình hệ thống vẫn hiển thị giá gói{" "}
                <strong>{formatCurrency(PREMIUM_DISPLAY_PRICE)}</strong>, nhưng
                QR này đang để số tiền test là{" "}
                <strong>{formatCurrency(QR_TEST_AMOUNT)}</strong>.
              </p>
            </div>

            <button
              className="premium-confirm-btn"
              type="button"
              onClick={handleConfirmPaid}
              disabled={confirming}
            >
              {confirming ? "Đang xác nhận..." : "Tôi đã thanh toán"}
            </button>

            <button
              className="premium-cancel-btn"
              type="button"
              onClick={() => navigate("/premium")}
              disabled={confirming}
            >
              Hủy thanh toán
            </button>
          </div>
        </div>

        <div className="premium-note">
          <strong>Lưu ý:</strong> Đây là QR test chuyển khoản 0đ. Một số app
          ngân hàng có thể không cho chuyển 0đ hoặc sẽ để trống ô số tiền. Đây
          là giới hạn từ app ngân hàng, không phải lỗi FE.
        </div>
      </div>
    </AppLayout>
  );
}
