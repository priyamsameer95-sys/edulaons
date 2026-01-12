import { useStudentApplication } from '@/hooks/useStudentApplication';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ConversationalForm from './conversational/ConversationalForm';
import SuccessStep from './SuccessStep';

const StudentApplicationFlow = () => {
  const {
    applicationData,
    isSubmitting,
    updateApplicationData,
    submitApplication,
    clearDraft
  } = useStudentApplication();
  
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  // Validate user context matches stored draft
  useEffect(() => {
    const validateUserContext = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Get user's phone from metadata or email
        let userPhone = user.user_metadata?.phone?.replace(/\D/g, '').slice(-10);
        if (!userPhone && user.email?.includes('@student.loan.app')) {
          userPhone = user.email.split('@')[0].replace(/\D/g, '').slice(-10);
        }
        
        // If draft phone doesn't match user phone, clear draft
        if (userPhone && applicationData.phone) {
          const draftPhone = applicationData.phone.replace(/\D/g, '').slice(-10);
          if (draftPhone && draftPhone !== userPhone) {
            console.log('⚠️ Draft phone mismatch, clearing draft');
            clearDraft();
          }
        }
      } catch (error) {
        console.error('Error validating user context:', error);
      }
    };
    
    validateUserContext();
  }, [applicationData.phone, clearDraft]);

  const handleSubmit = async () => {
    const result = await submitApplication();
    if (result) {
      setSubmissionResult(result);
      // AI lender recommendations are fetched async in SuccessStep
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
