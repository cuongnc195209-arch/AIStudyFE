import { useEffect, useState } from "react";
import { getAdminChats } from "../../../apis/adminApi";
import { AdminPagination } from "../shared/AdminPagination";

function mapChatAdmin(c) {
  return {
    id: c.id,
    content: c.messageContent || "",
  };
}

const CHAT_PAGE_SIZE = 10;

export default function ChatSection() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    getAdminChats({ size: 9999 })
      .then((res) => {
        const data = res?.content || res?.data || res || [];
        setChats(Array.isArray(data) ? data.map(mapChatAdmin) : []);
      })
      .catch((err) => console.error("Load admin chats error:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = chats.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.content.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / CHAT_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * CHAT_PAGE_SIZE,
    currentPage * CHAT_PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <h2>Quản lý Chat AI</h2>
        <p>{chats.length} tin nhắn trên toàn hệ thống</p>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <span className="admin-search-icon">🔍</span>
          <input
            className="admin-search"
            placeholder="Tìm nội dung tin nhắn..."
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
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID tin nhắn</th>
              <th>Nội dung</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((c, idx) => (
              <tr key={c.id ?? idx}>
                <td className="td-secondary">
                  {c.id ? `${c.id.slice(0, 8)}…` : "—"}
                </td>
                <td className="td-secondary">{c.content || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="table-empty">Đang tải...</div>}
        {!loading && filtered.length === 0 && (
          <div className="table-empty">Không tìm thấy tin nhắn</div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <AdminPagination
          page={currentPage}
          totalPages={totalPages}
          onChange={setPage}
        />
      )}
    </div>
  );
}
