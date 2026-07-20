import api from "./api";

// Các hàm trong file này chỉ dành cho khu vực /admin — gọi tới nhóm endpoint /admin/*

export async function getUsers({ key = "", page = 0, size = 10 } = {}) {
  return api.get("/admin/account", {
    key,
    page,
    size,
  });
}

export async function updateUserStatus(userId, status) {
  return api.put(`/admin/account/status/${userId}`, null, {
    queryParams: {
      status,
    },
  });
}

export async function updateUserRole(userId, role) {
  return api.put(`/admin/account/role/${userId}`, null, {
    queryParams: {
      role,
    },
  });
}

export async function getAdminDocuments({ page = 0, size = 10 } = {}) {
  return api.get("/admin/document", {
    page,
    size,
  });
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

export async function getPendingPublicDocuments({ page = 0, size = 10 } = {}) {
  return getAdminDocuments({ page, size });
}

// Trùng logic với documentApi.reviewDocument — giữ bản riêng ở đây để adminApi độc lập, không phụ thuộc documentApi
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

// Lưu cấu hình hệ thống (giới hạn upload, định dạng file cho phép...) — dùng bởi ConfigSection
export async function updateAdminConfig(payload) {
  return api.put("/admin/config", payload);
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
  getAdminStorageUsage,
  getAdminStorageUsages,

  updateAdminConfig,
};

export default adminApi;
