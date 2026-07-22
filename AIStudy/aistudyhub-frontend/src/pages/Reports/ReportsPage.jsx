import AppLayout from "../../components/layout/AppLayout";
import ReportsSection from "../Admin/sections/ReportsSection";
import "../Admin/AdminDashboardPage.css";

export default function ReportsPage() {
  return (
    <AppLayout>
      <div className="admin-page">
        <ReportsSection />
      </div>
    </AppLayout>
  );
}
