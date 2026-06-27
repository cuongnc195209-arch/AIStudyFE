import { request } from "./api";

export function getStorageUsage() {
  return request("/v1/storage/usage", {
    method: "GET",
  });
}
