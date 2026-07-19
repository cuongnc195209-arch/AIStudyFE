import { useEffect, useState } from "react";
import {
  getUsers,
  updateUserStatus,
  updateUserRole,
} from "../../../apis/adminApi";
import { ConfirmModal } from "../shared/ConfirmModal";
import { AdminPagination } from "../shared/AdminPagination";
import { mapUser } from "../shared/mappers";

const USERS_PAGE_SIZE = 10;

export default function UsersSection({ onToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [confirm, setConfirm] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    getUsers({ size: 9999 })
      .then((res) => {
        const list = res?.content || res?.data || res || [];
        const all = Array.isArray(list)
          ? list.map((u, i) => mapUser(u, i))
          : [];
        setUsers(all.filter((u) => u.role !== "ADMIN"));
      })
      .catch((err) => console.error("Load users error:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    const matchFilter = filter === "all" || u.status === filter;
    return matchSearch && matchFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / USERS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * USERS_PAGE_SIZE,
    currentPage * USERS_PAGE_SIZE,
  );

  function handleSearchChange(value) {
    setSearch(value);
    setPage(1);
  }

  function handleFilterChange(value) {
    setFilter(value);
    setPage(1);
  }

  async function doAction() {
    const { action, user, newRole } = confirm;
    try {
      if (action === "lock") {
        await updateUserStatus(user.id, "BANNED");
        setUsers((us) =>
          us.map((u) => (u.id === user.id ? { ...u, status: "locked" } : u)),
        );
      }
      if (action === "unlock") {
        await updateUserStatus(user.id, "ACTIVE");
        setUsers((us) =>
          us.map((u) => (u.id === user.id ? { ...u, status: "active" } : u)),
        );
      }
      if (action === "role") {
        await updateUserRole(user.id, newRole);
        setUsers((us) =>
          us.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)),
        );
      }
      if (action === "delete")
        setUsers((us) => us.filter((u) => u.id !== user.id));
      onToast(
        action === "lock"
          ? `Đã khóa tài khoản ${user.name}`
          : action === "unlock"
            ? `Đã mở khóa ${user.name}`
            : action === "role"
              ? `Đã đổi vai trò của ${user.name} thành ${newRole === "ADMIN" ? "Admin" : newRole === "MODERATOR" ? "Moderator" : "User"}`
              : `Đã xóa ${user.name}`,
      );
    } catch (err) {
      onToast(`Lỗi: ${err?.message || "Không thể thực hiện thao tác"}`);
    }
    setConfirm(null);
  }

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <h2>Quản lý người dùng</h2>
        <p>
          {users.length} tài khoản ·{" "}
          {users.filter((u) => u.status === "locked").length} bị khóa
        </p>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <span className="admin-search-icon">🔍</span>
          <input
            className="admin-search"
            placeholder="Tìm tên, email..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {search && (
            <button
              className="admin-search-clear"
              onClick={() => handleSearchChange("")}
            >
              ✕
            </button>
          )}
        </div>
        <div className="filter-tabs">
          {[
            ["all", "Tất cả"],
            ["active", "Đang hoạt động"],
            ["locked", "Đã khóa"],
          ].map(([v, l]) => (
            <button
              key={v}
              className={`filter-tab${filter === v ? " filter-tab--active" : ""}`}
              onClick={() => handleFilterChange(v)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Tham gia</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((u, idx) => (
              <tr key={u.id ?? idx}>
                <td>
                  <div className="td-user">
                    <div className="td-avatar">
                      {u.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(-2)
                        .join("")}
                    </div>
                    <div>
                      <p className="td-name">{u.name}</p>
                      <p className="td-email">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="td-secondary">
                  {u.joined
                    ? new Date(u.joined).toLocaleDateString("vi-VN")
                    : "—"}
                </td>
                <td>
                  <select
                    className={`admin-select role-select ${
                      u.role === "ADMIN"
                        ? "role-admin"
                        : u.role === "MODERATOR"
                          ? "role-mod"
                          : "role-user"
                    }`}
                    value={u.role}
                    onChange={(e) =>
                      setConfirm({
                        action: "role",
                        user: u,
                        newRole: e.target.value,
                      })
                    }
                  >
                    <option value="CUSTOMER">👤 User</option>
                    <option value="MODERATOR">🛡️ Moderator</option>
                    <option value="ADMIN">👑 Admin</option>
                  </select>
                </td>
                <td>
                  <span className={`status-badge status-${u.status}`}>
                    {u.status === "active" ? "● Hoạt động" : "● Đã khóa"}
                  </span>
                </td>
                <td>
                  <div className="td-actions">
                    {u.status === "active" ? (
                      <button
                        className="ta-btn ta-lock"
                        onClick={() => setConfirm({ action: "lock", user: u })}
                      >
                        🔒 Khóa
                      </button>
                    ) : (
                      <button
                        className="ta-btn ta-unlock"
                        onClick={() =>
                          setConfirm({ action: "unlock", user: u })
                        }
                      >
                        🔓 Mở
                      </button>
                    )}
                    <button
                      className="ta-btn ta-delete"
                      onClick={() => setConfirm({ action: "delete", user: u })}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="table-empty">Đang tải...</div>}
        {!loading && filtered.length === 0 && (
          <div className="table-empty">Không tìm thấy người dùng</div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <AdminPagination
          page={currentPage}
          totalPages={totalPages}
          onChange={setPage}
        />
      )}

      {confirm && (
        <ConfirmModal
          title={
            confirm.action === "lock"
              ? "Khóa tài khoản"
              : confirm.action === "unlock"
                ? "Mở khóa tài khoản"
                : confirm.action === "role"
                  ? "Đổi vai trò"
                  : "Xóa tài khoản"
          }
          desc={
            confirm.action === "role"
              ? `Đổi vai trò của "${confirm.user.name}" thành ${confirm.newRole === "ADMIN" ? "Admin" : confirm.newRole === "MODERATOR" ? "Moderator" : "User"}?`
              : `Bạn có chắc muốn ${confirm.action === "lock" ? "khóa" : confirm.action === "unlock" ? "mở khóa" : "xóa vĩnh viễn"} tài khoản "${confirm.user.name}"?`
          }
          danger={confirm.action === "delete"}
          onConfirm={doAction}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
