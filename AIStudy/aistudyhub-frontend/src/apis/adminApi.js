import api from "./api";

export async function getUsers({ key = "", page = 0, size = 10 } = {}) {
  return api.get("/admin/users", {
    key,
    page,
    size,
  });
}

export async function updateUserStatus(userId, status) {
  return api.put(`/admin/users/${userId}/status`, null, {
    queryParams: {
      status,
    },
  });
}

export async function updateUserRole(userId, role) {
  return api.put(`/admin/users/${userId}/role`, null, {
    queryParams: {
      role,
    },
  });
}

export async function getAdminDocuments({
  key = "",
  status,
  isPublic,
  page = 0,
  size = 10,
} = {}) {
  return api.get("/admin/documents", {
    key,
    status,
    isPublic,
    page,
    size,
  });
}

export async function getPendingPublicDocuments({ page = 0, size = 10 } = {}) {
  return getAdminDocuments({
    status: "PENDING",
    page,
    size,
  });
}

export async function reviewDocument(documentId, decision) {
  const cleanDecision = String(decision || "")
    .trim()
    .toUpperCase();

  if (cleanDecision !== "ACCEPT" && cleanDecision !== "DENY") {
    throw new Error("Decision không hợp lệ. Chỉ dùng ACCEPT hoặc DENY.");
  }

  return api.put(`/v1/documents/${documentId}/review`, null, {
    queryParams: {
      decision: cleanDecision,
    },
  });
}

export async function approveDocument(documentId) {
  return reviewDocument(documentId, "ACCEPT");
}

export async function rejectDocument(documentId) {
  return reviewDocument(documentId, "DENY");
}

export async function getAdminChats({ page = 0, size = 10 } = {}) {
  return api.get("/admin/chats", {
    page,
    size,
  });
}

export async function getAdminStorage({ page = 0, size = 10 } = {}) {
  return api.get("/admin/storages", {
    page,
    size,
  });
}

const adminApi = {
  getUsers,

  updateUserStatus,
  updateUserRole,

  getAdminDocuments,
  getPendingPublicDocuments,

  reviewDocument,
  approveDocument,
  rejectDocument,

  getAdminChats,
  getAdminStorage,
};

export default adminApi;
