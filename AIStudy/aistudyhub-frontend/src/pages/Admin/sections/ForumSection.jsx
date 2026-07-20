import { useState } from "react";
import { ConfirmModal } from "../shared/ConfirmModal";

// Kiểm duyệt report vi phạm ở forum — CHƯA NỐI API: "reports" luôn khởi tạo mảng rỗng và
// không có useEffect nào gọi API để load, nên UI luôn hiện "Tất cả nội dung đã được kiểm duyệt"
export default function ForumSection({ onToast }) {
  const [reports, setReports] = useState([]);
  const [confirm, setConfirm] = useState(null);

  function handleKeep(id) {
    setReports((rs) => rs.filter((r) => r.id !== id));
    onToast("Đã bỏ cờ — nội dung tiếp tục hiển thị");
  }

  // Cũng chỉ xoá ở state local — chưa gọi API xoá bài đăng/bình luận hay gửi cảnh báo thật tới người dùng
  function handleDelete() {
    setReports((rs) => rs.filter((r) => r.id !== confirm.id));
    onToast(`Đã xóa nội dung vi phạm và cảnh báo người dùng`);
    setConfirm(null);
  }

  const TYPE_LABEL = { post: "Bài đăng", comment: "Bình luận" };
  const TYPE_COLOR = { post: "#3b82f6", comment: "#7c3aed" };

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <h2>Kiểm duyệt diễn đàn</h2>
        <p>{reports.length} nội dung đang chờ xử lý</p>
      </div>

      {reports.length === 0 ? (
        <div className="moderation-empty">
          <div className="mod-empty-icon">✅</div>
          <p className="mod-empty-title">Tất cả nội dung đã được kiểm duyệt</p>
          <p className="mod-empty-sub">
            Không còn báo cáo vi phạm nào chờ xử lý
          </p>
        </div>
      ) : (
        <div className="report-list">
          {reports.map((r) => (
            <div key={r.id} className="report-card">
              <div className="report-card-head">
                <div className="report-meta">
                  <span
                    className="report-type-badge"
                    style={{
                      background: TYPE_COLOR[r.type] + "18",
                      color: TYPE_COLOR[r.type],
                    }}
                  >
                    {TYPE_LABEL[r.type]}
                  </span>
                  <span className="report-author">👤 {r.author}</span>
                  <span className="report-time">🕐 {r.time}</span>
                </div>
                <div className="report-count-badge">🚩 {r.reports} báo cáo</div>
              </div>

              <h3 className="report-title">{r.title}</h3>
              <p className="report-reason">
                <strong>Lý do:</strong> {r.reason}
              </p>
              <div className="report-content-preview">{r.content}</div>

              <div className="report-actions">
                <button
                  className="ra-btn ra-keep"
                  onClick={() => handleKeep(r.id)}
                >
                  ✅ Giữ lại — Không vi phạm
                </button>
                <button
                  className="ra-btn ra-delete"
                  onClick={() => setConfirm(r)}
                >
                  🗑️ Xóa nội dung & Cảnh báo
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirm && (
        <ConfirmModal
          title="Xóa nội dung vi phạm"
          desc={`Xóa "${confirm.title}" và gửi cảnh báo đến người dùng "${confirm.author}"?`}
          danger
          onConfirm={handleDelete}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
