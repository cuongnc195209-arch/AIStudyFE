// Định dạng ngày kiểu Việt Nam (dd/mm/yyyy). Lưu ý: hàm này không được import/dùng ở đâu trong code hiện tại —
// mỗi trang tự viết hàm format ngày riêng của mình thay vì dùng chung hàm này.
export function formatDate(date) {
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}
