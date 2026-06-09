import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import './DashboardPage.css'

const STATS = [
  { icon: '📁', label: 'Tài liệu', value: '24', sub: '+3 tuần này', color: 'blue' },
  { icon: '💾', label: 'Dung lượng', value: '2.4 GB', sub: '48% / 5 GB', color: 'purple' },
  { icon: '💬', label: 'Phiên Chat AI', value: '18', sub: 'Tuần này', color: 'green' },
  { icon: '🎓', label: 'Khóa học', value: '3', sub: '1 đang học', color: 'orange' },
]

const RECENT_DOCS = [
  { id: 1, ext: 'PDF', color: '#ef4444', name: 'Giáo trình Lập trình Web', subject: 'Lập trình Web', size: '4.2 MB', date: '2 giờ trước' },
  { id: 2, ext: 'PPT', color: '#f97316', name: 'Slide CSDL Chương 5', subject: 'Cơ sở dữ liệu', size: '8.1 MB', date: 'Hôm qua' },
  { id: 3, ext: 'DOC', color: '#3b82f6', name: 'Bài tập Trí tuệ nhân tạo', subject: 'Trí tuệ nhân tạo', size: '1.3 MB', date: '3 ngày trước' },
  { id: 4, ext: 'PDF', color: '#ef4444', name: 'Đề thi HK2 - Mạng máy tính', subject: 'Mạng máy tính', size: '2.8 MB', date: '5 ngày trước' },
]

const RECENT_CHATS = [
  { id: 1, question: 'Giải thích khái niệm OOP trong lập trình?', doc: 'Giáo trình Lập trình Web', time: '2 giờ trước' },
  { id: 2, question: 'Cách tối ưu hóa câu lệnh SQL JOIN?', doc: 'Slide CSDL Chương 5', time: 'Hôm qua' },
  { id: 3, question: 'Thuật toán A* hoạt động như thế nào?', doc: 'Bài tập Trí tuệ nhân tạo', time: '2 ngày trước' },
]

const FORUM_ACTIVITY = [
  { id: 1, type: 'comment', user: 'Trần Thị B', action: 'bình luận vào bài đăng của bạn', title: 'Hỏi về React Hooks', time: '1 giờ trước' },
  { id: 2, type: 'post', user: 'Lê Văn C', action: 'đã đăng bài mới trong', title: 'Cơ sở dữ liệu', time: '3 giờ trước' },
  { id: 3, type: 'download', user: 'Nguyễn Thị D', action: 'tải xuống tài liệu', title: 'Slide CSDL Chương 5', time: 'Hôm qua' },
]

const ACTIVITY_ICON = { comment: '💬', post: '📝', download: '⬇️' }

export default function DashboardPage() {
  const navigate = useNavigate()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const displayName = storedUser.fullName || storedUser.name || storedUser.email || 'Người dùng'
  const initials = displayName.includes('@')
    ? displayName[0].toUpperCase()
    : displayName.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()

  return (
    <AppLayout>
      <div className="dashboard">
        {/* ── Top bar ── */}
        <div className="dash-topbar">
          <div className="dash-greeting">
            <h1>{greeting}, {displayName} 👋</h1>
            <p>Hôm nay bạn muốn học gì?</p>
          </div>
          <div className="dash-topbar-right">
            <button className="notif-btn" title="Thông báo">
              🔔
              <span className="notif-badge">3</span>
            </button>
            <div className="user-chip">
              <div className="user-avatar">{initials}</div>
              <div className="user-info">
                <span className="user-name">{displayName}</span>
                <span className="user-plan">Gói miễn phí</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Upgrade banner ── */}
        <div className="upgrade-banner">
          <div className="upgrade-text">
            <span className="upgrade-icon">⚡</span>
            <div>
              <strong>Nâng cấp lên Premium</strong>
              <span> — Tăng dung lượng lên 50 GB, AI không giới hạn, tài liệu độc quyền</span>
            </div>
          </div>
          <button className="upgrade-btn" onClick={() => navigate('/courses')}>
            Xem gói Premium →
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="stats-grid">
          {STATS.map(s => (
            <div key={s.label} className={`stat-card stat-${s.color}`}>
              <div className="stat-icon-wrap">{s.icon}</div>
              <div className="stat-body">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-sub">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Quick actions ── */}
        <div className="section-header">
          <h2 className="section-title">Thao tác nhanh</h2>
        </div>
        <div className="quick-actions">
          <button className="qa-card qa-upload" onClick={() => navigate('/documents')}>
            <div className="qa-icon-wrap">⬆️</div>
            <span className="qa-label">Upload Tài liệu</span>
            <span className="qa-desc">Thêm tài liệu mới</span>
          </button>
          <button className="qa-card qa-chat" onClick={() => navigate('/chatbot')}>
            <div className="qa-icon-wrap">🤖</div>
            <span className="qa-label">Hỏi AI Chatbot</span>
            <span className="qa-desc">Hỏi về tài liệu của bạn</span>
          </button>
          <button className="qa-card qa-forum" onClick={() => navigate('/forum')}>
            <div className="qa-icon-wrap">🗣️</div>
            <span className="qa-label">Vào Diễn đàn</span>
            <span className="qa-desc">Trao đổi với sinh viên</span>
          </button>
          <button className="qa-card qa-courses" onClick={() => navigate('/courses')}>
            <div className="qa-icon-wrap">🎓</div>
            <span className="qa-label">Khóa học</span>
            <span className="qa-desc">Tiếp tục học tập</span>
          </button>
        </div>

        {/* ── Two-column main grid ── */}
        <div className="dash-grid">
          {/* Recent documents */}
          <div className="dash-card">
            <div className="dash-card-head">
              <h2>Tài liệu gần đây</h2>
              <button className="see-all-btn" onClick={() => navigate('/documents')}>
                Xem tất cả →
              </button>
            </div>
            <div className="doc-list">
              {RECENT_DOCS.map(doc => (
                <div key={doc.id} className="doc-row">
                  <div className="doc-ext" style={{ background: doc.color }}>
                    {doc.ext}
                  </div>
                  <div className="doc-meta">
                    <p className="doc-name">{doc.name}</p>
                    <p className="doc-sub">{doc.subject} · {doc.size}</p>
                  </div>
                  <div className="doc-right">
                    <span className="doc-date">{doc.date}</span>
                    <div className="doc-actions">
                      <button className="doc-action-btn" title="Xem trước">👁️</button>
                      <button className="doc-action-btn" title="Tải xuống">⬇️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="dash-col-right">
            {/* Recent AI chats */}
            <div className="dash-card">
              <div className="dash-card-head">
                <h2>Lịch sử Chat AI</h2>
                <button className="see-all-btn" onClick={() => navigate('/chatbot')}>
                  Xem tất cả →
                </button>
              </div>
              <div className="chat-list">
                {RECENT_CHATS.map(chat => (
                  <div key={chat.id} className="chat-row">
                    <div className="chat-ai-dot">AI</div>
                    <div className="chat-meta">
                      <p className="chat-question">{chat.question}</p>
                      <p className="chat-doc">📄 {chat.doc}</p>
                    </div>
                    <span className="chat-time">{chat.time}</span>
                  </div>
                ))}
              </div>
              <button className="new-chat-btn" onClick={() => navigate('/chatbot')}>
                + Bắt đầu chat mới
              </button>
            </div>

            {/* Forum activity */}
            <div className="dash-card">
              <div className="dash-card-head">
                <h2>Hoạt động Forum</h2>
                <button className="see-all-btn" onClick={() => navigate('/forum')}>
                  Xem tất cả →
                </button>
              </div>
              <div className="activity-list">
                {FORUM_ACTIVITY.map(item => (
                  <div key={item.id} className="activity-row">
                    <span className="activity-icon">{ACTIVITY_ICON[item.type]}</span>
                    <div className="activity-meta">
                      <p className="activity-text">
                        <strong>{item.user}</strong> {item.action}{' '}
                        <span className="activity-link">"{item.title}"</span>
                      </p>
                      <span className="activity-time">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
