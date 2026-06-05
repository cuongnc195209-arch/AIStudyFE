import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import './ForumPage.css'

/* ── Constants ── */
const CATEGORIES = ['Tất cả', 'Hỏi đáp', 'Thảo luận', 'Chia sẻ tài liệu', 'Thông báo']
const SUBJECTS    = ['Tất cả', 'Lập trình Web', 'Cơ sở dữ liệu', 'Trí tuệ nhân tạo', 'Mạng máy tính', 'Giải tích', 'Vật lý đại cương']
const HOT_TAGS    = ['OOP', 'SQL', 'React', 'AI', 'Đề thi', 'Slide', 'Thuật toán', 'Node.js', 'Docker', 'Git']

/* ── Mock data ── */
let postIdCounter = 6
const MOCK_COMMENTS = {
  1: [
    { id: 1, author: 'Trần Thị B', avatar: 'TB', content: 'Bạn có thể xem thêm ví dụ ở trang 45 giáo trình nhé!', likes: 3, liked: false, time: '1 giờ trước' },
    { id: 2, author: 'Lê Văn C', avatar: 'LC', content: 'Mình cũng đang học phần này, theo mình thì **Encapsulation** là quan trọng nhất để hiểu OOP.', likes: 1, liked: false, time: '45 phút trước' },
  ],
  2: [
    { id: 1, author: 'Phạm Thị D', avatar: 'PD', content: 'Cảm ơn bạn đã chia sẻ! Bộ slide này rất hữu ích cho bài thi giữa kỳ.', likes: 5, liked: false, time: '3 giờ trước' },
  ],
  3: [],
  4: [
    { id: 1, author: 'Nguyễn Văn E', avatar: 'NE', content: 'Mình nghĩ câu 3 phần B sẽ ra bài tập về JOIN và subquery đó.', likes: 2, liked: false, time: '1 ngày trước' },
  ],
  5: [],
}

const INITIAL_POSTS = [
  { id: 1, title: 'Giải thích sự khác nhau giữa Interface và Abstract Class trong Java?', category: 'Hỏi đáp', subject: 'Lập trình Web', author: 'Nguyễn Văn A', avatar: 'NA', content: 'Mình đang ôn tập OOP và bị mắc kẹt ở phần này. Interface và Abstract Class đều định nghĩa "hợp đồng" nhưng cách dùng khác nhau thế nào?\n\nMình đã đọc giáo trình nhưng vẫn chưa hiểu rõ lắm, mong mọi người giải thích thêm với ví dụ cụ thể nhé!', tags: ['OOP', 'Java', 'Interface'], likes: 12, liked: false, views: 84, time: '2 giờ trước', attachedDoc: null },
  { id: 2, title: 'Chia sẻ bộ slide CSDL chương 5 - Index & Query Optimization', category: 'Chia sẻ tài liệu', subject: 'Cơ sở dữ liệu', author: 'Trần Thị B', avatar: 'TB', content: 'Mình vừa tổng hợp lại slide chương 5 về Index và tối ưu hóa câu truy vấn. Hy vọng hữu ích cho các bạn đang ôn thi!\n\nSlide có đầy đủ:\n- Khái niệm Index\n- B-tree và Hash Index\n- Query Execution Plan\n- Các kỹ thuật tối ưu', tags: ['SQL', 'Index', 'Slide'], likes: 28, liked: true, views: 156, time: '5 giờ trước', attachedDoc: { name: 'Slide CSDL Chương 5', ext: 'PPT' } },
  { id: 3, title: 'Thuật toán A* có điểm gì khác với Dijkstra?', category: 'Hỏi đáp', subject: 'Trí tuệ nhân tạo', author: 'Lê Văn C', avatar: 'LC', content: 'Mình đang làm bài tập về search algorithms và không hiểu tại sao A* lại nhanh hơn Dijkstra trong nhiều trường hợp. Heuristic function ảnh hưởng thế nào đến hiệu suất?', tags: ['Thuật toán', 'AI', 'Search'], likes: 7, liked: false, views: 43, time: '1 ngày trước', attachedDoc: null },
  { id: 4, title: '[THẢO LUẬN] Đề thi giữa kỳ CSDL năm ngoái có gì?', category: 'Thảo luận', subject: 'Cơ sở dữ liệu', author: 'Phạm Thị D', avatar: 'PD', content: 'Mọi người có kinh nghiệm về đề thi CSDL không? Năm ngoái đề ra dạng bài gì nhiều nhất? Mình nghe nói phần normalization và transaction sẽ chiếm nhiều điểm.', tags: ['Đề thi', 'CSDL', 'Ôn tập'], likes: 15, liked: false, views: 203, time: '2 ngày trước', attachedDoc: null },
  { id: 5, title: 'Tài nguyên học React cho người mới bắt đầu', category: 'Chia sẻ tài liệu', subject: 'Lập trình Web', author: 'Nguyễn Thị E', avatar: 'NE', content: 'Tổng hợp các tài nguyên mình đã dùng khi mới học React:\n1. Official docs: react.dev\n2. Khoá học trên YouTube của Fireship\n3. Fullstack open 2024\n\nChúc mọi người học tốt!', tags: ['React', 'Frontend', 'Tài liệu'], likes: 34, liked: false, views: 289, time: '3 ngày trước', attachedDoc: null },
]

const DOC_EXT_COLOR = { PPT: '#f97316', PDF: '#ef4444', DOC: '#3b82f6', IMG: '#10b981' }
const CATEGORY_COLOR = { 'Hỏi đáp': '#3b82f6', 'Thảo luận': '#7c3aed', 'Chia sẻ tài liệu': '#059669', 'Thông báo': '#f59e0b' }

function timeAgo(t) { return t }

/* ── Create Post Modal ── */
function CreatePostModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ title: '', category: 'Hỏi đáp', subject: SUBJECTS[1], content: '', tags: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) return
    onSubmit({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--lg">
        <div className="modal-header">
          <h2>✍️ Tạo bài đăng mới</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="fg-full">
              <label>Tiêu đề <span className="required">*</span></label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Đặt câu hỏi hoặc tiêu đề bài viết..." required />
            </div>
            <div>
              <label>Danh mục</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label>Môn học</label>
              <select value={form.subject} onChange={e => set('subject', e.target.value)}>
                {SUBJECTS.slice(1).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="fg-full">
              <label>Nội dung <span className="required">*</span></label>
              <textarea value={form.content} onChange={e => set('content', e.target.value)} placeholder="Mô tả chi tiết câu hỏi hoặc nội dung bài viết..." rows={6} required />
            </div>
            <div className="fg-full">
              <label>Tag (cách bằng dấu phẩy)</label>
              <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="React, OOP, Đề thi..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-primary">📢 Đăng bài</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Post Detail Modal ── */
function PostDetail({ post, comments: initComments, onClose, onLikePost }) {
  const [comments, setComments] = useState(initComments)
  const [commentInput, setCommentInput] = useState('')

  function handleAddComment() {
    const text = commentInput.trim()
    if (!text) return
    setComments(c => [...c, { id: Date.now(), author: 'Nguyễn Văn A', avatar: 'NA', content: text, likes: 0, liked: false, time: 'Vừa xong' }])
    setCommentInput('')
  }

  function toggleLikeComment(id) {
    setComments(c => c.map(cm => cm.id === id ? { ...cm, liked: !cm.liked, likes: cm.liked ? cm.likes - 1 : cm.likes + 1 } : cm))
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--lg modal--post">
        <div className="modal-header">
          <div className="post-detail-cats">
            <span className="post-cat-badge" style={{ background: CATEGORY_COLOR[post.category] + '20', color: CATEGORY_COLOR[post.category] }}>{post.category}</span>
            <span className="post-subject-badge">{post.subject}</span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="post-detail-body">
          <h2 className="post-detail-title">{post.title}</h2>
          <div className="post-detail-meta">
            <div className="post-author-chip">
              <div className="author-avatar">{post.avatar}</div>
              <div>
                <p className="author-name">{post.author}</p>
                <p className="post-time">{post.time}</p>
              </div>
            </div>
            <div className="post-detail-stats">
              <span>👁️ {post.views}</span>
              <span>💬 {comments.length}</span>
            </div>
          </div>

          <div className="post-detail-content">
            {post.content.split('\n').map((line, i) => <p key={i} className="content-line">{line}</p>)}
          </div>

          {post.attachedDoc && (
            <div className="post-attached-doc">
              <div className="doc-ext-sm" style={{ background: DOC_EXT_COLOR[post.attachedDoc.ext] }}>{post.attachedDoc.ext}</div>
              <span>{post.attachedDoc.name}</span>
              <button className="doc-download-btn">⬇️ Tải xuống</button>
            </div>
          )}

          <div className="post-tags-row">
            {post.tags.map(t => <span key={t} className="tag">#{t}</span>)}
          </div>

          <div className="post-detail-actions">
            <button className={`action-btn${post.liked ? ' action-btn--active' : ''}`} onClick={() => onLikePost(post.id)}>
              ❤️ {post.liked ? 'Đã thích' : 'Thích'} ({post.likes})
            </button>
            <button className="action-btn">🔗 Chia sẻ</button>
            <button className="action-btn action-btn--report">🚩 Báo cáo</button>
          </div>

          {/* Comments */}
          <div className="comments-section">
            <h3 className="comments-title">Bình luận ({comments.length})</h3>

            {comments.length === 0 && (
              <p className="no-comments">Chưa có bình luận. Hãy là người đầu tiên!</p>
            )}

            {comments.map(cm => (
              <div key={cm.id} className="comment-item">
                <div className="comment-avatar">{cm.avatar}</div>
                <div className="comment-body">
                  <div className="comment-header">
                    <span className="comment-author">{cm.author}</span>
                    <span className="comment-time">{cm.time}</span>
                  </div>
                  <p className="comment-text">{cm.content}</p>
                  <button
                    className={`comment-like-btn${cm.liked ? ' liked' : ''}`}
                    onClick={() => toggleLikeComment(cm.id)}
                  >
                    ❤️ {cm.likes}
                  </button>
                </div>
              </div>
            ))}

            {/* Add comment */}
            <div className="add-comment">
              <div className="comment-avatar own-avatar">NA</div>
              <div className="comment-input-wrap">
                <textarea
                  className="comment-textarea"
                  rows={2}
                  placeholder="Viết bình luận... (Shift+Enter xuống dòng)"
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment() } }}
                />
                <button className="comment-send-btn" onClick={handleAddComment} disabled={!commentInput.trim()}>Gửi</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Post Card ── */
function PostCard({ post, onOpen, onLike }) {
  return (
    <div className="post-card" onClick={() => onOpen(post)}>
      <div className="post-card-top">
        <div className="post-cats">
          <span className="post-cat-badge" style={{ background: CATEGORY_COLOR[post.category] + '18', color: CATEGORY_COLOR[post.category] }}>{post.category}</span>
          <span className="post-subject-badge">{post.subject}</span>
        </div>
        <span className="post-time">{post.time}</span>
      </div>

      <h3 className="post-title">{post.title}</h3>
      <p className="post-excerpt">{post.content.slice(0, 120)}{post.content.length > 120 ? '...' : ''}</p>

      {post.attachedDoc && (
        <div className="post-doc-chip">
          <div className="doc-ext-xs" style={{ background: DOC_EXT_COLOR[post.attachedDoc.ext] }}>{post.attachedDoc.ext}</div>
          <span>{post.attachedDoc.name}</span>
        </div>
      )}

      <div className="post-tags-row">
        {post.tags.map(t => <span key={t} className="tag">#{t}</span>)}
      </div>

      <div className="post-card-footer">
        <div className="post-author">
          <div className="author-avatar author-avatar--sm">{post.avatar}</div>
          <span className="author-name-sm">{post.author}</span>
        </div>
        <div className="post-stats">
          <button
            className={`stat-btn${post.liked ? ' stat-btn--liked' : ''}`}
            onClick={e => { e.stopPropagation(); onLike(post.id) }}
          >
            ❤️ {post.likes}
          </button>
          <span className="stat-btn">💬 {(MOCK_COMMENTS[post.id] || []).length}</span>
          <span className="stat-btn">👁️ {post.views}</span>
        </div>
      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function ForumPage() {
  const [posts, setPosts] = useState(INITIAL_POSTS)
  const [comments, setComments] = useState(MOCK_COMMENTS)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Tất cả')
  const [activeSubject, setActiveSubject] = useState('Tất cả')
  const [sortBy, setSortBy] = useState('newest')
  const [showCreate, setShowCreate] = useState(false)
  const [detailPost, setDetailPost] = useState(null)

  function handleLike(id) {
    setPosts(ps => ps.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p))
  }

  function handleCreatePost(form) {
    postIdCounter++
    const newPost = {
      id: postIdCounter,
      title: form.title,
      category: form.category,
      subject: form.subject,
      content: form.content,
      tags: form.tags,
      author: 'Nguyễn Văn A',
      avatar: 'NA',
      likes: 0,
      liked: false,
      views: 0,
      time: 'Vừa xong',
      attachedDoc: null,
    }
    setPosts(ps => [newPost, ...ps])
    setComments(c => ({ ...c, [postIdCounter]: [] }))
    setShowCreate(false)
  }

  const sorted = [...posts]
    .filter(p => {
      const q = search.toLowerCase()
      const matchSearch = !q || p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q))
      const matchCat = activeCategory === 'Tất cả' || p.category === activeCategory
      const matchSubject = activeSubject === 'Tất cả' || p.subject === activeSubject
      return matchSearch && matchCat && matchSubject
    })
    .sort((a, b) => {
      if (sortBy === 'hot') return b.likes + b.views - (a.likes + a.views)
      return 0
    })

  return (
    <AppLayout>
      <div className="forum-page">
        {/* ── Header ── */}
        <div className="forum-header">
          <div>
            <h1 className="forum-title">Diễn đàn</h1>
            <p className="forum-sub">{posts.length} bài đăng · Trao đổi và học hỏi cùng nhau</p>
          </div>
          <button className="btn-primary btn-create-post" onClick={() => setShowCreate(true)}>
            ✍️ Tạo bài đăng
          </button>
        </div>

        <div className="forum-layout">
          {/* ── Main feed ── */}
          <div className="forum-feed">
            {/* Filter bar */}
            <div className="forum-toolbar">
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input className="search-input" type="text" placeholder="Tìm kiếm bài đăng..." value={search} onChange={e => setSearch(e.target.value)} />
                {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}
              </div>
              <select className="filter-select" value={activeSubject} onChange={e => setActiveSubject(e.target.value)}>
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
              <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="newest">Mới nhất</option>
                <option value="hot">Hot nhất</option>
              </select>
            </div>

            {/* Category tabs */}
            <div className="category-tabs">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  className={`cat-tab${activeCategory === c ? ' cat-tab--active' : ''}`}
                  onClick={() => setActiveCategory(c)}
                >
                  {c}
                  {c !== 'Tất cả' && <span className="cat-count">{posts.filter(p => p.category === c).length}</span>}
                </button>
              ))}
            </div>

            {/* Posts */}
            {sorted.length > 0 ? (
              <div className="posts-list">
                {sorted.map(post => (
                  <PostCard key={post.id} post={post} onOpen={setDetailPost} onLike={handleLike} />
                ))}
              </div>
            ) : (
              <div className="forum-empty">
                <div className="empty-icon">🗣️</div>
                <p className="empty-title">Không tìm thấy bài đăng nào</p>
                <p className="empty-sub">Thử thay đổi bộ lọc hoặc hãy là người đầu tiên đăng bài!</p>
                <button className="btn-primary" onClick={() => setShowCreate(true)}>✍️ Tạo bài đăng</button>
              </div>
            )}
          </div>

          {/* ── Right sidebar ── */}
          <aside className="forum-sidebar">
            <div className="sidebar-widget">
              <h3 className="widget-title">Danh mục</h3>
              <div className="widget-categories">
                {CATEGORIES.slice(1).map(c => (
                  <button
                    key={c}
                    className={`widget-cat-btn${activeCategory === c ? ' widget-cat-btn--active' : ''}`}
                    onClick={() => setActiveCategory(c === activeCategory ? 'Tất cả' : c)}
                  >
                    <span className="widget-cat-dot" style={{ background: CATEGORY_COLOR[c] }} />
                    {c}
                    <span className="widget-cat-count">{posts.filter(p => p.category === c).length}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="sidebar-widget">
              <h3 className="widget-title">Tag phổ biến</h3>
              <div className="hot-tags">
                {HOT_TAGS.map(t => (
                  <button key={t} className="hot-tag" onClick={() => setSearch(t)}>#{t}</button>
                ))}
              </div>
            </div>

            <div className="sidebar-widget widget-cta">
              <div className="cta-icon">💡</div>
              <h3>Có câu hỏi?</h3>
              <p>Đăng câu hỏi để nhận giải đáp từ cộng đồng sinh viên</p>
              <button className="btn-primary" onClick={() => setShowCreate(true)}>Đặt câu hỏi ngay</button>
            </div>

            <div className="sidebar-widget">
              <h3 className="widget-title">Thống kê diễn đàn</h3>
              <div className="forum-stats">
                <div className="forum-stat">
                  <span className="fstat-value">{posts.length}</span>
                  <span className="fstat-label">Bài đăng</span>
                </div>
                <div className="forum-stat">
                  <span className="fstat-value">{Object.values(comments).flat().length}</span>
                  <span className="fstat-label">Bình luận</span>
                </div>
                <div className="forum-stat">
                  <span className="fstat-value">128</span>
                  <span className="fstat-label">Thành viên</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} onSubmit={handleCreatePost} />}
      {detailPost && (
        <PostDetail
          post={posts.find(p => p.id === detailPost.id)}
          comments={comments[detailPost.id] || []}
          onClose={() => setDetailPost(null)}
          onLikePost={handleLike}
        />
      )}
    </AppLayout>
  )
}
