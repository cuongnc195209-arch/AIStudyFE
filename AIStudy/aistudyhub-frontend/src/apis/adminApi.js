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
  return request(`/admin/account/${userId}?status=${status}`, {
    method: "PUT",
  });
}
