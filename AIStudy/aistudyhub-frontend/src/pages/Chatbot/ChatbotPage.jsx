import { useState, useRef, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import './ChatbotPage.css'

/* ── Mock docs (giống DocumentsPage) ── */
const MOCK_DOCS = [
  { id: 1, name: 'Giáo trình Lập trình Web', ext: 'PDF', subject: 'Lập trình Web' },
  { id: 2, name: 'Slide CSDL Chương 5', ext: 'PPT', subject: 'Cơ sở dữ liệu' },
  { id: 3, name: 'Bài tập Trí tuệ nhân tạo', ext: 'DOC', subject: 'Trí tuệ nhân tạo' },
  { id: 4, name: 'Đề thi HK2 - Mạng máy tính', ext: 'PDF', subject: 'Mạng máy tính' },
  { id: 5, name: 'Tóm tắt Giải tích 1', ext: 'PDF', subject: 'Giải tích' },
]

const EXT_COLOR = { PDF: '#ef4444', PPT: '#f97316', DOC: '#3b82f6', IMG: '#10b981' }

/* ── Simulated AI replies ── */
const AI_REPLIES = [
  (q) => `Đây là câu trả lời dựa trên tài liệu bạn đã chọn.\n\nVề câu hỏi **"${q}"**, tôi tìm thấy các thông tin liên quan sau:\n\n- Khái niệm được định nghĩa rõ ở **Chương 2**, trang 45\n- Có ví dụ minh họa cụ thể ở phần bài tập\n- Nội dung liên quan thêm ở phần tóm tắt cuối chương\n\nBạn có muốn tôi giải thích sâu hơn về phần nào không?`,
  () => `Tôi đã phân tích nội dung tài liệu và tìm thấy thông tin liên quan.\n\nKết quả:\n1. **Định nghĩa cốt lõi**: Được trình bày chi tiết trong tài liệu\n2. **Ví dụ thực tế**: Có 3 ví dụ minh họa\n3. **Bài tập thực hành**: Trang 78–82\n\n> Trích dẫn từ tài liệu: *"Đây là đoạn trích quan trọng liên quan đến câu hỏi của bạn"*\n\nHỏi thêm nếu bạn cần giải thích chi tiết hơn!`,
  () => `Tôi không tìm thấy thông tin chính xác về điều này trong tài liệu đã chọn. Tuy nhiên, dựa trên kiến thức chung:\n\n- Đây là một khái niệm phổ biến trong lĩnh vực này\n- Bạn có thể tham khảo thêm ở các tài liệu khác\n\nBạn có muốn tôi tìm kiếm trong tài liệu khác không?`,
]

let replyIdx = 0
function fakeReply(q) {
  const reply = AI_REPLIES[replyIdx % AI_REPLIES.length](q)
  replyIdx++
  return reply
}

/* ── Helpers ── */
let sessionCounter = 3
function newSession(docs = []) {
  sessionCounter++
  return {
    id: sessionCounter,
    name: `Phiên chat ${sessionCounter}`,
    docs,
    messages: [],
    updatedAt: new Date().toISOString(),
  }
}

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000)
  if (diff < 1) return 'Vừa xong'
  if (diff < 60) return `${diff} phút trước`
  if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`
  return `${Math.floor(diff / 1440)} ngày trước`
}

/* ── Doc Picker Modal ── */
function DocPicker({ selected, onClose, onConfirm }) {
  const [search, setSearch] = useState('')
  const [picked, setPicked] = useState(selected.map(d => d.id))

  const filtered = MOCK_DOCS.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.subject.toLowerCase().includes(search.toLowerCase())
  )

  function toggle(id) {
    setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Chọn tài liệu để hỏi</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <input
            className="picker-search"
            placeholder="Tìm tài liệu..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          <div className="picker-list">
            {filtered.map(doc => (
              <label key={doc.id} className={`picker-item${picked.includes(doc.id) ? ' picked' : ''}`}>
                <input
                  type="checkbox"
                  checked={picked.includes(doc.id)}
                  onChange={() => toggle(doc.id)}
                />
                <div className="picker-ext" style={{ background: EXT_COLOR[doc.ext] }}>{doc.ext}</div>
                <div className="picker-info">
                  <p className="picker-name">{doc.name}</p>
                  <p className="picker-subject">{doc.subject}</p>
                </div>
                {picked.includes(doc.id) && <span className="picker-check">✓</span>}
              </label>
            ))}
          </div>
          {picked.length > 0 && (
            <p className="picker-selected-count">Đã chọn {picked.length} tài liệu</p>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Hủy</button>
          <button
            className="btn-primary"
            onClick={() => onConfirm(MOCK_DOCS.filter(d => picked.includes(d.id)))}
            disabled={picked.length === 0}
          >
            Xác nhận ({picked.length})
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Message bubble ── */
function Message({ msg }) {
  const isUser = msg.role === 'user'
  /* Minimal markdown: **bold**, newlines → <br> */
  function renderText(text) {
    return text
      .split('\n')
      .map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/)
        return (
          <span key={i}>
            {parts.map((p, j) =>
              p.startsWith('**') && p.endsWith('**')
                ? <strong key={j}>{p.slice(2, -2)}</strong>
                : p.startsWith('> ')
                  ? <blockquote key={j}>{p.slice(2)}</blockquote>
                  : <span key={j}>{p}</span>
            )}
            {i < text.split('\n').length - 1 && <br />}
          </span>
        )
      })
  }

  return (
    <div className={`msg-row ${isUser ? 'msg-row--user' : 'msg-row--ai'}`}>
      {!isUser && <div className="msg-avatar ai-avatar">AI</div>}
      <div className={`msg-bubble ${isUser ? 'bubble-user' : 'bubble-ai'}`}>
        {renderText(msg.content)}
      </div>
      {isUser && <div className="msg-avatar user-avatar">NA</div>}
    </div>
  )
}

/* ── Typing indicator ── */
function TypingIndicator() {
  return (
    <div className="msg-row msg-row--ai">
      <div className="msg-avatar ai-avatar">AI</div>
      <div className="msg-bubble bubble-ai typing-bubble">
        <span className="dot" /><span className="dot" /><span className="dot" />
      </div>
    </div>
  )
}

/* ── Main Page ── */
const INITIAL_SESSIONS = [
  {
    id: 1, name: 'Hỏi về OOP và SOLID',
    docs: [MOCK_DOCS[0]],
    messages: [
      { id: 1, role: 'user', content: 'Giải thích khái niệm OOP trong lập trình?' },
      { id: 2, role: 'ai', content: 'OOP (Object-Oriented Programming) là phương pháp lập trình hướng đối tượng, tổ chức code xung quanh **các đối tượng** thay vì logic tuần tự.\n\nCó 4 tính chất cốt lõi:\n1. **Encapsulation** – đóng gói dữ liệu\n2. **Inheritance** – kế thừa\n3. **Polymorphism** – đa hình\n4. **Abstraction** – trừu tượng hóa' },
    ],
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 2, name: 'Câu lệnh SQL tối ưu',
    docs: [MOCK_DOCS[1]],
    messages: [
      { id: 1, role: 'user', content: 'Cách tối ưu hóa câu lệnh SQL JOIN?' },
      { id: 2, role: 'ai', content: 'Để tối ưu SQL JOIN, bạn cần chú ý:\n\n- **Index** các cột dùng trong điều kiện JOIN\n- Ưu tiên **INNER JOIN** trước LEFT/RIGHT JOIN\n- Tránh SELECT *, chỉ lấy cột cần thiết' },
    ],
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
]

export default function ChatbotPage() {
  const [sessions, setSessions] = useState(INITIAL_SESSIONS)
  const [activeId, setActiveId] = useState(1)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDocPicker, setShowDocPicker] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [editingName, setEditingName] = useState(null)
  const [tempName, setTempName] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const activeSession = sessions.find(s => s.id === activeId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeSession?.messages, loading])

  function handleNewSession() {
    const s = newSession()
    setSessions(prev => [s, ...prev])
    setActiveId(s.id)
    setShowDocPicker(true)
  }

  function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    if (!activeSession?.docs.length) { setShowDocPicker(true); return }

    const userMsg = { id: Date.now(), role: 'user', content: text }
    setSessions(prev => prev.map(s =>
      s.id === activeId
        ? { ...s, messages: [...s.messages, userMsg], updatedAt: new Date().toISOString() }
        : s
    ))
    setInput('')
    setLoading(true)

    setTimeout(() => {
      const aiMsg = { id: Date.now() + 1, role: 'ai', content: fakeReply(text) }
      setSessions(prev => prev.map(s =>
        s.id === activeId
          ? { ...s, messages: [...s.messages, aiMsg], updatedAt: new Date().toISOString() }
          : s
      ))
      setLoading(false)
    }, 1400 + Math.random() * 600)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  function handleDocConfirm(docs) {
    setSessions(prev => prev.map(s => s.id === activeId ? { ...s, docs } : s))
    setShowDocPicker(false)
    inputRef.current?.focus()
  }

  function handleDeleteSession(id) {
    const remaining = sessions.filter(s => s.id !== id)
    setSessions(remaining)
    if (activeId === id) setActiveId(remaining[0]?.id ?? null)
  }

  function startRename(s) { setEditingName(s.id); setTempName(s.name) }

  function confirmRename(id) {
    if (tempName.trim()) setSessions(prev => prev.map(s => s.id === id ? { ...s, name: tempName.trim() } : s))
    setEditingName(null)
  }

  const SUGGESTIONS = ['Tóm tắt nội dung chính của tài liệu?', 'Giải thích khái niệm khó nhất trong chương này?', 'Cho tôi ví dụ minh họa?', 'Liệt kê các điểm quan trọng cần nhớ?']

  return (
    <AppLayout>
      <div className="chat-page">
        {/* ── Session Sidebar ── */}
        <aside className={`chat-sidebar${sidebarOpen ? '' : ' chat-sidebar--closed'}`}>
          <div className="chat-sidebar-head">
            <button className="new-session-btn" onClick={handleNewSession}>＋ Chat mới</button>
            <button className="sidebar-collapse-btn" onClick={() => setSidebarOpen(p => !p)} title="Thu gọn">‹</button>
          </div>

          <p className="sessions-label">Lịch sử ({sessions.length})</p>

          <div className="sessions-list">
            {sessions.map(s => (
              <div
                key={s.id}
                className={`session-item${s.id === activeId ? ' session-item--active' : ''}`}
                onClick={() => setActiveId(s.id)}
              >
                <div className="session-icon">💬</div>
                <div className="session-info">
                  {editingName === s.id ? (
                    <input
                      className="session-name-input"
                      value={tempName}
                      onChange={e => setTempName(e.target.value)}
                      onBlur={() => confirmRename(s.id)}
                      onKeyDown={e => e.key === 'Enter' && confirmRename(s.id)}
                      autoFocus
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <p className="session-name">{s.name}</p>
                  )}
                  <p className="session-meta">{s.docs.length > 0 ? s.docs.map(d => d.name).join(', ') : 'Chưa chọn tài liệu'}</p>
                  <p className="session-time">{timeAgo(s.updatedAt)}</p>
                </div>
                <div className="session-actions" onClick={e => e.stopPropagation()}>
                  <button className="sess-act-btn" title="Đổi tên" onClick={() => startRename(s)}>✏️</button>
                  <button className="sess-act-btn sess-act-btn--del" title="Xóa" onClick={() => handleDeleteSession(s.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Sidebar collapsed toggle ── */}
        {!sidebarOpen && (
          <button className="sidebar-expand-btn" onClick={() => setSidebarOpen(true)} title="Mở rộng">›</button>
        )}

        {/* ── Chat Area ── */}
        <div className="chat-main">
          {activeSession ? (
            <>
              {/* Top bar */}
              <div className="chat-topbar">
                <div className="chat-topbar-left">
                  <h2 className="chat-session-title">{activeSession.name}</h2>
                  <p className="chat-session-count">{activeSession.messages.length} tin nhắn</p>
                </div>
                <div className="chat-topbar-docs">
                  {activeSession.docs.length > 0 ? (
                    <>
                      <span className="docs-chip-label">📄 Tài liệu:</span>
                      {activeSession.docs.map(d => (
                        <span key={d.id} className="doc-chip">
                          <span className="doc-chip-ext" style={{ background: EXT_COLOR[d.ext] }}>{d.ext}</span>
                          {d.name}
                        </span>
                      ))}
                      <button className="change-docs-btn" onClick={() => setShowDocPicker(true)}>Đổi</button>
                    </>
                  ) : (
                    <button className="select-docs-btn" onClick={() => setShowDocPicker(true)}>📂 Chọn tài liệu để bắt đầu</button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="messages-area">
                {activeSession.messages.length === 0 && (
                  <div className="chat-welcome">
                    <div className="welcome-icon">🤖</div>
                    <h3>Xin chào! Tôi là AI Study Assistant</h3>
                    <p>
                      {activeSession.docs.length > 0
                        ? `Tôi đã sẵn sàng trả lời câu hỏi về ${activeSession.docs.map(d => d.name).join(', ')}.`
                        : 'Hãy chọn tài liệu trước, sau đó đặt câu hỏi để tôi hỗ trợ bạn học tập.'}
                    </p>
                    {activeSession.docs.length > 0 && (
                      <div className="suggestions">
                        <p className="suggestions-label">Gợi ý câu hỏi:</p>
                        <div className="suggestion-list">
                          {SUGGESTIONS.map(s => (
                            <button key={s} className="suggestion-btn" onClick={() => { setInput(s); inputRef.current?.focus() }}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {activeSession.messages.map(msg => <Message key={msg.id} msg={msg} />)}
                {loading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="chat-input-area">
                {activeSession.docs.length === 0 && (
                  <div className="no-doc-warning">
                    ⚠️ Chưa chọn tài liệu —{' '}
                    <button className="warning-link" onClick={() => setShowDocPicker(true)}>chọn tài liệu ngay</button>
                  </div>
                )}
                <div className="input-row">
                  <textarea
                    ref={inputRef}
                    className="chat-textarea"
                    rows={1}
                    placeholder={activeSession.docs.length > 0 ? 'Hỏi về nội dung tài liệu... (Enter để gửi, Shift+Enter xuống dòng)' : 'Chọn tài liệu trước khi đặt câu hỏi'}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                  />
                  <button
                    className={`send-btn${(!input.trim() || loading) ? ' send-btn--disabled' : ''}`}
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    title="Gửi (Enter)"
                  >
                    {loading ? '⏳' : '➤'}
                  </button>
                </div>
                <p className="input-hint">AI có thể mắc lỗi. Hãy kiểm tra lại thông tin quan trọng.</p>
              </div>
            </>
          ) : (
            <div className="chat-no-session">
              <div className="no-session-icon">💬</div>
              <h3>Chưa có phiên chat nào</h3>
              <p>Tạo phiên chat mới để bắt đầu hỏi đáp với AI</p>
              <button className="btn-primary" onClick={handleNewSession}>＋ Tạo chat mới</button>
            </div>
          )}
        </div>
      </div>

      {showDocPicker && activeSession && (
        <DocPicker
          selected={activeSession.docs}
          onClose={() => setShowDocPicker(false)}
          onConfirm={handleDocConfirm}
        />
      )}
    </AppLayout>
  )
}
