import api from "./api";

/**
 * Lấy dung lượng storage của user hiện tại.
 *
 * BE:
 * GET /api/v1/storage/usage
 */
export async function getStorageUsage() {
  return api.get("/v1/storage/usage");
}

export async function getCloudStorageUsage() {
  return getStorageUsage();
}

export async function getMyStorageUsage() {
  return getStorageUsage();
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

// Chuẩn hoá + bổ sung field hiển thị sẵn (usedText/totalText) từ response storage thô
export function normalizeStorageUsage(storage) {
  if (!storage) {
    return {
      userId: null,
      usedQuota: 0,
      totalQuota: 0,
      usagePercentage: "0%",
      usedText: "0 B",
      totalText: "0 B",
    };
  }

  return {
    ...storage,
    usedQuota: Number(storage.usedQuota || 0),
    totalQuota: Number(storage.totalQuota || 0),
    usagePercentage: storage.usagePercentage || "0%",
    usedText: formatBytes(storage.usedQuota || 0),
    totalText: formatBytes(storage.totalQuota || 0),
  };
}

export async function getNormalizedStorageUsage() {
  const storage = await getStorageUsage();
  return normalizeStorageUsage(storage);
}

const storageApi = {
  getStorageUsage,
  getCloudStorageUsage,
  getMyStorageUsage,
  getNormalizedStorageUsage,
  normalizeStorageUsage,
  formatBytes,
};

export default storageApi;
