import { request } from "./api";

export function startChatSession(documentIds = []) {
  return request("/chat/start", {
    method: "POST",
    body: JSON.stringify({ documentIds }),
  });
}

export function sendMessage(sessionId, messageContent) {
  return request("/chat/send-message", {
    method: "POST",
    body: JSON.stringify({ sessionId, messageContent }),
  });
}

export function getChatHistory(sessionId) {
  return request(`/chat/session/${sessionId}/history`, {
    method: "GET",
  });
}

export function updateSessionDocuments(sessionId, documentIds) {
  return request(`/chat/session/${sessionId}/documents`, {
    method: "PUT",
    body: JSON.stringify({ documentIds }),
  });
}
