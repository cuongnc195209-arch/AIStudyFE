import { useNavigate } from 'react-router-dom'
import './HomePage.css'

function HomePage() {
  const navigate = useNavigate()

  const handleNavigateToLogin = () => {
    navigate('/login')
  }

  return (
    <div className="landing-page">
      <header className="header-bar">
        <div className="header-content">
          <div className="brand-row">
            <div className="brand-icon">📄</div>
            <span className="brand-name">AI Study Hub</span>
          </div>

          <nav className="nav-links">
            <button type="button">Tính năng</button>
            <button type="button">Lịch sử</button>
            <button type="button">Về chúng tôi</button>
          </nav>

          <button className="header-cta" type="button" onClick={handleNavigateToLogin}>
            Bắt đầu miễn phí
          </button>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <div className="hero-pill">
              <span className="hero-pill-icon">✨</span>
              Hệ thống quản lý tài liệu hiện đại
            </div>

            <h1>
              Nâng Tầm Kết Quả Học Tập
              <br />
              <span className="hero-highlight">Với Hệ Thống AI Study Hub</span>
            </h1>

            <p className="hero-description">
              Tất cả tài liệu học tập trong tầm tay của bạn. Lưu trữ Cloud, tìm kiếm thông minh và hỏi chatbot trợ lý với AI để giải đáp mọi thắc mắc.
            </p>
            <div className="hero-actions">
              <button className="primary-btn" type="button" onClick={handleNavigateToLogin}>
                Thử Nghiệm Miễn Phí <span className="arrow">→</span>
              </button>
            </div>
          </div>

          <div className="hero-panel">
            <div className="upload-card">
              <div className="upload-header">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
                <span className="upload-label">Tải tài liệu lên</span>
              </div>
              <div className="upload-list">
                <div className="upload-item">
                  <div className="upload-icon blue">W</div>
                  <div>
                    <p className="upload-title">Lập trình Web</p>
                    <p className="upload-subtitle">Bài giảng lý thuyết</p>
                  </div>
                  <span className="check">✓</span>
                </div>
                <div className="upload-item">
                  <div className="upload-icon purple">D</div>
                  <div>
                    <p className="upload-title">Cơ sở dữ liệu</p>
                    <p className="upload-subtitle">Slide thuyết trình</p>
                  </div>
                  <span className="check">✓</span>
                </div>
                <div className="upload-item">
                  <div className="upload-icon orange">AI</div>
                  <div>
                    <p className="upload-title">Trí tuệ nhân tạo</p>
                    <p className="upload-subtitle">Bài tập thực hành</p>
                  </div>
                  <span className="check">✓</span>
                </div>
              </div>
            </div>

            <div className="chat-card">
              <div className="chat-header">
                <div className="chat-icon">💬</div>
                <span>Hỏi đáp AI</span>
              </div>
              <div className="chat-box">
                <p className="chat-question">Giải thích khái niệm OOP trong lập trình?</p>
              </div>
              <div className="chat-answer">
                <p>
                  OOP (Object-Oriented Programming) là phương pháp lập trình hướng đối tượng, tổ chức code xung quanh các đối tượng thay vì logic...
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="feature-section">
          <h2>Mọi thứ bạn cần để bứt phá học tập</h2>
          <p>Đầy đủ tính năng giúp bạn quản lý tài liệu hiệu quả và học tập thông minh hơn</p>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon blue">📚</div>
              <h3>Lưu Trữ Tập Trung</h3>
              <p>Upload và lưu trữ tài liệu trên cloud. Truy cập mọi lúc mọi nơi từ bất kỳ thiết bị nào.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon purple">🔍</div>
              <h3>Tìm Kiếm Siêu Tốc</h3>
              <p>Tìm kiếm tài liệu nhanh chóng theo tên, môn học, nội dung. Tìm thấy ngay lập tức.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon pink">💬</div>
              <h3>Hỏi Đáp AI Chatbot</h3>
              <p>Hỏi AI về nội dung tài liệu, giải thích khái niệm khó hiểu. AI trợ lý luôn sẵn sàng.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon cyan">🗂️</div>
              <h3>Phân Loại Tự Động</h3>
              <p>Hệ thống tự động phân loại tài liệu theo môn học và chủ đề một cách thông minh.</p>
            </div>
          </div>
        </section>

        <section className="problem-section">
          <div className="problem-copy">
            <h2>Giải từ nỗi lo thất lạc tài liệu giáo trình</h2>
            <ul className="problem-list">
              <li className="problem-item">
                <span className="problem-icon">✓</span>
                <span>Tài liệu nằm rải rác nhiều nơi (Drive, USB, Facebook...)</span>
              </li>
              <li className="problem-item">
                <span className="problem-icon">✓</span>
                <span>Thường xuyên bị mất tài liệu quan trọng</span>
              </li>
              <li className="problem-item">
                <span className="problem-icon">✓</span>
                <span>Tìm kiếm mất nhiều thời gian và công sức</span>
              </li>
              <li className="problem-item">
                <span className="problem-icon">✓</span>
                <span>Không có hệ thống quản lý tài liệu rõ ràng</span>
              </li>
              <li className="problem-item">
                <span className="problem-icon">✓</span>
                <span>Dung lượng lưu trữ máy cá nhân bị hạn chế</span>
              </li>
            </ul>
            <button className="primary-btn problem-cta" type="button" onClick={handleNavigateToLogin}>Bắt đầu sử dụng ngay</button>
          </div>
          <div className="problem-quote">
            <div className="quote-icon">⚡</div>
            <p className="quote-title">"Bạn không thể hỏi USB, nhưng bạn có thể hỏi AI Study Hub."</p>
            <p className="quote-text">
              Thay vì lưu tài liệu rải rác, tập trung mọi thứ vào một nơi. Hỏi AI bất cứ lúc nào, nhận câu trả lời ngay lập tức.
            </p>
          </div>
        </section>

        <section className="cta-section">
          <div className="cta-box">
            <h2>Sẵn sàng nâng tầm học tập của bạn?</h2>
            <p>Tham gia cùng hàng nghìn sinh viên đang sử dụng AI Study Hub</p>
            <button className="cta-button" type="button" onClick={handleNavigateToLogin}>Bắt đầu miễn phí ngay</button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default HomePage
