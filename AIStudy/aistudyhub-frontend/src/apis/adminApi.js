import { request } from "./api";

export function getUsers({ key = "", page = 0, size = 10 } = {}) {
  const params = new URLSearchParams();

  if (key) params.append("key", key);
  params.append("page", page);
  params.append("size", size);

  return request(`/admin/account?${params.toString()}`, {
    method: "GET",
  });
}

export function updateUserStatus(userId, status) {
  return request(`/admin/account/status/${userId}?status=${status}`, {
    method: "PUT",
  });
}

export function updateUserRole(userId, role) {
  return request(`/admin/account/role/${userId}?role=${role}`, {
    method: "PUT",
  });
}

export function getAdminStorage() {
  return request("/admin/storage", {
    method: "GET",
  });
}

export function getAdminDocuments({ key = "", page = 0, size = 10 } = {}) {
  const params = new URLSearchParams();

  if (key) params.append("key", key);
  params.append("page", page);
  params.append("size", size);

  return request(`/admin/document?${params.toString()}`, {
    method: "GET",
  });
}

export function getAdminChats({ key = "", page = 0, size = 10 } = {}) {
  const params = new URLSearchParams();

  if (key) params.append("key", key);
  params.append("page", page);
  params.append("size", size);

  return request(`/admin/chat?${params.toString()}`, {
    method: "GET",
  });
}
