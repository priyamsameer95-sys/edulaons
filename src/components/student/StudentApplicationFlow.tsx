import { useStudentApplication } from '@/hooks/useStudentApplication';
import { useState } from 'react';
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

  const handleSubmit = async () => {
    const result = await submitApplication();
    if (result) {
      setSubmissionResult(result);
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
    <ConversationalForm
      data={applicationData}
      onUpdate={updateApplicationData}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
};

export default StudentApplicationFlow;
