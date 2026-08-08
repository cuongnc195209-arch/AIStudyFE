import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import { getPaymentHistory } from "../../apis/memberApi";
import "../Settings/SettingsPage.css";
import "./PaymentHistoryPage.css";

function formatCurrency(value) {
  const amount = Number(value || 0);

  if (amount === 0) {
    return "0đ";
  }

  return amount.toLocaleString("vi-VN") + "₫";
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("vi-VN");
}

function getStatusMeta(status) {
  const value = String(status || "").toUpperCase();

  if (value === "MANUAL_CONFIRMED" || value === "PAID" || value === "SUCCESS") {
    return { label: "Đã thanh toán", className: "th-status th-status--paid" };
  }

  if (value === "PENDING_CONFIRMATION" || value === "PENDING") {
    return { label: "Chờ xác nhận", className: "th-status th-status--pending" };
  }

  if (value === "CANCELLED" || value === "FAILED") {
    return { label: "Đã hủy", className: "th-status th-status--failed" };
  }

  return { label: value || "Không rõ", className: "th-status" };
}

function getListFromResponse(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.content)) return res.content;
  if (Array.isArray(res?.data?.content)) return res.data.content;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

export default function PaymentHistoryPage() {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setLoading(true);
      setError("");

      try {
        const res = await getPaymentHistory();

        if (!cancelled) {
          setTransactions(getListFromResponse(res));
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Load payment history error:", err);
          setTransactions([]);
          setError(
            err?.message ||
              err?.data?.message ||
              "Không thể tải lịch sử giao dịch.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTransactions = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      return transactions;
    }

    return transactions.filter((tx) => {
      return (
        String(tx.orderCode || "").includes(q) ||
        String(tx.transferContent || "").toLowerCase().includes(q) ||
        String(tx.description || "").toLowerCase().includes(q) ||
        String(tx.status || "").toLowerCase().includes(q)
      );
    });
  }, [transactions, search]);

  return (
    <AppLayout>
      <div className="settings-page">
        <div className="settings-header">
          <h1 className="settings-title">Lịch sử giao dịch</h1>
          <p className="settings-sub">
            Theo dõi toàn bộ giao dịch nâng cấp Premium của tài khoản bạn.
          </p>
        </div>

        <div className="settings-content">
          <div className="section-content">
            <div className="section-head th-section-head">
              <div>
                <h2>Giao dịch của bạn</h2>
                <p>{transactions.length} giao dịch</p>
              </div>

              <button
                className="btn-outline btn-sm"
                type="button"
                onClick={() => navigate("/premium")}
              >
                ⚡ Nâng cấp Premium
              </button>
            </div>

            <div className="th-toolbar">
              <input
                className="th-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo mã đơn, nội dung, trạng thái..."
              />
            </div>

            {error && <p className="th-error">⚠️ {error}</p>}

            <div className="th-table-wrap">
              <table className="th-table">
                <thead>
                  <tr>
                    <th>Mã đơn hàng</th>
                    <th>Nội dung</th>
                    <th>Số tiền</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th>Ngày thanh toán</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransactions.map((tx) => {
                    const status = getStatusMeta(tx.status);

                    return (
                      <tr key={tx.orderCode}>
                        <td className="th-order-code">{tx.orderCode}</td>
                        <td className="th-secondary">
                          {tx.transferContent || tx.description || "—"}
                        </td>
                        <td>{formatCurrency(tx.displayPrice ?? tx.amount)}</td>
                        <td>
                          <span className={status.className}>
                            {status.label}
                          </span>
                        </td>
                        <td className="th-secondary">
                          {formatDate(tx.createdAt)}
                        </td>
                        <td className="th-secondary">
                          {formatDate(tx.paidAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {loading && (
                <div className="th-table-empty">Đang tải lịch sử giao dịch...</div>
              )}

              {!loading && filteredTransactions.length === 0 && (
                <div className="th-table-empty">
                  {search
                    ? "Không tìm thấy giao dịch phù hợp."
                    : "Bạn chưa có giao dịch nào."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
