import api from "./api";

/**
 * Lấy danh sách user cho admin.
 *
 * BE:
 * GET /api/admin/users
 */
export async function getUsers({ key = "", page = 0, size = 10 } = {}) {
  return api.get("/admin/users", {
    key,
    page,
    size,
  });
}

export async function getAllUsers(params = {}) {
  return getUsers(params);
}

export async function getAccounts(params = {}) {
  return getUsers(params);
}

export async function getAllAccounts(params = {}) {
  return getUsers(params);
}

/**
 * Cập nhật trạng thái tài khoản.
 *
 * status: ACTIVE | BANNED
 */
export async function updateUserStatus(userId, status) {
  return api.put(`/admin/account/status/${userId}`, null, {
    queryParams: {
      status,
    },
  });
}

export async function banUser(userId) {
  return updateUserStatus(userId, "BANNED");
}

export async function unbanUser(userId) {
  return updateUserStatus(userId, "ACTIVE");
}

/**
 * Cập nhật role tài khoản.
 *
 * role: CUSTOMER | ADMIN | MODERATOR
 */
export async function updateUserRole(userId, role) {
  return api.put(`/admin/account/role/${userId}`, null, {
    queryParams: {
      role,
    },
  });
}

/**
 * Lấy danh sách tài liệu toàn hệ thống.
 *
 * BE:
 * GET /api/admin/documents
 */
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

export async function getAllDocuments(params = {}) {
  return getAdminDocuments(params);
}

export async function getDocuments(params = {}) {
  return getAdminDocuments(params);
}

/**
 * Lấy tài liệu đang chờ duyệt public.
 */
export async function getPendingPublicDocuments({ page = 0, size = 10 } = {}) {
  return getAdminDocuments({
    status: "PENDING",
    page,
    size,
  });
}

/**
 * Duyệt yêu cầu public tài liệu.
 *
 * BE:
 * PUT /api/v1/documents/{documentId}/review?decision=ACCEPT
 */
export async function reviewDocument(documentId, decision) {
  return api.put(`/v1/documents/${documentId}/review`, null, {
    queryParams: {
      decision,
    },
  });
}

export async function approveDocument(documentId) {
  return reviewDocument(documentId, "ACCEPT");
}

export async function rejectDocument(documentId) {
  return reviewDocument(documentId, "DENY");
}

export async function acceptDocumentPublicRequest(documentId) {
  return approveDocument(documentId);
}

export async function denyDocumentPublicRequest(documentId) {
  return rejectDocument(documentId);
}

/**
 * Lấy danh sách chat user gửi.
 *
 * BE:
 * GET /api/admin/chats
 */
export async function getAdminChats({ page = 0, size = 10 } = {}) {
  return api.get("/admin/chats", {
    page,
    size,
  });
}

export async function getAllChats(params = {}) {
  return getAdminChats(params);
}

export async function getAdminChat(params = {}) {
  return getAdminChats(params);
}

/**
 * Lấy danh sách storage toàn hệ thống.
 *
 * BE:
 * GET /api/admin/storages
 */
export async function getAdminStorages({ page = 0, size = 10 } = {}) {
  return api.get("/admin/storages", {
    page,
    size,
  });
}

/**
 * Alias để tương thích với AdminDashboardPage.jsx.
 */
export async function getAdminStorage(params = {}) {
  return getAdminStorages(params);
}

export async function getAdminStorageUsage(params = {}) {
  return getAdminStorages(params);
}

export async function getAdminStorageUsages(params = {}) {
  return getAdminStorages(params);
}

export async function getAllStorages(params = {}) {
  return getAdminStorages(params);
}

export async function getStorageUsages(params = {}) {
  return getAdminStorages(params);
}

/**
 * Các API config hiện tại BE đang để placeholder.
 */
export async function configureTotalStorageQuota() {
  return api.put("/admin/config-storage");
}

export async function configureChatToken() {
  return api.put("/admin/config-aitoken");
}

export async function configureMaxFileSize() {
  return api.put("/admin/config-file-size");
}

export async function configureAvailableFileType() {
  return api.put("/admin/config-file-type");
}

const adminApi = {
  getUsers,
  getAllUsers,
  getAccounts,
  getAllAccounts,

  updateUserStatus,
  banUser,
  unbanUser,
  updateUserRole,

  getAdminDocuments,
  getAllDocuments,
  getDocuments,
  getPendingPublicDocuments,

  reviewDocument,
  approveDocument,
  rejectDocument,
  acceptDocumentPublicRequest,
  denyDocumentPublicRequest,

  getAdminChats,
  getAdminChat,
  getAllChats,

  getAdminStorages,
  getAdminStorage,
  getAdminStorageUsage,
  getAdminStorageUsages,
  getAllStorages,
  getStorageUsages,

  configureTotalStorageQuota,
  configureChatToken,
  configureMaxFileSize,
  configureAvailableFileType,
};

export default adminApi;
