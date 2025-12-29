import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import type { StudentApplicationData, Relationship, EmploymentType, HighestQualification } from '@/types/student-application';
import { transformToEdgeFunctionPayload } from '@/utils/studentApplicationHelpers';
import { studentApplicationSchema } from '@/lib/validation/studentValidation';

// Phone-scoped storage key to prevent cross-user data leakage
const getStorageKey = (phone: string) => `student_application_draft_${phone.replace(/\D/g, '').slice(-10)}`;
const LEGACY_STORAGE_KEY = 'student_application_draft';

// Re-export type for backward compatibility
export type { StudentApplicationData };

// Clear any drafts from other phone numbers
const clearForeignDrafts = (currentPhone: string) => {
  const currentKey = getStorageKey(currentPhone);
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('student_application_draft_') && key !== currentKey) {
      keysToRemove.push(key);
    }
  }
  
  // Also remove legacy key if different from current
  if (localStorage.getItem(LEGACY_STORAGE_KEY)) {
    keysToRemove.push(LEGACY_STORAGE_KEY);
  }
  
  keysToRemove.forEach(key => {
    console.log('🧹 Clearing foreign draft:', key);
    localStorage.removeItem(key);
  });
};

// Transform database lead data to application form data
const transformLeadToApplicationData = (
  lead: any,
  student: any,
  coApplicant: any,
  universityIds: string[]
): Partial<StudentApplicationData> => {
  return {
    // Personal details from student
    name: student?.name || '',
    email: student?.email || '',
    phone: student?.phone || '',
    dateOfBirth: student?.date_of_birth || '',
    gender: student?.gender || '',
    city: student?.city || '',
    state: student?.state || '',
    postalCode: student?.postal_code || '',
    nationality: student?.nationality || 'Indian',
    creditScore: student?.credit_score || undefined,
    
    // Academic background
    highestQualification: (student?.highest_qualification as HighestQualification) || undefined,
    tenthPercentage: student?.tenth_percentage || undefined,
    twelfthPercentage: student?.twelfth_percentage || undefined,
    bachelorsPercentage: student?.bachelors_percentage || undefined,
    bachelorsCgpa: student?.bachelors_cgpa || undefined,
    mastersPercentage: student?.masters_percentage || undefined,
    mastersCgpa: student?.masters_cgpa || undefined,
    
    // Study details from lead
    studyDestination: lead?.study_destination || '',
    universities: universityIds || [],
    loanType: lead?.loan_type || 'unsecured',
    loanAmount: lead?.loan_amount ? Number(lead.loan_amount) : undefined,
    intakeMonth: lead?.intake_month || undefined,
    intakeYear: lead?.intake_year || undefined,
    
    // Co-applicant details
    coApplicantName: coApplicant?.name || '',
    coApplicantPhone: coApplicant?.phone || '',
    coApplicantEmail: coApplicant?.email || '',
    coApplicantRelationship: (coApplicant?.relationship as Relationship) || undefined,
    coApplicantMonthlySalary: coApplicant?.monthly_salary || coApplicant?.salary || undefined,
    coApplicantEmploymentType: (coApplicant?.employment_type as EmploymentType) || undefined,
    coApplicantOccupation: coApplicant?.occupation || '',
    coApplicantEmployer: coApplicant?.employer || '',
    coApplicantEmploymentDuration: coApplicant?.employment_duration_years || undefined,
    coApplicantPinCode: coApplicant?.pin_code || '',
    coApplicantCreditScore: coApplicant?.credit_score || undefined,
  };
};

export const useStudentApplication = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingLeadId, setExistingLeadId] = useState<string | null>(null);
  
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
    loanType: 'unsecured',
    intakeMonth: defaultIntake.month,
    intakeYear: defaultIntake.year,
  });

  // Get current user's phone from auth metadata
  useEffect(() => {
    const getAuthPhone = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.phone) {
        const phone = user.user_metadata.phone.replace(/\D/g, '').slice(-10);
        setUserPhone(phone);
        return phone;
      }
      // Fallback: extract from email if it's phone-based
      if (user?.email?.includes('@student.loan.app')) {
        const phone = user.email.split('@')[0].replace(/\D/g, '').slice(-10);
        if (phone.length === 10) {
          setUserPhone(phone);
          return phone;
        }
      }
      return null;
    };
    
    getAuthPhone();
  }, []);

  // Load saved form data - only after we know the user's phone
  // Priority: 1) DB existing lead (edit mode), 2) localStorage draft, 3) sessionStorage eligibility
  useEffect(() => {
    if (isInitialized) return; // Only run once
    
    const loadData = async () => {
      try {
        // Get user's phone and email
        const { data: { user } } = await supabase.auth.getUser();
        let phone = userPhone;
        let userEmail = user?.email;
        
        if (!phone) {
          if (user?.user_metadata?.phone) {
            phone = user.user_metadata.phone.replace(/\D/g, '').slice(-10);
          } else if (user?.email?.includes('@student.loan.app')) {
            phone = user.email.split('@')[0].replace(/\D/g, '').slice(-10);
          }
        }
        
        // PRIORITY 1: Check for existing lead in database (edit mode)
        if (userEmail) {
          console.log('🔍 Checking for existing lead in DB for:', userEmail);
          
          // Get student by email
          const { data: student } = await supabase
            .from('students')
            .select('*')
            .eq('email', userEmail)
            .maybeSingle();
          
          if (student) {
            console.log('📋 Found student:', student.id);
            
            // Get their most recent lead
            const { data: lead } = await supabase
              .from('leads_new')
              .select('*')
              .eq('student_id', student.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (lead) {
              console.log('📋 Found existing lead:', lead.case_id);

              // Fetch co-applicant separately (avoid relying on implicit relationship joins)
              const { data: coApplicant } = await supabase
                .from('co_applicants')
                .select('*')
                .eq('id', lead.co_applicant_id)
                .maybeSingle();

              // Get university IDs for this lead
              const { data: leadUniversities } = await supabase
                .from('lead_universities')
                .select('university_id')
                .eq('lead_id', lead.id);

              const universityIds = leadUniversities?.map(lu => lu.university_id) || [];

              // Transform DB data to form data
              const prefillData = transformLeadToApplicationData(
                lead,
                student,
                coApplicant,
                universityIds
              );

              console.log('✅ Pre-filling form with existing lead data');
              setApplicationData(prev => ({ ...prev, ...prefillData }));
              setIsEditMode(true);
              setExistingLeadId(lead.id);
              setIsInitialized(true);

              // Clear any stale drafts since we're loading from DB
              if (phone && phone.length === 10) {
                clearForeignDrafts(phone);
                localStorage.removeItem(getStorageKey(phone));
              }

              return;
            }
          }
        }
        
        // PRIORITY 2: Load from localStorage draft
        if (phone && phone.length === 10) {
          // Clear drafts from other users
          clearForeignDrafts(phone);
          
          // Load phone-specific draft
          const storageKey = getStorageKey(phone);
          const saved = localStorage.getItem(storageKey);
          
          if (saved) {
            const parsed = JSON.parse(saved);
            // Validate draft belongs to current user
            if (parsed.phone === phone) {
              setApplicationData(prev => ({ ...prev, ...parsed.data }));
              setCurrentStep(parsed.step || 0);
              console.log('📝 Loaded draft for phone:', phone);
              setIsInitialized(true);
              return;
            } else {
              // Draft is from different user, clear it
              console.log('🧹 Clearing draft from different user');
              localStorage.removeItem(storageKey);
            }
          }
        }
        
        // PRIORITY 3: Pre-fill from eligibility check
        const eligibility = sessionStorage.getItem('eligibility_form');
        if (eligibility) {
          const data = JSON.parse(eligibility);
          console.log('📥 Loading pre-fill data from eligibility check');
          
          const prefillData: Partial<StudentApplicationData> = {
            name: data.student_name || '',
            phone: data.student_phone || '',
            studyDestination: data.country_value || data.country || '',
            universities: data.university_id ? [data.university_id] : [],
            loanAmount: data.loan_amount || 3000000,
            coApplicantMonthlySalary: data.co_applicant_monthly_salary || 0,
            coApplicantRelationship: 'parent',
            loanType: 'secured',
            nationality: 'Indian',
          };
          
          setApplicationData(prev => ({ ...prev, ...prefillData }));
          
          // Clear eligibility data after use
          sessionStorage.removeItem('eligibility_form');
          console.log('✅ Pre-filled application with eligibility data');
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to load application data:', error);
        setIsInitialized(true);
      }
    };
    
    loadData();
  }, [userPhone, isInitialized]);

  const updateApplicationData = useCallback((data: Partial<StudentApplicationData>) => {
    setApplicationData(prev => {
      const updated = { ...prev, ...data };
      
      // Save to phone-scoped localStorage
      try {
        const phone = userPhone || updated.phone?.replace(/\D/g, '').slice(-10);
        if (phone && phone.length === 10) {
          const storageKey = getStorageKey(phone);
          localStorage.setItem(storageKey, JSON.stringify({
            data: updated,
            step: currentStep,
            phone: phone, // Include phone for validation
            timestamp: new Date().toISOString()
          }));
        }
      } catch (error) {
        console.error('Failed to save application data:', error);
      }
      return updated;
    });
  }, [userPhone, currentStep]);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => {
      const newStep = Math.min(prev + 1, 5);
      // Update step in localStorage
      try {
        const phone = userPhone || applicationData.phone?.replace(/\D/g, '').slice(-10);
        if (phone && phone.length === 10) {
          const storageKey = getStorageKey(phone);
          const current = localStorage.getItem(storageKey);
          if (current) {
            const parsed = JSON.parse(current);
            localStorage.setItem(storageKey, JSON.stringify({ ...parsed, step: newStep }));
          }
        }
      } catch (error) {
        console.error('Failed to save step:', error);
      }
      return newStep;
    });
  }, [userPhone, applicationData.phone]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => {
      const newStep = Math.max(prev - 1, 0);
      // Update step in localStorage
      try {
        const phone = userPhone || applicationData.phone?.replace(/\D/g, '').slice(-10);
        if (phone && phone.length === 10) {
          const storageKey = getStorageKey(phone);
          const current = localStorage.getItem(storageKey);
          if (current) {
            const parsed = JSON.parse(current);
            localStorage.setItem(storageKey, JSON.stringify({ ...parsed, step: newStep }));
          }
        }
      } catch (error) {
        console.error('Failed to save step:', error);
      }
      return newStep;
    });
  }, [userPhone, applicationData.phone]);

  const clearDraft = useCallback(() => {
    try {
      const phone = userPhone || applicationData.phone?.replace(/\D/g, '').slice(-10);
      if (phone && phone.length === 10) {
        const storageKey = getStorageKey(phone);
        localStorage.removeItem(storageKey);
      }
      // Also clear legacy key
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [userPhone, applicationData.phone]);

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

      const studentPayload = {
        ...payload,
        source: 'student_application',
        student_name: payload.student_name,
        student_phone: payload.student_phone,
        student_pin_code: payload.student_pin_code,
        country: payload.country,
        loan_amount: payload.amount_requested,
        // Pass edit mode info so edge function knows this is an update
        is_edit: isEditMode,
        existing_lead_id: existingLeadId,
      };

      const { data: result, error } = await supabase.functions.invoke('create-lead-student', {
        body: studentPayload,
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to submit application');
      }

      if (result?.is_existing && result?.lead?.is_partner_lead) {
        toast({
          title: "Application Found!",
          description: result?.lead?.partner_name 
            ? `${result.lead.partner_name} has already started your application. We've linked your account.`
            : "Your application was already started by a partner.",
          duration: 5000,
        });
      } else if (isEditMode) {
        toast({
          title: "Application Updated!",
          description: `Your changes have been saved. Case ID: ${result?.lead?.case_id || 'N/A'}`,
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
      clearDraft();

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
    isEditMode,
    existingLeadId,
    updateApplicationData,
    nextStep,
    prevStep,
    setCurrentStep,
    submitApplication,
    clearDraft,
  };
};
