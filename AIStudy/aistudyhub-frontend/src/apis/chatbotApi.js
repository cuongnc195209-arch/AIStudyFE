import api from "./api";

// Backend có thể trả sessionId dưới dạng object field hoặc lồng trong chuỗi text tự do
// => hàm này cố dò ra UUID bằng nhiều cách khác nhau tuỳ hình dạng response
function extractSessionId(response) {
  if (!response) {
    return null;
  }

  if (typeof response === "object") {
    return (
      response.sessionId ||
      response.id ||
      response.chatSessionId ||
      response.data?.sessionId ||
      null
    );
  }

  if (typeof response === "string") {
    const uuidMatch = response.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
    );

    return uuidMatch ? uuidMatch[0] : null;
  }

  return null;
}

/**
 * Tạo chat session.
 *
 * BE:
 * POST /api/chat/start
 *
 * Body: raw UUID của tài liệu muốn ghim sẵn (có thể null nếu tạo session trống)
 * — cùng kiểu @RequestBody UUID như /chat/session/{id}/documents, KHÔNG bọc
 *   trong { documentIds: [...] }. Gửi object (kể cả mảng rỗng) sẽ bị lỗi
 *   "Cannot deserialize value of type `java.util.UUID` from Object value".
 */
// createChatSession/startChatSession bên dưới chỉ là alias gọi lại hàm này
export async function startChat(payload = {}) {
  const documentIds = payload?.documentIds;
  const ids = Array.isArray(documentIds) ? documentIds : [documentIds].filter(Boolean);
  const documentId = ids[0] || null;

  const response = await api.post("/chat/start", documentId);

  return {
    raw: response,
    sessionId: extractSessionId(response),
  };
}

export async function createChatSession(payload = {}) {
  return startChat(payload);
}

export async function startChatSession(payload = {}) {
  return startChat(payload);
}

/**
 * Update document được ghim cho session (DocPicker hiện chỉ cho chọn 1 tài liệu).
 *
 * BE:
 * PUT /api/chat/session/{sessionId}/documents
 *
 * Body: raw UUID của tài liệu (vd: "3fa85f64-...")
 * — KHÔNG bọc trong { documentIds: [...] }, vì @RequestBody phía BE nhận thẳng
 *   kiểu UUID. Gửi object sẽ bị lỗi "Cannot deserialize value of type
 *   `java.util.UUID` from Object value".
 */
export async function updateSessionDocuments(sessionId, documentIds = []) {
  const ids = Array.isArray(documentIds) ? documentIds : [documentIds];
  const documentId = ids[0] || null;
  return api.put(`/chat/session/${sessionId}/documents`, documentId);
}

export async function updateChatSessionDocuments(sessionId, documentIds = []) {
  return updateSessionDocuments(sessionId, documentIds);
}

/**
 * Gửi message.
 *
 * BE:
 * POST /api/chat/send-message
 *
 * Body:
 * {
 *   sessionId,
 *   messageContent
 * }
 */
export async function sendMessage({ sessionId, messageContent }) {
  if (!sessionId) {
    throw new Error("Thiếu sessionId");
  }

  if (!messageContent || !messageContent.trim()) {
    throw new Error("Tin nhắn không được để trống");
  }

  return api.post("/chat/send-message", {
    sessionId,
    messageContent: messageContent.trim(),
  });
}

export async function sendChatMessage(sessionId, messageContent) {
  return sendMessage({
    sessionId,
    messageContent,
  });
}

export async function askAI(sessionId, messageContent) {
  return sendChatMessage(sessionId, messageContent);
}

/**
 * Lấy lịch sử chat.
 *
 * BE:
 * GET /api/chat/session/{sessionId}/history?page=0&size=20
 */
export async function getChatHistory(sessionId, { page = 0, size = 20 } = {}) {
  if (!sessionId) {
    throw new Error("Thiếu sessionId");
  }

  return api.get(`/chat/session/${sessionId}/history`, {
    page,
    size,
  });
}

export async function getSessionHistory(sessionId, params = {}) {
  return getChatHistory(sessionId, params);
}

const chatApi = {
  startChat,
  createChatSession,
  startChatSession,
  updateSessionDocuments,
  updateChatSessionDocuments,
  sendMessage,
  sendChatMessage,
  askAI,
  getChatHistory,
  getSessionHistory,
};

export default chatApi;
