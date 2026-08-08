import { useEffect, useMemo, useState } from "react";
import {
  getAdminDocuments,
  getAdminPayments,
  getAdminUsers,
} from "../../../apis/adminApi";

const CURRENT_YEAR = new Date().getFullYear();

const MONTHS = Array.from({ length: 12 }, (_, index) => ({
  index,
  label: `T${index + 1}`,
}));

const FILE_TYPES = ["PDF", "PPT", "DOC", "IMG"];

const FILE_COLOR = {
  PDF: "#ef4444",
  PPT: "#f97316",
  DOC: "#3b82f6",
  IMG: "#10b981",
};

const PLAN_COLOR = {
  FREE: "#6b7280",
  PREMIUM: "#0066ff",
};

function getListFromResponse(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.content)) return res.content;
  if (Array.isArray(res?.data?.content)) return res.data.content;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

function deduplicateUsers(list) {
  const map = new Map();

  list.forEach((user) => {
    const key =
      user.id ||
      user.userId ||
      user.user_id ||
      user.email ||
      JSON.stringify(user);

    if (!map.has(key)) {
      map.set(key, user);
    }
  });

  return Array.from(map.values());
}

function normalizeRole(user) {
  const rawRole =
    user?.role ||
    user?.userRole ||
    user?.accountRole ||
    user?.roleName ||
    user?.authority ||
    user?.authorities?.[0]?.authority ||
    "";

  return String(rawRole)
    .trim()
    .toUpperCase()
    .replace(/^ROLE_/, "");
}

function isAdminUser(user) {
  const role = normalizeRole(user);

  if (role === "ADMIN") {
    return true;
  }

  /*
   * Fallback nếu BE không trả role nhưng trả field riêng của admin profile.
   */
  if (
    user?.adminId ||
    user?.admin_id ||
    user?.adminName ||
    user?.adminFullName ||
    (user?.accessLevel !== null && user?.accessLevel !== undefined)
  ) {
    return true;
  }

  return false;
}

function filterNonAdminUsers(list) {
  return list.filter((user) => !isAdminUser(user));
}

function getCreatedAt(item) {
  return item.createdAt || item.created_at || item.date || item.joinedAt || "";
}

function getMonthIndex(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (date.getFullYear() !== CURRENT_YEAR) {
    return null;
  }

  return date.getMonth();
}

function normalizeFileType(doc) {
  const raw = String(
    doc.fileType ||
      doc.ext ||
      doc.extension ||
      doc.mimeType ||
      doc.documentName ||
      doc.name ||
      "",
  ).toUpperCase();

  const name = String(doc.documentName || doc.name || "").toUpperCase();

  if (raw.includes("PDF") || name.endsWith(".PDF")) return "PDF";

  if (
    raw.includes("PPT") ||
    raw.includes("POWERPOINT") ||
    name.endsWith(".PPT") ||
    name.endsWith(".PPTX")
  ) {
    return "PPT";
  }

  if (
    raw.includes("DOC") ||
    raw.includes("WORD") ||
    name.endsWith(".DOC") ||
    name.endsWith(".DOCX")
  ) {
    return "DOC";
  }

  if (
    raw.includes("IMG") ||
    raw.includes("IMAGE") ||
    raw.includes("JPG") ||
    raw.includes("JPEG") ||
    raw.includes("PNG") ||
    name.endsWith(".JPG") ||
    name.endsWith(".JPEG") ||
    name.endsWith(".PNG")
  ) {
    return "IMG";
  }

  return "OTHER";
}

function normalizePlan(user) {
  if (!user) {
    return "FREE";
  }

  /*
   * BE đang trả memberId trong /api/admin/account.
   * Có memberId nghĩa là user đã có gói thành viên/Premium.
   */
  if (
    user.memberId ||
    user.member_id ||
    user.memId ||
    user.subscriptionId ||
    user.userMemberSubscriptionId ||
    user.isPremium === true
  ) {
    return "PREMIUM";
  }

  const raw = String(
    user.plan ||
      user.subscriptionPlan ||
      user.subscription ||
      user.membership ||
      user.memberType ||
      user.packageName ||
      user.planName ||
      user.memberStatus ||
      "",
  )
    .trim()
    .toUpperCase();

  if (
    raw.includes("PREMIUM") ||
    raw.includes("PRO") ||
    raw.includes("PAID") ||
    raw.includes("VIP") ||
    raw.includes("ACTIVE")
  ) {
    return "PREMIUM";
  }

  return "FREE";
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function formatRevenue(value) {
  const amount = Number(value || 0);

  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}M`;
  }

  return `${Math.round(amount)}K`;
}

function getPercent(value, total) {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function StatBarChart({ title, rightText, data, color }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="stats-chart-card">
      <div className="stats-chart-card-head">
        <h3>{title}</h3>
        <span>{rightText}</span>
      </div>

      <div className="admin-month-chart">
        {data.map((item) => {
          const height = Math.max(4, (item.value / maxValue) * 100);

          return (
            <div key={item.label} className="admin-month-item">
              <span className="admin-month-value">
                {item.shortLabel || item.value}
              </span>

              <div className="admin-month-bar-wrap">
                <div
                  className="admin-month-bar"
                  style={{
                    height: `${height}%`,
                    background: color,
                  }}
                />
              </div>

              <span className="admin-month-label">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlanDistribution({ freeCount, premiumCount }) {
  const total = freeCount + premiumCount;

  const plans = [
    {
      key: "FREE",
      label: "Miễn phí",
      count: freeCount,
      percent: getPercent(freeCount, total),
    },
    {
      key: "PREMIUM",
      label: "Premium",
      count: premiumCount,
      percent: getPercent(premiumCount, total),
    },
  ];

  return (
    <div className="stats-chart-card">
      <div className="stats-chart-card-head">
        <h3>Phân bổ gói thành viên</h3>
        <span>{formatNumber(total)} người dùng</span>
      </div>

      <div className="admin-progress-list">
        {plans.map((plan) => (
          <div key={plan.key} className="admin-progress-row">
            <div className="admin-progress-label">
              <span
                className="admin-progress-dot"
                style={{
                  background: PLAN_COLOR[plan.key],
                }}
              />

              <span>{plan.label}</span>
            </div>

            <div className="admin-progress-track">
              <div
                className="admin-progress-fill"
                style={{
                  width: `${plan.percent}%`,
                  background: PLAN_COLOR[plan.key],
                }}
              />
            </div>

            <strong>{plan.percent}%</strong>

            <span className="admin-progress-count">
              {formatNumber(plan.count)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FileTypeDistribution({ docs }) {
  const total = docs.length;

  const data = FILE_TYPES.map((type) => {
    const count = docs.filter((doc) => normalizeFileType(doc) === type).length;

    return {
      type,
      count,
      percent: getPercent(count, total),
    };
  });

  return (
    <div className="stats-chart-card">
      <div className="stats-chart-card-head">
        <h3>Loại tài liệu phổ biến</h3>
        <span>{formatNumber(total)} tài liệu</span>
      </div>

      <div className="admin-progress-list">
        {data.map((item) => (
          <div key={item.type} className="admin-progress-row">
            <div className="admin-progress-label">
              <span
                className="admin-progress-dot"
                style={{
                  background: FILE_COLOR[item.type],
                }}
              />

              <span>{item.type}</span>
            </div>

            <div className="admin-progress-track">
              <div
                className="admin-progress-fill"
                style={{
                  width: `${item.percent}%`,
                  background: FILE_COLOR[item.type],
                }}
              />
            </div>

            <strong>{item.percent}%</strong>

            <span className="admin-progress-count">
              {formatNumber(item.count)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatsSection() {
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadStatsData() {
      setLoading(true);

      try {
        const [userRes, docRes, paymentRes] = await Promise.all([
          getAdminUsers({
            page: 0,
            size: 9999,
          }),
          getAdminDocuments({
            page: 0,
            size: 9999,
          }),
          getAdminPayments({
            size: 9999,
          }),
        ]);

        if (cancelled) {
          return;
        }

        const rawUsers = getListFromResponse(userRes);
        const uniqueUsers = deduplicateUsers(rawUsers);
        const nonAdminUsers = filterNonAdminUsers(uniqueUsers);

        const rawDocuments = getListFromResponse(docRes);
        const rawPayments = getListFromResponse(paymentRes);

        setUsers(nonAdminUsers);
        setDocuments(rawDocuments);
        setPayments(rawPayments);
      } catch (err) {
        if (!cancelled) {
          console.error("Load stats data error:", err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadStatsData();

    return () => {
      cancelled = true;
    };
  }, []);

  const userMonthlyData = useMemo(() => {
    const monthly = Array(12).fill(0);

    users.forEach((user) => {
      const monthIndex = getMonthIndex(getCreatedAt(user));

      if (monthIndex !== null) {
        monthly[monthIndex] += 1;
      }
    });

    return MONTHS.map((month) => ({
      label: month.label,
      value: monthly[month.index],
      shortLabel: monthly[month.index],
    }));
  }, [users]);

  const revenueMonthlyData = useMemo(() => {
    const monthly = Array(12).fill(0);

    payments.forEach((payment) => {
      const status = String(payment.status || "").toUpperCase();

      if (status !== "MANUAL_CONFIRMED") {
        return;
      }

      const paidDate = payment.paidAt || payment.createdAt;
      const monthIndex = getMonthIndex(paidDate);

      if (monthIndex === null) {
        return;
      }

      const amountVnd = Number(payment.displayPrice ?? payment.amount ?? 0);

      // Đơn vị hiển thị của chart là nghìn đồng.
      monthly[monthIndex] += amountVnd / 1000;
    });

    return MONTHS.map((month) => ({
      label: month.label,
      value: monthly[month.index],
      shortLabel: formatRevenue(monthly[month.index]),
    }));
  }, [payments]);
  const totalUsersThisYear = userMonthlyData.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  const totalRevenueThisYear = revenueMonthlyData.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  const freeCount = users.filter(
    (user) => normalizePlan(user) === "FREE",
  ).length;

  const premiumCount = users.filter(
    (user) => normalizePlan(user) === "PREMIUM",
  ).length;

  return (
    <section className="admin-stats-section">
      <div className="admin-section-head">
        <div>
          <h2>Thống kê & Báo cáo</h2>

          <p>
            Dữ liệu năm {CURRENT_YEAR}
            {loading ? " · Đang tải..." : ""}
          </p>
        </div>
      </div>

      <div className="stats-charts-grid">
        <StatBarChart
          title="Người dùng mới theo tháng"
          rightText={`Tổng ${formatNumber(totalUsersThisYear)} người dùng`}
          data={userMonthlyData}
          color="#0066ff"
        />

        <StatBarChart
          title="Doanh thu theo tháng"
          rightText={`Tổng ${formatRevenue(totalRevenueThisYear)} · nghìn đồng`}
          data={revenueMonthlyData}
          color="#059669"
        />

        <PlanDistribution freeCount={freeCount} premiumCount={premiumCount} />

        <FileTypeDistribution docs={documents} />
      </div>
    </section>
  );
}
