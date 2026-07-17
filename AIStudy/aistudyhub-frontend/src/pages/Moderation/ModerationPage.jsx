import { useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { ForumSection, Toast } from "../Admin/AdminDashboardPage";
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
