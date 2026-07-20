// Toàn bộ file này là dữ liệu giả (hardcode) — dùng để vẽ StatsSection và làm danh sách môn học khởi tạo
// cho ConfigSection, không lấy từ API nào.
export const SUBJECTS = [
  "Lập trình Web",
  "Cơ sở dữ liệu",
  "Trí tuệ nhân tạo",
  "Mạng máy tính",
  "Giải tích",
  "Vật lý đại cương",
];

export const EXT_COLOR = {
  PDF: "#ef4444",
  PPT: "#f97316",
  DOC: "#3b82f6",
  IMG: "#10b981",
};

// Dữ liệu giả cho 2 biểu đồ cột ở StatsSection: số user mới và doanh thu theo từng tháng trong năm
export const MONTH_USERS = [12, 19, 15, 28, 24, 38, 31, 45, 42, 58, 51, 67];
export const MONTH_REVENUE = [
  0, 0, 990, 1980, 2970, 4950, 3960, 6930, 5940, 8910, 7920, 12870,
];
export const MONTH_LABELS = [
  "T1",
  "T2",
  "T3",
  "T4",
  "T5",
  "T6",
  "T7",
  "T8",
  "T9",
  "T10",
  "T11",
  "T12",
];
