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
