import { useState, useRef, useEffect } from "react";
import AppLayout from "../../components/layout/AppLayout";
import {
  startChatSession,
  sendChatMessage,
  getChatHistory,
  updateSessionDocuments,
} from "../../apis/chatbotApi";
import { getDocuments } from "../../apis/documentApi";
import { getCurrentUser } from "../../apis/api";
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
// Modal chọn tài liệu để "ghim" vào phiên chat — AI sẽ trả lời dựa trên nội dung các tài liệu này
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
// 1 bong bóng chat — tự parse Markdown đơn giản (**in đậm**, dòng bắt đầu bằng "> " thành blockquote)
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
// Danh sách phiên chat (tên, tài liệu ghim, tin nhắn) chỉ lưu ở localStorage —
// không có API backend để list lại các session cũ, nên mất nếu xoá localStorage/đổi trình duyệt.
// Key phải gắn theo user hiện tại, nếu không tài khoản khác đăng nhập cùng trình duyệt
// sẽ đọc thấy chung 1 danh sách chat của nhau.
function getSessionsStorageKey() {
  const user = getCurrentUser();
  const userKey = user?.id || user?.userId || user?.email || "guest";
  return `chatSessions_${userKey}`;
}

function loadSessionsFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(getSessionsStorageKey())) || [];
  } catch {
    return [];
  }
}

function saveSessionsToStorage(sessions) {
  localStorage.setItem(getSessionsStorageKey(), JSON.stringify(sessions));
}

export default function ChatbotPage() {
  const [sessions, setSessions] = useState(loadSessionsFromStorage);
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDocPicker, setShowDocPicker] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingName, setEditingName] = useState(null);
  const [tempName, setTempName] = useState("");
  const [allDocs, setAllDocs] = useState([]);
  const [sessionError, setSessionError] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Backend có thể trả sessionId theo nhiều hình dạng khác nhau (kể cả nhúng trong 1 câu text)
  function extractSessionId(result) {
    if (typeof result === "string") {
      const match = result.match(/Session ID:\s*([a-f0-9-]+)/i);
      if (match) return match[1];
    }
    const session = result?.data || result || {};
    return session.sessionId || session.id || null;
  }

  const activeSession = sessions.find((s) => s.id === activeId);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    saveSessionsToStorage(sessions);
  }, [sessions]);

  // Khi chuyển sang 1 session chưa có tin nhắn nào ở local (messages rỗng), thử tải lịch sử từ backend
  // — trường hợp session được tạo ở phiên trình duyệt khác nhưng cùng account
  useEffect(() => {
    if (!activeId) return;
    const session = sessions.find((s) => s.id === activeId);
    if (session && session.messages.length === 0) {
      loadChatHistory(activeId);
    }
  }, [activeId]);

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

  async function loadChatHistory(sessionId) {
    try {
      const result = await getChatHistory(sessionId);
      const messages = (result?.data?.content || result?.data || result?.content || result || []);
      if (Array.isArray(messages) && messages.length > 0) {
        const mapped = messages.map((m) => ({
          id: m.id || Date.now() + Math.random(),
          role: m.senderType === "USER" || m.senderType === "user" ? "user" : "ai",
          content: m.messageContent || m.content || "",
        }));
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId ? { ...s, messages: mapped } : s
          )
        );
      }
    } catch (err) {
      console.error("Load chat history error:", err);
    }
  }

  // Tạo session mới: PHẢI có sessionId thật từ backend mới cho vào danh sách.
  // Không còn fallback tạo session giả (Date.now() làm id) khi API lỗi hoặc không
  // trả sessionId — session giả khiến các tin nhắn gửi sau đó không gắn được với
  // tài liệu thật ở backend (AI "không đọc được tài liệu").
  async function handleNewSession() {
    setSessionError("");
    try {
      const result = await startChatSession({ documentIds: [] });
      const sessionId = extractSessionId(result);
      if (!sessionId) {
        throw new Error("Backend không trả về sessionId hợp lệ");
      }
      const newSess = {
        id: sessionId,
        name: `Chat ${sessions.length + 1}`,
        docs: [],
        messages: [],
        updatedAt: new Date().toISOString(),
      };
      setSessions((prev) => [newSess, ...prev]);
      setActiveId(newSess.id);
    } catch (err) {
      console.error("Start session error:", err);
      setSessionError(
        "Không thể tạo phiên chat mới (backend không phản hồi hợp lệ). Vui lòng thử lại."
      );
    }
    inputRef.current?.focus();
  }

  async function handleDocConfirm(docs) {
    setShowDocPicker(false);
    setSessionError("");

    if (activeSession) {
      try {
        await updateSessionDocuments(
          activeSession.id,
          docs.map((d) => d.id)
        );
        setSessions((prev) =>
          prev.map((s) => (s.id === activeId ? { ...s, docs } : s))
        );
      } catch (err) {
        console.error("Update session docs error:", err);
        setSessionError(
          "Không thể cập nhật tài liệu cho phiên chat này. AI sẽ không đọc được tài liệu mới — vui lòng thử lại."
        );
      }
      inputRef.current?.focus();
      return;
    }

    try {
      const result = await startChatSession({
        documentIds: docs.map((d) => d.id),
      });
      const sessionId = extractSessionId(result);
      if (!sessionId) {
        throw new Error("Backend không trả về sessionId hợp lệ");
      }
      const newSess = {
        id: sessionId,
        name: `Chat ${sessions.length + 1}`,
        docs,
        messages: [],
        updatedAt: new Date().toISOString(),
      };
      setSessions((prev) => [newSess, ...prev]);
      setActiveId(newSess.id);
    } catch (err) {
      console.error("Start session error:", err);
      setSessionError(
        "Không thể tạo phiên chat với tài liệu đã chọn. Vui lòng thử lại."
      );
    }
    inputRef.current?.focus();
  }

  // Gửi tin nhắn: cập nhật UI với tin nhắn user ngay lập tức (optimistic update),
  // rồi mới gọi API và chờ phản hồi AI để thêm vào cuối
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
      const aiContent =
        typeof result === "string"
          ? result
          : result?.reply || result?.message || result?.content || result?.answer || "...";
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

  // Câu hỏi gợi ý hiện khi phiên chat chưa có tin nhắn nào
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
          {sessionError && (
            <div className="chat-error-banner">
              <span>⚠️ {sessionError}</span>
              <button
                className="chat-error-banner-close"
                onClick={() => setSessionError("")}
              >
                ✕
              </button>
            </div>
          )}
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
