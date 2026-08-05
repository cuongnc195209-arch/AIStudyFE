//cấu hình hệ thống
import { useEffect, useState } from "react";
import {
  updateAdminConfig,
  updatePremiumConfig,
  updatePremiumPrice,
  getSystemConfig,
  getSubscriptionConfig,
} from "../../../apis/adminApi";

function parseAllowedFileTypes(value) {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).toUpperCase());
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim().toUpperCase())
      .filter(Boolean);
  }

  return [];
}

export default function ConfigSection({ onToast }) {
  const [config, setConfig] = useState({
    maxDailyChatTokens: 20000,
    totalStorageQuotaGb: 5,
    maxFileSizeMb: 10,
    allowedFileTypes: [],
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [premiumConfig, setPremiumConfig] = useState({
    storageQuotaGb: 10,
    maxFileSizeMb: 100,
    maxDailyChatTokens: 50000,
    price: 99000,
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

  useEffect(() => {
    let cancelled = false;

    async function loadConfigs() {
      try {
        const [systemRes, subscriptionRes] = await Promise.all([
          getSystemConfig(),
          getSubscriptionConfig(),
        ]);

        if (cancelled) return;

        if (systemRes) {
          setConfig((c) => ({
            ...c,
            maxDailyChatTokens:
              systemRes.maxDailyChatTokens ?? c.maxDailyChatTokens,
            totalStorageQuotaGb:
              systemRes.totalStorageQuotaGb ?? c.totalStorageQuotaGb,
            maxFileSizeMb: systemRes.maxFileSizeMb ?? c.maxFileSizeMb,
            allowedFileTypes:
              systemRes.allowedFileTypes !== undefined
                ? parseAllowedFileTypes(systemRes.allowedFileTypes)
                : c.allowedFileTypes,
          }));
        }

        if (subscriptionRes) {
          setPremiumConfig((c) => ({
            ...c,
            storageQuotaGb:
              subscriptionRes.totalStorageQuotaGb ??
              subscriptionRes.storageQuotaGb ??
              c.storageQuotaGb,
            maxFileSizeMb: subscriptionRes.maxFileSizeMb ?? c.maxFileSizeMb,
            maxDailyChatTokens:
              subscriptionRes.maxDailyChatTokens ?? c.maxDailyChatTokens,
            price: subscriptionRes.price ?? c.price,
          }));
        }
      } catch (err) {
        if (!cancelled) {
          onToast(`Lỗi khi tải cấu hình: ${err?.message || err}`);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadConfigs();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      await updateAdminConfig({
        maxDailyChatTokens: Number(config.maxDailyChatTokens),
        totalStorageQuotaGb: Number(config.totalStorageQuotaGb),
        maxFileSizeMb: Number(config.maxFileSizeMb),
        allowedFileTypes: config.allowedFileTypes.join(",").toLowerCase(),
      });

      await updatePremiumConfig({
        maxDailyChatTokens: Number(premiumConfig.maxDailyChatTokens),
        totalStorageQuotaGb: Number(premiumConfig.storageQuotaGb),
        maxFileSizeMb: Number(premiumConfig.maxFileSizeMb),
      });

      await updatePremiumPrice(premiumConfig.price);

      onToast("Cấu hình đã được lưu và áp dụng!");
    } catch (err) {
      onToast(`Lỗi khi lưu cấu hình: ${err?.message || err}`);
    } finally {
      setSaving(false);
    }
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

      {/* Premium plan config — nối /admin/config-member và /admin/config-member/price */}
      <div className="config-section">
        <h3 className="config-section-title">Cấu hình gói Premium</h3>
        <div className="config-grid">
          {/* Tạm ẩn "Giá gói Premium" — vẫn giữ premiumConfig.price và logic lưu, chỉ ẩn UI */}
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
          </div>
        </div>
      </div>

      <div className="config-save-row">
        <button
          className="abtn-primary abtn-lg"
          disabled={saving || loading}
          onClick={saveConfig}
        >
          {saving ? "Đang lưu..." : "💾 Lưu cấu hình"}
        </button>
      </div>
    </div>
  );
}
