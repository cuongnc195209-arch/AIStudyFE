import api from "./api";

/**
 * Lấy tổng dung lượng (quota) được cấp cho user hiện tại, tính bằng byte.
 *
 * BE: GET /api/v1/documents/get-storage
 * Response thực tế chỉ là 1 số nguyên (vd: 5368709120 = 5GB), không phải object
 * {used, total} — endpoint này KHÔNG trả số đã dùng, chỉ trả tổng quota.
 */
export async function getTotalQuota() {
  const result = await api.get("/v1/documents/get-storage");
  return Number(result) || 0;
}

// Đổi số byte thành chuỗi dễ đọc (KB/MB/GB...) bằng công thức log cơ số 1024
export function formatBytes(bytes = 0) {
  const value = Number(bytes || 0);

  if (value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(value) / Math.log(1024));
  const safeIndex = Math.min(index, units.length - 1);
  const formatted = value / Math.pow(1024, safeIndex);

  return `${formatted.toFixed(formatted >= 10 ? 1 : 2)} ${units[safeIndex]}`;
}

// Gộp usedBytes (tính tay từ tổng fileSize danh sách tài liệu) với totalQuota lấy từ BE
// thành 1 object tiện hiển thị (usedText/totalText/usagePercentage)
export function normalizeStorageUsage(usedBytes = 0, totalBytes = 0) {
  const usedQuota = Number(usedBytes) || 0;
  const totalQuota = Number(totalBytes) || 0;

  return {
    usedQuota,
    totalQuota,
    usagePercentage:
      totalQuota > 0 ? `${((usedQuota / totalQuota) * 100).toFixed(0)}%` : "0%",
    usedText: formatBytes(usedQuota),
    totalText: formatBytes(totalQuota),
  };
}

const storageApi = {
  getTotalQuota,
  normalizeStorageUsage,
  formatBytes,
};

export default storageApi;
