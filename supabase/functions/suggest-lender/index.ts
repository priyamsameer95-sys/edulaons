/**
 * Smart Lender 4-Layer Decision Engine
 * 
 * Layer 1: TRANSLATOR - Normalizes data (University Tier, Urgency Zone)
 * Layer 2: BOUNCER - Hard knockouts (but locked lenders still shown, ranked lower)
 * Layer 3: STRATEGIST - Time-weighted scoring based on urgency
 * Layer 4: SCORER - 3-Pillar evaluation (Future, Financial, Past)
 * 
 * Key Features:
 * - Locked lenders are NOT hidden, just ranked lower with unlock hints
 * - AI generates persuasive justifications
 * - Admin override feedback stored for learning
 * - Version tracking for recommendation history
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================================================
// TYPES
// ============================================================================

type UniversityTier = 'S' | 'A' | 'B' | 'C';
type UrgencyZone = 'GREEN' | 'YELLOW' | 'RED';
type Strategy = 'COST_OPTIMIZATION' | 'BALANCED' | 'SPEED_PRIORITY';
type LenderStatus = 'BEST_FIT' | 'GOOD_FIT' | 'BACKUP' | 'LOCKED';

interface RecommendationContext {
  student_tier: UniversityTier;
  urgency_zone: UrgencyZone;
  days_until_deadline: number;
  strategy: Strategy;
  missing_data_warnings: string[];
  intake_date: string | null;
  loan_amount: number;
  loan_type: string;
  has_collateral: boolean;
}

interface PillarBreakdown {
  future: { score: number; label: string; strong: boolean; details: string };
  financial: { score: number; label: string; strong: boolean; details: string };
  past: { score: number; label: string; strong: boolean; details: string };
  two_of_three_bonus: number;
}

interface TieBreakerInfo {
  applied: boolean;
  criteria: string;
  value: number | string;
}

interface DataCompleteness {
  has_university: boolean;
  has_intake: boolean;
  has_income: boolean;
  has_academics: boolean;
  score: number;
  needs_review: boolean;
}

interface LenderResult {
  rank: number;
  lender_id: string;
  lender_name: string;
  lender_code: string;
  status: LenderStatus;
  score: number;
  raw_score: number;
  strategic_adjustment: number;
  reason: string;
  trade_off: string;
  badges: string[];
  pillar_breakdown: PillarBreakdown;
  knockout_reason?: string;
  unlock_hint?: string;
  processing_time_estimate: string;
  interest_rate_display: string;
  loan_range_display: string;
  fit_factors: string[];
  risk_flags: string[];
  probability_band: 'high' | 'medium' | 'low';
  group: 'best_fit' | 'also_consider' | 'possible_but_risky' | 'not_suitable';
  student_facing_reason: {
    greeting: string;
    confidence: string;
    cta: string;
  } | string;
  university_boost?: {
    type: 'premium' | 'ranked' | 'none';
    amount: number;
    details: string;
    duplicate_detected: boolean;
    ranked_tier: number | null;
  };
  tie_breaker?: TieBreakerInfo;
}

interface SmartLenderOutput {
  recommendation_context: RecommendationContext;
  results: LenderResult[];
  top_recommendation: LenderResult | null;
  overall_confidence: number;
  needs_human_review: boolean;
  ai_notes: string;
  model_version: string;
}

// ============================================================================
// LAYER 1: TRANSLATOR - Normalize Data
// ============================================================================

function calculateUniversityTier(globalRank: number | null | undefined): UniversityTier {
  if (!globalRank || globalRank <= 0) return 'C';
  if (globalRank <= 100) return 'S';
  if (globalRank <= 300) return 'A';
  if (globalRank <= 500) return 'B';
  return 'C';
}

function calculateUrgencyZone(intakeMonth: number | null, intakeYear: number | null): { zone: UrgencyZone; daysUntil: number } {
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

function determineStrategy(zone: UrgencyZone): Strategy {
  switch (zone) {
    case 'RED': return 'SPEED_PRIORITY';
    case 'GREEN': return 'COST_OPTIMIZATION';
    default: return 'BALANCED';
  }
}

function calculateWeightedAcademicScore(
  tenth: number | null,
  twelfth: number | null,
  bachelors: number | null,
  cgpa: number | null
): number {
  // Convert CGPA to percentage if needed
  const bachPercent = bachelors || (cgpa ? cgpa * 10 : null);

  const scores: { value: number; weight: number }[] = [];
  if (tenth) scores.push({ value: tenth, weight: 0.2 });
  if (twelfth) scores.push({ value: twelfth, weight: 0.3 });
  if (bachPercent) scores.push({ value: bachPercent, weight: 0.5 });

  if (scores.length === 0) return 50; // Default

  // Normalize weights if not all present
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  const weightedSum = scores.reduce((sum, s) => sum + (s.value * s.weight / totalWeight), 0);

  return Math.round(weightedSum);
}

// ============================================================================
// LAYER 2: BOUNCER - Check Knockouts (but don't hide, just flag)
// ============================================================================

interface KnockoutResult {
  isLocked: boolean;
  reason: string | null;
  unlockHint: string | null;
  penaltyScore: number;
}

function checkLenderKnockouts(
  lender: any,
  loanAmount: number,
  loanType: string,
  coApplicantSalary: number | null,
  hasCollateral: boolean,
  tier: UniversityTier
): KnockoutResult {
  const breJson = lender.bre_json || {};

  // 1. Check Tier-Specific Loan Limits (from bre_json)
  const tierLimitKey = `tier_${tier.toLowerCase()}_limit`;
  const tierLimit = breJson[tierLimitKey];

  if (tierLimit && loanAmount > tierLimit) {
    return {
      isLocked: true,
      reason: 'LOAN_EXCEEDS_TIER_LIMIT',
      unlockHint: `Move to a higher-ranked university (currently Tier ${tier}) or reduce loan to ₹${(tierLimit / 100000).toFixed(0)}L`,
      penaltyScore: 40,
    };
  }

  // 2. Check overall loan amount limits
  const maxAmount = lender.loan_amount_max || 0;
  const minAmount = lender.loan_amount_min || 0;

  if (maxAmount > 0 && loanAmount > maxAmount) {
    return {
      isLocked: true,
      reason: 'LOAN_EXCEEDS_MAX',
      unlockHint: `Add collateral or split between lenders. Max: ₹${(maxAmount / 100000).toFixed(0)}L`,
      penaltyScore: 35,
    };
  }

  if (minAmount > 0 && loanAmount < minAmount) {
    return {
      isLocked: true,
      reason: 'LOAN_BELOW_MIN',
      unlockHint: `Minimum requirement: ₹${(minAmount / 100000).toFixed(0)}L`,
      penaltyScore: 30,
    };
  }

  // 3. Check income requirements (collateral can override)
  const incomeMin = lender.income_expectations_min || 0;
  if (incomeMin > 0 && coApplicantSalary && coApplicantSalary < incomeMin && !hasCollateral) {
    return {
      isLocked: true,
      reason: 'INCOME_BELOW_MIN',
      unlockHint: `Add co-applicant with ₹${(incomeMin / 1000).toFixed(0)}K+ monthly income, or provide collateral`,
      penaltyScore: 25,
    };
  }

  return { isLocked: false, reason: null, unlockHint: null, penaltyScore: 0 };
}

// ============================================================================
// LAYER 3: STRATEGIST - Apply Time-Based Adjustments
// ============================================================================

function applyStrategicAdjustments(
  baseScore: number,
  lender: any,
  zone: UrgencyZone,
  strategy: Strategy
): { adjustedScore: number; adjustment: number; badges: string[] } {
  let adjustment = 0;
  const badges: string[] = [];

  const processingDays = lender.processing_time_days || lender.processing_time_range_min || 20;
  const interestRate = lender.interest_rate_min || 10;

  const isFast = processingDays <= 15;
  const isSlow = processingDays >= 31;
  const isLowRate = interestRate < 9.5;
  const isHighRate = interestRate > 11;

  switch (strategy) {
    case 'SPEED_PRIORITY': // RED zone
      if (isFast) {
        adjustment += 40;
        badges.push('⚡ Fast Approval');
      }
      if (isSlow) {
        adjustment -= 50;
        badges.push('🐢 Slow Processing');
      }
      break;

    case 'COST_OPTIMIZATION': // GREEN zone
      if (isLowRate) {
        adjustment += 30;
        badges.push('💰 Lowest Rate');
      }
      if (isHighRate) {
        adjustment -= 15;
      }
      // Small speed bonus even in green zone
      if (isFast) {
        adjustment += 10;
        badges.push('Quick Turnaround');
      }
      break;

    case 'BALANCED': // YELLOW zone
      if (isFast) {
        adjustment += 15;
        badges.push('Fast Processing');
      }
      if (isLowRate) {
        adjustment += 15;
        badges.push('Competitive Rate');
      }
      if (isSlow) {
        adjustment -= 20;
      }
      break;
  }

  return {
    adjustedScore: Math.min(100, Math.max(0, baseScore + adjustment)),
    adjustment,
    badges,
  };
}

// ============================================================================
// RANKED UNIVERSITY TIER BOOST CALCULATOR
// ============================================================================

interface RankedUniversity {
  name: string;
  country: string;
  rank: number;
}

interface PremiumUniversity {
  name: string;
  country: string;
}

/**
 * Premium University Boost - Flat +25 points for premium partnerships
 * Uses fuzzy matching for flexibility (partial name matches)
 */
function calculatePremiumUniversityBoost(
  universityName: string | null | undefined,
  premiumUniversities: PremiumUniversity[]
): { boost: number; matched: boolean; matchedName?: string } {
  if (!universityName || !premiumUniversities || premiumUniversities.length === 0) {
    return { boost: 0, matched: false };
  }

  const normalizedInput = universityName.toLowerCase().trim();

  // Fuzzy matching: check if input contains premium name or vice versa
  const matchedPremium = premiumUniversities.find((u) => {
    const premiumName = u.name.toLowerCase().trim();
    return (
      normalizedInput === premiumName ||
      normalizedInput.includes(premiumName) ||
      premiumName.includes(normalizedInput)
    );
  });

  if (matchedPremium) {
    return { boost: 25, matched: true, matchedName: matchedPremium.name };
  }

  return { boost: 0, matched: false };
}

/**
 * Calculates the tier boost for a university based on its rank in the lender's ranked list.
 * Uses fuzzy matching and percentage-based tiers that scale with list size:
 * - Top 10%: +15 points
 * - 10-50%: +10 points
 * - 50-80%: +5 points
 * - Bottom 20%: +2 points
 */
function calculateRankedUniversityBoost(
  universityName: string | null | undefined,
  rankedUniversities: RankedUniversity[]
): { boost: number; tier: number | null; matched: boolean; matchedName?: string } {
  if (!universityName || !rankedUniversities || rankedUniversities.length === 0) {
    return { boost: 0, tier: null, matched: false };
  }

  const normalizedInput = universityName.toLowerCase().trim();
  const totalCount = rankedUniversities.length;

  // Exact match first
  let rankedEntry = rankedUniversities.find(
    (u) => u.name.toLowerCase().trim() === normalizedInput
  );

  // If no exact match, try fuzzy matching (partial name match)
  if (!rankedEntry) {
    rankedEntry = rankedUniversities.find((u) => {
      const rankedName = u.name.toLowerCase().trim();
      return normalizedInput.includes(rankedName) || rankedName.includes(normalizedInput);
    });
  }

  if (!rankedEntry) {
    return { boost: 0, tier: null, matched: false };
  }

  const percentile = (rankedEntry.rank / totalCount) * 100;

  if (percentile <= 10) {
    return { boost: 15, tier: 1, matched: true, matchedName: rankedEntry.name };
  } else if (percentile <= 50) {
    return { boost: 10, tier: 2, matched: true, matchedName: rankedEntry.name };
  } else if (percentile <= 80) {
    return { boost: 5, tier: 3, matched: true, matchedName: rankedEntry.name };
  }
  return { boost: 2, tier: 4, matched: true, matchedName: rankedEntry.name };
}

interface UniversityBoostResult {
  boost: number;
  type: 'premium' | 'ranked' | 'none';
  details: string;
  duplicateDetected: boolean;
  premiumMatched: boolean;
  rankedMatched: boolean;
  rankedTier: number | null;
}

/**
 * Calculate combined university boost with duplicate prevention.
 * If university appears in both premium and ranked lists, take the higher boost only.
 */
function calculateCombinedUniversityBoost(
  universityName: string | null | undefined,
  premiumUniversities: PremiumUniversity[],
  rankedUniversities: RankedUniversity[]
): UniversityBoostResult {
  const premiumResult = calculatePremiumUniversityBoost(universityName, premiumUniversities);
  const rankedResult = calculateRankedUniversityBoost(universityName, rankedUniversities);

  // Both matched - take higher boost (duplicate prevention)
  if (premiumResult.matched && rankedResult.matched) {
    const usePremium = premiumResult.boost >= rankedResult.boost;
    return {
      boost: Math.max(premiumResult.boost, rankedResult.boost),
      type: usePremium ? 'premium' : 'ranked',
      details: `Found in both lists (Premium: +${premiumResult.boost}, Ranked Tier ${rankedResult.tier}: +${rankedResult.boost}) — using ${usePremium ? 'Premium' : 'Ranked'} (+${Math.max(premiumResult.boost, rankedResult.boost)})`,
      duplicateDetected: true,
      premiumMatched: true,
      rankedMatched: true,
      rankedTier: rankedResult.tier,
    };
  }

  // Premium only
  if (premiumResult.matched) {
    return {
      boost: premiumResult.boost,
      type: 'premium',
      details: `Premium Partner University (+${premiumResult.boost})`,
      duplicateDetected: false,
      premiumMatched: true,
      rankedMatched: false,
      rankedTier: null,
    };
  }

  // Ranked only
  if (rankedResult.matched) {
    return {
      boost: rankedResult.boost,
      type: 'ranked',
      details: `Ranked Tier ${rankedResult.tier} (+${rankedResult.boost})`,
      duplicateDetected: false,
      premiumMatched: false,
      rankedMatched: true,
      rankedTier: rankedResult.tier,
    };
  }

  // No match
  return {
    boost: 0,
    type: 'none',
    details: '',
    duplicateDetected: false,
    premiumMatched: false,
    rankedMatched: false,
    rankedTier: null,
  };
}

// ============================================================================
// LAYER 4: SCORER - 3-Pillar Evaluation
// ============================================================================

function calculate3PillarScore(
  lender: any,
  tier: UniversityTier,
  academicScore: number,
  coApplicantSalary: number | null,
  hasCollateral: boolean,
  loanAmount: number
): PillarBreakdown {
  // ===== FUTURE PILLAR (University/Course) - Max 100 =====
  let futureScore = 0;
  let futureLabel = '';
  let futureDetails = '';

  const tierScores: Record<UniversityTier, number> = { S: 100, A: 80, B: 60, C: 40 };
  futureScore = tierScores[tier];

  switch (tier) {
    case 'S':
      futureLabel = 'Top 100 University';
      futureDetails = 'Premium institution recognition';
      break;
    case 'A':
      futureLabel = 'Top 300 University';
      futureDetails = 'Strong global ranking';
      break;
    case 'B':
      futureLabel = 'Top 500 University';
      futureDetails = 'Good university standing';
      break;
    default:
      futureLabel = 'Standard University';
      futureDetails = 'May need additional documentation';
  }

  // ===== FINANCIAL PILLAR (Income/Collateral) - Max 100 =====
  let financialScore = 0;
  let financialLabel = '';
  let financialDetails = '';

  const incomeExpected = lender.income_expectations_min || 50000;
  const incomeRatio = coApplicantSalary ? coApplicantSalary / incomeExpected : 0;

  if (hasCollateral) {
    financialScore = 90; // Collateral provides strong backing
    financialLabel = 'Collateral Secured';
    financialDetails = 'Property backing strengthens application';
  } else if (incomeRatio >= 1.5) {
    financialScore = 100;
    financialLabel = 'Excellent Income';
    financialDetails = `Income exceeds expectations by ${Math.round((incomeRatio - 1) * 100)}%`;
  } else if (incomeRatio >= 1.0) {
    financialScore = 75;
    financialLabel = 'Strong Income';
    financialDetails = 'Income meets lender expectations';
  } else if (incomeRatio >= 0.7) {
    financialScore = 50;
    financialLabel = 'Adequate Income';
    financialDetails = 'Income slightly below preference';
  } else {
    financialScore = 30;
    financialLabel = 'Income Gap';
    financialDetails = 'Consider adding co-applicant or collateral';
  }

  // ===== PAST PILLAR (Academics) - Max 100 =====
  let pastScore = academicScore;
  let pastLabel = '';
  let pastDetails = '';

  if (academicScore >= 80) {
    pastLabel = 'Excellent Academics';
    pastDetails = 'Strong academic profile';
  } else if (academicScore >= 65) {
    pastLabel = 'Good Academics';
    pastDetails = 'Solid academic background';
  } else if (academicScore >= 50) {
    pastLabel = 'Average Academics';
    pastDetails = 'Standard academic profile';
  } else {
    pastLabel = 'Needs Support';
    pastDetails = 'Academic profile may need explanation';
  }

  // ===== 2-OUT-OF-3 COMPENSATION BONUS =====
  const strongPillars = [
    futureScore >= 70,
    financialScore >= 70,
    pastScore >= 70,
  ].filter(Boolean).length;

  const twoOfThreeBonus = strongPillars >= 2 ? 10 : 0;

  return {
    future: { score: futureScore, label: futureLabel, strong: futureScore >= 70, details: futureDetails },
    financial: { score: financialScore, label: financialLabel, strong: financialScore >= 70, details: financialDetails },
    past: { score: pastScore, label: pastLabel, strong: pastScore >= 70, details: pastDetails },
    two_of_three_bonus: twoOfThreeBonus,
  };
}

// ============================================================================
// STUDENT-FRIENDLY REASON GENERATOR (SMART ENGINE)
// ============================================================================

function generateSmartReason(
  student: any,
  lender: any,
  loanAmount: number,
  context: RecommendationContext
): string {
  // 1. The "Scholar" Match
  const gpa = student.bachelors_cgpa || (student.bachelors_percentage ? student.bachelors_percentage / 10 : 0);
  const lenderMinGpa = lender.min_cgpa_requirement || 0; // Assuming this field exists or default 0

  if (gpa > 7.5 && (lenderMinGpa < 7 || lenderMinGpa === 0)) {
    return `Your strong academic profile (GPA ${gpa.toFixed(1)}) makes you a preferred candidate here.`;
  }

  // 2. The "High Value" Match
  const lenderMaxLoan = lender.loan_amount_max || 0;
  if (loanAmount > 2000000 && lenderMaxLoan >= loanAmount) {
    return `Fully covers your ₹${(loanAmount / 100000).toFixed(1)}L request where others might cap out.`;
  }

  // 3. The "Speed" Match
  const processingTime = lender.processing_time_days || 20;
  if (context.urgency_zone === 'RED' && processingTime < 7) {
    return `Selected because they can meet your tight deadline (<${processingTime} days).`;
  }

  // 4. Fallback (Safety)
  return "Balanced match for your profile and loan requirement.";
}

function generateStudentReason(
  lender: any,
  score: number,
  zone: UrgencyZone,
  daysUntil: number,
  isLocked: boolean
): { greeting: string; confidence: string; cta: string } {
  // Deprecated but kept for type compatibility if needed, 
  // though we will prefer generateSmartReason in the main flow.
  if (isLocked) {
    return {
      greeting: 'This lender has specific requirements.',
      confidence: 'Check the unlock hint to see how to qualify.',
      cta: 'View other options below.',
    };
  }

  return {
    greeting: 'A strong option for your study plans.',
    confidence: 'Good match based on your profile.',
    cta: 'Compare terms below to decide.',
  };
}

// ============================================================================
// AI JUSTIFICATION LAYER
// ============================================================================

async function generateAIJustifications(
  results: LenderResult[],
  context: RecommendationContext,
  lovableApiKey: string | undefined
): Promise<LenderResult[]> {
  if (!lovableApiKey || results.length === 0) {
    return results;
  }

  try {
    const prompt = `You are a friendly loan counselor. Generate persuasive reasons and trade-offs for these lender rankings.

Context:
- Student Tier: ${context.student_tier} (${context.student_tier === 'S' ? 'Top 100' : context.student_tier === 'A' ? 'Top 300' : 'Standard'} university)
- Timeline: ${context.days_until_deadline} days until intake (${context.urgency_zone} zone)
- Strategy: ${context.strategy.replace('_', ' ')}
- Loan Amount: ₹${(context.loan_amount / 100000).toFixed(0)} Lakhs
- Has Collateral: ${context.has_collateral ? 'Yes' : 'No'}

Top 5 Lenders (already ranked by our algorithm):
${results.slice(0, 5).map((r, i) => `
${i + 1}. ${r.lender_name} (Score: ${r.score}, Status: ${r.status})
   - Interest: ${r.interest_rate_display}
   - Processing: ${r.processing_time_estimate}
   - Strengths: ${r.fit_factors.slice(0, 3).join(', ')}
   ${r.status === 'LOCKED' ? `- LOCKED: ${r.knockout_reason}` : ''}
`).join('')}

For each lender, generate:
1. reason (2 sentences): Why this lender is recommended at this rank. Be specific to the student's situation.
2. trade_off (1 sentence): What the student gives up by choosing this lender vs #1.

For LOCKED lenders, explain sympathetically why they don't qualify and encourage the unlock path.

Respond in JSON format:
{
  "lender_justifications": [
    { "lender_id": "...", "reason": "...", "trade_off": "..." }
  ]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.warn('AI justification request failed:', response.status);
      return results;
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;

    if (content) {
      const parsed = JSON.parse(content);
      const justifications = parsed.lender_justifications || [];

      return results.map(r => {
        const aiJust = justifications.find((j: any) => j.lender_id === r.lender_id);
        if (aiJust) {
          return {
            ...r,
            reason: aiJust.reason || r.reason,
            trade_off: aiJust.trade_off || r.trade_off,
          };
        }
        return r;
      });
    }
  } catch (err) {
    console.error('AI justification error:', err);
  }

  return results;
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
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { leadId, studyDestination, loanAmount } = await req.json();

    console.log('🧠 [Smart Lender Engine] Processing lead:', leadId);

    // =========================================================================
    // FETCH DATA
    // =========================================================================

    const { data: lead, error: leadError } = await supabase
      .from('leads_new')
      .select(`
        id, loan_amount, loan_type, study_destination, loan_classification,
        intake_month, intake_year,
        student:students(
          id, name, email, phone, highest_qualification,
          tenth_percentage, twelfth_percentage, bachelors_percentage, bachelors_cgpa,
          city, state, pin_code_tier
        ),
        co_applicant:co_applicants(
          id, name, relationship, monthly_salary, employment_type, employer,
          occupation, pin_code
        ),
        lead_universities!fk_lead_universities_lead(
          university:universities!fk_lead_universities_university(id, name, country, city, global_rank)
        )
      `)
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      throw new Error('Lead not found: ' + leadError?.message);
    }

    const { data: lenders, error: lendersError } = await supabase
      .from('lenders')
      .select('*')
      .eq('is_active', true)
      .order('preferred_rank', { ascending: true, nullsFirst: false });

    if (lendersError || !lenders?.length) {
      throw new Error('No active lenders found');
    }

    console.log(`📊 Processing ${lenders.length} active lenders`);

    // Extract data
    const student = lead.student as any;
    const coApplicant = lead.co_applicant as any;
    const universities = (lead.lead_universities as any[])?.map(lu => lu.university) || [];
    const primaryUniversity = universities[0];

    const effectiveLoanAmount = loanAmount || lead.loan_amount;
    const effectiveLoanType = lead.loan_type || 'secured';
    const hasCollateral = effectiveLoanType === 'secured';

    // =========================================================================
    // LAYER 1: TRANSLATOR
    // =========================================================================

    const tier = calculateUniversityTier(primaryUniversity?.global_rank);
    const { zone, daysUntil } = calculateUrgencyZone(lead.intake_month, lead.intake_year);
    const strategy = determineStrategy(zone);

    const academicScore = calculateWeightedAcademicScore(
      student?.tenth_percentage,
      student?.twelfth_percentage,
      student?.bachelors_percentage,
      student?.bachelors_cgpa
    );

    console.log(`📐 Layer 1 - Tier: ${tier}, Zone: ${zone} (${daysUntil} days), Strategy: ${strategy}, Academic: ${academicScore}`);

    // Build missing data warnings and data completeness score
    const missingWarnings: string[] = [];
    if (!primaryUniversity) missingWarnings.push('University not specified');
    if (!lead.intake_month || !lead.intake_year) missingWarnings.push('Intake date not specified');
    if (!coApplicant?.monthly_salary) missingWarnings.push('Co-applicant income missing');

    // Data Completeness Tracking
    const dataCompleteness: DataCompleteness = {
      has_university: !!primaryUniversity?.global_rank,
      has_intake: !!(lead.intake_month && lead.intake_year),
      has_income: !!coApplicant?.monthly_salary,
      has_academics: !!(student?.tenth_percentage || student?.twelfth_percentage || student?.bachelors_percentage),
      score: 0,
      needs_review: false,
    };
    dataCompleteness.score = [
      dataCompleteness.has_university,
      dataCompleteness.has_intake,
      dataCompleteness.has_income,
      dataCompleteness.has_academics,
    ].filter(Boolean).length;
    dataCompleteness.needs_review = dataCompleteness.score < 3;

    console.log(`📊 Data Completeness: ${dataCompleteness.score}/4 (needs_review: ${dataCompleteness.needs_review})`);

    // Construct Context for Smart Engine
    const recommendationContext: RecommendationContext = {
      student_tier: tier,
      urgency_zone: zone,
      days_until_deadline: daysUntil,
      strategy,
      missing_data_warnings: missingWarnings,
      intake_date: lead.intake_month && lead.intake_year ? `${lead.intake_month}/${lead.intake_year}` : null,
      loan_amount: effectiveLoanAmount,
      loan_type: effectiveLoanType,
      has_collateral: hasCollateral,
    };

    // =========================================================================
    // LAYERS 2-4: BOUNCER + STRATEGIST + SCORER
    // =========================================================================

    const coApplicantSalary = coApplicant?.monthly_salary || null;

    const scoredLenders = lenders.map(lender => {
      // Layer 2: Bouncer
      const knockout = checkLenderKnockouts(
        lender,
        effectiveLoanAmount,
        effectiveLoanType,
        coApplicantSalary,
        hasCollateral,
        tier
      );

      // Layer 4: 3-Pillar Score
      const pillars = calculate3PillarScore(
        lender,
        tier,
        academicScore,
        coApplicantSalary,
        hasCollateral,
        effectiveLoanAmount
      );

      // Base score from pillars (weighted average) - CAP AT 100
      const pillarWeights = { future: 0.35, financial: 0.4, past: 0.25 };
      const rawScore = Math.min(100, Math.round(
        pillars.future.score * pillarWeights.future +
        pillars.financial.score * pillarWeights.financial +
        pillars.past.score * pillarWeights.past +
        pillars.two_of_three_bonus
      ));

      // Layer 3: Strategic Adjustments
      const { adjustedScore, adjustment, badges } = applyStrategicAdjustments(
        rawScore,
        lender,
        zone,
        strategy
      );

      // Calculate combined university boost (premium + ranked with duplicate prevention)
      const universityRestrictions = lender.university_restrictions as {
        premium?: PremiumUniversity[];
        ranked?: RankedUniversity[];
      } | null;
      const premiumUniversities = universityRestrictions?.premium || [];
      const rankedUniversities = universityRestrictions?.ranked || [];

      const universityBoost = calculateCombinedUniversityBoost(
        primaryUniversity?.name,
        premiumUniversities,
        rankedUniversities
      );

      // FIX: Apply knockout penalty BEFORE university boost
      // This prevents locked lenders from ranking higher than unlocked ones
      const scoreAfterKnockout = knockout.isLocked
        ? Math.max(0, adjustedScore - knockout.penaltyScore)
        : adjustedScore;

      // Apply university boost AFTER knockout penalty, capped at 100
      const finalScore = Math.min(100, scoreAfterKnockout + universityBoost.boost);

      // Add badge if matched (with boost type indicator)
      const finalBadges = [...badges];
      if (universityBoost.type === 'premium') {
        finalBadges.push(`⭐ Premium University (+${universityBoost.boost})`);
      } else if (universityBoost.type === 'ranked') {
        finalBadges.push(`🎓 Ranked Tier ${universityBoost.rankedTier} (+${universityBoost.boost})`);
      }

      // Determine status
      let status: LenderStatus = 'BACKUP';
      if (knockout.isLocked) {
        status = 'LOCKED';
      } else if (finalScore >= 80) {
        status = 'BEST_FIT';
      } else if (finalScore >= 60) {
        status = 'GOOD_FIT';
      }

      // Build fit factors
      const fitFactors: string[] = [];
      if (pillars.future.strong) fitFactors.push(pillars.future.label);
      if (pillars.financial.strong) fitFactors.push(pillars.financial.label);
      if (pillars.past.strong) fitFactors.push(pillars.past.label);

      // Check loan coverage
      const min = lender.loan_amount_min || 0;
      const max = lender.loan_amount_max || 0;
      if (min > 0 && max > 0 && effectiveLoanAmount >= min && effectiveLoanAmount <= max) {
        fitFactors.push('Loan Amount Covered');
      }

      // Add income match if applicable
      if (coApplicantSalary && lender.income_expectations_min && coApplicantSalary >= lender.income_expectations_min) {
        fitFactors.push('Income Meets Expectations');
      }

      // Risk flags
      const riskFlags: string[] = [];
      if (knockout.isLocked && knockout.reason) {
        riskFlags.push(knockout.reason);
      }

      return {
        lender,
        knockout,
        pillars,
        rawScore,
        adjustment,
        finalScore,
        status,
        badges: finalBadges,
        fitFactors,
        riskFlags,
        universityBoost,
      };
    });

    // DETERMINISTIC TIE-BREAKER SORTING
    // Multi-criteria sort ensures consistent rankings when scores are equal
    scoredLenders.sort((a, b) => {
      // Primary: Final score (descending)
      if (b.finalScore !== a.finalScore) {
        return b.finalScore - a.finalScore;
      }

      // Tie-breaker 1: Raw pillar score before adjustments (descending)
      if (b.rawScore !== a.rawScore) {
        return b.rawScore - a.rawScore;
      }

      // Tie-breaker 2: Processing speed - faster wins (ascending)
      const aProcessing = a.lender.processing_time_days || a.lender.processing_time_range_min || 30;
      const bProcessing = b.lender.processing_time_days || b.lender.processing_time_range_min || 30;
      if (aProcessing !== bProcessing) {
        return aProcessing - bProcessing;
      }

      // Tie-breaker 3: Interest rate - lower wins (ascending)
      const aRate = a.lender.interest_rate_min || 12;
      const bRate = b.lender.interest_rate_min || 12;
      if (aRate !== bRate) {
        return aRate - bRate;
      }

      // Tie-breaker 4: Preferred rank if set (ascending)
      const aRank = a.lender.preferred_rank || 999;
      const bRank = b.lender.preferred_rank || 999;
      if (aRank !== bRank) {
        return aRank - bRank;
      }

      // Final fallback: Alphabetical by name for determinism
      return a.lender.name.localeCompare(b.lender.name);
    });

    // Track which tie-breaker was applied for transparency
    const tieBreakerResults: Map<string, TieBreakerInfo> = new Map();
    for (let i = 1; i < scoredLenders.length; i++) {
      const current = scoredLenders[i];
      const previous = scoredLenders[i - 1];

      if (current.finalScore === previous.finalScore) {
        // Determine which criteria broke the tie
        let criteria = 'alphabetical';
        let value: number | string = current.lender.name;

        if (previous.rawScore !== current.rawScore) {
          criteria = 'raw_pillar_score';
          value = previous.rawScore;
        } else {
          const prevProcessing = previous.lender.processing_time_days || previous.lender.processing_time_range_min || 30;
          const currProcessing = current.lender.processing_time_days || current.lender.processing_time_range_min || 30;
          if (prevProcessing !== currProcessing) {
            criteria = 'processing_speed';
            value = `${prevProcessing} days`;
          } else {
            const prevRate = previous.lender.interest_rate_min || 12;
            const currRate = current.lender.interest_rate_min || 12;
            if (prevRate !== currRate) {
              criteria = 'interest_rate';
              value = `${prevRate}%`;
            } else {
              const prevRank = previous.lender.preferred_rank || 999;
              const currRank = current.lender.preferred_rank || 999;
              if (prevRank !== currRank) {
                criteria = 'preferred_rank';
                value = prevRank;
              }
            }
          }
        }

        tieBreakerResults.set(previous.lender.id, { applied: true, criteria, value });
      }
    }

    // =========================================================================
    // BUILD RESULTS
    // =========================================================================

    const results: LenderResult[] = scoredLenders.map((sl, index) => {
      const { lender, knockout, pillars, rawScore, adjustment, finalScore, status, badges, fitFactors, riskFlags, universityBoost } = sl;

      // Determine group
      let group: LenderResult['group'] = 'not_suitable';
      if (status === 'BEST_FIT') group = 'best_fit';
      else if (status === 'GOOD_FIT') group = 'also_consider';
      else if (status === 'BACKUP') group = 'possible_but_risky';
      else if (status === 'LOCKED') group = 'not_suitable';

      // Probability band
      let probabilityBand: LenderResult['probability_band'] = 'low';
      if (finalScore >= 80) probabilityBand = 'high';
      else if (finalScore >= 60) probabilityBand = 'medium';

      // Generate basic reason and trade-off (AI will enhance these)
      let reason = '';
      let tradeOff = '';

      if (knockout.isLocked) {
        reason = `Currently doesn't match due to ${knockout.reason?.toLowerCase().replace(/_/g, ' ')}. ${knockout.unlockHint}`;
        tradeOff = 'Unlock by following the hint above.';
      } else if (index === 0) {
        reason = `Top recommendation for your ${zone === 'RED' ? 'urgent' : zone === 'GREEN' ? 'relaxed' : 'moderate'} timeline.`;
        tradeOff = 'Best overall match for your profile.';
      } else {
        const topLender = scoredLenders[0];
        reason = `Solid alternative with ${badges.length > 0 ? badges[0] : 'good overall fit'}.`;
        tradeOff = `${topLender.finalScore - finalScore} points behind ${topLender.lender.name}.`;
      }

      const studentReason = generateSmartReason(student, lender, effectiveLoanAmount, recommendationContext);

      return {
        rank: index + 1,
        lender_id: lender.id,
        lender_name: lender.name,
        lender_code: lender.code,
        status,
        score: finalScore,
        raw_score: rawScore,
        strategic_adjustment: adjustment,
        reason,
        trade_off: tradeOff,
        badges,
        pillar_breakdown: pillars,
        knockout_reason: knockout.reason || undefined,
        unlock_hint: knockout.unlockHint || undefined,
        processing_time_estimate: lender.processing_time_range_min && lender.processing_time_range_max
          ? `${lender.processing_time_range_min}-${lender.processing_time_range_max} days`
          : lender.processing_time_days
            ? `~${lender.processing_time_days} days`
            : 'Not specified',
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
        student_facing_reason: studentReason,
        university_boost: universityBoost.type !== 'none' ? {
          type: universityBoost.type,
          amount: universityBoost.boost,
          details: universityBoost.details,
          duplicate_detected: universityBoost.duplicateDetected,
          ranked_tier: universityBoost.rankedTier,
        } : undefined,
        tie_breaker: tieBreakerResults.get(lender.id),
      };
    });

    // =========================================================================
    // AI ENHANCEMENT (optional)
    // =========================================================================

    const enhancedResults = await generateAIJustifications(
      results,
      {
        student_tier: tier,
        urgency_zone: zone,
        days_until_deadline: daysUntil,
        strategy,
        missing_data_warnings: missingWarnings,
        intake_date: lead.intake_month && lead.intake_year
          ? `${lead.intake_month}/${lead.intake_year}`
          : null,
        loan_amount: effectiveLoanAmount,
        loan_type: effectiveLoanType,
        has_collateral: hasCollateral,
      },
      lovableApiKey
    );

    // =========================================================================
    // BUILD OUTPUT
    // =========================================================================

    const topResult = enhancedResults.find(r => r.status !== 'LOCKED') || enhancedResults[0];
    const topScores = enhancedResults.slice(0, 3).map(r => r.score);
    const overallConfidence = Math.round(topScores.reduce((a, b) => a + b, 0) / topScores.length);

    const output: SmartLenderOutput = {
      recommendation_context: {
        student_tier: tier,
        urgency_zone: zone,
        days_until_deadline: daysUntil,
        strategy,
        missing_data_warnings: missingWarnings,
        intake_date: lead.intake_month && lead.intake_year
          ? `${lead.intake_month}/${lead.intake_year}`
          : null,
        loan_amount: effectiveLoanAmount,
        loan_type: effectiveLoanType,
        has_collateral: hasCollateral,
      },
      results: enhancedResults,
      top_recommendation: topResult,
      overall_confidence: overallConfidence,
      needs_human_review: overallConfidence < 70 || missingWarnings.length > 0,
      ai_notes: lovableApiKey ? 'AI-enhanced justifications' : 'Rule-based scoring',
      model_version: '3.0-smart-lender-4layer',
    };

    console.log(`✅ Smart Lender: Top=${topResult?.lender_name} (${topResult?.score}), Confidence=${overallConfidence}%`);

    // =========================================================================
    // GET NEXT VERSION NUMBER
    // =========================================================================

    const { data: existingRec } = await supabase
      .from('ai_lender_recommendations')
      .select('version')
      .eq('lead_id', leadId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (existingRec?.version || 0) + 1;

    // =========================================================================
    // SAVE TO DATABASE
    // =========================================================================

    const { data: savedRec, error: saveError } = await supabase
      .from('ai_lender_recommendations')
      .insert({
        lead_id: leadId,
        recommended_lender_ids: enhancedResults.filter(r => r.status !== 'LOCKED').slice(0, 5).map(r => r.lender_id),
        recommended_lenders_data: enhancedResults.slice(0, 5).map(r => ({
          lender_id: r.lender_id,
          lender_name: r.lender_name,
          confidence_score: r.score,
          rationale: r.reason,
          match_factors: r.fit_factors,
        })),
        all_lenders_output: enhancedResults,
        rationale: topResult
          ? `Smart Lender recommends ${topResult.lender_name} with ${topResult.score}% fit`
          : 'No clear recommendation - human review needed',
        confidence_score: overallConfidence,
        model_version: output.model_version,
        inputs_snapshot: {
          lead_id: leadId,
          loan_amount: effectiveLoanAmount,
          study_destination: studyDestination || lead.study_destination,
          loan_type: effectiveLoanType,
          co_applicant_salary: coApplicantSalary,
          university: primaryUniversity?.name,
          intake: lead.intake_month && lead.intake_year
            ? `${lead.intake_month}/${lead.intake_year}`
            : null,
        },
        recommendation_context: output.recommendation_context,
        version: nextVersion,
        urgency_zone: zone,
        student_tier: tier,
        strategy,
        pillar_scores: topResult?.pillar_breakdown,
        all_lender_scores: enhancedResults.map(r => ({
          id: r.lender_id,
          name: r.lender_name,
          score: r.score,
          status: r.status,
        })),
        student_facing_reason: topResult?.student_facing_reason,
        ai_unavailable: !lovableApiKey,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save recommendation:', saveError);
    }

    // =========================================================================
    // RESPONSE
    // =========================================================================

    return new Response(
      JSON.stringify({
        success: true,
        recommendation: savedRec || output,
        recommendation_context: output.recommendation_context,
        results: output.results,
        top_recommendation: output.top_recommendation,
        grouped_evaluations: {
          best_fit: enhancedResults.filter(r => r.group === 'best_fit'),
          also_consider: enhancedResults.filter(r => r.group === 'also_consider'),
          possible_but_risky: enhancedResults.filter(r => r.group === 'possible_but_risky'),
          not_suitable: enhancedResults.filter(r => r.group === 'not_suitable'),
        },
        needs_human_review: output.needs_human_review,
        ai_notes: output.ai_notes,
        version: nextVersion,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('💥 [Smart Lender] Error:', error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        ai_unavailable: true,
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
