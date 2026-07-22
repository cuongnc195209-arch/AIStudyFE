import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import "../Settings/SettingsPage.css";

export default function PremiumPage() {
  const navigate = useNavigate();

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const isPremium =
    currentUser.memberId ||
    currentUser.membership === "PREMIUM" ||
    currentUser.plan === "PREMIUM" ||
    currentUser.subscriptionPlan === "PREMIUM";

  return (
    <AppLayout>
      <div className="settings-page">
        <div className="settings-header">
          <h1 className="settings-title">Nâng cấp Premium</h1>
          <p className="settings-sub">
            Chọn gói phù hợp để mở khóa toàn bộ tính năng AI Study Hub
          </p>
        </div>

        <div className="settings-content">
          <div className="section-content">
            <div className="section-head">
              <h2>Gói thành viên</h2>
              <p>
                Bạn đang dùng gói{" "}
                <strong>{isPremium ? "Premium" : "Miễn phí"}</strong>
                {!isPremium && " · Nâng cấp để mở khóa thêm tính năng"}
              </p>
            </div>

            <div className="plans-grid">
              <div className="plan-card plan-card--current">
                <div className="plan-top">
                  <h3 className="plan-name">Miễn phí</h3>
                  <div className="plan-price">
                    <span className="plan-amount" style={{ color: "#6b7280" }}>
                      0₫
                    </span>
                    <span className="plan-period">/tháng</span>
                  </div>
                </div>

                <ul className="plan-features">
                  <li className="feature-item feature-item--ok">
                    <span
                      className="feature-check"
                      style={{ color: "#6b7280" }}
                    >
                      ✓
                    </span>
                    5 GB lưu trữ
                  </li>
                  <li className="feature-item feature-item--ok">
                    <span
                      className="feature-check"
                      style={{ color: "#6b7280" }}
                    >
                      ✓
                    </span>
                    20.000 token AI/ngày
                  </li>
                  <li className="feature-item feature-item--ok">
                    <span
                      className="feature-check"
                      style={{ color: "#6b7280" }}
                    >
                      ✓
                    </span>
                    Upload tối đa 10 MB/file
                  </li>
                </ul>

                {!isPremium ? (
                  <div className="plan-current-badge">✓ Gói hiện tại</div>
                ) : (
                  <div className="plan-current-badge">Gói cơ bản</div>
                )}
              </div>

              <div className="plan-card plan-card--featured">
                <div className="plan-badge" style={{ background: "#0066ff" }}>
                  Phổ biến nhất
                </div>

                <div className="plan-top">
                  <h3 className="plan-name">Premium</h3>
                  <div className="plan-price">
                    <span className="plan-amount" style={{ color: "#0066ff" }}>
                      99.000₫
                    </span>
                    <span className="plan-period">/tháng</span>
                  </div>
                </div>

                <ul className="plan-features">
                  <li className="feature-item feature-item--ok">
                    <span
                      className="feature-check"
                      style={{ color: "#0066ff" }}
                    >
                      ✓
                    </span>
                    10 GB lưu trữ
                  </li>
                  <li className="feature-item feature-item--ok">
                    <span
                      className="feature-check"
                      style={{ color: "#0066ff" }}
                    >
                      ✓
                    </span>
                    50.000 token AI/ngày
                  </li>
                  <li className="feature-item feature-item--ok">
                    <span
                      className="feature-check"
                      style={{ color: "#0066ff" }}
                    >
                      ✓
                    </span>
                    Upload tối đa 100 MB/file
                  </li>
                </ul>

                {isPremium ? (
                  <div className="plan-current-badge">
                    ✓ Đang sử dụng Premium
                  </div>
                ) : (
                  <button
                    className="plan-cta"
                    style={{ background: "#0066ff" }}
                    onClick={() => navigate("/premium/checkout")}
                  >
                    Nâng cấp Premium
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
