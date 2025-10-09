import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'student_application_draft';

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

  // Load saved form data from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setApplicationData(prev => ({ ...prev, ...parsed.data }));
        setCurrentStep(parsed.step || 0);
      }
    } catch (error) {
      console.error('Failed to load saved application data:', error);
    }
  }, []);

  const updateApplicationData = (data: Partial<StudentApplicationData>) => {
    setApplicationData(prev => {
      const updated = { ...prev, ...data };
      // Save to localStorage whenever data changes
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          data: updated,
          step: currentStep,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('Failed to save application data:', error);
      }
      return updated;
    });
  };

  const nextStep = () => {
    setCurrentStep(prev => {
      const newStep = Math.min(prev + 1, 4);
      // Save step to localStorage
      try {
        const current = localStorage.getItem(STORAGE_KEY);
        if (current) {
          const parsed = JSON.parse(current);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, step: newStep }));
        }
      } catch (error) {
        console.error('Failed to save step:', error);
      }
      return newStep;
    });
  };

  const prevStep = () => {
    setCurrentStep(prev => {
      const newStep = Math.max(prev - 1, 0);
      // Save step to localStorage
      try {
        const current = localStorage.getItem(STORAGE_KEY);
        if (current) {
          const parsed = JSON.parse(current);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, step: newStep }));
        }
      } catch (error) {
        console.error('Failed to save step:', error);
      }
      return newStep;
    });
  };

  const submitApplication = async () => {
    try {
      setIsSubmitting(true);

      const { data: user } = await supabase.auth.getUser();
      
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

      // Clear saved form data on successful submission
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error('Failed to clear saved data:', error);
      }

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
