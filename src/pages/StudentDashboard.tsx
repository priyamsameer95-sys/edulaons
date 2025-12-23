import { useState, useEffect } from "react";
import { useStudentApplications } from "@/hooks/useStudentApplications";
import { Button } from "@/components/ui/button";
import StudentApplicationFlow from "@/components/student/StudentApplicationFlow";
import { PlusCircle } from "lucide-react";
import type { StudentApplication } from "@/hooks/useStudentApplications";
import { StudentApplicationCard } from "@/components/student/dashboard/StudentApplicationCard";
import { StudentLayout } from "@/components/student/layout/StudentLayout";
import { ImprovedEmptyState } from "@/components/student/dashboard/ImprovedEmptyState";
import { SupportButton } from "@/components/student/dashboard/SupportButton";
import { StudentLoadingState } from "@/components/student/dashboard/StudentLoadingState";
import { StudentErrorState } from "@/components/student/dashboard/StudentErrorState";
import { StudentApplicationDetail } from "@/components/student/dashboard/StudentApplicationDetail";
import { updateMetaTags, pageSEO } from "@/utils/seo";

const StudentDashboard = () => {
  const { applications, loading, error, refetch } = useStudentApplications();
  const [selectedApplication, setSelectedApplication] = useState<StudentApplication | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  useEffect(() => {
    updateMetaTags(pageSEO.studentDashboard);
  }, []);

  if (loading) {
    return (
      <StudentLayout>
        <StudentLoadingState />
      </StudentLayout>
    );
  }

  if (showApplicationForm) {
    return <StudentApplicationFlow />;
  }

  if (error) {
    return (
      <StudentLayout>
        <StudentErrorState error={error} onRetry={refetch} />
      </StudentLayout>
    );
  }

  if (applications.length === 0) {
    return (
      <StudentLayout>
        <ImprovedEmptyState onStartApplication={() => setShowApplicationForm(true)} />
      </StudentLayout>
    );
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
      <div className="space-y-6">
        <header className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">My Applications</h1>
              <p className="text-muted-foreground text-sm">
                Track your education loan applications
              </p>
            </div>
            <Button 
              size="lg" 
              onClick={() => setShowApplicationForm(true)}
              className="h-11 px-6"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              New Application
            </Button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              {applications.length === 1 ? 'Your Application' : `All Applications (${applications.length})`}
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {applications.map((app) => (
                <StudentApplicationCard
                  key={app.id}
                  application={app}
                  onClick={() => setSelectedApplication(app)}
                />
              ))}
            </div>
          </div>
          <div>
            <SupportButton />
          </div>
        </section>
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;
