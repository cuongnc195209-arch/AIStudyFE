import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getProfile } from "../../apis/authApi";
import AdminLayout from "../../components/layout/AdminLayout";
import { Toast } from "./shared/Toast";
import OverviewSection from "./sections/OverviewSection";
import UsersSection from "./sections/UsersSection";
import DocumentsSection from "./sections/DocumentsSection";
import ChatSection from "./sections/ChatSection";
import ForumSection from "./sections/ForumSection";
import StatsSection from "./sections/StatsSection";
import ConfigSection from "./sections/ConfigSection";
import "./AdminDashboardPage.css";

export default function AdminDashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const sectionFromUrl = location.pathname.split("/admin/")[1] || "overview";
  const [section, setSection] = useState(sectionFromUrl);

  function handleNavigate(s) {
    setSection(s);
    navigate(s === "overview" ? "/admin" : `/admin/${s}`, { replace: true });
  }

  const [toast, setToast] = useState(null);

  const [currentUser, setCurrentUser] = useState(() => {
    return JSON.parse(localStorage.getItem("user") || "{}");
  });

  useEffect(() => {
    async function loadAdminProfile() {
      try {
        const result = await getProfile();
        console.log("Admin profile result:", result);

        const profileData = result.data || result;

        const userData =
          profileData.user ||
          profileData.profile ||
          profileData.userProfile ||
          profileData;

        const newUser = {
          ...currentUser,
          ...userData,
          fullName:
            userData.fullName ||
            userData.name ||
            userData.full_name ||
            userData.displayName ||
            currentUser.fullName ||
            currentUser.name ||
            currentUser.full_name,
          email: userData.email || currentUser.email,
          role:
            userData.role ||
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
  }, []);

  const displayName =
    currentUser.fullName ||
    currentUser.name ||
    currentUser.full_name ||
    currentUser.displayName ||
    currentUser.username ||
    "Admin";

  const initials = displayName.includes("@")
    ? displayName[0].toUpperCase()
    : displayName
        .split(" ")
        .filter(Boolean)
        .map((word) => word[0])
        .slice(-2)
        .join("")
        .toUpperCase();

  const role = localStorage.getItem("role") || currentUser.role || "ADMIN";

  const roleText =
    role === "ADMIN" || role === "ROLE_ADMIN"
      ? "Quản trị viên"
      : role === "MODERATOR" || role === "ROLE_MODERATOR"
        ? "Kiểm duyệt viên"
        : "Người dùng";

  function showToast(msg) {
    setToast(msg);
  }

  const SECTION_MAP = {
    overview: <OverviewSection />,
    users: <UsersSection onToast={showToast} />,
    documents: <DocumentsSection onToast={showToast} />,
    chat: <ChatSection />,
    forum: <ForumSection onToast={showToast} />,
    stats: <StatsSection />,
    config: <ConfigSection onToast={showToast} />,
  };

  return (
    <AdminLayout activeSection={section} onNavigate={handleNavigate}>
      <div className="admin-page">
        {/* Top bar */}
        <div className="admin-topbar">
          <div className="admin-topbar-left">
            <span className="admin-breadcrumb">
              Admin ·{" "}
              {
                {
                  overview: "Tổng quan",
                  users: "Người dùng",
                  documents: "Tài liệu",
                  chat: "Chat AI",
                  forum: "Kiểm duyệt Forum",
                  stats: "Thống kê",
                  config: "Cấu hình",
                }[section]
              }
            </span>
          </div>
          <div className="admin-topbar-right">
            <button className="admin-notif-btn" title="Thông báo">
              🔔<span className="admin-notif-badge">3</span>
            </button>
            <div className="admin-user-chip">
              <div className="admin-user-avatar">{initials}</div>
              <div>
                <p className="admin-user-name">{displayName}</p>
                <p className="admin-user-role">{roleText}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {SECTION_MAP[section]}
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </AdminLayout>
  );
}
