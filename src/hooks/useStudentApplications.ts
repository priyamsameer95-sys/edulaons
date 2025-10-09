import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useErrorHandler } from './useErrorHandler';
import { logger } from '@/utils/logger';

export interface StudentApplication {
  id: string;
  case_id: string;
  loan_amount: number;
  loan_type: 'secured' | 'unsecured';
  study_destination: string;
  intake_month: number;
  intake_year: number;
  status: 'new' | 'in_progress' | 'approved' | 'rejected';
  documents_status: 'pending' | 'uploaded' | 'verified' | 'rejected' | 'resubmission_required';
  created_at: string;
  updated_at: string;
  status_updated_at: string;
  student: {
    name: string;
    email: string;
    phone: string;
    nationality?: string;
    city?: string;
    state?: string;
  };
  co_applicant: {
    name: string;
    relationship: string;
    salary: number;
  };
  lender: {
    name: string;
    code: string;
  };
  partner?: {
    name: string;
    email: string;
  };
  universities?: Array<{
    id: string;
    name: string;
    country: string;
    city: string;
  }>;
}

export const useStudentApplications = () => {
  const { user } = useAuth();
  const { handleDatabaseError } = useErrorHandler();
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      logger.info('[useStudentApplications] Fetching applications for user:', user?.email);

      // First, get the student record by email
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('email', user?.email)
        .maybeSingle();

      if (studentError) throw studentError;

      if (!studentData) {
        logger.info('[useStudentApplications] No student record found');
        setApplications([]);
        setLoading(false);
        return;
      }

      // Fetch all applications for this student with related data
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads_new')
        .select(`
          *,
          students!inner(name, email, phone, nationality, city, state),
          co_applicants!inner(name, relationship, salary),
          lenders!inner(name, code),
          partners(name, email)
        `)
        .eq('student_id', studentData.id)
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;

      // Fetch universities for each lead
      const applicationsWithUniversities = await Promise.all(
        (leadsData || []).map(async (lead) => {
          const { data: universitiesData } = await supabase
            .from('lead_universities')
            .select('universities:university_id(id, name, country, city)')
            .eq('lead_id', lead.id);

          const universities = (universitiesData || [])
            .map(item => (item as any).universities)
            .filter((uni: any) => uni !== null) as Array<{
              id: string;
              name: string;
              country: string;
              city: string;
            }>;

          return {
            id: lead.id,
            case_id: lead.case_id,
            loan_amount: Number(lead.loan_amount),
            loan_type: lead.loan_type,
            study_destination: lead.study_destination,
            intake_month: lead.intake_month,
            intake_year: lead.intake_year,
            status: lead.status,
            documents_status: lead.documents_status,
            created_at: lead.created_at,
            updated_at: lead.updated_at,
            status_updated_at: lead.status_updated_at,
            student: {
              name: lead.students.name,
              email: lead.students.email,
              phone: lead.students.phone,
              nationality: lead.students.nationality,
              city: lead.students.city,
              state: lead.students.state,
            },
            co_applicant: {
              name: lead.co_applicants.name,
              relationship: lead.co_applicants.relationship,
              salary: Number(lead.co_applicants.salary),
            },
            lender: {
              name: lead.lenders.name,
              code: lead.lenders.code,
            },
            partner: lead.partners ? {
              name: lead.partners.name,
              email: lead.partners.email,
            } : undefined,
            universities,
          } as StudentApplication;
        })
      );

      logger.info('[useStudentApplications] Fetched applications:', applicationsWithUniversities.length);
      setApplications(applicationsWithUniversities);
    } catch (err) {
      logger.error('[useStudentApplications] Error fetching applications:', err);
      const errorMessage = handleDatabaseError(err, {
        showToast: true,
        description: 'Failed to load your applications',
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.email, handleDatabaseError]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return {
    applications,
    loading,
    error,
    refetch: fetchApplications,
  };
};
