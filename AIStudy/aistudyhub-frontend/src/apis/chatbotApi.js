import { request } from "./api";

function getUserId() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.id || user?.userId || user?.user_id;
  } catch {
    return null;
  }
}

export function startChatSession(documentIds = []) {
  return request("/chat/start", {
    method: "POST",
    body: JSON.stringify({ documentIds }),
    headers: { "X-User-Id": getUserId() },
  });
}

export function sendMessage(sessionId, message) {
  return request("/chat/send-message", {
    method: "POST",
    body: JSON.stringify({ sessionId, message }),
    headers: { "X-User-Id": getUserId() },
  });
}

export function getChatHistory(sessionId) {
  return request(`/chat/session/${sessionId}/history`, {
    method: "GET",
    headers: { "X-User-Id": getUserId() },
  });
}

export function updateSessionDocuments(sessionId, documentIds) {
  return request(`/chat/session/${sessionId}/documents`, {
    method: "PUT",
    body: JSON.stringify({ documentIds }),
    headers: { "X-User-Id": getUserId() },
  });
}
