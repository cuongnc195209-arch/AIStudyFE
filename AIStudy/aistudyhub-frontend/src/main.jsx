// Điểm khởi động của toàn bộ ứng dụng React
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // CSS global duy nhất, áp dụng cho cả app
import App from './App.jsx'

// Gắn (mount) <App/> vào thẻ <div id="root"> trong index.html
createRoot(document.getElementById('root')).render(
  <StrictMode> {/* Chỉ có tác dụng ở dev: render 2 lần để phát hiện side-effect không an toàn */}
    <App />
  </StrictMode>,
)
