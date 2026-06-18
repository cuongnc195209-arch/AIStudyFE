import { request } from "./api";

export function getUsers() {
  return request("/admin/users", { method: "GET" });
}
