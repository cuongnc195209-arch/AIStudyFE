import { useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import ForumSection from "../Admin/sections/ForumSection";
import { Toast } from "../Admin/shared/Toast";
import "../Admin/AdminDashboardPage.css";

export default function ModerationPage() {
  const [toast, setToast] = useState(null);

  return (
    <AppLayout>
      <div className="admin-page">
        <ForumSection onToast={setToast} />
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </AppLayout>
  );
}
