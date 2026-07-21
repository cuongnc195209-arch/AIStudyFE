import { useEffect, useState } from "react";
import { getAdminDocuments } from "../../../apis/adminApi";
import { deleteDocument } from "../../../apis/documentApi";
import { ConfirmModal } from "../shared/ConfirmModal";
import { EXT_COLOR } from "../shared/mockData";

// Chuẩn hoá tài liệu cho bảng admin — gộp DOCX->DOC, PPTX->PPT, JPG/PNG->IMG để khớp với EXT_COLOR
function mapDocAdmin(d, index = 0) {
  const rawExt = String(d.fileType || d.ext || "PDF").toUpperCase();
  let ext = rawExt;
  if (rawExt === "DOCX") ext = "DOC";
  if (rawExt === "PPTX") ext = "PPT";
  if (["JPG", "JPEG", "PNG"].includes(rawExt)) ext = "IMG";

  return {
    id:
      d.id ||
      d.documentId ||
      d.document_id ||
      `${d.documentName || d.name || "document"}-${d.createdAt || d.date || index}`,
    name: d.documentName || d.name || "Untitled",
    ext,
    owner: d.userFullName || d.userEmail || "—",
    subject: d.subject || "Tài liệu",
    size: d.fileSize
      ? d.fileSize >= 1048576
        ? `${(d.fileSize / 1048576).toFixed(1)} MB`
        : `${(d.fileSize / 1024).toFixed(0)} KB`
      : "—",
    date: d.createdAt ? d.createdAt.slice(0, 10) : "",
    privacy: d.isPublic || d.is_public ? "public" : "private",
  };
}

// Bảng tài liệu toàn hệ thống — admin chỉ xoá được, nút "Xem" chưa gắn hành vi gì (không có onClick)
export default function DocumentsSection({ onToast }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [extFilter, setExtFilter] = useState("Tất cả");
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    getAdminDocuments({ size: 9999 })
      .then((res) => {
        const data = res?.content || res?.data || res || [];
        setDocs(
          Array.isArray(data)
            ? data.map((d, index) => mapDocAdmin(d, index))
            : [],
        );
      })
      .catch((err) => console.error("Load admin docs error:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = docs.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.owner.toLowerCase().includes(q) ||
      d.subject.toLowerCase().includes(q);
    const matchExt = extFilter === "Tất cả" || d.ext === extFilter;
    return matchSearch && matchExt;
  });

  // Xoá thật ở backend (khác UsersSection.doAction — action "delete" ở đó chỉ xoá local)
  async function handleDelete() {
    try {
      await deleteDocument(confirm.id);
      setDocs((ds) => ds.filter((d) => d.id !== confirm.id));
      onToast(`Đã xóa tài liệu "${confirm.name}"`);
    } catch (err) {
      console.error("Delete doc error:", err);
      onToast("Xóa tài liệu thất bại");
    }
    setConfirm(null);
  }

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <h2>Quản lý tài liệu</h2>
        <p>{docs.length} tài liệu trên toàn hệ thống</p>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <span className="admin-search-icon">🔍</span>
          <input
            className="admin-search"
            placeholder="Tìm tên, chủ sở hữu, môn học..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="admin-search-clear"
              onClick={() => setSearch("")}
            >
              ✕
            </button>
          )}
        </div>
        <select
          className="admin-select"
          value={extFilter}
          onChange={(e) => setExtFilter(e.target.value)}
        >
          {["Tất cả", "PDF", "PPT", "DOC", "IMG"].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tài liệu</th>
              <th>Chủ sở hữu</th>
              <th>Môn học</th>
              <th>Kích thước</th>
              <th>Ngày upload</th>
              <th>Quyền</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d, index) => (
              <tr key={d.id || `${d.name}-${d.date}-${index}`}>
                <td>
                  <div className="td-doc">
                    <div
                      className="td-ext"
                      style={{ background: EXT_COLOR[d.ext] }}
                    >
                      {d.ext}
                    </div>
                    <p className="td-docname">{d.name}</p>
                  </div>
                </td>
                <td className="td-secondary">{d.owner}</td>
                <td className="td-secondary">{d.subject}</td>
                <td className="td-secondary">{d.size}</td>
                <td className="td-secondary">
                  {new Date(d.date).toLocaleDateString("vi-VN")}
                </td>
                <td>
                  <span
                    className={
                      d.privacy === "public"
                        ? "privacy-public"
                        : "privacy-private"
                    }
                  >
                    {d.privacy === "public" ? "🌐 Công khai" : "🔒 Riêng tư"}
                  </span>
                </td>
                <td>
                  <div className="td-actions">
                    <button className="ta-btn ta-view">👁️ Xem</button>
                    <button
                      className="ta-btn ta-delete"
                      onClick={() => setConfirm(d)}
                    >
                      🗑️ Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="table-empty">Đang tải...</div>}
        {!loading && filtered.length === 0 && (
          <div className="table-empty">Không tìm thấy tài liệu</div>
        )}
      </div>

      {confirm && (
        <ConfirmModal
          title="Xóa tài liệu"
          desc={`Xóa vĩnh viễn "${confirm.name}" khỏi Cloud Storage?`}
          danger
          onConfirm={handleDelete}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
