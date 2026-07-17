import AppLayout from '../../components/layout/AppLayout'
import { MembershipSection } from '../Settings/SettingsPage'
import '../Settings/SettingsPage.css'

export default function PremiumPage() {
  return (
    <AppLayout>
      <div className="settings-page">
        <div className="settings-header">
          <h1 className="settings-title">Nâng cấp Premium</h1>
          <p className="settings-sub">Chọn gói phù hợp để mở khóa toàn bộ tính năng AI Study Hub</p>
        </div>

        <div className="settings-content">
          <MembershipSection />
        </div>
      </div>
    </AppLayout>
  )
}
