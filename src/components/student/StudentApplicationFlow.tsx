import { useStudentApplication } from '@/hooks/useStudentApplication';
import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import ConversationalForm from './conversational/ConversationalForm';
import SuccessStep from './SuccessStep';

const StudentApplicationFlow = () => {
  const {
    applicationData,
    isSubmitting,
    updateApplicationData,
    submitApplication
  } = useStudentApplication();
  
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSubmit = async () => {
    const result = await submitApplication();
    if (result) {
      setSubmissionResult(result);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout? Your progress will be saved.')) {
      await signOut();
      navigate('/student/landing');
    }
  };

  // Success state
  if (submissionResult) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <SuccessStep 
            caseId={submissionResult.lead?.case_id || submissionResult.case_id} 
            leadId={submissionResult.lead?.id} 
            requestedAmount={submissionResult.lead?.requested_amount || applicationData.loanAmount} 
            recommendedLenders={submissionResult.recommended_lenders || []} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Logout button */}
      <button 
        onClick={handleLogout}
        className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-card border border-border hover:bg-muted transition-colors"
      >
        <LogOut className="h-5 w-5" />
      </button>

      <ConversationalForm
        data={applicationData}
        onUpdate={updateApplicationData}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default StudentApplicationFlow;
