// Banner thông báo tự đóng — không có timer JS, animation CSS tự chạy hết rồi bắn sự kiện onAnimationEnd
// để component cha (AdminDashboardPage/SettingsPage) set state toast về null, gỡ Toast khỏi DOM.
export function Toast({ message, type = "success", onDone }) {
  return (
    <div
      className={`admin-toast admin-toast--${type}`}
      onAnimationEnd={onDone}
    >
      {type === "success" ? "✅" : "⚠️"} {message}
    </div>
  );
}
