import { request } from "./api";

export function login(credentials) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function register(data) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function refreshToken(data) {
  return request("/auth/refresh", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function logout(data) {
  return request("/auth/logout", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getProfile() {
  return request("/auth/me", {
    method: "GET",
  });
}

export function updateProfile(data) {
  return request("/auth/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function changePassword(data) {
  return request("/auth/change-password", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function forgotPassword(email) {
  return request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(token, newPassword) {
  return request("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}
