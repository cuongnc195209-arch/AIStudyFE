import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMemberDetail, isActiveMemberDetail } from "../../apis/memberApi";
import AppLayout from "../../components/layout/AppLayout";
import "../Settings/SettingsPage.css";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function formatExpiryDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("vi-VN");
}

function checkPremiumFromUser(user) {
  const plan = String(
    user?.membership ||
      user?.plan ||
      user?.subscriptionPlan ||
      user?.memberType ||
      "",
  ).toUpperCase();

  return Boolean(
    user?.isPremium ||
    user?.memberId ||
    user?.memberStatus === "ACTIVE" ||
    plan === "PREMIUM" ||
    plan.includes("PREMIUM"),
  );
}

function savePremiumLocalUser() {
  const currentUser = getStoredUser();

  const premiumUser = {
    ...currentUser,
    membership: "PREMIUM",
    plan: "PREMIUM",
    subscriptionPlan: "PREMIUM",
    memberStatus: "ACTIVE",
    isPremium: true,
  };

  localStorage.setItem("user", JSON.stringify(premiumUser));
  window.dispatchEvent(new Event("auth:user-updated"));
}

export default function PremiumPage() {
  const navigate = useNavigate();

  const [storedUser, setStoredUser] = useState(() => getStoredUser());
  const [memberDetail, setMemberDetail] = useState(null);
  const [loadingMember, setLoadingMember] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadMemberDetail() {
      setLoadingMember(true);

      try {
        const detail = await getMemberDetail();

        if (cancelled) {
          return;
        }

        setMemberDetail(detail || null);

        if (isActiveMemberDetail(detail)) {
          savePremiumLocalUser();
          setStoredUser(getStoredUser());
        }
      } catch (err) {
        console.error("Load member detail error:", err);
      } finally {
        if (!cancelled) {
          setLoadingMember(false);
        }
      }
    }

    loadMemberDetail();

    return () => {
      cancelled = true;
    };
  }, []);

  const isPremium =
    checkPremiumFromUser(storedUser) || isActiveMemberDetail(memberDetail);

  const expiryDate = formatExpiryDate(memberDetail?.endDate);

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
                    Dung lượng lưu trữ cơ bản
                  </li>

                  <li className="feature-item feature-item--ok">
                    <span
                      className="feature-check"
                      style={{ color: "#6b7280" }}
                    >
                      ✓
                    </span>
                    Giới hạn AI cơ bản
                  </li>

                  <li className="feature-item feature-item--ok">
                    <span
                      className="feature-check"
                      style={{ color: "#6b7280" }}
                    >
                      ✓
                    </span>
                    Upload tài liệu học tập
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
                    Dung lượng lưu trữ Premium
                  </li>

                  <li className="feature-item feature-item--ok">
                    <span
                      className="feature-check"
                      style={{ color: "#0066ff" }}
                    >
                      ✓
                    </span>
                    Giới hạn AI cao hơn
                  </li>

                  <li className="feature-item feature-item--ok">
                    <span
                      className="feature-check"
                      style={{ color: "#0066ff" }}
                    >
                      ✓
                    </span>
                    Upload file lớn hơn
                  </li>
                </ul>

                {isPremium ? (
                  <div className="plan-current-badge">
                    ✓ Đang sử dụng Premium
                    {expiryDate && (
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: "0.78rem",
                          fontWeight: 500,
                          color: "#9ca3af",
                        }}
                      >
                        Hết hạn: {expiryDate}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    className="plan-cta"
                    style={{ background: "#0066ff" }}
                    onClick={() => navigate("/premium/checkout")}
                    disabled={loadingMember}
                  >
                    {loadingMember ? "Đang kiểm tra..." : "Nâng cấp Premium"}
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
