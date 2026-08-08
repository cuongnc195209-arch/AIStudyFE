import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getProfile } from "../../apis/authApi";
import AdminLayout from "../../components/layout/AdminLayout";
import { Toast } from "./shared/Toast";
import OverviewSection from "./sections/OverviewSection";
import UsersSection from "./sections/UsersSection";
import DocumentsSection from "./sections/DocumentsSection";
import ChatSection from "./sections/ChatSection";
import StatsSection from "./sections/StatsSection";
import ConfigSection from "./sections/ConfigSection";
import PaymentsSection from "./sections/PaymentsSection";
import "./AdminDashboardPage.css";
import ReportsSection from "./sections/ReportsSection";

function isEmailLike(value) {
  return typeof value === "string" && value.includes("@");
}

function getDisplayName(user) {
  if (!user) {
    return "Người dùng";
  }

  return (
    [
      user.fullName,
      user.full_name,
      user.displayName,
      user.name,
      user.username,
      user.studentName,
      user.studentCode,
    ].find((value) => value && !isEmailLike(value)) || "Người dùng"
  );
}

function getInitials(name) {
  if (!name || name === "Người dùng") {
    return "U";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .slice(-2)
    .join("")
    .toUpperCase();
}

function normalizeRole(role) {
  return String(role || "ADMIN")
    .trim()
    .toUpperCase()
    .replace(/^ROLE_/, "");
}

function getRoleText(role) {
  const cleanRole = normalizeRole(role);

  if (cleanRole === "ADMIN") {
    return "Quản trị viên";
  }

  if (cleanRole === "MODERATOR") {
    return "Kiểm duyệt viên";
  }

  return "Người dùng";
}

export default function AdminDashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const sectionFromUrl = location.pathname.split("/admin/")[1] || "overview";
  const [section, setSection] = useState(sectionFromUrl);
  const [toast, setToast] = useState(null);

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });

  function handleNavigate(s) {
    setSection(s);
    navigate(s === "overview" ? "/admin" : `/admin/${s}`, {
      replace: true,
    });
  }

  useEffect(() => {
    async function loadAdminProfile() {
      try {
        const result = await getProfile();
        console.log("Admin profile result:", result);

        const profileData = result?.data || result || {};

        const userData =
          profileData.user ||
          profileData.profile ||
          profileData.userProfile ||
          profileData.account ||
          profileData ||
          {};

        const mergedUser = {
          ...currentUser,
          ...userData,
        };

        const fullName = getDisplayName(mergedUser);

        const newUser = {
          ...mergedUser,
          fullName,
          displayName: fullName,
          name: fullName,
          email: mergedUser.email || currentUser.email,
          role:
            mergedUser.role ||
            currentUser.role ||
            localStorage.getItem("role") ||
            "ADMIN",
        };

        localStorage.setItem("user", JSON.stringify(newUser));
        localStorage.setItem("role", newUser.role);

        setCurrentUser(newUser);
      } catch (error) {
        console.error("Load admin profile error:", error);
      }
    }

    loadAdminProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayName = getDisplayName(currentUser);
  const initials = getInitials(displayName);

  const role = currentUser.role || localStorage.getItem("role") || "ADMIN";

  const roleText = getRoleText(role);

  function showToast(msg) {
    setToast(msg);
  }

  const SECTION_MAP = {
    overview: <OverviewSection />,
    users: <UsersSection onToast={showToast} />,
    documents: <DocumentsSection onToast={showToast} />,
    reports: <ReportsSection onToast={showToast} />,
    chat: <ChatSection />,
    stats: <StatsSection />,
    payments: <PaymentsSection onToast={showToast} />,
    config: <ConfigSection onToast={showToast} />,
  };

  return (
    <AdminLayout activeSection={section} onNavigate={handleNavigate}>
      <div className="admin-page">
        <div className="admin-topbar">
          <div className="admin-topbar-left">
            <span className="admin-breadcrumb">
              Admin ·{" "}
              {
                {
                  overview: "Tổng quan",
                  users: "Người dùng",
                  documents: "Tài liệu",
                  reports: "Báo cáo",
                  chat: "Chat AI",
                  stats: "Thống kê",
                  payments: "Giao dịch",
                  config: "Cấu hình",
                }[section]
              }
            </span>
          </div>

          <div className="admin-topbar-right">
            <div className="admin-user-chip">
              <div className="admin-user-avatar">{initials}</div>

              <div>
                <p className="admin-user-name">{displayName}</p>
                <p className="admin-user-role">{roleText}</p>
              </div>
            </div>
          </div>
        </div>

        {SECTION_MAP[section]}
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </AdminLayout>
  );
}
