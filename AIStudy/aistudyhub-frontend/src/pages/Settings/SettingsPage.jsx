import { useState, useRef, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { updateProfile, changePassword } from '../../apis/authApi'
import { getDocuments } from '../../apis/documentApi'
import './SettingsPage.css'

/* ── Nav sections ── */
const SECTIONS = [
  { id: 'profile',       icon: '👤', label: 'Hồ sơ cá nhân' },
  { id: 'security',      icon: '🔒', label: 'Bảo mật' },
  { id: 'membership',    icon: '⭐', label: 'Gói thành viên' },
]

/* ── Toast ── */
function Toast({ message, onDone }) {
  return (
    <div className="toast" onAnimationEnd={onDone}>
      ✅ {message}
    </div>
  )
}

/* ── Section: Profile ── */
function ProfileSection({ onSave }) {
  const fileRef = useRef()
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const [form, setForm] = useState({
    name: storedUser.fullName || '',
    email: storedUser.email || '',
    studentCode: storedUser.studentCode || '',
    schoolName: storedUser.schoolName || '',
    department: storedUser.department || '',
    assignedSubject: storedUser.assignedSubject || '',
    avatar: null,
  })
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const userId = storedUser.id || storedUser.userId || storedUser.user_id || ''
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function handleCopyId() {
    navigator.clipboard.writeText(userId)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    set('avatar', file)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const result = await updateProfile({
        fullName: form.name,
        studentCode: form.studentCode,
        schoolName: form.schoolName,
        department: form.department,
        assignedSubject: form.assignedSubject,
      })
      const profileData = result?.data || {}
      const updatedUser = { ...storedUser, ...profileData }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      onSave('Cập nhật hồ sơ thành công!')
    } catch (err) {
      setError(err?.message || 'Cập nhật thất bại')
    } finally {
      setSaving(false)
    }
  }

  const initials = form.name
    ? form.name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
    : (form.email[0] || 'U').toUpperCase()

  return (
    <div className="section-content">
      <div className="section-head">
        <h2>Hồ sơ cá nhân</h2>
        <p>Cập nhật thông tin cá nhân của bạn</p>
      </div>

      {/* Avatar */}
      <div className="avatar-row">
        <div className="avatar-preview">
          {preview
            ? <img src={preview} alt="avatar" className="avatar-img" />
            : <div className="avatar-initials">{initials}</div>
          }
          <button className="avatar-edit-btn" onClick={() => fileRef.current.click()} title="Đổi ảnh">📷</button>
        </div>
        <div className="avatar-info">
          <p className="avatar-name">{form.name || form.email}</p>
          <p className="avatar-email">{form.email}</p>
          <button className="btn-outline" onClick={() => fileRef.current.click()}>Đổi ảnh đại diện</button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
        </div>
      </div>

      <div className="form-grid">
        <div>
          <label>Họ và tên</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nhập họ tên" />
        </div>
        <div>
          <label>Email <span className="badge-locked">Không thể thay đổi</span></label>
          <input value={form.email} disabled className="input-locked" />
        </div>
        <div>
          <label>Mã định danh (User ID) <span className="badge-locked">Dùng để chia sẻ tài liệu</span></label>
          <div className="id-field-row">
            <input value={userId} disabled className="input-locked" />
            <button type="button" className="copy-btn" onClick={handleCopyId}>
              {copied ? '✅ Đã chép' : '📋 Sao chép'}
            </button>
          </div>
        </div>
        <div>
          <label>Mã sinh viên</label>
          <input value={form.studentCode} onChange={e => set('studentCode', e.target.value)} placeholder="Ví dụ: SE161878" />
        </div>
        <div>
          <label>Trường đại học</label>
          <input value={form.schoolName} onChange={e => set('schoolName', e.target.value)} placeholder="Tên trường" />
        </div>
        <div>
          <label>Khoa / Ngành</label>
          <input value={form.department} onChange={e => set('department', e.target.value)} placeholder="Ví dụ: Software Engineering" />
        </div>
        <div>
          <label>Môn học phụ trách</label>
          <input value={form.assignedSubject} onChange={e => set('assignedSubject', e.target.value)} placeholder="Ví dụ: Lập trình Web" />
        </div>
      </div>

      {error && <p style={{ color: 'red', marginTop: '8px' }}>{error}</p>}

      <div className="section-actions">
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Đang lưu...' : '💾 Lưu thay đổi'}
        </button>
      </div>
    </div>
  )
}

/* ── Section: Security ── */
function SecuritySection({ onSave }) {
  const [form, setForm] = useState({ current: '', newPw: '', confirm: '' })
  const [show, setShow] = useState({ current: false, newPw: false, confirm: false })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleShow = (k) => setShow(s => ({ ...s, [k]: !s[k] }))

  const SESSIONS = [
    { id: 1, device: 'Chrome · Windows 11', location: 'Hà Nội, VN', time: 'Đang hoạt động', current: true },
    { id: 2, device: 'Safari · iPhone', location: 'TP. HCM, VN', time: '2 giờ trước', current: false },
  ]

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.current) errs.current = 'Nhập mật khẩu hiện tại'
    if (form.newPw.length < 8) errs.newPw = 'Mật khẩu tối thiểu 8 ký tự'
    if (form.newPw !== form.confirm) errs.confirm = 'Mật khẩu không khớp'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSaving(true)
    try {
      await changePassword({ currentPassword: form.current, newPassword: form.newPw })
      setForm({ current: '', newPw: '', confirm: '' })
      onSave('Đổi mật khẩu thành công!')
    } catch (err) {
      setErrors({ current: err?.message || 'Đổi mật khẩu thất bại. Kiểm tra lại mật khẩu hiện tại.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="section-content">
      <div className="section-head">
        <h2>Bảo mật</h2>
        <p>Quản lý mật khẩu và phiên đăng nhập</p>
      </div>

      <div className="subsection">
        <h3 className="subsection-title">Đổi mật khẩu</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {[
              { key: 'current', label: 'Mật khẩu hiện tại' },
              { key: 'newPw',   label: 'Mật khẩu mới' },
              { key: 'confirm', label: 'Xác nhận mật khẩu mới' },
            ].map(({ key, label }) => (
              <div key={key} className="fg-full">
                <label>{label}</label>
                <div className="pw-wrap">
                  <input
                    type={show[key] ? 'text' : 'password'}
                    value={form[key]}
                    onChange={e => set(key, e.target.value)}
                    placeholder="••••••••"
                    className={errors[key] ? 'input-error' : ''}
                  />
                  <button type="button" className="pw-toggle" onClick={() => toggleShow(key)}>
                    {show[key] ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors[key] && <p className="error-msg">{errors[key]}</p>}
              </div>
            ))}
          </div>
          <div className="pw-rules">
            <p className="pw-rules-title">Yêu cầu mật khẩu:</p>
            <ul>
              <li className={form.newPw.length >= 8 ? 'rule-ok' : ''}>Ít nhất 8 ký tự</li>
              <li className={/[A-Z]/.test(form.newPw) ? 'rule-ok' : ''}>Có chữ hoa</li>
              <li className={/[0-9]/.test(form.newPw) ? 'rule-ok' : ''}>Có chữ số</li>
            </ul>
          </div>
          <div className="section-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Đang cập nhật...' : '🔒 Cập nhật mật khẩu'}
            </button>
          </div>
        </form>
      </div>

    </div>
  )
}

/* ── Section: Notifications ── */
function NotificationsSection({ onSave }) {
  const [settings, setSettings] = useState({
    uploadSuccess:  { label: 'Upload tài liệu thành công', enabled: true },
    uploadFail:     { label: 'Upload tài liệu thất bại', enabled: true },
    forumComment:   { label: 'Có bình luận vào bài đăng của tôi', enabled: true },
    forumMention:   { label: 'Được @mention trong diễn đàn', enabled: true },
    docDownloaded:  { label: 'Có người tải tài liệu của tôi', enabled: false },
    paymentSuccess: { label: 'Thanh toán thành công', enabled: true },
    paymentFail:    { label: 'Thanh toán thất bại', enabled: true },
    courseComplete: { label: 'Hoàn thành khóa học', enabled: true },
    newsletter:     { label: 'Bản tin và cập nhật tính năng', enabled: false },
  })

  const toggle = (key) =>
    setSettings(s => ({ ...s, [key]: { ...s[key], enabled: !s[key].enabled } }))

  const GROUPS = [
    { title: 'Tài liệu', keys: ['uploadSuccess', 'uploadFail', 'docDownloaded'] },
    { title: 'Diễn đàn', keys: ['forumComment', 'forumMention'] },
    { title: 'Thanh toán & Khóa học', keys: ['paymentSuccess', 'paymentFail', 'courseComplete'] },
    { title: 'Khác', keys: ['newsletter'] },
  ]

  return (
    <div className="section-content">
      <div className="section-head">
        <h2>Thông báo</h2>
        <p>Chọn loại thông báo bạn muốn nhận</p>
      </div>

      {GROUPS.map(group => (
        <div key={group.title} className="subsection">
          <h3 className="subsection-title">{group.title}</h3>
          <div className="toggle-list">
            {group.keys.map(key => (
              <div key={key} className="toggle-row">
                <span className="toggle-label">{settings[key].label}</span>
                <button
                  className={`toggle-btn${settings[key].enabled ? ' toggle-btn--on' : ''}`}
                  onClick={() => toggle(key)}
                  role="switch"
                  aria-checked={settings[key].enabled}
                >
                  <span className="toggle-thumb" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="section-actions">
        <button className="btn-primary" onClick={() => onSave('Cài đặt thông báo đã được lưu!')}>
          💾 Lưu cài đặt
        </button>
      </div>
    </div>
  )
}

/* ── Section: Storage ── */
const EXT_COLORS = {
  pdf: '#ef4444', ppt: '#f97316', pptx: '#f97316',
  doc: '#3b82f6', docx: '#3b82f6',
  xls: '#10b981', xlsx: '#10b981',
  jpg: '#8b5cf6', jpeg: '#8b5cf6', png: '#8b5cf6', gif: '#8b5cf6', webp: '#8b5cf6',
  mp4: '#ec4899', mp3: '#ec4899',
  zip: '#64748b', rar: '#64748b',
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

function toGB(bytes) {
  return bytes / (1024 * 1024 * 1024)
}

function StorageSection() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getDocuments()
      .then(res => {
        if (cancelled) return
        const list = res?.data || res || []
        const arr = Array.isArray(list) ? list : []
        setDocs(arr)
      })
      .catch(err => {
        if (cancelled) return
        console.error('Documents API error:', err)
        setError('Không thể tải dữ liệu lưu trữ.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="section-content">
        <div className="section-head">
          <h2>Lưu trữ</h2>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="section-content">
        <div className="section-head">
          <h2>Lưu trữ</h2>
          <p style={{ color: '#ef4444' }}>{error}</p>
        </div>
      </div>
    )
  }

  const totalBytes = 5 * 1024 * 1024 * 1024
  const usedBytes  = docs.reduce((s, d) => s + (d.fileSize || 0), 0)
  const freeBytes  = totalBytes - usedBytes
  const usedPct    = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0

  const fileList = docs.map(d => {
    const ext = (d.fileType || d.ext || '').toLowerCase()
    const name = d.documentName || d.name || 'Untitled'
    return {
      name,
      ext,
      size: d.fileSize || 0,
      color: EXT_COLORS[ext] || '#94a3b8',
      label: ext.toUpperCase() || '?',
    }
  }).sort((a, b) => b.size - a.size)

  return (
    <div className="section-content">
      <div className="section-head">
        <h2>Lưu trữ</h2>
        <p>Quản lý dung lượng Cloud Storage</p>
      </div>

      <div className="storage-overview">
        <div className="storage-circle-wrap">
          <svg viewBox="0 0 120 120" className="storage-circle">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#f3f4f6" strokeWidth="12" />
            <circle
              cx="60" cy="60" r="50"
              fill="none" stroke="#0066ff" strokeWidth="12"
              strokeDasharray={`${usedPct * 3.14159} 314.159`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="storage-circle-text">
            <span className="storage-circle-used">{formatSize(usedBytes)}</span>
            <span className="storage-circle-label">đã dùng</span>
          </div>
        </div>
        <div className="storage-details">
          <div className="storage-stat-row">
            <span>Đã sử dụng</span>
            <strong>{formatSize(usedBytes)}</strong>
          </div>
          <div className="storage-stat-row">
            <span>Còn trống</span>
            <strong>{formatSize(freeBytes)}</strong>
          </div>
          <div className="storage-stat-row">
            <span>Tổng dung lượng</span>
            <strong>{formatSize(totalBytes)}</strong>
          </div>
          <div className="storage-main-bar">
            <div className="storage-main-fill" style={{ width: `${Math.min(usedPct, 100)}%` }} />
          </div>
          <p className="storage-pct">{usedPct.toFixed(0)}% đã sử dụng</p>
        </div>
      </div>

      <div className="storage-upgrade-card">
        <div className="upgrade-card-left">
          <div className="upgrade-card-icon">⚡</div>
          <div>
            <p className="upgrade-card-title">Cần thêm dung lượng?</p>
            <p className="upgrade-card-sub">Nâng cấp Premium để có đến <strong>50 GB</strong> lưu trữ</p>
          </div>
        </div>
        <button className="btn-primary">Nâng cấp ngay</button>
      </div>
    </div>
  )
}

/* ── Section: Membership ── */
function MembershipSection() {
  const PLANS = [
    {
      id: 'free',
      name: 'Miễn phí',
      price: '0₫',
      period: '/tháng',
      current: true,
      color: '#6b7280',
      features: [
        '5 GB lưu trữ',
        '20 câu hỏi AI/ngày',
        'Upload tối đa 10 MB/file',
        'Diễn đàn cơ bản',
      ],
      missing: ['Khóa học Premium', 'AI không giới hạn', 'Gói nhóm'],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '99.000₫',
      period: '/tháng',
      current: false,
      color: '#0066ff',
      badge: 'Phổ biến nhất',
      features: [
        '50 GB lưu trữ',
        'AI không giới hạn',
        'Upload tối đa 100 MB/file',
        'Truy cập tất cả khóa học',
        'Ưu tiên hỗ trợ',
      ],
      missing: ['Gói nhóm'],
    },
    {
      id: 'group',
      name: 'Nhóm',
      price: '299.000₫',
      period: '/tháng',
      current: false,
      color: '#7c3aed',
      badge: 'Tiết kiệm nhất',
      features: [
        '200 GB lưu trữ (chia sẻ)',
        'Tối đa 5 thành viên',
        'AI không giới hạn',
        'Chia sẻ tài liệu nội bộ',
        'Tất cả tính năng Premium',
        'Dashboard nhóm',
      ],
      missing: [],
    },
  ]

  return (
    <div className="section-content">
      <div className="section-head">
        <h2>Gói thành viên</h2>
        <p>Bạn đang dùng gói <strong>Miễn phí</strong> · Nâng cấp để mở khóa thêm tính năng</p>
      </div>

      <div className="plans-grid">
        {PLANS.map(plan => (
          <div key={plan.id} className={`plan-card${plan.current ? ' plan-card--current' : ''}${plan.id === 'premium' ? ' plan-card--featured' : ''}`}>
            {plan.badge && <div className="plan-badge" style={{ background: plan.color }}>{plan.badge}</div>}
            <div className="plan-top">
              <h3 className="plan-name">{plan.name}</h3>
              <div className="plan-price">
                <span className="plan-amount" style={{ color: plan.color }}>{plan.price}</span>
                <span className="plan-period">{plan.period}</span>
              </div>
            </div>

            <ul className="plan-features">
              {plan.features.map(f => (
                <li key={f} className="feature-item feature-item--ok">
                  <span className="feature-check" style={{ color: plan.color }}>✓</span>
                  {f}
                </li>
              ))}
              {plan.missing.map(f => (
                <li key={f} className="feature-item feature-item--no">
                  <span className="feature-check">✗</span>
                  {f}
                </li>
              ))}
            </ul>

            {plan.current ? (
              <div className="plan-current-badge">✓ Gói hiện tại</div>
            ) : (
              <button className="plan-cta" style={{ background: plan.color }}>
                Nâng cấp {plan.name}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="billing-info">
        <h3 className="subsection-title">Lịch sử thanh toán</h3>
        <p className="billing-empty">Chưa có giao dịch nào. Gói hiện tại của bạn là Miễn phí.</p>
      </div>
    </div>
  )
}

/* ── Section: Account ── */
function AccountSection({ onSave }) {
  const [deleteInput, setDeleteInput] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const CONFIRM_PHRASE = 'XÓA TÀI KHOẢN'

  return (
    <div className="section-content">
      <div className="section-head">
        <h2>Tài khoản</h2>
        <p>Quản lý dữ liệu và cài đặt tài khoản</p>
      </div>

      <div className="subsection">
        <h3 className="subsection-title">Xuất dữ liệu</h3>
        <p className="subsection-desc">Tải xuống toàn bộ dữ liệu của bạn bao gồm tài liệu, lịch sử chat và thông tin tài khoản.</p>
        <button className="btn-outline" onClick={() => onSave('Đang chuẩn bị file xuất — bạn sẽ nhận email khi hoàn tất!')}>
          📦 Xuất toàn bộ dữ liệu
        </button>
      </div>

      <div className="subsection danger-zone">
        <div className="danger-header">
          <span className="danger-icon">⚠️</span>
          <h3 className="danger-title">Vùng nguy hiểm</h3>
        </div>

        <div className="danger-item">
          <div>
            <p className="danger-item-title">Đăng xuất tất cả thiết bị</p>
            <p className="danger-item-desc">Kết thúc tất cả phiên đăng nhập trên mọi thiết bị</p>
          </div>
          <button className="btn-danger-outline" onClick={() => onSave('Đã đăng xuất tất cả thiết bị!')}>
            Đăng xuất hết
          </button>
        </div>

        <div className="danger-item">
          <div>
            <p className="danger-item-title">Xóa tài khoản vĩnh viễn</p>
            <p className="danger-item-desc">Xóa toàn bộ tài liệu, lịch sử, dữ liệu. Không thể hoàn tác.</p>
          </div>
          <button className="btn-danger" onClick={() => setShowDeleteConfirm(true)}>
            🗑️ Xóa tài khoản
          </button>
        </div>

        {showDeleteConfirm && (
          <div className="delete-confirm-box">
            <p className="delete-warn">Hành động này <strong>không thể hoàn tác</strong>. Nhập <code>{CONFIRM_PHRASE}</code> để xác nhận:</p>
            <div className="delete-confirm-input-row">
              <input
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                placeholder={CONFIRM_PHRASE}
                className="delete-confirm-input"
              />
              <button
                className="btn-danger"
                disabled={deleteInput !== CONFIRM_PHRASE}
                onClick={() => alert('Tính năng này chỉ demo — tài khoản không bị xóa.')}
              >
                Xác nhận xóa
              </button>
              <button className="btn-outline" onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }}>
                Hủy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile')
  const [toast, setToast] = useState(null)

  function showToast(msg) {
    setToast(msg)
  }

  const SECTION_MAP = {
    profile:       <ProfileSection       onSave={showToast} />,
    security:      <SecuritySection      onSave={showToast} />,
    membership:    <MembershipSection />,
  }

  return (
    <AppLayout>
      <div className="settings-page">
        <div className="settings-header">
          <h1 className="settings-title">Cài đặt</h1>
          <p className="settings-sub">Quản lý tài khoản và tùy chỉnh trải nghiệm</p>
        </div>

        <div className="settings-layout">
          {/* ── Left nav ── */}
          <nav className="settings-nav">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                className={`settings-nav-btn${activeSection === s.id ? ' settings-nav-btn--active' : ''}${s.id === 'account' ? ' settings-nav-btn--danger' : ''}`}
                onClick={() => setActiveSection(s.id)}
              >
                <span className="nav-btn-icon">{s.icon}</span>
                <span>{s.label}</span>
                <span className="nav-btn-arrow">›</span>
              </button>
            ))}
          </nav>

          {/* ── Content ── */}
          <div className="settings-content">
            {SECTION_MAP[activeSection]}
          </div>
        </div>
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </AppLayout>
  )
}
