//cấu hình hệ thống
import { useState } from "react";
import { updateAdminConfig } from "../../../apis/adminApi";
import { SUBJECTS } from "../shared/mockData";

// Form cấu hình hệ thống. Lưu ý: state config luôn khởi tạo giá trị rỗng/0 — không có useEffect nào
// gọi API để load cấu hình HIỆN TẠI từ backend, nên mỗi lần vào trang admin sẽ thấy form trống,
// dù trước đó đã lưu cấu hình khác.
export default function ConfigSection({ onToast }) {
  const [config, setConfig] = useState({
    maxDailyChatTokens: 0,
    totalStorageQuotaGb: 0,
    maxFileSizeMb: 0,
    allowedFileTypes: [],
  });
  const [saving, setSaving] = useState(false);
  const [subjects, setSubjects] = useState(SUBJECTS);
  const [newSubject, setNewSubject] = useState("");

  // Cấu hình riêng cho gói Premium — chưa có API backend nào cho việc này (xem MembershipSection
  // trong SettingsPage.jsx, PLANS ở đó vẫn đang hardcode cứng). State này chỉ lưu ở client,
  // chưa gửi lên đâu cả — cần backend có endpoint quản lý gói Premium rồi mới nối dữ liệu thật.
  const [premiumConfig, setPremiumConfig] = useState({
    storageQuotaGb: 50,
    maxFileSizeMb: 100,
    maxDailyChatTokens: 0,
  });
  const ALL_FORMATS = [
    "PDF",
    "DOCX",
    "PPTX",
    "DOC",
    "PPT",
    "JPG",
    "PNG",
    "MP4",
    "ZIP",
    "TXT",
  ];

  function toggleFormat(fmt) {
    setConfig((c) => ({
      ...c,
      allowedFileTypes: c.allowedFileTypes.includes(fmt)
        ? c.allowedFileTypes.filter((f) => f !== fmt)
        : [...c.allowedFileTypes, fmt],
    }));
  }

  async function saveConfig() {
    setSaving(true);
    try {
      const result = await updateAdminConfig({
        maxDailyChatTokens: Number(config.maxDailyChatTokens),
        totalStorageQuotaGb: Number(config.totalStorageQuotaGb),
        maxFileSizeMb: Number(config.maxFileSizeMb),
        allowedFileTypes: config.allowedFileTypes.join(",").toLowerCase(),
      });
      console.log("Update config result:", result);
      onToast("Cấu hình đã được lưu và áp dụng!");
    } catch (err) {
      onToast(`Lỗi khi lưu cấu hình: ${err?.message || err}`);
    } finally {
      setSaving(false);
    }
  }

  // Danh sách môn học ở đây chỉ sửa trong state local (subjects) — KHÔNG có nút lưu riêng
  // và không thấy gửi lên API nào, nên thay đổi sẽ mất khi rời trang.
  function addSubject() {
    const s = newSubject.trim();
    if (s && !subjects.includes(s)) {
      setSubjects((p) => [...p, s]);
      setNewSubject("");
    }
  }

  function removeSubject(s) {
    setSubjects((p) => p.filter((x) => x !== s));
  }

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <h2>Cấu hình hệ thống</h2>
        <p>Thay đổi sẽ áp dụng ngay lập tức</p>
      </div>

      {/* Upload limits */}
      <div className="config-section">
        <h3 className="config-section-title">Giới hạn Upload & Lưu trữ</h3>
        <div className="config-grid">
          <div className="config-item">
            <label>Dung lượng tối đa mỗi file (MB)</label>
            <div className="config-input-row">
              <input
                type="number"
                min={1}
                max={500}
                value={config.maxFileSizeMb}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    maxFileSizeMb: +e.target.value,
                  }))
                }
              />
              <span className="config-unit">MB</span>
            </div>
            <p className="config-hint">
              Áp dụng cho người dùng gói Free
            </p>
          </div>
          <div className="config-item">
            <label>Tổng dung lượng lưu trữ (GB)</label>
            <div className="config-input-row">
              <input
                type="number"
                min={1}
                max={100}
                value={config.totalStorageQuotaGb}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    totalStorageQuotaGb: +e.target.value,
                  }))
                }
              />
              <span className="config-unit">GB</span>
            </div>
          </div>
          <div className="config-item">
            <label>Giới hạn token chat AI / ngày</label>
            <div className="config-input-row">
              <input
                type="number"
                min={0}
                value={config.maxDailyChatTokens}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    maxDailyChatTokens: +e.target.value,
                  }))
                }
              />
              <span className="config-unit">token/ngày</span>
            </div>
          </div>
        </div>
      </div>

      {/* Allowed formats */}
      <div className="config-section">
        <h3 className="config-section-title">
          Định dạng file được phép upload
        </h3>
        <div className="format-grid">
          {ALL_FORMATS.map((fmt) => (
            <label
              key={fmt}
              className={`format-checkbox${config.allowedFileTypes.includes(fmt) ? " format-checkbox--checked" : ""}`}
            >
              <input
                type="checkbox"
                checked={config.allowedFileTypes.includes(fmt)}
                onChange={() => toggleFormat(fmt)}
              />
              {fmt}
            </label>
          ))}
        </div>
      </div>

      {/* Premium plan config — local-only, chưa nối API backend */}
      <div className="config-section">
        <h3 className="config-section-title">Cấu hình gói Premium</h3>
        <div className="config-grid">
          <div className="config-item">
            <label>Dung lượng lưu trữ Premium</label>
            <div className="config-input-row">
              <input
                type="number"
                min={1}
                value={premiumConfig.storageQuotaGb}
                onChange={(e) =>
                  setPremiumConfig((c) => ({
                    ...c,
                    storageQuotaGb: +e.target.value,
                  }))
                }
              />
              <span className="config-unit">GB</span>
            </div>
          </div>
          <div className="config-item">
            <label>Dung lượng tối đa mỗi file (Premium)</label>
            <div className="config-input-row">
              <input
                type="number"
                min={1}
                value={premiumConfig.maxFileSizeMb}
                onChange={(e) =>
                  setPremiumConfig((c) => ({
                    ...c,
                    maxFileSizeMb: +e.target.value,
                  }))
                }
              />
              <span className="config-unit">MB</span>
            </div>
          </div>
          <div className="config-item">
            <label>Giới hạn token chat AI Premium / ngày</label>
            <div className="config-input-row">
              <input
                type="number"
                min={0}
                value={premiumConfig.maxDailyChatTokens}
                onChange={(e) =>
                  setPremiumConfig((c) => ({
                    ...c,
                    maxDailyChatTokens: +e.target.value,
                  }))
                }
              />
              <span className="config-unit">token/ngày</span>
            </div>
            <p className="config-hint">0 = không giới hạn</p>
          </div>
        </div>
      </div>

      {/* Subject categories */}
      <div className="config-section">
        <h3 className="config-section-title">Danh sách Môn học</h3>
        <div className="subject-tags">
          {subjects.map((s) => (
            <div key={s} className="subject-tag">
              {s}
              <button
                className="subject-remove"
                onClick={() => removeSubject(s)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="add-subject-row">
          <input
            className="add-subject-input"
            placeholder="Thêm môn học mới..."
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSubject()}
          />
          <button className="abtn-primary" onClick={addSubject}>
            + Thêm
          </button>
        </div>
      </div>

      <div className="config-save-row">
        <button
          className="abtn-primary abtn-lg"
          disabled={saving}
          onClick={saveConfig}
        >
          {saving ? "Đang lưu..." : "💾 Lưu cấu hình"}
        </button>
      </div>
    </div>
  );
}
