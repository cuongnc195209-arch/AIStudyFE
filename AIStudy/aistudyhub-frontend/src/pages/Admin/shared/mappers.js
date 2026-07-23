// Chuẩn hoá 1 user thô từ backend thành object thống nhất cho bảng admin — dùng chung bởi
// UsersSection và OverviewSection. Backend trả field role/status ở nhiều hình dạng khác nhau
// (role, userRole, roles[], authorities[]...) nên phải thử lần lượt để tìm giá trị đúng.
export function mapUser(u, index = 0) {
  const rawStatus = (u.accountStatus || "").toUpperCase();
  const status =
    rawStatus === "BANNED" || rawStatus === "LOCKED" ? "locked" : "active";
  const fullName =
    u.fullName ||
    u.customerProfileFullName ||
    u.customerProfile?.fullName ||
    (u.email || "").split("@")[0] ||
    "Unknown";
  const id =
    u.id ||
    u.userId ||
    u.user_id ||
    u.customerProfile?.id ||
    u.email ||
    `user-${index}`;
  const rawRole =
    u.role ||
    u.userRole ||
    u.accountRole ||
    (Array.isArray(u.roles) ? u.roles[0] : null) ||
    (Array.isArray(u.authorities)
      ? u.authorities[0]?.authority || u.authorities[0]
      : null) ||
    "CUSTOMER";
  const role = rawRole.replace(/^ROLE_/, "").toUpperCase();

  const rawPlan = String(
    u.membership || u.plan || u.subscriptionPlan || u.memberType || "",
  ).toUpperCase();
  const isPremium = Boolean(
    u.isPremium || u.memberId || rawPlan === "PREMIUM" || rawPlan.includes("PREMIUM"),
  );

  return {
    id,
    name: fullName,
    email: u.email || "",
    joined: u.createdAt ? u.createdAt.slice(0, 10) : "",
    role,
    status,
    plan: isPremium ? "Premium" : "Miễn phí",
  };
}
