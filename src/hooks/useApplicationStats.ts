import { useMemo } from 'react';
import { StudentApplication } from './useStudentApplications';

export const useApplicationStats = (applications: StudentApplication[]) => {
  return useMemo(() => {
    const totalApplications = applications.length;
    const activeApplications = applications.filter(
      app => app.status === 'in_progress' || app.status === 'new'
    ).length;
    const approvedApplications = applications.filter(app => app.status === 'approved').length;
    const totalLoanAmount = applications
      .filter(app => app.status === 'approved')
      .reduce((sum, app) => sum + app.loan_amount, 0);

    const pendingActions = applications.filter(
      app => app.documents_status === 'pending' || app.documents_status === 'resubmission_required'
    );

    const documentStats = {
      pending: applications.filter(app => app.documents_status === 'pending').length,
      uploaded: applications.filter(app => app.documents_status === 'uploaded').length,
      verified: applications.filter(app => app.documents_status === 'verified').length,
      resubmissionRequired: applications.filter(app => app.documents_status === 'resubmission_required').length,
    };

    return {
      totalApplications,
      activeApplications,
      approvedApplications,
      totalLoanAmount,
      pendingActions,
      documentStats,
    };
  }, [applications]);
};
