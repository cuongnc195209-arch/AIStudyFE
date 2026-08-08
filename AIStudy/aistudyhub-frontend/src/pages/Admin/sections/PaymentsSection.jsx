import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAdminPayments } from "../../../apis/adminApi";
import { AdminPagination } from "../shared/AdminPagination";

const PAYMENTS_PAGE_SIZE = 10;

function getListFromResponse(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.content)) return res.content;
  if (Array.isArray(res?.data?.content)) return res.data.content;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

function formatCurrency(value) {
  const amount = Number(value || 0);

  if (amount === 0) {
    return "0đ";
  }

  return amount.toLocaleString("vi-VN") + "₫";
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("vi-VN");
}

function getStatusMeta(status) {
  const value = String(status || "").toUpperCase();

  if (value === "MANUAL_CONFIRMED" || value === "PAID" || value === "SUCCESS") {
    return { label: "Đã thanh toán", className: "pay-status pay-status--paid" };
  }

  if (value === "PENDING_CONFIRMATION" || value === "PENDING") {
    return { label: "Chờ xác nhận", className: "pay-status pay-status--pending" };
  }

  if (value === "CANCELLED" || value === "FAILED") {
    return { label: "Đã hủy", className: "pay-status pay-status--failed" };
  }

  return { label: value || "Không rõ", className: "pay-status" };
}

function mapPayment(payment) {
  return {
    id: payment.paymentId || payment.orderCode,
    orderCode: payment.orderCode,
    userFullName: payment.userFullName || payment.userEmail || "Người dùng",
    userEmail: payment.userEmail || "—",
    amount: payment.displayPrice ?? payment.amount,
    status: String(payment.status || "").toUpperCase(),
    content: payment.transferContent || payment.description || "—",
    createdAt: payment.createdAt,
    paidAt: payment.paidAt,
  };
}

export default function PaymentsSection({ onToast }) {
  const onToastRef = useRef(onToast);

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [page, setPage] = useState(1);

  useEffect(() => {
    onToastRef.current = onToast;
  }, [onToast]);

  const loadPayments = useCallback(async () => {
    setLoading(true);

    try {
      const res = await getAdminPayments({ size: 9999 });
      const list = getListFromResponse(res);

      setPayments(list.map(mapPayment));
    } catch (err) {
      console.error("Load admin payments error:", err);

      onToastRef.current?.(
        `Lỗi tải giao dịch: ${err?.message || "Không thể tải dữ liệu"}`,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPayments();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadPayments]);

  const filtered = useMemo(() => {
    return payments.filter((payment) => {
      const q = search.toLowerCase().trim();

      const matchSearch =
        !q ||
        String(payment.orderCode || "").includes(q) ||
        payment.userFullName.toLowerCase().includes(q) ||
        payment.userEmail.toLowerCase().includes(q) ||
        payment.content.toLowerCase().includes(q);

      const matchFilter = filter === "all" || payment.status === filter;

      return matchSearch && matchFilter;
    });
  }, [payments, search, filter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAYMENTS_PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages);

  const paginated = filtered.slice(
    (currentPage - 1) * PAYMENTS_PAGE_SIZE,
    currentPage * PAYMENTS_PAGE_SIZE,
  );

  const paidCount = payments.filter(
    (payment) => payment.status === "MANUAL_CONFIRMED",
  ).length;
  const pendingCount = payments.filter(
    (payment) => payment.status === "PENDING_CONFIRMATION",
  ).length;

  function handleSearchChange(value) {
    setSearch(value);
    setPage(1);
  }

  function handleFilterChange(value) {
    setFilter(value);
    setPage(1);
  }

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <div>
          <h2>Quản lý giao dịch</h2>

          <p>
            {payments.length} giao dịch · {paidCount} đã thanh toán ·{" "}
            {pendingCount} chờ xác nhận
          </p>
        </div>

        <button
          className="ta-btn ta-view"
          type="button"
          onClick={loadPayments}
          disabled={loading}
        >
          🔄 Tải lại
        </button>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <span className="admin-search-icon">🔍</span>

          <input
            className="admin-search"
            placeholder="Tìm mã đơn, tên, email, nội dung..."
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
            ["MANUAL_CONFIRMED", "Đã thanh toán"],
            ["PENDING_CONFIRMATION", "Chờ xác nhận"],
            ["CANCELLED", "Đã hủy"],
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
              <th>Mã đơn hàng</th>
              <th>Người dùng</th>
              <th>Nội dung</th>
              <th>Số tiền</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Ngày thanh toán</th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((payment) => {
              const status = getStatusMeta(payment.status);

              return (
                <tr key={payment.id}>
                  <td className="pay-order-code">{payment.orderCode}</td>

                  <td>
                    <div className="td-user">
                      <div>
                        <p className="td-name">{payment.userFullName}</p>
                        <p className="td-email">{payment.userEmail}</p>
                      </div>
                    </div>
                  </td>

                  <td className="td-secondary">{payment.content}</td>

                  <td>{formatCurrency(payment.amount)}</td>

                  <td>
                    <span className={status.className}>{status.label}</span>
                  </td>

                  <td className="td-secondary">
                    {formatDate(payment.createdAt)}
                  </td>

                  <td className="td-secondary">
                    {formatDate(payment.paidAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {loading && <div className="table-empty">Đang tải giao dịch...</div>}

        {!loading && filtered.length === 0 && (
          <div className="table-empty">Không tìm thấy giao dịch nào.</div>
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
