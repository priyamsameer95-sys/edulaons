import { useState, useEffect } from "react";
import { useStudentApplications } from "@/hooks/useStudentApplications";
import StudentApplicationFlow from "@/components/student/StudentApplicationFlow";
import type { StudentApplication } from "@/hooks/useStudentApplications";
import { StudentLayout } from "@/components/student/layout/StudentLayout";
import { ImprovedEmptyState } from "@/components/student/dashboard/ImprovedEmptyState";
import { StudentLoadingState } from "@/components/student/dashboard/StudentLoadingState";
import { StudentErrorState } from "@/components/student/dashboard/StudentErrorState";
import { StudentApplicationDetail } from "@/components/student/dashboard/StudentApplicationDetail";
import { GuidedWizardDashboard } from "@/components/student/dashboard/GuidedWizardDashboard";
import { updateMetaTags, pageSEO } from "@/utils/seo";

const StudentDashboard = () => {
  const { applications, loading, error, refetch } = useStudentApplications();
  const [selectedApplication, setSelectedApplication] = useState<StudentApplication | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  useEffect(() => {
    updateMetaTags(pageSEO.studentDashboard);
  }, []);

  if (loading) {
    return <StudentLayout><StudentLoadingState /></StudentLayout>;
  }

  if (showApplicationForm) {
    return <StudentApplicationFlow />;
  }

  if (error) {
    return <StudentLayout><StudentErrorState error={error} onRetry={refetch} /></StudentLayout>;
  }

  if (applications.length === 0) {
    return <StudentLayout><ImprovedEmptyState onStartApplication={() => setShowApplicationForm(true)} /></StudentLayout>;
  }

  if (selectedApplication) {
    return (
      <StudentLayout>
        <StudentApplicationDetail
          application={selectedApplication}
          onBack={() => setSelectedApplication(null)}
        />
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <GuidedWizardDashboard
        applications={applications}
        onSelectApplication={setSelectedApplication}
        onNewApplication={() => setShowApplicationForm(true)}
      />
    </StudentLayout>
  );
};

export default StudentDashboard;
