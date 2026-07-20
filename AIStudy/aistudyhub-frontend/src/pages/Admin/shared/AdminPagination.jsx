// Component phân trang dùng chung cho các bảng admin (UsersSection, ChatSection...)
export function AdminPagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null; // chỉ 1 trang thì không cần hiện thanh phân trang

  // Dựng danh sách số trang để hiện, có thể chứa dấu "…" khi rút gọn
  const pages = [];
  const addRange = (from, to) => {
    for (let i = from; i <= to; i++) pages.push(i);
  };

  if (totalPages <= 7) {
    // Ít trang => hiện đủ hết, ví dụ: 1 2 3 4 5
    addRange(1, totalPages);
  } else {
    // Nhiều trang => luôn giữ trang đầu, trang cuối, và 1 trang trước/sau trang hiện tại,
    // phần còn lại rút gọn bằng "…", ví dụ: 1 … 4 5 6 … 20
    pages.push(1);
    if (page > 3) pages.push("…");
    addRange(Math.max(2, page - 1), Math.min(totalPages - 1, page + 1));
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <div className="admin-pagination">
      <div className="admin-pagination-info">
        Trang {page}/{totalPages}
      </div>
      <div className="admin-pagination-controls">
        <button
          className="page-btn"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
        >
          ‹
        </button>
        {/* Dấu "…" chỉ là chữ tĩnh, không click được — khác các nút số trang bên cạnh */}
        {pages.map((p, idx) =>
          p === "…" ? (
            <span
              key={`ellipsis-${idx}`}
              className="page-btn page-btn-ellipsis"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              className={`page-btn${p === page ? " page-btn--active" : ""}`}
              onClick={() => onChange(p)}
            >
              {p}
            </button>
          ),
        )}
        <button
          className="page-btn"
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
        >
          ›
        </button>
      </div>
    </div>
  );
}
