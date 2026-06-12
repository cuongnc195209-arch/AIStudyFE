import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home/HomePage";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import DocumentsPage from "./pages/Documents/DocumentsPage";
import ChatbotPage from "./pages/Chatbot/ChatbotPage";
import ForumPage from "./pages/Forum/ForumPage";
import CoursesPage from "./pages/Courses/CoursesPage";
import SettingsPage from "./pages/Settings/SettingsPage";
import AdminDashboardPage from "./pages/Admin/AdminDashboardPage";
import PrivateRoute from "./routes/PrivateRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute
              allowedRoles={["CUSTOMER", "ADMIN", "MODERATOR", "TEACHER"]}
            >
              <DashboardPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/documents"
          element={
            <PrivateRoute>
              <DocumentsPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/chatbot"
          element={
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
          path="/courses"
          element={
            <PrivateRoute>
              <CoursesPage />
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
          path="/admin"
          element={
            <PrivateRoute allowedRoles={["ADMIN"]}>
              <AdminDashboardPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
