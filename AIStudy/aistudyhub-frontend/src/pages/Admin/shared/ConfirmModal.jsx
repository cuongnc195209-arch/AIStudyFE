//Modal xác nhận hành động dùng chung (xác nhận xóa, khóa tài khoản...).
export function ConfirmModal({ title, desc, danger, onConfirm, onClose }) {
  return (
    <div
      className="admin-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="admin-modal admin-modal--sm">
        <div className="admin-modal-header">
          <h3>{title}</h3>
          <button className="admin-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="admin-modal-body">
          <p className="confirm-desc">{desc}</p>
        </div>
        <div className="admin-modal-footer">
          <button className="abtn-cancel" onClick={onClose}>
            Hủy
          </button>
          <button
            className={danger ? "abtn-danger" : "abtn-primary"}
            onClick={onConfirm}
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
