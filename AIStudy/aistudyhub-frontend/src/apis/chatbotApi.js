import api from "./api";

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
 * Body optional:
 * {
 *   sessionTitle,
 *   documentIds
 * }
 */
export async function startChat(payload = {}) {
  const response = await api.post("/chat/start", payload || {});

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
 * Update document list cho session.
 *
 * BE:
 * PUT /api/chat/session/{sessionId}/documents
 *
 * Body:
 * {
 *   documentIds: [...]
 * }
 */
export async function updateSessionDocuments(sessionId, documentIds = []) {
  return api.put(`/chat/session/${sessionId}/documents`, {
    documentIds,
  });
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
