import { request } from "./api";

export function getUsers() {
  return request("/admin/account", { method: "GET" });
}
