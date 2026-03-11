/**
 * Smart Lender BRE v4.0 - Per-Lender Evaluation Engine
 * 
 * NEW ARCHITECTURE:
 * 1. PREMIUM CHECK: If university in lender's premium list → 100 score (bypasses income)
 * 2. RANKED TIER: Position-based scoring from lender's ranked list
 * 3. COURSE TYPE: Multiplier based on course type (others = 0.8)
 * 4. ELIGIBILITY: Income and loan amount knockouts per lender
 * 5. URGENCY: Processing time relevance based on intake deadline
 * 
 * Key Changes from v3:
 * - Each lender evaluated against its OWN rules, not global pillars
 * - Premium list = auto-qualify (no collateral, low CIBIL OK)
 * - Simpler, more transparent scoring
 * - Urgency doesn't penalize cheap lenders unfairly
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================================================
// TYPES
// ============================================================================

type CourseType = 'masters_stem' | 'bachelors_stem' | 'mba_management' | 'others';
type UrgencyZone = 'GREEN' | 'YELLOW' | 'RED';
type LenderStatus = 'PREMIUM_MATCH' | 'BEST_FIT' | 'GOOD_FIT' | 'BACKUP' | 'LOCKED';

interface PremiumUniversity {
  name: string;
  country?: string;
}

interface RankedUniversity {
  name: string;
  country?: string;
  rank: number;
}

interface LenderEvaluation {
  rank: number;
  lender_id: string;
  lender_name: string;
  lender_code: string;
  status: LenderStatus;
  score: number;
  base_score: number;
  course_multiplier: number;
  urgency_adjustment: number;
  reason: string;
  badges: string[];
  is_premium_match: boolean;
  university_match: {
    type: 'premium' | 'ranked' | 'none';
    position?: number;
    total_in_list?: number;
    tier_label?: string;
  };
  knockout_reason?: string;
  unlock_hint?: string;
  processing_time_estimate: string;
  interest_rate_display: string;
  loan_range_display: string;
  fit_factors: string[];
  risk_flags: string[];
  probability_band: 'high' | 'medium' | 'low';
  group: 'premium' | 'best_fit' | 'good_fit' | 'backup' | 'locked';
}

interface BREOutput {
  results: LenderEvaluation[];
  top_recommendation: LenderEvaluation | null;
  urgency_zone: UrgencyZone;
  days_until_deadline: number;
  overall_confidence: number;
  needs_human_review: boolean;
  model_version: string;
  course_type: CourseType;
  loan_amount: number;
  university_name: string | null;
}

// ============================================================================
// URGENCY CALCULATION
// ============================================================================

function calculateUrgency(intakeMonth: number | null, intakeYear: number | null): { zone: UrgencyZone; daysUntil: number } {
  if (!intakeMonth || !intakeYear) {
    return { zone: 'YELLOW', daysUntil: 60 }; // Default to balanced
  }

  const now = new Date();
  const intakeDate = new Date(intakeYear, intakeMonth - 1, 1);
  const diffTime = intakeDate.getTime() - now.getTime();
  const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const VISA_BUFFER = 7;
  const effectiveDays = daysUntil - VISA_BUFFER;

  if (effectiveDays <= 30) return { zone: 'RED', daysUntil };
  if (effectiveDays <= 60) return { zone: 'YELLOW', daysUntil };
  return { zone: 'GREEN', daysUntil };
}

// ============================================================================
// COURSE TYPE MULTIPLIER
// ============================================================================

function getCourseMultiplier(courseType: CourseType | string | null | undefined): number {
  if (!courseType) return 1.0; // Default to full score if not specified

  const normalized = String(courseType).toLowerCase();

  // "others" gets 0.8 multiplier, everything else gets 1.0
  if (normalized === 'others' || normalized === 'other') {
    return 0.8;
  }

  return 1.0; // masters_stem, bachelors_stem, mba_management all get full score
}

// ============================================================================
// PREMIUM UNIVERSITY CHECK
// ============================================================================

function checkPremiumMatch(
  universityName: string | null | undefined,
  premiumList: PremiumUniversity[]
): boolean {
  if (!universityName || !premiumList || premiumList.length === 0) {
    return false;
  }

  const normalizedInput = universityName.toLowerCase().trim();

  return premiumList.some(pu => {
    const premiumName = pu.name.toLowerCase().trim();
    return (
      normalizedInput === premiumName ||
      normalizedInput.includes(premiumName) ||
      premiumName.includes(normalizedInput)
    );
  });
}

// ============================================================================
// RANKED UNIVERSITY TIER CALCULATION
// ============================================================================

interface RankedTierResult {
  matched: boolean;
  position: number;
  total: number;
  score: number;
  tierLabel: string;
}

function calculateRankedTierScore(
  universityName: string | null | undefined,
  rankedList: RankedUniversity[]
): RankedTierResult {
  if (!universityName || !rankedList || rankedList.length === 0) {
    return { matched: false, position: 0, total: 0, score: 30, tierLabel: 'Not in lender list' };
  }

  const normalizedInput = universityName.toLowerCase().trim();
  const total = rankedList.length;

  // Find match
  let matchedEntry: RankedUniversity | undefined;
  for (const ru of rankedList) {
    const rankedName = ru.name.toLowerCase().trim();
    if (
      normalizedInput === rankedName ||
      normalizedInput.includes(rankedName) ||
      rankedName.includes(normalizedInput)
    ) {
      matchedEntry = ru;
      break;
    }
  }

  if (!matchedEntry) {
    // Not in ranked list at all
    return { matched: false, position: 0, total, score: 30, tierLabel: 'Not in lender list' };
  }

  // Calculate percentile position (ascending order means rank 1 is top)
  const position = matchedEntry.rank || (rankedList.indexOf(matchedEntry) + 1);
  const percentile = (position / total) * 100;

  // Score based on tier
  if (percentile <= 10) {
    return { matched: true, position, total, score: 95, tierLabel: 'Top 10%' };
  } else if (percentile <= 30) {
    return { matched: true, position, total, score: 85, tierLabel: 'Top 30%' };
  } else if (percentile <= 50) {
    return { matched: true, position, total, score: 75, tierLabel: 'Top 50%' };
  } else if (percentile <= 80) {
    return { matched: true, position, total, score: 60, tierLabel: 'Top 80%' };
  } else {
    return { matched: true, position, total, score: 45, tierLabel: 'In list' };
  }
}

// ============================================================================
// ELIGIBILITY CHECK (KNOCKOUTS)
// ============================================================================

interface EligibilityResult {
  eligible: boolean;
  reason: string | null;
  unlockHint: string | null;
}

function checkEligibility(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lender: any,
  loanAmount: number,
  coApplicantSalary: number | null,
  hasCollateral: boolean,
  isPremiumMatch: boolean
): EligibilityResult {
  // Premium matches bypass income requirements
  if (isPremiumMatch) {
    // Still check loan amount limits for premium
    const maxAmount = lender.loan_amount_max || 0;
    const minAmount = lender.loan_amount_min || 0;

    if (maxAmount > 0 && loanAmount > maxAmount) {
      return {
        eligible: false,
        reason: 'LOAN_EXCEEDS_MAX',
        unlockHint: `Max loan: ₹${(maxAmount / 100000).toFixed(0)}L. Consider splitting or reducing amount.`,
      };
    }

    if (minAmount > 0 && loanAmount < minAmount) {
      return {
        eligible: false,
        reason: 'LOAN_BELOW_MIN',
        unlockHint: `Minimum loan: ₹${(minAmount / 100000).toFixed(0)}L`,
      };
    }

    return { eligible: true, reason: null, unlockHint: null };
  }

  // Non-premium: Check all requirements
  const maxAmount = lender.loan_amount_max || 0;
  const minAmount = lender.loan_amount_min || 0;
  const incomeMin = lender.income_expectations_min || 0;

  if (maxAmount > 0 && loanAmount > maxAmount) {
    return {
      eligible: false,
      reason: 'LOAN_EXCEEDS_MAX',
      unlockHint: `Max loan: ₹${(maxAmount / 100000).toFixed(0)}L. Add collateral or split between lenders.`,
    };
  }

  if (minAmount > 0 && loanAmount < minAmount) {
    return {
      eligible: false,
      reason: 'LOAN_BELOW_MIN',
      unlockHint: `Minimum requirement: ₹${(minAmount / 100000).toFixed(0)}L`,
    };
  }

  // Income check only if no collateral
  if (!hasCollateral && incomeMin > 0 && coApplicantSalary && coApplicantSalary < incomeMin) {
    return {
      eligible: false,
      reason: 'INCOME_BELOW_MIN',
      unlockHint: `Requires ₹${(incomeMin / 1000).toFixed(0)}K+ monthly income, or provide collateral`,
    };
  }

  return { eligible: true, reason: null, unlockHint: null };
}

// ============================================================================
// URGENCY ADJUSTMENT
// ============================================================================

function calculateUrgencyAdjustment(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lender: any,
  zone: UrgencyZone,
  daysUntil: number
): { adjustment: number; badge: string | null } {
  const processingDays = lender.processing_time_days || lender.processing_time_range_max || 20;

  if (zone === 'RED') {
    // Urgent: Need fast lenders, but don't overly penalize slow ones
    if (processingDays <= 10) {
      return { adjustment: 10, badge: '⚡ Fast Approval' };
    } else if (processingDays <= 20) {
      return { adjustment: 5, badge: 'Quick Processing' };
    } else if (processingDays >= 40) {
      // Only warn, don't heavily penalize
      return { adjustment: -5, badge: '⏳ May be slow for deadline' };
    }
  } else if (zone === 'YELLOW') {
    // Moderate urgency
    if (processingDays <= 15) {
      return { adjustment: 5, badge: 'Good Timeline' };
    }
  }
  // GREEN zone: No urgency adjustments, let cost/rate factors dominate

  return { adjustment: 0, badge: null };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { leadId, studyDestination, loanAmount } = await req.json();

    console.log('🧠 [BRE v4.0] Processing lead:', leadId);

    // =========================================================================
    // FETCH LEAD DATA
    // =========================================================================

    const { data: lead, error: leadError } = await supabase
      .from('leads_new')
      .select(`
        id, loan_amount, loan_type, study_destination, course_type,
        intake_month, intake_year,
        student:students(
          id, name, email, phone, highest_qualification,
          tenth_percentage, twelfth_percentage, bachelors_percentage, bachelors_cgpa
        ),
        co_applicant:co_applicants(
          id, name, relationship, monthly_salary, salary, employment_type, occupation
        ),
        lead_universities!fk_lead_universities_lead(
          university:universities!fk_lead_universities_university(id, name, country, global_rank)
        )
      `)
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      throw new Error('Lead not found: ' + leadError?.message);
    }

    // =========================================================================
    // FETCH ALL ACTIVE LENDERS
    // =========================================================================

    const { data: lenders, error: lendersError } = await supabase
      .from('lenders')
      .select('*')
      .eq('is_active', true)
      .order('preferred_rank', { ascending: true, nullsFirst: false });

    if (lendersError || !lenders?.length) {
      throw new Error('No active lenders found');
    }

    console.log(`📊 Evaluating ${lenders.length} lenders`);

    // =========================================================================
    // EXTRACT LEAD CONTEXT
    // =========================================================================

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const coApplicant = lead.co_applicant as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const universities = (lead.lead_universities as any[])?.map(lu => lu.university) || [];
    const primaryUniversity = universities[0];
    const universityName = primaryUniversity?.name || null;

    const effectiveLoanAmount = loanAmount || lead.loan_amount || 0;
    const effectiveLoanType = lead.loan_type || 'secured';
    const hasCollateral = effectiveLoanType === 'secured';
    const courseType = (lead.course_type || 'others') as CourseType;
    const coApplicantSalary = coApplicant?.monthly_salary || coApplicant?.salary || null;

    const { zone: urgencyZone, daysUntil } = calculateUrgency(lead.intake_month, lead.intake_year);
    const courseMultiplier = getCourseMultiplier(courseType);

    console.log(`📐 Context: University=${universityName}, Loan=₹${effectiveLoanAmount}, Course=${courseType}, Urgency=${urgencyZone}`);

    // =========================================================================
    // EVALUATE EACH LENDER
    // =========================================================================

    const evaluations: LenderEvaluation[] = [];

    for (const lender of lenders) {
      // Parse lender's university restrictions
      const restrictions = lender.university_restrictions as {
        premium?: PremiumUniversity[];
        ranked?: RankedUniversity[];
      } | null;

      const premiumList = restrictions?.premium || [];
      const rankedList = restrictions?.ranked || [];

      // Step 1: Check Premium Match
      const isPremiumMatch = checkPremiumMatch(universityName, premiumList);

      // Step 2: Check Eligibility
      const eligibility = checkEligibility(
        lender,
        effectiveLoanAmount,
        coApplicantSalary,
        hasCollateral,
        isPremiumMatch
      );

      // Step 3: Calculate Base Score
      let baseScore: number;
      let universityMatch: LenderEvaluation['university_match'];
      let reason: string;
      const badges: string[] = [];
      const fitFactors: string[] = [];
      const riskFlags: string[] = [];

      if (isPremiumMatch) {
        // PREMIUM: Auto 100 score
        baseScore = 100;
        universityMatch = { type: 'premium' };
        reason = 'Premium university partner - guaranteed approval, no collateral needed';
        badges.push('⭐ Premium Partner');
        fitFactors.push('Premium University', 'No Collateral Required', 'Flexible CIBIL');
      } else {
        // Check Ranked List
        const rankedResult = calculateRankedTierScore(universityName, rankedList);
        baseScore = rankedResult.score;
        universityMatch = rankedResult.matched
          ? { type: 'ranked', position: rankedResult.position, total_in_list: rankedResult.total, tier_label: rankedResult.tierLabel }
          : { type: 'none' };

        if (rankedResult.matched) {
          reason = `University ranked ${rankedResult.tierLabel} in lender's preferred list`;
          badges.push(`🎓 ${rankedResult.tierLabel}`);
          fitFactors.push(`University in ${rankedResult.tierLabel}`);
        } else {
          reason = "University not in lender's preferred list - standard evaluation applies";
          fitFactors.push('Standard Evaluation');
        }
      }

      // Step 4: Apply Course Type Multiplier
      const scoreAfterCourse = Math.round(baseScore * courseMultiplier);
      if (courseMultiplier < 1) {
        riskFlags.push('Course type: Other (reduced priority)');
      }

      // Step 5: Apply Urgency Adjustment
      const { adjustment: urgencyAdjustment, badge: urgencyBadge } = calculateUrgencyAdjustment(
        lender,
        urgencyZone,
        daysUntil
      );
      if (urgencyBadge) {
        badges.push(urgencyBadge);
      }

      // Final Score (capped at 100)
      let finalScore = Math.min(100, Math.max(0, scoreAfterCourse + urgencyAdjustment));

      // Step 6: Determine Status
      let status: LenderStatus;
      let group: LenderEvaluation['group'];

      if (!eligibility.eligible) {
        status = 'LOCKED';
        group = 'locked';
        finalScore = Math.max(0, finalScore - 30); // Penalty for locked
        riskFlags.push(eligibility.reason || 'Eligibility issue');
      } else if (isPremiumMatch) {
        status = 'PREMIUM_MATCH';
        group = 'premium';
      } else if (finalScore >= 85) {
        status = 'BEST_FIT';
        group = 'best_fit';
      } else if (finalScore >= 65) {
        status = 'GOOD_FIT';
        group = 'good_fit';
      } else {
        status = 'BACKUP';
        group = 'backup';
      }

      // Probability Band
      let probabilityBand: LenderEvaluation['probability_band'] = 'low';
      if (finalScore >= 80) probabilityBand = 'high';
      else if (finalScore >= 60) probabilityBand = 'medium';

      evaluations.push({
        rank: 0, // Will be set after sorting
        lender_id: lender.id,
        lender_name: lender.name,
        lender_code: lender.code,
        status,
        score: finalScore,
        base_score: baseScore,
        course_multiplier: courseMultiplier,
        urgency_adjustment: urgencyAdjustment,
        reason,
        badges,
        is_premium_match: isPremiumMatch,
        university_match: universityMatch,
        knockout_reason: eligibility.reason || undefined,
        unlock_hint: eligibility.unlockHint || undefined,
        processing_time_estimate: lender.processing_time_range_min && lender.processing_time_range_max
          ? `${lender.processing_time_range_min}-${lender.processing_time_range_max} days`
          : lender.processing_time_days
            ? `~${lender.processing_time_days} days`
            : 'Contact for timeline',
        interest_rate_display: lender.interest_rate_min && lender.interest_rate_max
          ? `${lender.interest_rate_min}% - ${lender.interest_rate_max}%`
          : 'Contact for rates',
        loan_range_display: lender.loan_amount_min && lender.loan_amount_max
          ? `₹${(lender.loan_amount_min / 100000).toFixed(0)}L - ₹${(lender.loan_amount_max / 100000).toFixed(0)}L`
          : 'Flexible',
        fit_factors: fitFactors,
        risk_flags: riskFlags,
        probability_band: probabilityBand,
        group,
      });
    }

    // =========================================================================
    // SORT & RANK
    // =========================================================================

    // Sort: Premium first, then by score descending, then by interest rate ascending
    evaluations.sort((a, b) => {
      // Premium matches always first
      if (a.is_premium_match && !b.is_premium_match) return -1;
      if (!a.is_premium_match && b.is_premium_match) return 1;

      // Locked lenders always last (among non-premium)
      if (a.status === 'LOCKED' && b.status !== 'LOCKED') return 1;
      if (a.status !== 'LOCKED' && b.status === 'LOCKED') return -1;

      // By score descending
      if (b.score !== a.score) return b.score - a.score;

      // Tie-breaker: Lower interest rate wins
      // (We'd need to parse the display string, so skip for now)
      return 0;
    });

    // Assign ranks
    evaluations.forEach((e, i) => {
      e.rank = i + 1;
    });

    // =========================================================================
    // BUILD OUTPUT
    // =========================================================================

    const topResult = evaluations.find(e => e.status !== 'LOCKED') || evaluations[0];
    const topScores = evaluations.slice(0, 3).map(e => e.score);
    const overallConfidence = topScores.length > 0
      ? Math.round(topScores.reduce((a, b) => a + b, 0) / topScores.length)
      : 0;

    const output: BREOutput = {
      results: evaluations,
      top_recommendation: topResult,
      urgency_zone: urgencyZone,
      days_until_deadline: daysUntil,
      overall_confidence: overallConfidence,
      needs_human_review: overallConfidence < 60 || !universityName,
      model_version: 'v4.0-per-lender-bre',
      course_type: courseType,
      loan_amount: effectiveLoanAmount,
      university_name: universityName,
    };

    console.log(`✅ BRE v4.0: Top=${topResult?.lender_name} (${topResult?.score}%), Premium=${topResult?.is_premium_match}`);

    // =========================================================================
    // SAVE TO DATABASE
    // =========================================================================

    const { data: existingRec } = await supabase
      .from('ai_lender_recommendations')
      .select('version')
      .eq('lead_id', leadId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (existingRec?.version || 0) + 1;

    await supabase
      .from('ai_lender_recommendations')
      .insert({
        lead_id: leadId,
        recommended_lender_ids: evaluations.filter(e => e.status !== 'LOCKED').slice(0, 5).map(e => e.lender_id),
        recommended_lenders_data: evaluations.slice(0, 5).map(e => ({
          lender_id: e.lender_id,
          lender_name: e.lender_name,
          confidence_score: e.score,
          rationale: e.reason,
          match_factors: e.fit_factors,
          is_premium: e.is_premium_match,
        })),
        all_lenders_output: evaluations,
        rationale: topResult
          ? `BRE v4.0 recommends ${topResult.lender_name} with ${topResult.score}% fit${topResult.is_premium_match ? ' (Premium Partner)' : ''}`
          : 'No clear recommendation - human review needed',
        confidence_score: overallConfidence,
        model_version: output.model_version,
        inputs_snapshot: {
          lead_id: leadId,
          loan_amount: effectiveLoanAmount,
          study_destination: studyDestination || lead.study_destination,
          loan_type: effectiveLoanType,
          course_type: courseType,
          co_applicant_salary: coApplicantSalary,
          university: universityName,
          intake: lead.intake_month && lead.intake_year
            ? `${lead.intake_month}/${lead.intake_year}`
            : null,
        },
        version: nextVersion,
        urgency_zone: urgencyZone,
        student_tier: topResult?.university_match?.tier_label || 'Standard',
        strategy: urgencyZone === 'RED' ? 'SPEED_PRIORITY' : urgencyZone === 'GREEN' ? 'COST_OPTIMIZATION' : 'BALANCED',
        all_lender_scores: evaluations.map(e => ({
          id: e.lender_id,
          name: e.lender_name,
          score: e.score,
          status: e.status,
          is_premium: e.is_premium_match,
        })),
        student_facing_reason: topResult?.reason,
      });

    // =========================================================================
    // RESPONSE
    // =========================================================================

    return new Response(
      JSON.stringify({
        success: true,
        ...output,
        grouped: {
          premium: evaluations.filter(e => e.group === 'premium'),
          best_fit: evaluations.filter(e => e.group === 'best_fit'),
          good_fit: evaluations.filter(e => e.group === 'good_fit'),
          backup: evaluations.filter(e => e.group === 'backup'),
          locked: evaluations.filter(e => e.group === 'locked'),
        },
        version: nextVersion,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('💥 [BRE v4.0] Error:', error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
