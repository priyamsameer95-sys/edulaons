import { AdminDashboardLayout } from '@/components/admin/dashboard/AdminDashboardLayout';
import { DashboardOverview } from '@/components/admin/dashboard/DashboardOverview';

/**
 * Phase 1 Demo - New Admin Dashboard Design
 * 
 * Features:
 * - Collapsible icon sidebar (64px collapsed / 256px expanded)
 * - Modern top navigation with global search
 * - KPI cards with circular progress indicators
 * - Priority actions panel
 * - Real-time activity feed
 */
const AdminDashboardV2 = () => {
  const handleSearch = (query: string) => {
    console.log('Searching:', query);
    // TODO: Implement search logic
  };

  return (
    <AdminDashboardLayout onSearch={handleSearch}>
      <DashboardOverview />
    </AdminDashboardLayout>
  );
};

export default AdminDashboardV2;
