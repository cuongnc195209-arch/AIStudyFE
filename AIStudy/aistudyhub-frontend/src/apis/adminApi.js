import api from "./api";

// Các hàm trong file này chỉ dành cho khu vực /admin — gọi tới nhóm endpoint /admin/*

export async function getUsers({ key = "", page = 0, size = 10 } = {}) {
  return api.get("/admin/account", {
    key,
    page,
    size,
  });
}

export async function getAdminUsers({ key = "", page = 0, size = 10 } = {}) {
  return getUsers({ key, page, size });
}

export async function updateUserStatus(userId, status) {
  if (!userId) {
    throw new Error("Thiếu userId");
  }

  if (!status) {
    throw new Error("Thiếu trạng thái tài khoản");
  }

  return api.put(`/admin/account/status/${userId}`, null, {
    queryParams: {
      status,
    },
  });
}

export async function updateUserRole(userId, role) {
  if (!userId) {
    throw new Error("Thiếu userId");
  }

  const cleanRole = String(role || "")
    .trim()
    .toUpperCase()
    .replace(/^ROLE_/, "");

  if (cleanRole !== "CUSTOMER" && cleanRole !== "MODERATOR") {
    throw new Error("Role không hợp lệ. Chỉ được đổi CUSTOMER hoặc MODERATOR.");
  }

  return api.put(`/admin/account/role/${userId}`, null, {
    queryParams: {
      role: cleanRole,
    },
  });
}

export async function getAdminDocuments({
  page = 0,
  size = 10,
  status = "",
} = {}) {
  const queryParams = {
    page,
    size,
  };

  if (status) {
    queryParams.status = status;
  }

  return api.get("/admin/document", queryParams);
}

export async function getPendingPublicDocuments({ page = 0, size = 10 } = {}) {
  return getAdminDocuments({
    page,
    size,
    status: "PENDING",
  });
}

export async function reviewDocument(documentId, decision) {
  if (!documentId) {
    throw new Error("Thiếu documentId");
  }

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
  return api.get("/admin/chat", {
    page,
    size,
  });
}

export async function getAdminStorage({ page = 0, size = 10 } = {}) {
  return api.get("/admin/storage", {
    page,
    size,
  });
}

export async function getAdminStorageUsage({ page = 0, size = 10 } = {}) {
  return getAdminStorage({ page, size });
}

export async function getAdminStorageUsages({ page = 0, size = 10 } = {}) {
  return getAdminStorage({ page, size });
}

export async function updateAdminConfig(payload) {
  return api.put("/admin/config", payload);
}

const adminApi = {
  getUsers,
  getAdminUsers,

  updateUserStatus,
  updateUserRole,

  getAdminDocuments,
  getPendingPublicDocuments,

  reviewDocument,
  approveDocument,
  rejectDocument,

  getAdminChats,
  getAdminStorage,
  getAdminStorageUsage,
  getAdminStorageUsages,

  updateAdminConfig,
};

export default adminApi;
