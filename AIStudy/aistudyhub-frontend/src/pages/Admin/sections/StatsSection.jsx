import { MONTH_USERS, MONTH_REVENUE, MONTH_LABELS } from "../shared/mockData";

function BarChart({ data, labels, color, unit = "" }) {
  const max = Math.max(...data);
  return (
    <div className="bar-chart">
      <div className="bars">
        {data.map((v, i) => (
          <div key={i} className="bar-col">
            <div className="bar-value-label">
              {v > 0 ? (unit === "₫" ? (v / 1000).toFixed(0) + "K" : v) : ""}
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  height: max > 0 ? `${(v / max) * 100}%` : "0%",
                  background: color,
                }}
                title={`${labels[i]}: ${v}${unit}`}
              />
            </div>
            <div className="bar-label">{labels[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatsSection() {
  const PLAN_DIST = [
    { label: "Miễn phí", count: 2401, pct: 84, color: "#6b7280" },
    { label: "Premium", count: 389, pct: 14, color: "#0066ff" },
    { label: "Nhóm", count: 57, pct: 2, color: "#7c3aed" },
  ];
  const DOC_TYPES = [
    { label: "PDF", count: 9842, pct: 53, color: "#ef4444" },
    { label: "PPT", count: 4218, pct: 23, color: "#f97316" },
    { label: "DOC", count: 3104, pct: 17, color: "#3b82f6" },
    { label: "IMG", count: 1228, pct: 7, color: "#10b981" },
  ];

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <h2>Thống kê & Báo cáo</h2>
        <p>Dữ liệu năm 2026</p>
      </div>

      <div className="stats-charts-grid">
        {/* Users chart */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h3>Người dùng mới theo tháng</h3>
            <span className="card-meta">Tổng 2,847 người dùng</span>
          </div>
          <BarChart data={MONTH_USERS} labels={MONTH_LABELS} color="#0066ff" />
        </div>

        {/* Revenue chart */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h3>Doanh thu theo tháng</h3>
            <span className="card-meta">Đơn vị: nghìn đồng</span>
          </div>
          <BarChart
            data={MONTH_REVENUE}
            labels={MONTH_LABELS}
            color="#059669"
            unit="₫"
          />
        </div>
      </div>

      <div className="stats-dist-grid">
        {/* Plan distribution */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h3>Phân bổ gói thành viên</h3>
          </div>
          <div className="dist-list">
            {PLAN_DIST.map((p) => (
              <div key={p.label} className="dist-row">
                <div className="dist-dot" style={{ background: p.color }} />
                <span className="dist-label">{p.label}</span>
                <div className="dist-bar-track">
                  <div
                    className="dist-bar-fill"
                    style={{ width: `${p.pct}%`, background: p.color }}
                  />
                </div>
                <span className="dist-pct">{p.pct}%</span>
                <span className="dist-count">{p.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Document types */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h3>Loại tài liệu phổ biến</h3>
          </div>
          <div className="dist-list">
            {DOC_TYPES.map((p) => (
              <div key={p.label} className="dist-row">
                <div className="dist-dot" style={{ background: p.color }} />
                <span className="dist-label">{p.label}</span>
                <div className="dist-bar-track">
                  <div
                    className="dist-bar-fill"
                    style={{ width: `${p.pct}%`, background: p.color }}
                  />
                </div>
                <span className="dist-pct">{p.pct}%</span>
                <span className="dist-count">{p.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
