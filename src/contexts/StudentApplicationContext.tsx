import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { validateStep, validateCompleteApplication } from '@/services/studentApplicationValidation';

/**
 * Student Application Context
 * Provides centralized state management for the entire application flow
 */

export interface StudentApplicationData {
  // Personal Details
  name: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  city: string;
  state: string;
  postalCode: string;
  qualification: string;
  
  // Study Details
  studyDestination: string;
  universities: string[]; // Array of university UUIDs or custom university names
  course: string;
  courseId?: string;
  courseDetails?: {
    programName: string;
    degree: string;
    stream: string;
    tuition: string;
  };
  loanType: 'secured' | 'unsecured';
  intakeMonth: number;
  intakeYear: number;
  loanAmount: number;
  
  // Co-Applicant Details
  coApplicantName: string;
  coApplicantRelationship: string;
  coApplicantPhone: string;
  coApplicantEmail: string;
  coApplicantSalary: number;
  coApplicantPinCode: string;
}

interface ApplicationContextValue {
  // State
  currentStep: number;
  applicationData: Partial<StudentApplicationData>;
  isSubmitting: boolean;
  validationErrors: Record<string, string>;
  submissionResult: any | null;
  
  // Actions
  updateApplicationData: (data: Partial<StudentApplicationData>) => void;
  nextStep: () => Promise<boolean>;
  prevStep: () => void;
  goToStep: (step: number) => void;
  submitApplication: () => Promise<any>;
  clearValidationErrors: () => void;
  resetApplication: () => void;
}

const ApplicationContext = createContext<ApplicationContextValue | undefined>(undefined);

const STORAGE_KEY = 'student_application_draft';
const MAX_STEPS = 5;

export function StudentApplicationProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [applicationData, setApplicationData] = useState<Partial<StudentApplicationData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);
  const { toast } = useToast();

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem(STORAGE_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        const draftData = parsed.data || {};
        
        // Check if draft has corrupted university data (names instead of UUIDs)
        // UUID format: 8-4-4-4-12 hex characters
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (draftData.universities && Array.isArray(draftData.universities)) {
          const hasInvalidUUIDs = draftData.universities.some(
            (uni: string) => uni && !uuidRegex.test(uni)
          );
          
          if (hasInvalidUUIDs) {
            logger.warn('Draft contains invalid university data (names instead of UUIDs). Clearing universities and course fields.');
            // Clear corrupted fields
            draftData.universities = [];
            draftData.course = '';
            draftData.courseId = undefined;
            draftData.courseDetails = undefined;
          }
        }
        
        setApplicationData(draftData);
        setCurrentStep(parsed.step || 0);
        logger.info('Loaded draft application from localStorage');
      }
    } catch (error) {
      logger.error('Failed to load draft:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (Object.keys(applicationData).length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          data: applicationData,
          step: currentStep,
          timestamp: new Date().toISOString(),
        }));
        logger.debug('Auto-saved application draft');
      } catch (error) {
        logger.error('Failed to save draft:', error);
      }
    }
  }, [applicationData, currentStep]);

  const updateApplicationData = useCallback((data: Partial<StudentApplicationData>) => {
    setApplicationData(prev => ({ ...prev, ...data }));
    // Clear related validation errors
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(data).forEach(key => delete newErrors[key]);
      return newErrors;
    });
  }, []);

  const clearValidationErrors = useCallback(() => {
    setValidationErrors({});
  }, []);

  const nextStep = useCallback(async (): Promise<boolean> => {
    // Validate current step before proceeding
    const validation = validateStep(currentStep, applicationData);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      
      // Log validation errors for debugging
      logger.error('Validation failed for step', currentStep, {
        errors: validation.errors,
        data: applicationData
      });
      
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before continuing',
        variant: 'destructive',
      });
      return false;
    }

    if (currentStep < MAX_STEPS - 1) {
      setCurrentStep(prev => prev + 1);
      setValidationErrors({});
      return true;
    }
    
    return false;
  }, [currentStep, applicationData, toast]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setValidationErrors({});
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < MAX_STEPS) {
      setCurrentStep(step);
      setValidationErrors({});
    }
  }, []);

  const submitApplication = useCallback(async () => {
    setIsSubmitting(true);
    setValidationErrors({});

    try {
      // Final validation
      const validation = validateCompleteApplication(applicationData);
      
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        toast({
          title: 'Incomplete Application',
          description: `Please fill in all required fields: ${validation.missingFields.join(', ')}`,
          variant: 'destructive',
        });
        return null;
      }

      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast({
          title: 'Session Expired',
          description: 'Please log in to submit your application',
          variant: 'destructive',
        });
        window.location.href = '/login';
        return null;
      }

      // Transform camelCase to snake_case for edge function
      const transformedData = {
        student_name: applicationData.name,
        student_phone: applicationData.phone,
        student_dob: applicationData.dateOfBirth,
        student_gender: applicationData.gender,
        student_city: applicationData.city,
        student_state: applicationData.state,
        student_pin_code: applicationData.postalCode,
        student_qualification: applicationData.qualification,
        
        co_applicant_name: applicationData.coApplicantName,
        co_applicant_phone: applicationData.coApplicantPhone,
        co_applicant_email: applicationData.coApplicantEmail,
        co_applicant_salary: applicationData.coApplicantSalary,
        co_applicant_relationship: applicationData.coApplicantRelationship,
        co_applicant_pin_code: applicationData.coApplicantPinCode,
        
        country: applicationData.studyDestination,
        loan_type: applicationData.loanType,
        intake_month: `${applicationData.intakeYear}-${String(applicationData.intakeMonth).padStart(2, '0')}`,
        amount_requested: applicationData.loanAmount,
        universities: applicationData.universities,
        course_name: applicationData.course,
        course_id: applicationData.courseId,
      };

      // Submit to edge function
      logger.info('Submitting application...', transformedData);
      
      const { data, error } = await supabase.functions.invoke('create-lead', {
        body: transformedData,
      });

      if (error) {
        logger.error('Submission error:', error);
        throw error;
      }

      logger.info('Application submitted successfully:', data);
      
      setSubmissionResult(data);
      
      // Clear draft
      localStorage.removeItem(STORAGE_KEY);
      
      toast({
        title: 'Success!',
        description: 'Your application has been submitted successfully',
      });

      return data;
    } catch (error: any) {
      logger.error('Application submission failed:', error);
      
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit application. Please try again.',
        variant: 'destructive',
      });
      
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [applicationData, toast]);

  const resetApplication = useCallback(() => {
    setCurrentStep(0);
    setApplicationData({});
    setValidationErrors({});
    setSubmissionResult(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value: ApplicationContextValue = {
    currentStep,
    applicationData,
    isSubmitting,
    validationErrors,
    submissionResult,
    updateApplicationData,
    nextStep,
    prevStep,
    goToStep,
    submitApplication,
    clearValidationErrors,
    resetApplication,
  };

  return (
    <ApplicationContext.Provider value={value}>
      {children}
    </ApplicationContext.Provider>
  );
}

export function useStudentApplicationContext() {
  const context = useContext(ApplicationContext);
  
  if (!context) {
    throw new Error('useStudentApplicationContext must be used within StudentApplicationProvider');
  }
  
  return context;
}
