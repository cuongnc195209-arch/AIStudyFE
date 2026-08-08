import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home/HomePage";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import ChatbotPage from "./pages/Chatbot/ChatbotPage";
import ForumPage from "./pages/Forum/ForumPage";
import PremiumPage from "./pages/Premium/PremiumPage";
import ModerationPage from "./pages/Moderation/ModerationPage";
import SettingsPage from "./pages/Settings/SettingsPage";
import AdminDashboardPage from "./pages/Admin/AdminDashboardPage";
import PrivateRoute from "./routes/PrivateRoute";
import VerifyEmailOtpPage from "./pages/Auth/VerifyEmailOtpPage";
import ForgotPasswordOtpPage from "./pages/Auth/ForgotPasswordOtpPage";
import PremiumCheckoutPage from "./pages/Premium/PremiumCheckoutPage";
import ReportsPage from "./pages/Reports/ReportsPage";
import PaymentHistoryPage from "./pages/Payment/PaymentHistoryPage";

function App() {
  return (
    // BrowserRouter dùng URL thật của trình duyệt (không phải dạng #hash)
    <BrowserRouter>
      <Routes>
        {/* ── Route công khai — không cần đăng nhập ── */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordOtpPage />} />

        {/* ── Route riêng tư — bọc PrivateRoute để bắt buộc đăng nhập (và đúng role nếu có truyền allowedRoles) ── */}
        <Route
          path="/dashboard"
          element={
            // Liệt kê hết role hiện có => bất kỳ ai đã đăng nhập đều vào được
            <PrivateRoute
              allowedRoles={["CUSTOMER", "ADMIN", "TEACHER", "MODERATOR"]}
            >
              <DashboardPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/moderation"
          element={
            // Trang duyệt tài liệu pending — chỉ MODERATOR và ADMIN
            <PrivateRoute allowedRoles={["MODERATOR", "ADMIN"]}>
              <ModerationPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <PrivateRoute allowedRoles={["MODERATOR", "ADMIN"]}>
              <ReportsPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/chatbot"
          element={
            // Không truyền allowedRoles => chỉ cần có token, không giới hạn role
            <PrivateRoute>
              <ChatbotPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/forum"
          element={
            <PrivateRoute>
              <ForumPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/premium"
          element={
            <PrivateRoute>
              <PremiumPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/premium/checkout"
          element={
            <PrivateRoute>
              <PremiumCheckoutPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/payment-history"
          element={
            <PrivateRoute>
              <PaymentHistoryPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/*"
          element={
            // "/*" => mọi path con (/admin/users, /admin/documents...) đều render AdminDashboardPage;
            // việc chuyển section bên trong khu vực admin do chính AdminDashboardPage tự quản lý, không khai báo route con ở đây
            <PrivateRoute allowedRoles={["ADMIN"]}>
              <AdminDashboardPage />
            </PrivateRoute>
          }
        />

        <Route path="/verify-email" element={<VerifyEmailOtpPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
