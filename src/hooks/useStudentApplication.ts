import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import type { StudentApplicationData } from '@/types/student-application';
import { transformToEdgeFunctionPayload } from '@/utils/studentApplicationHelpers';
import { studentApplicationSchema } from '@/lib/validation/studentValidation';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'student_application_draft';

// Re-export type for backward compatibility
export type { StudentApplicationData };

export const useStudentApplication = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Smart defaults for better UX
  const getDefaultIntake = () => {
    const now = new Date();
    const futureMonth = (now.getMonth() + 4) % 12 || 12;
    const futureYear = now.getMonth() + 4 > 11 ? now.getFullYear() + 1 : now.getFullYear();
    return { month: futureMonth, year: futureYear };
  };
  
  const defaultIntake = getDefaultIntake();
  
  const [applicationData, setApplicationData] = useState<Partial<StudentApplicationData>>({
    nationality: 'Indian',
    loanType: 'unsecured', // Most students start with unsecured
    intakeMonth: defaultIntake.month,
    intakeYear: defaultIntake.year,
  });

  // Load saved form data from localStorage or pre-fill from eligibility check
  useEffect(() => {
    try {
      // First, check for existing draft in localStorage
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setApplicationData(prev => ({ ...prev, ...parsed.data }));
        setCurrentStep(parsed.step || 0);
        console.log('📝 Loaded existing draft from localStorage');
        return;
      }
      
      // Otherwise, check for pre-fill data from eligibility check (sessionStorage)
      const eligibility = sessionStorage.getItem('eligibility_form');
      if (eligibility) {
        const data = JSON.parse(eligibility);
        console.log('📥 Loading pre-fill data from eligibility check:', data);
        
        // Map eligibility fields to application fields
        const prefillData: Partial<StudentApplicationData> = {
          name: data.student_name || '',
          phone: data.student_phone || '',
          studyDestination: data.country_value || data.country || '',
          universities: data.university_id ? [data.university_id] : [],
          loanAmount: data.loan_amount || 3000000,
          coApplicantMonthlySalary: data.co_applicant_monthly_salary || 0,
          coApplicantRelationship: 'parent', // Default from eligibility
          loanType: 'secured', // Default
          nationality: 'Indian', // Default
        };
        
        setApplicationData(prev => ({ ...prev, ...prefillData }));
        
        // Clear eligibility data to prevent re-loading
        sessionStorage.removeItem('eligibility_form');
        
        console.log('✅ Pre-filled application with eligibility data:', prefillData);
      }
    } catch (error) {
      console.error('Failed to load application data:', error);
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
      const newStep = Math.min(prev + 1, 5);
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

      // Get authenticated user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user?.email) {
        throw new Error('You must be logged in to submit an application');
      }

      // Clean test scores before validation
      const cleanedData = {
        ...applicationData,
        tests: applicationData.tests?.filter(test => 
          test.testType && test.testScore && test.testScore > 0
        )
      };

      // Validate complete application data
      const validationResult = studentApplicationSchema.safeParse(cleanedData);
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        const fieldPath = firstError.path.join('.');
        
        // Map field paths to user-friendly messages and step guidance
        const fieldToStep: Record<string, { step: number; label: string }> = {
          name: { step: 1, label: 'Full Name' },
          email: { step: 1, label: 'Email' },
          phone: { step: 1, label: 'Phone Number' },
          dateOfBirth: { step: 1, label: 'Date of Birth' },
          gender: { step: 1, label: 'Gender' },
          state: { step: 1, label: 'State' },
          postalCode: { step: 1, label: 'PIN Code' },
          nationality: { step: 1, label: 'Nationality' },
          highestQualification: { step: 2, label: 'Highest Qualification' },
          studyDestination: { step: 2, label: 'Study Destination' },
          universities: { step: 2, label: 'University Selection' },
          courseType: { step: 2, label: 'Course Type' },
          loanType: { step: 2, label: 'Loan Type' },
          loanAmount: { step: 2, label: 'Loan Amount' },
          intakeMonth: { step: 2, label: 'Intake Date' },
          intakeYear: { step: 2, label: 'Intake Year' },
          coApplicantName: { step: 3, label: 'Co-applicant Name' },
          coApplicantPhone: { step: 3, label: 'Co-applicant Phone' },
          coApplicantEmail: { step: 3, label: 'Co-applicant Email' },
          coApplicantRelationship: { step: 3, label: 'Relationship' },
          coApplicantMonthlySalary: { step: 3, label: 'Monthly Salary' },
          coApplicantEmploymentType: { step: 3, label: 'Employment Type' },
          coApplicantPinCode: { step: 3, label: 'Co-applicant PIN Code' },
        };
        
        const fieldInfo = fieldToStep[fieldPath] || { step: 0, label: fieldPath };
        const userMessage = `Please check "${fieldInfo.label}" in Step ${fieldInfo.step}: ${firstError.message}`;
        
        throw new Error(userMessage);
      }

      // Transform data to edge function payload
      const payload = transformToEdgeFunctionPayload(
        applicationData as StudentApplicationData,
        userData.user.email
      );

      // Add source to indicate this is from student application flow
      const studentPayload = {
        ...payload,
        source: 'student_application',
        student_name: payload.student_name,
        student_phone: payload.student_phone,
        student_pin_code: payload.student_pin_code,
        country: payload.country,
        loan_amount: payload.amount_requested,
      };

      // Submit to student-specific edge function that handles partner linking
      const { data: result, error } = await supabase.functions.invoke('create-lead-student', {
        body: studentPayload,
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to submit application');
      }

      // Check if this was linked to an existing partner lead
      if (result?.is_existing && result?.lead?.is_partner_lead) {
        toast({
          title: "Application Found!",
          description: result?.lead?.partner_name 
            ? `${result.lead.partner_name} has already started your application. We've linked your account.`
            : "Your application was already started by a partner.",
          duration: 5000,
        });
      } else {
        toast({
          title: "Application Submitted Successfully!",
          description: `Your case ID is ${result?.lead?.case_id || 'N/A'}`,
          duration: 5000,
        });
      }

      // Clear saved form data on successful submission
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error('Failed to clear saved data:', error);
      }

      return result;
    } catch (error: any) {
      console.error('Application submission error:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Could not submit application. Please try again.",
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
