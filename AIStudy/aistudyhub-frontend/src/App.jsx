import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/Home/HomePage'
import LoginPage from './pages/Auth/LoginPage'
import RegisterPage from './pages/Auth/RegisterPage'
import DashboardPage from './pages/Dashboard/DashboardPage'
import DocumentsPage from './pages/Documents/DocumentsPage'
import ChatbotPage from './pages/Chatbot/ChatbotPage'
import ForumPage from './pages/Forum/ForumPage'
import CoursesPage from './pages/Courses/CoursesPage'
import SettingsPage from './pages/Settings/SettingsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route path="/forum" element={<ForumPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
