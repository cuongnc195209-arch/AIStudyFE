import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getUsers,
  updateUserStatus,
  updateUserRole,
} from "../../../apis/adminApi";
import { ConfirmModal } from "../shared/ConfirmModal";
import { AdminPagination } from "../shared/AdminPagination";
import { mapUser } from "../shared/mappers";

const USERS_PAGE_SIZE = 10;

function getRoleLabel(role) {
  if (role === "MODERATOR") {
    return "Kiểm duyệt viên";
  }

  return "Người dùng";
}

function getRoleToastMessage(newRole, userName) {
  if (newRole === "MODERATOR") {
    return `Đã nâng quyền ${userName} lên Kiểm duyệt viên. Email thông báo đã được gửi.`;
  }

  return `Đã hạ quyền ${userName} về Người dùng. Email thông báo đã được gửi.`;
}

export default function UsersSection({ onToast }) {
  const onToastRef = useRef(onToast);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [confirm, setConfirm] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    onToastRef.current = onToast;
  }, [onToast]);

  const loadUsers = useCallback(async () => {
    setLoading(true);

    try {
      const res = await getUsers({ size: 9999 });

      const list = res?.content || res?.data?.content || res?.data || res || [];

      const all = Array.isArray(list)
        ? list.map((user, index) => mapUser(user, index))
        : [];

      setUsers(
        all.filter(
          (user) => user.role !== "ADMIN" && user.role !== "ROLE_ADMIN",
        ),
      );
    } catch (err) {
      console.error("Load users error:", err);

      onToastRef.current?.(
        `Lỗi tải người dùng: ${err?.message || "Không thể tải dữ liệu"}`,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadUsers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  const filtered = useMemo(() => {
    return users.filter((user) => {
      const q = search.toLowerCase().trim();

      const matchSearch =
        !q ||
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q);

      const matchFilter = filter === "all" || user.status === filter;

      return matchSearch && matchFilter;
    });
  }, [users, search, filter]);

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
    if (!confirm) {
      return;
    }

    const { action, user, newRole } = confirm;

    try {
      if (action === "lock") {
        await updateUserStatus(user.id, "BANNED");

        setUsers((currentUsers) =>
          currentUsers.map((item) =>
            item.id === user.id ? { ...item, status: "locked" } : item,
          ),
        );

        onToastRef.current?.(`Đã khóa tài khoản ${user.name}`);
      }

      if (action === "unlock") {
        await updateUserStatus(user.id, "ACTIVE");

        setUsers((currentUsers) =>
          currentUsers.map((item) =>
            item.id === user.id ? { ...item, status: "active" } : item,
          ),
        );

        onToastRef.current?.(`Đã mở khóa tài khoản ${user.name}`);
      }

      if (action === "role") {
        await updateUserRole(user.id, newRole);

        setUsers((currentUsers) =>
          currentUsers.map((item) =>
            item.id === user.id ? { ...item, role: newRole } : item,
          ),
        );

        onToastRef.current?.(getRoleToastMessage(newRole, user.name));
      }

      if (action === "delete") {
        setUsers((currentUsers) =>
          currentUsers.filter((item) => item.id !== user.id),
        );

        onToastRef.current?.(`Đã xóa ${user.name} khỏi danh sách hiển thị`);
      }
    } catch (err) {
      console.error("User action error:", err);

      onToastRef.current?.(
        `Lỗi: ${err?.message || "Không thể thực hiện thao tác"}`,
      );
    } finally {
      setConfirm(null);
    }
  }

  function getConfirmTitle() {
    if (!confirm) {
      return "";
    }

    if (confirm.action === "lock") {
      return "Khóa tài khoản";
    }

    if (confirm.action === "unlock") {
      return "Mở khóa tài khoản";
    }

    if (confirm.action === "role") {
      return "Đổi quyền người dùng";
    }

    return "Xóa tài khoản";
  }

  function getConfirmDescription() {
    if (!confirm) {
      return "";
    }

    if (confirm.action === "role") {
      return `Đổi quyền của "${confirm.user.name}" thành ${getRoleLabel(
        confirm.newRole,
      )}? Hệ thống sẽ gửi email thông báo cho người dùng.`;
    }

    if (confirm.action === "lock") {
      return `Bạn có chắc muốn khóa tài khoản "${confirm.user.name}"?`;
    }

    if (confirm.action === "unlock") {
      return `Bạn có chắc muốn mở khóa tài khoản "${confirm.user.name}"?`;
    }

    return `Bạn có chắc muốn xóa "${confirm.user.name}" khỏi danh sách hiển thị?`;
  }

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <h2>Quản lý người dùng</h2>

        <p>
          {users.length} tài khoản ·{" "}
          {users.filter((user) => user.status === "locked").length} bị khóa
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
          ].map(([value, label]) => (
            <button
              key={value}
              className={`filter-tab${
                filter === value ? " filter-tab--active" : ""
              }`}
              onClick={() => handleFilterChange(value)}
            >
              {label}
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
              <th>Gói</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((user, index) => (
              <tr key={user.id ?? index}>
                <td>
                  <div className="td-user">
                    <div className="td-avatar">
                      {user.name
                        .split(" ")
                        .filter(Boolean)
                        .map((word) => word[0])
                        .slice(-2)
                        .join("")
                        .toUpperCase() || "U"}
                    </div>

                    <div>
                      <p className="td-name">{user.name}</p>
                      <p className="td-email">{user.email}</p>
                    </div>
                  </div>
                </td>

                <td className="td-secondary">
                  {user.joined
                    ? new Date(user.joined).toLocaleDateString("vi-VN")
                    : "—"}
                </td>

                <td>
                  <select
                    className={`admin-select role-select ${
                      user.role === "MODERATOR" ? "role-mod" : "role-user"
                    }`}
                    value={user.role}
                    onChange={(e) =>
                      setConfirm({
                        action: "role",
                        user,
                        newRole: e.target.value,
                      })
                    }
                  >
                    <option value="CUSTOMER">👤 User</option>
                    <option value="MODERATOR">🛡️ Moderator</option>
                  </select>
                </td>

                <td className="td-secondary">{user.plan}</td>

                <td>
                  <span className={`status-badge status-${user.status}`}>
                    {user.status === "active" ? "● Hoạt động" : "● Đã khóa"}
                  </span>
                </td>

                <td>
                  <div className="td-actions">
                    {user.status === "active" ? (
                      <button
                        className="ta-btn ta-lock"
                        onClick={() =>
                          setConfirm({
                            action: "lock",
                            user,
                          })
                        }
                      >
                        🔒 Khóa
                      </button>
                    ) : (
                      <button
                        className="ta-btn ta-unlock"
                        onClick={() =>
                          setConfirm({
                            action: "unlock",
                            user,
                          })
                        }
                      >
                        🔓 Mở
                      </button>
                    )}

                    <button
                      className="ta-btn ta-delete"
                      onClick={() =>
                        setConfirm({
                          action: "delete",
                          user,
                        })
                      }
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
          title={getConfirmTitle()}
          desc={getConfirmDescription()}
          danger={confirm.action === "delete" || confirm.action === "lock"}
          onConfirm={doAction}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
