import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export interface StudentApplicationData {
  // Personal Details
  name: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  city: string;
  state: string;
  postalCode: string;
  nationality: string;
  qualification: string;
  
  // Study Details
  universities: string[]; // Array of university IDs
  course: string;
  studyDestination: string;
  intakeMonth: number;
  intakeYear: number;
  loanAmount: number;
  loanType: string;
  
  // Co-Applicant Details
  coApplicantName: string;
  coApplicantRelationship: string;
  coApplicantPhone: string;
  coApplicantEmail: string;
  coApplicantSalary: number;
  coApplicantPinCode: string;
}

export const useStudentApplication = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationData, setApplicationData] = useState<Partial<StudentApplicationData>>({
    nationality: 'Indian',
    loanType: 'secured',
  });

  const updateApplicationData = (data: Partial<StudentApplicationData>) => {
    setApplicationData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const submitApplication = async () => {
    try {
      setIsSubmitting(true);

      const { data: result, error } = await (supabase.rpc as any)('create_case_student', {
        p_student_name: applicationData.name!,
        p_student_email: (await supabase.auth.getUser()).data.user?.email!,
        p_student_phone: applicationData.phone!,
        p_student_dob: applicationData.dateOfBirth!,
        p_student_nationality: applicationData.nationality!,
        p_student_country: applicationData.nationality === 'Indian' ? 'India' : 'Other',
        p_student_city: applicationData.city!,
        p_student_state: applicationData.state!,
        p_student_postal_code: applicationData.postalCode!,
        p_co_applicant_name: applicationData.coApplicantName!,
        p_co_applicant_relationship: applicationData.coApplicantRelationship as any,
        p_co_applicant_salary: applicationData.coApplicantSalary!,
        p_co_applicant_pin_code: applicationData.coApplicantPinCode!,
        p_co_applicant_phone: applicationData.coApplicantPhone!,
        p_co_applicant_email: applicationData.coApplicantEmail!,
        p_loan_amount: applicationData.loanAmount!,
        p_loan_type: applicationData.loanType as any,
        p_study_destination: applicationData.studyDestination as any,
        p_intake_month: applicationData.intakeMonth!,
        p_intake_year: applicationData.intakeYear!,
        p_university_ids: applicationData.universities!,
      });

      if (error) throw error;

      toast({
        title: "Application Submitted!",
        description: `Your case ID is ${(result as any).case_id}`,
      });

      return result;
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Could not submit application",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    currentStep,
    applicationData,
    isSubmitting,
    updateApplicationData,
    nextStep,
    prevStep,
    setCurrentStep,
    submitApplication,
  };
};
