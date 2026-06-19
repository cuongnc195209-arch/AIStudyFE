import { useState, useRef, useEffect } from "react";
import AppLayout from "../../components/layout/AppLayout";
import {
  startChatSession,
  sendMessage as sendChatMessage,
  getChatHistory,
  updateSessionDocuments,
} from "../../apis/chatbotApi";
import { getDocuments } from "../../apis/documentApi";
import "./ChatbotPage.css";

const EXT_COLOR = {
  PDF: "#ef4444",
  PPT: "#f97316",
  DOC: "#3b82f6",
  DOCX: "#3b82f6",
  IMG: "#10b981",
};

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (diff < 1) return "Vừa xong";
  if (diff < 60) return `${diff} phút trước`;
  if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`;
  return `${Math.floor(diff / 1440)} ngày trước`;
}

/* ── Doc Picker Modal ── */
function DocPicker({ allDocs, selected, onClose, onConfirm }) {
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState(selected.map((d) => d.id));

  const filtered = allDocs.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.subject || "").toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id) {
    setPicked((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
    );
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-header">
          <h2>Chọn tài liệu để hỏi</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <input
            className="picker-search"
            placeholder="Tìm tài liệu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="picker-list">
            {filtered.length === 0 && (
              <p style={{ textAlign: "center", color: "#888", padding: 16 }}>
                Không có tài liệu nào
              </p>
            )}
            {filtered.map((doc) => (
              <label
                key={doc.id}
                className={`picker-item${picked.includes(doc.id) ? " picked" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={picked.includes(doc.id)}
                  onChange={() => toggle(doc.id)}
                />
                <div
                  className="picker-ext"
                  style={{
                    background: EXT_COLOR[doc.ext] || EXT_COLOR.PDF,
                  }}
                >
                  {doc.ext}
                </div>
                <div className="picker-info">
                  <p className="picker-name">{doc.name}</p>
                  <p className="picker-subject">{doc.subject || ""}</p>
                </div>
                {picked.includes(doc.id) && (
                  <span className="picker-check">✓</span>
                )}
              </label>
            ))}
          </div>
          {picked.length > 0 && (
            <p className="picker-selected-count">
              Đã chọn {picked.length} tài liệu
            </p>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Hủy
          </button>
          <button
            className="btn-primary"
            onClick={() =>
              onConfirm(allDocs.filter((d) => picked.includes(d.id)))
            }
            disabled={picked.length === 0}
          >
            Xác nhận ({picked.length})
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Message bubble ── */
function Message({ msg }) {
  const isUser = msg.role === "user";

  function renderText(text) {
    return text.split("\n").map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/);
      return (
        <span key={i}>
          {parts.map((p, j) =>
            p.startsWith("**") && p.endsWith("**") ? (
              <strong key={j}>{p.slice(2, -2)}</strong>
            ) : p.startsWith("> ") ? (
              <blockquote key={j}>{p.slice(2)}</blockquote>
            ) : (
              <span key={j}>{p}</span>
            )
          )}
          {i < text.split("\n").length - 1 && <br />}
        </span>
      );
    });
  }

  return (
    <div className={`msg-row ${isUser ? "msg-row--user" : "msg-row--ai"}`}>
      {!isUser && <div className="msg-avatar ai-avatar">AI</div>}
      <div className={`msg-bubble ${isUser ? "bubble-user" : "bubble-ai"}`}>
        {renderText(msg.content)}
      </div>
      {isUser && <div className="msg-avatar user-avatar">NA</div>}
    </div>
  );
}

/* ── Typing indicator ── */
function TypingIndicator() {
  return (
    <div className="msg-row msg-row--ai">
      <div className="msg-avatar ai-avatar">AI</div>
      <div className="msg-bubble bubble-ai typing-bubble">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function ChatbotPage() {
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDocPicker, setShowDocPicker] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingName, setEditingName] = useState(null);
  const [tempName, setTempName] = useState("");
  const [allDocs, setAllDocs] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const activeSession = sessions.find((s) => s.id === activeId);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, loading]);

  async function loadDocuments() {
    try {
      const result = await getDocuments();
      const docs = (result?.data || result || []).map((d) => ({
        id: d.documentId || d.id,
        name: d.documentName || d.name || "Untitled",
        ext: (d.fileType || "PDF").toUpperCase(),
        subject: d.subject || "",
      }));
      setAllDocs(docs);
    } catch (err) {
      console.error("Load docs error:", err);
    }
  }

  async function handleNewSession() {
    try {
      const result = await startChatSession([]);
      const session = result?.data || result || {};
      const newSess = {
        id: session.sessionId || session.id || Date.now(),
        name: `Chat ${sessions.length + 1}`,
        docs: [],
        messages: [],
        updatedAt: new Date().toISOString(),
      };
      setSessions((prev) => [newSess, ...prev]);
      setActiveId(newSess.id);
    } catch (err) {
      console.error("Start session error:", err);
      const newSess = {
        id: Date.now(),
        name: `Chat ${sessions.length + 1}`,
        docs: [],
        messages: [],
        updatedAt: new Date().toISOString(),
      };
      setSessions((prev) => [newSess, ...prev]);
      setActiveId(newSess.id);
    }
    inputRef.current?.focus();
  }

  async function handleDocConfirm(docs) {
    setShowDocPicker(false);

    if (activeSession) {
      try {
        await updateSessionDocuments(
          activeSession.id,
          docs.map((d) => d.id)
        );
      } catch (err) {
        console.error("Update session docs error:", err);
      }
      setSessions((prev) =>
        prev.map((s) => (s.id === activeId ? { ...s, docs } : s))
      );
      inputRef.current?.focus();
      return;
    }

    try {
      const result = await startChatSession(docs.map((d) => d.id));
      const session = result?.data || result || {};
      const newSess = {
        id: session.sessionId || session.id,
        name: `Chat ${sessions.length + 1}`,
        docs,
        messages: [],
        updatedAt: new Date().toISOString(),
      };
      setSessions((prev) => [newSess, ...prev]);
      setActiveId(newSess.id);
    } catch (err) {
      console.error("Start session error:", err);
    }
    inputRef.current?.focus();
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { id: Date.now(), role: "user", content: text };
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeId
          ? {
              ...s,
              messages: [...s.messages, userMsg],
              updatedAt: new Date().toISOString(),
            }
          : s
      )
    );
    setInput("");
    setLoading(true);

    try {
      const result = await sendChatMessage(activeId, text);
      const data = result?.data || result || {};
      const aiContent =
        data.reply || data.message || data.content || data.answer || "...";
      const aiMsg = { id: Date.now() + 1, role: "ai", content: aiContent };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeId
            ? {
                ...s,
                messages: [...s.messages, aiMsg],
                updatedAt: new Date().toISOString(),
              }
            : s
        )
      );
    } catch (err) {
      console.error("Send message error:", err);
      const errMsg = {
        id: Date.now() + 1,
        role: "ai",
        content: "Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại.",
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeId
            ? { ...s, messages: [...s.messages, errMsg] }
            : s
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleDeleteSession(id) {
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    if (activeId === id) setActiveId(remaining[0]?.id ?? null);
  }

  function startRename(s) {
    setEditingName(s.id);
    setTempName(s.name);
  }

  function confirmRename(id) {
    if (tempName.trim())
      setSessions((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, name: tempName.trim() } : s
        )
      );
    setEditingName(null);
  }

  const SUGGESTIONS = [
    "Tóm tắt nội dung chính của tài liệu?",
    "Giải thích khái niệm khó nhất trong chương này?",
    "Cho tôi ví dụ minh họa?",
    "Liệt kê các điểm quan trọng cần nhớ?",
  ];

  return (
    <AppLayout>
      <div className="chat-page">
        {/* ── Session Sidebar ── */}
        <aside
          className={`chat-sidebar${sidebarOpen ? "" : " chat-sidebar--closed"}`}
        >
          <div className="chat-sidebar-head">
            <button className="new-session-btn" onClick={handleNewSession}>
              ＋ Chat mới
            </button>
            <button
              className="sidebar-collapse-btn"
              onClick={() => setSidebarOpen((p) => !p)}
              title="Thu gọn"
            >
              ‹
            </button>
          </div>

          <p className="sessions-label">Lịch sử ({sessions.length})</p>

          <div className="sessions-list">
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`session-item${s.id === activeId ? " session-item--active" : ""}`}
                onClick={() => setActiveId(s.id)}
              >
                <div className="session-icon">💬</div>
                <div className="session-info">
                  {editingName === s.id ? (
                    <input
                      className="session-name-input"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onBlur={() => confirmRename(s.id)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && confirmRename(s.id)
                      }
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <p className="session-name">{s.name}</p>
                  )}
                  <p className="session-meta">
                    {s.docs.length > 0
                      ? s.docs.map((d) => d.name).join(", ")
                      : "Chưa chọn tài liệu"}
                  </p>
                  <p className="session-time">{timeAgo(s.updatedAt)}</p>
                </div>
                <div
                  className="session-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="sess-act-btn"
                    title="Đổi tên"
                    onClick={() => startRename(s)}
                  >
                    ✏️
                  </button>
                  <button
                    className="sess-act-btn sess-act-btn--del"
                    title="Xóa"
                    onClick={() => handleDeleteSession(s.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Sidebar collapsed toggle ── */}
        {!sidebarOpen && (
          <button
            className="sidebar-expand-btn"
            onClick={() => setSidebarOpen(true)}
            title="Mở rộng"
          >
            ›
          </button>
        )}

        {/* ── Chat Area ── */}
        <div className="chat-main">
          {activeSession ? (
            <>
              {/* Top bar */}
              <div className="chat-topbar">
                <div className="chat-topbar-left">
                  <h2 className="chat-session-title">
                    {activeSession.name}
                  </h2>
                  <p className="chat-session-count">
                    {activeSession.messages.length} tin nhắn
                  </p>
                </div>
                <div className="chat-topbar-docs">
                  {activeSession.docs.length > 0 ? (
                    <>
                      <span className="docs-chip-label">📄 Tài liệu:</span>
                      {activeSession.docs.map((d) => (
                        <span key={d.id} className="doc-chip">
                          <span
                            className="doc-chip-ext"
                            style={{
                              background: EXT_COLOR[d.ext] || EXT_COLOR.PDF,
                            }}
                          >
                            {d.ext}
                          </span>
                          {d.name}
                        </span>
                      ))}
                      <button
                        className="change-docs-btn"
                        onClick={() => setShowDocPicker(true)}
                      >
                        Đổi
                      </button>
                    </>
                  ) : (
                    <button
                      className="select-docs-btn"
                      onClick={() => setShowDocPicker(true)}
                    >
                      📂 Chọn tài liệu để bắt đầu
                    </button>
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
                        ? `Tôi đã sẵn sàng trả lời câu hỏi về ${activeSession.docs.map((d) => d.name).join(", ")}.`
                        : "Hãy đặt câu hỏi để tôi hỗ trợ bạn học tập. Bạn cũng có thể chọn tài liệu để hỏi đáp chính xác hơn."}
                    </p>
                    <div className="suggestions">
                      <p className="suggestions-label">Gợi ý câu hỏi:</p>
                      <div className="suggestion-list">
                        {SUGGESTIONS.map((s) => (
                          <button
                            key={s}
                            className="suggestion-btn"
                            onClick={() => {
                              setInput(s);
                              inputRef.current?.focus();
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {activeSession.messages.map((msg) => (
                  <Message key={msg.id} msg={msg} />
                ))}
                {loading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="chat-input-area">
                <div className="input-row">
                  <textarea
                    ref={inputRef}
                    className="chat-textarea"
                    rows={1}
                    placeholder="Đặt câu hỏi... (Enter để gửi, Shift+Enter xuống dòng)"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                  />
                  <button
                    className={`send-btn${!input.trim() || loading ? " send-btn--disabled" : ""}`}
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    title="Gửi (Enter)"
                  >
                    {loading ? "⏳" : "➤"}
                  </button>
                </div>
                <p className="input-hint">
                  AI có thể mắc lỗi. Hãy kiểm tra lại thông tin quan trọng.
                </p>
              </div>
            </>
          ) : (
            <div className="chat-no-session">
              <div className="no-session-icon">💬</div>
              <h3>Chưa có phiên chat nào</h3>
              <p>Tạo phiên chat mới để bắt đầu hỏi đáp với AI</p>
              <button className="btn-primary" onClick={handleNewSession}>
                ＋ Tạo chat mới
              </button>
            </div>
          )}
        </div>
      </div>

      {showDocPicker && (
        <DocPicker
          allDocs={allDocs}
          selected={activeSession?.docs || []}
          onClose={() => setShowDocPicker(false)}
          onConfirm={handleDocConfirm}
        />
      )}
    </AppLayout>
  );
}
