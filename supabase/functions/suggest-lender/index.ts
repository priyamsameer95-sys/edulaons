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
  };
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
  
  if (daysUntil <= 30) return { zone: 'RED', daysUntil };
  if (daysUntil <= 60) return { zone: 'YELLOW', daysUntil };
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
// STUDENT-FRIENDLY REASON GENERATOR
// ============================================================================

function generateStudentReason(
  lender: any,
  score: number,
  zone: UrgencyZone,
  daysUntil: number,
  isLocked: boolean
): { greeting: string; confidence: string; cta: string } {
  if (isLocked) {
    return {
      greeting: 'This lender has specific requirements.',
      confidence: 'Check the unlock hint to see how to qualify.',
      cta: 'View other options below.',
    };
  }
  
  let greeting = '';
  let confidence = '';
  
  if (score >= 85) {
    greeting = 'An excellent match for your profile.';
    confidence = 'High approval likelihood with competitive rates.';
  } else if (score >= 70) {
    greeting = 'A strong option for your study plans.';
    confidence = 'Good match based on your profile.';
  } else if (score >= 55) {
    greeting = 'Worth considering as a backup.';
    confidence = 'Moderate fit - review the terms carefully.';
  } else {
    greeting = 'An alternative to explore.';
    confidence = 'Some conditions may apply.';
  }
  
  // Add zone-specific context
  if (zone === 'RED' && daysUntil <= 30) {
    confidence = `Fast processing prioritized for your ${daysUntil}-day timeline.`;
  } else if (zone === 'GREEN' && daysUntil > 60) {
    confidence = 'Cost-optimized for your relaxed timeline.';
  }
  
  return {
    greeting,
    confidence,
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

    // Build missing data warnings
    const missingWarnings: string[] = [];
    if (!primaryUniversity) missingWarnings.push('University not specified');
    if (!lead.intake_month || !lead.intake_year) missingWarnings.push('Intake date not specified');
    if (!coApplicant?.monthly_salary) missingWarnings.push('Co-applicant income missing');

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
      
      // Base score from pillars (weighted average)
      const pillarWeights = { future: 0.35, financial: 0.4, past: 0.25 };
      const rawScore = Math.round(
        pillars.future.score * pillarWeights.future +
        pillars.financial.score * pillarWeights.financial +
        pillars.past.score * pillarWeights.past +
        pillars.two_of_three_bonus
      );
      
      // Layer 3: Strategic Adjustments
      const { adjustedScore, adjustment, badges } = applyStrategicAdjustments(
        rawScore,
        lender,
        zone,
        strategy
      );
      
      // Apply knockout penalty (but don't zero out)
      const finalScore = knockout.isLocked 
        ? Math.max(0, adjustedScore - knockout.penaltyScore)
        : adjustedScore;
      
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
        badges,
        fitFactors,
        riskFlags,
      };
    });
    
    // Sort by final score (locked lenders will naturally be lower due to penalty)
    scoredLenders.sort((a, b) => b.finalScore - a.finalScore);

    // =========================================================================
    // BUILD RESULTS
    // =========================================================================
    
    const results: LenderResult[] = scoredLenders.map((sl, index) => {
      const { lender, knockout, pillars, rawScore, adjustment, finalScore, status, badges, fitFactors, riskFlags } = sl;
      
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
      
      const studentReason = generateStudentReason(lender, finalScore, zone, daysUntil, knockout.isLocked);
      
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
