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
  return {
    id,
    name: fullName,
    email: u.email || "",
    joined: u.createdAt ? u.createdAt.slice(0, 10) : "",
    role,
    status,
  };
}
