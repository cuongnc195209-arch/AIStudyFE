import { request } from "./api";

export function getUsers() {
  return request("/admin/account", { method: "GET" });
}

export function updateUserStatus(userId, status) {
  return request(`/admin/account/${userId}?status=${status}`, { method: "PUT" });
}
