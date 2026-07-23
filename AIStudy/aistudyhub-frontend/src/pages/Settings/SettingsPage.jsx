import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { updateProfile, changePassword } from '../../apis/authApi'
import './SettingsPage.css'

/* ── Nav sections ── */
const SECTIONS = [
  { id: 'profile',       icon: '👤', label: 'Hồ sơ cá nhân' },
  { id: 'security',      icon: '🔒', label: 'Bảo mật' },
]

/* ── Toast ── */
function Toast({ message, onDone }) {
  return (
    <div className="toast" onAnimationEnd={onDone}>
      ✅ {message}
    </div>
  )
}

/* ── Section: Profile ── Sửa thông tin cá nhân */
function ProfileSection({ onSave }) {
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const [form, setForm] = useState({
    name: storedUser.fullName || '',
    email: storedUser.email || '',
    studentCode: storedUser.studentCode || '',
    schoolName: storedUser.schoolName || '',
    department: storedUser.department || '',
    assignedSubject: storedUser.assignedSubject || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const userId = storedUser.id || storedUser.userId || storedUser.user_id || ''
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Sao chép User ID để người khác dùng khi share tài liệu (xem ShareModal ở DocumentsPage)
  function handleCopyId() {
    navigator.clipboard.writeText(userId)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
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
          <div className="avatar-initials">{initials}</div>
        </div>
        <div className="avatar-info">
          <p className="avatar-name">{form.name || form.email}</p>
          <p className="avatar-email">{form.email}</p>
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

/* ── Section: Security ── Đổi mật khẩu (gọi API thật) */
function SecuritySection({ onSave }) {
  const [form, setForm] = useState({ current: '', newPw: '', confirm: '' })
  const [show, setShow] = useState({ current: false, newPw: false, confirm: false })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleShow = (k) => setShow(s => ({ ...s, [k]: !s[k] }))

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

/* ── Section: Membership ── Bảng 2 gói Free/Premium, export riêng vì PremiumPage.jsx cũng dùng lại.
   Hoàn toàn là UI demo: nút "Nâng cấp" không có onClick, chưa nối cổng thanh toán nào. */
export function MembershipSection() {
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
        '20.000 token AI/ngày',
        'Upload tối đa 10 MB/file',
      ],
      missing: [],
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
        '10 GB lưu trữ',
        '50.000 token AI/ngày',
        'Upload tối đa 100 MB/file',
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
