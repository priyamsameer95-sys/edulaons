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
  courseId?: string; // Optional DB reference
  courseDetails?: { // Optional enrichment
    programName: string;
    degree: string;
    stream: string;
    tuition?: string;
  };
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

      const { data: user, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user.user) {
        toast({
          title: "Session Expired",
          description: "Please log in again to submit your application",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }
      
      const { data: result, error } = await supabase.functions.invoke('create-lead', {
        body: {
          student_name: applicationData.name!,
          student_email: user.user?.email!,
          student_phone: applicationData.phone!,
          student_pin_code: applicationData.postalCode!,
          co_applicant_name: applicationData.coApplicantName!,
          co_applicant_relationship: applicationData.coApplicantRelationship!,
          co_applicant_salary: applicationData.coApplicantSalary!,
          co_applicant_pin_code: applicationData.coApplicantPinCode!,
          co_applicant_phone: applicationData.coApplicantPhone!,
          co_applicant_email: applicationData.coApplicantEmail!,
          amount_requested: applicationData.loanAmount!,
          loan_type: applicationData.loanType!,
          country: applicationData.studyDestination!,
          intake_month: `${applicationData.intakeYear}-${String(applicationData.intakeMonth).padStart(2, '0')}`,
          universities: applicationData.universities!,
        },
      });

      if (error) throw error;

      toast({
        title: "Application Submitted!",
        description: `Your case ID is ${result?.case_id}`,
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
