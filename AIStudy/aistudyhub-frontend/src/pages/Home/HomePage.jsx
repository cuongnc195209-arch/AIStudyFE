import React from 'react'
import { useNavigate } from 'react-router-dom'
import './HomePage.css'

const STATS = [
  { value: '2,500+', label: 'Sinh viên' },
  { value: '10K+', label: 'Tài liệu' },
  { value: '50K+', label: 'Câu hỏi AI' },
  { value: '99.9%', label: 'Uptime' },
]

const FEATURES = [
  { icon: '📚', color: 'blue', title: 'Lưu Trữ Cloud', desc: 'Upload và lưu trữ tài liệu trên cloud. Truy cập mọi lúc mọi nơi từ bất kỳ thiết bị nào.' },
  { icon: '🔍', color: 'purple', title: 'Tìm Kiếm Thông Minh', desc: 'Tìm tài liệu tức thì theo tên, môn học, nội dung với AI-powered search engine.' },
  { icon: '💬', color: 'pink', title: 'AI Chatbot', desc: 'Hỏi AI về nội dung tài liệu, giải thích khái niệm khó. Trợ lý AI luôn sẵn sàng 24/7.' },
  { icon: '🗂️', color: 'cyan', title: 'Phân Loại Tự Động', desc: 'Hệ thống tự phân loại tài liệu theo môn học và chủ đề một cách thông minh.' },
  { icon: '🔒', color: 'green', title: 'Bảo Mật Tuyệt Đối', desc: 'Tài liệu của bạn được mã hóa và bảo vệ. Chỉ bạn mới có quyền truy cập.' },
  { icon: '📊', color: 'orange', title: 'Thống Kê Học Tập', desc: 'Theo dõi tiến độ học tập, lịch sử tài liệu và hoạt động chatbot của bạn.' },
]

const TESTIMONIALS = [
  { name: 'Nguyễn Minh Tuấn', role: 'Sinh viên CNTT - FPT', avatar: 'MT', color: '#4f46e5', text: 'AI Study Hub giúp mình tìm tài liệu siêu nhanh. Không còn phải lục tung máy hay group chat nữa!' },
  { name: 'Trần Thị Hương', role: 'Sinh viên QTKD - FPT', avatar: 'TH', color: '#7c3aed', text: 'Chatbot AI trả lời cực kỳ chính xác về nội dung tài liệu. Ôn thi hiệu quả hơn nhiều!' },
  { name: 'Lê Văn Đức', role: 'Sinh viên KT - FPT', avatar: 'LĐ', color: '#0ea5e9', text: 'Giao diện đẹp, dễ dùng. Mình upload tài liệu từ năm 1 đến giờ vẫn tìm được ngay.' },
]

export default function HomePage() {
  const navigate = useNavigate()

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="landing-page">
      {/* Animated background orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />

      {/* ── Header ── */}
      <header className="header-bar">
        <div className="header-content">
          <div className="brand-row">
            <div className="brand-icon">📄</div>
            <span className="brand-name">AI Study Hub</span>
          </div>
          <nav className="nav-links">
            <button type="button" onClick={() => scrollTo('feature-section')}>Tính năng</button>
            <button type="button" onClick={() => scrollTo('testimonial-section')}>Đánh giá</button>
            <button type="button" onClick={() => scrollTo('cta-section')}>Bắt đầu</button>
          </nav>
          <div className="header-right">
            <button className="header-login" type="button" onClick={() => navigate('/login')}>Đăng nhập</button>
            <button className="header-cta" type="button" onClick={() => navigate('/register')}>Dùng miễn phí →</button>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="hero-section">
          <div className="hero-copy">
            <div className="hero-pill">
              <span className="hero-pill-dot" />
              <span>Nền tảng học tập thông minh cho sinh viên</span>
            </div>

            <h1>
              Quản Lý Tài Liệu
              <br />
              <span className="hero-highlight">Thông Minh Với AI</span>
            </h1>

            <p className="hero-description">
              Lưu trữ cloud, tìm kiếm siêu tốc và hỏi đáp AI ngay từ tài liệu của bạn.
              Tất cả trong một nền tảng — miễn phí cho sinh viên.
            </p>

            <div className="hero-actions">
              <button className="primary-btn" type="button" onClick={() => navigate('/register')}>
                🚀 Bắt đầu miễn phí
              </button>
              <button className="secondary-btn" type="button" onClick={() => navigate('/login')}>
                Đã có tài khoản →
              </button>
            </div>

            <div className="hero-stats">
              {STATS.map(s => (
                <div key={s.label} className="hero-stat">
                  <span className="hero-stat-value">{s.value}</span>
                  <span className="hero-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-panel">
            <div className="upload-card">
              <div className="upload-header">
                <span className="dot red" /><span className="dot yellow" /><span className="dot green" />
                <span className="upload-label">📂 Tài liệu của tôi</span>
                <span className="upload-badge">3 mới</span>
              </div>
              <div className="upload-list">
                {[
                  { icon: 'W', color: 'blue', name: 'Lập trình Web', sub: 'Bài giảng lý thuyết · 4.2 MB' },
                  { icon: 'D', color: 'purple', name: 'Cơ sở dữ liệu', sub: 'Slide chương 5 · 8.1 MB' },
                  { icon: 'AI', color: 'orange', name: 'Trí tuệ nhân tạo', sub: 'Bài tập A* Search · 1.3 MB' },
                ].map(item => (
                  <div key={item.name} className="upload-item">
                    <div className={`upload-icon ${item.color}`}>{item.icon}</div>
                    <div className="upload-meta">
                      <p className="upload-title">{item.name}</p>
                      <p className="upload-subtitle">{item.sub}</p>
                    </div>
                    <span className="check">✓</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="chat-card">
              <div className="chat-header">
                <div className="chat-icon">🤖</div>
                <div>
                  <span className="chat-title">AI Chatbot</span>
                  <span className="chat-online">● Trực tuyến</span>
                </div>
              </div>
              <div className="chat-messages">
                <div className="chat-bubble user-bubble">Giải thích OOP trong lập trình?</div>
                <div className="chat-bubble ai-bubble">
                  OOP là phương pháp lập trình hướng đối tượng, tổ chức code xung quanh các đối tượng với 4 tính chất: Đóng gói, Kế thừa, Đa hình, Trừu tượng...
                </div>
                <div className="chat-typing">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Trusted by ── */}
        <div className="trusted-bar">
          <span className="trusted-label">Được tin dùng bởi sinh viên tại</span>
          <div className="trusted-logos">
            {['FPT University', 'Đại học Bách Khoa', 'RMIT Vietnam', 'UEH', 'NEU'].map(name => (
              <span key={name} className="trusted-logo">{name}</span>
            ))}
          </div>
        </div>

        {/* ── Features ── */}
        <section className="feature-section" id="feature-section">
          <div className="section-label">Tính năng</div>
          <h2>Mọi thứ bạn cần để bứt phá học tập</h2>
          <p>Đầy đủ công cụ giúp bạn quản lý tài liệu hiệu quả và học tập thông minh hơn</p>
          <div className="feature-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card">
                <div className={`feature-icon ${f.color}`}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="how-section">
          <div className="section-label">Cách hoạt động</div>
          <h2>Chỉ 3 bước để bắt đầu</h2>
          <div className="how-grid">
            {[
              { step: '01', icon: '📝', title: 'Đăng ký miễn phí', desc: 'Tạo tài khoản trong 30 giây với email sinh viên.' },
              { step: '02', icon: '⬆️', title: 'Upload tài liệu', desc: 'Kéo thả PDF, DOCX, PPTX lên cloud an toàn.' },
              { step: '03', icon: '🤖', title: 'Hỏi AI bất cứ lúc nào', desc: 'Chat với AI về nội dung tài liệu của bạn.' },
            ].map((item, i) => (
              <React.Fragment key={item.step}>
                <div className="how-card">
                  <div className="how-step">{item.step}</div>
                  <div className="how-icon">{item.icon}</div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
                {i < 2 && <div className="how-arrow">→</div>}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="testimonial-section" id="testimonial-section">
          <div className="section-label">Đánh giá</div>
          <h2>Sinh viên nói gì về chúng tôi?</h2>
          <div className="testimonial-grid">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="testimonial-card">
                <div className="testimonial-stars">★★★★★</div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar" style={{ background: t.color }}>{t.avatar}</div>
                  <div>
                    <p className="testimonial-name">{t.name}</p>
                    <p className="testimonial-role">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="cta-section" id="cta-section">
          <div className="cta-box">
            <div className="cta-badge">🎓 Miễn phí cho sinh viên</div>
            <h2>Sẵn sàng học tập thông minh hơn?</h2>
            <p>Tham gia cùng 2,500+ sinh viên đang sử dụng AI Study Hub mỗi ngày</p>
            <div className="cta-actions">
              <button className="cta-button" type="button" onClick={() => navigate('/register')}>
                🚀 Bắt đầu miễn phí ngay
              </button>
              <button className="cta-secondary" type="button" onClick={() => navigate('/login')}>
                Đăng nhập
              </button>
            </div>
            <p className="cta-note">Không cần thẻ tín dụng · Miễn phí mãi mãi cho gói cơ bản</p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="brand-row">
            <div className="brand-icon">📄</div>
            <span className="brand-name">AI Study Hub</span>
          </div>
          <p className="footer-copy">© 2026 AI Study Hub. Được tạo ra với ❤️ cho sinh viên Việt Nam.</p>
        </div>
      </footer>
    </div>
  )
}
