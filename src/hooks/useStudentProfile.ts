import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TestScore {
  id: string;
  test_type: string;
  score: string;
  test_date: string | null;
  expiry_date: string | null;
}

interface StudentProfileData {
  lead: any;
  testScores: TestScore[];
}

interface EligibilityScores {
  university_score: number;
  student_score: number;
  co_applicant_score: number;
  overall_score: number;
  university_breakdown: any;
  student_breakdown: any;
  co_applicant_breakdown: any;
  approval_status: string;
  rejection_reason?: string | null;
  eligible_loan_min?: number | null;
  eligible_loan_max?: number | null;
  loan_band_percentage?: string | null;
  interest_rate_min?: number | null;
  interest_rate_max?: number | null;
  rate_tier?: string | null;
}

export function useStudentProfile(leadId: string | null) {
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [scores, setScores] = useState<EligibilityScores | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (leadId) {
      fetchStudentProfile();
    }
  }, [leadId]);

  const fetchStudentProfile = async () => {
    if (!leadId) return;
    
    setLoading(true);
    setError(null);

    try {
      // Fetch lead with all related data
      const { data: lead, error: leadError } = await supabase
        .from('leads_new')
        .select(`
          *,
          students(*),
          co_applicants(*),
          lenders(*),
          partners(*),
          lead_universities(
            universities(*)
          )
        `)
        .eq('id', leadId)
        .single();

      if (leadError) throw leadError;

      // Fetch test scores
      const { data: testScores } = await supabase
        .from('academic_tests')
        .select('*')
        .eq('student_id', lead.student_id);

      setProfile({
        lead,
        testScores: testScores || []
      });

      // Fetch eligibility scores
      const { data: eligibilityData } = await supabase
        .from('eligibility_scores')
        .select('*')
        .eq('lead_id', leadId)
        .maybeSingle();

      if (eligibilityData) {
        setScores(eligibilityData as EligibilityScores);
      }
    } catch (err: any) {
      console.error('Error fetching student profile:', err);
      setError(err.message || 'Failed to load student profile');
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    scores,
    loading,
    error,
    refetch: fetchStudentProfile
  };
}
