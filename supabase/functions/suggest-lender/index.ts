/**
 * AI Lender Suggestion Edge Function with Lovable AI Integration
 * 
 * Per Knowledge Base:
 * - AI evaluates ALL lenders against applicant profile
 * - Uses BRE text/JSON for each lender
 * - Groups: Best Fit, Also Consider, Possible but Risky, Not Suitable
 * - Stores complete snapshot for audit
 * - Never auto-rejects; flags low confidence for human review
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LenderEvaluation {
  lender_id: string;
  lender_name: string;
  fit_score: number;
  probability_band: 'high' | 'medium' | 'low';
  processing_time_estimate: string;
  justification: string;
  risk_flags: string[];
  bre_rules_matched: string[];
  group: 'best_fit' | 'also_consider' | 'possible_but_risky' | 'not_suitable';
  student_facing_reason?: string;
}

interface AIResponse {
  lender_evaluations: LenderEvaluation[];
  overall_confidence: number;
  ai_notes: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { leadId, studyDestination, loanAmount } = await req.json()
    
    console.log('🤖 [suggest-lender] Processing lead:', leadId)

    // Fetch complete lead profile with all related data
    const { data: lead, error: leadError } = await supabase
      .from('leads_new')
      .select(`
        id, loan_amount, loan_type, study_destination, loan_classification,
        intake_month, intake_year,
        student:students(
          id, name, email, phone, highest_qualification, credit_score,
          tenth_percentage, twelfth_percentage, bachelors_percentage, bachelors_cgpa,
          city, state, postal_code, pin_code_tier
        ),
        co_applicant:co_applicants(
          id, name, relationship, monthly_salary, employment_type, employer,
          occupation, credit_score, pin_code
        ),
        lead_universities!fk_lead_universities_lead(
          university:universities!fk_lead_universities_university(id, name, country, city, global_rank, score)
        )
      `)
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      console.error('Lead fetch error:', leadError)
      throw new Error('Lead not found')
    }

    // Fetch ALL active lenders with BRE data
    const { data: lenders, error: lendersError } = await supabase
      .from('lenders')
      .select(`
        id, name, code, description, is_active,
        interest_rate_min, interest_rate_max,
        loan_amount_min, loan_amount_max,
        processing_fee, foreclosure_charges,
        processing_time_days, disbursement_time_days,
        approval_rate, moratorium_period,
        preferred_rank,
        bre_text, bre_json,
        processing_time_range_min, processing_time_range_max,
        collateral_preference, country_restrictions,
        university_restrictions,
        income_expectations_min, income_expectations_max,
        credit_expectations, experience_score, admin_remarks
      `)
      .eq('is_active', true)
      .order('preferred_rank', { ascending: true, nullsFirst: false })

    if (lendersError || !lenders?.length) {
      console.error('Lenders fetch error:', lendersError)
      throw new Error('No active lenders found')
    }

    console.log(`📊 Found ${lenders.length} active lenders`)

    // Build applicant profile for AI
    const student = lead.student as any
    const coApplicant = lead.co_applicant as any
    const universities = (lead.lead_universities as any[])?.map(lu => lu.university) || []

    const applicantProfile = {
      loan_amount: loanAmount || lead.loan_amount,
      loan_type: lead.loan_type,
      loan_classification: lead.loan_classification,
      study_destination: studyDestination || lead.study_destination,
      intake: lead.intake_month && lead.intake_year 
        ? `${lead.intake_month}/${lead.intake_year}` 
        : 'Not specified',
      student: {
        name: student?.name,
        qualification: student?.highest_qualification,
        credit_score: student?.credit_score,
        academic_scores: {
          tenth: student?.tenth_percentage,
          twelfth: student?.twelfth_percentage,
          bachelors: student?.bachelors_percentage || student?.bachelors_cgpa,
        },
        location: student?.city && student?.state 
          ? `${student.city}, ${student.state}` 
          : 'Not specified',
        pin_code_tier: student?.pin_code_tier,
      },
      co_applicant: coApplicant ? {
        relationship: coApplicant.relationship,
        monthly_salary: coApplicant.monthly_salary,
        employment_type: coApplicant.employment_type,
        employer: coApplicant.employer,
        occupation: coApplicant.occupation,
        credit_score: coApplicant.credit_score,
      } : null,
      universities: universities.map(u => ({
        name: u?.name,
        country: u?.country,
        global_rank: u?.global_rank,
      })),
    }

    // Build lender profiles for AI
    const lenderProfiles = lenders.map(l => ({
      id: l.id,
      name: l.name,
      code: l.code,
      loan_range: `₹${(l.loan_amount_min || 0).toLocaleString()} - ₹${(l.loan_amount_max || 0).toLocaleString()}`,
      interest_range: `${l.interest_rate_min || 0}% - ${l.interest_rate_max || 0}%`,
      processing_time: l.processing_time_days || l.processing_time_range_min || 'Not specified',
      preferred_rank: l.preferred_rank,
      bre_text: l.bre_text,
      bre_json: l.bre_json,
      collateral_preference: l.collateral_preference,
      country_restrictions: l.country_restrictions,
      university_restrictions: l.university_restrictions,
      income_expectations: {
        min: l.income_expectations_min,
        max: l.income_expectations_max,
      },
      credit_expectations: l.credit_expectations,
      experience_score: l.experience_score,
    }))

    // Create lender snapshots for audit
    const lenderSnapshots: Record<string, any> = {}
    lenders.forEach(l => {
      lenderSnapshots[l.id] = {
        name: l.name,
        bre_text: l.bre_text,
        bre_json: l.bre_json,
        collateral_preference: l.collateral_preference,
        country_restrictions: l.country_restrictions,
        income_expectations_min: l.income_expectations_min,
        income_expectations_max: l.income_expectations_max,
      }
    })

    let evaluations: LenderEvaluation[] = []
    let overallConfidence = 50
    let aiNotes = ''
    let aiUnavailable = false

    // Try AI evaluation first
    if (lovableApiKey) {
      try {
        console.log('🧠 Calling Lovable AI for lender evaluation...')
        
        const systemPrompt = `You are an expert education loan underwriter AI. Your task is to evaluate EVERY lender against an applicant's profile and provide a comprehensive assessment.

For EACH lender, you must:
1. Evaluate how well the applicant matches the lender's BRE (Business Rules Engine) criteria
2. Assign a fit_score from 0-100
3. Determine probability_band: "high" (score >= 80), "medium" (60-79), "low" (< 60)
4. Provide a clear justification explaining the match
5. Flag any risk factors
6. List which BRE rules were matched
7. Assign to a group: best_fit (>=80), also_consider (60-79), possible_but_risky (40-59), not_suitable (<40)
8. Generate a SHORT student-friendly reason (MAX 15 words, e.g. "Great fit for your income level and loan amount")

IMPORTANT:
- NEVER eliminate any lender - evaluate ALL of them
- Be conservative with high scores - reserve 85+ for truly excellent matches
- Consider country restrictions, income expectations, and collateral preferences
- Processing time estimates should be realistic ranges
- If BRE data is missing, use structured fields and be more conservative with scoring`

        const userPrompt = `Evaluate the following applicant against ALL lenders:

## Applicant Profile:
${JSON.stringify(applicantProfile, null, 2)}

## Lenders to Evaluate:
${JSON.stringify(lenderProfiles, null, 2)}

Evaluate EACH lender and return structured results using the evaluate_lenders function.`

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            tools: [
              {
                type: 'function',
                function: {
                  name: 'evaluate_lenders',
                  description: 'Evaluate all lenders against the applicant profile',
                  parameters: {
                    type: 'object',
                    properties: {
                      lender_evaluations: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            lender_id: { type: 'string' },
                            lender_name: { type: 'string' },
                            fit_score: { type: 'number', minimum: 0, maximum: 100 },
                            probability_band: { type: 'string', enum: ['high', 'medium', 'low'] },
                            processing_time_estimate: { type: 'string' },
                            justification: { type: 'string' },
                            risk_flags: { type: 'array', items: { type: 'string' } },
                            bre_rules_matched: { type: 'array', items: { type: 'string' } },
                            group: { type: 'string', enum: ['best_fit', 'also_consider', 'possible_but_risky', 'not_suitable'] },
                            student_facing_reason: { type: 'string', description: 'Max 15 words, simple and friendly' },
                          },
                          required: ['lender_id', 'lender_name', 'fit_score', 'probability_band', 'justification', 'group'],
                        },
                      },
                      overall_confidence: { type: 'number', minimum: 0, maximum: 100 },
                      ai_notes: { type: 'string' },
                    },
                    required: ['lender_evaluations', 'overall_confidence'],
                  },
                },
              },
            ],
            tool_choice: { type: 'function', function: { name: 'evaluate_lenders' } },
          }),
        })

        if (!aiResponse.ok) {
          const status = aiResponse.status
          if (status === 429) {
            console.warn('⚠️ AI rate limited, falling back to rule-based')
            aiNotes = 'AI rate limited - using rule-based evaluation'
            aiUnavailable = true
          } else if (status === 402) {
            console.warn('⚠️ AI credits exhausted, falling back to rule-based')
            aiNotes = 'AI credits required - using rule-based evaluation'
            aiUnavailable = true
          } else {
            const errorText = await aiResponse.text()
            console.error('AI error:', status, errorText)
            aiNotes = `AI error (${status}) - using rule-based evaluation`
            aiUnavailable = true
          }
        } else {
          const result = await aiResponse.json()
          console.log('✅ AI response received')

          // Extract tool call result
          const toolCall = result.choices?.[0]?.message?.tool_calls?.[0]
          if (toolCall?.function?.arguments) {
            try {
              const parsed: AIResponse = JSON.parse(toolCall.function.arguments)
              evaluations = parsed.lender_evaluations || []
              overallConfidence = parsed.overall_confidence || 50
              aiNotes = parsed.ai_notes || ''
              console.log(`📊 AI evaluated ${evaluations.length} lenders`)
            } catch (parseErr) {
              console.error('Failed to parse AI response:', parseErr)
              aiNotes = 'AI response parsing failed - using rule-based evaluation'
              aiUnavailable = true
            }
          }
        }
      } catch (aiErr) {
        console.error('AI call failed:', aiErr)
        aiNotes = 'AI unavailable - using rule-based evaluation'
        aiUnavailable = true
      }
    } else {
      console.log('⚠️ LOVABLE_API_KEY not configured, using rule-based scoring')
      aiNotes = 'AI not configured - using rule-based evaluation'
      aiUnavailable = true
    }

    // Fallback to rule-based scoring if AI didn't work
    if (evaluations.length === 0) {
      console.log('📋 Using enhanced rule-based scoring')
      
      // Find min/max values for normalization
      const allRates = lenders.map(l => l.interest_rate_min).filter(r => r !== null) as number[]
      const minRate = Math.min(...allRates)
      const maxRate = Math.max(...allRates)
      
      const allAmounts = lenders.map(l => l.loan_amount_max).filter(a => a !== null) as number[]
      const maxLoanAmount = Math.max(...allAmounts)
      
      const allTimes = lenders.map(l => l.processing_time_days || l.processing_time_range_min).filter(t => t !== null) as number[]
      const minTime = Math.min(...allTimes)
      const maxTime = Math.max(...allTimes)
      
      evaluations = lenders.map(lender => {
        let score = 50
        const factors: string[] = []
        const riskFlags: string[] = []

        // === Interest Rate Score (up to 20 points) ===
        // Lower rate = higher score
        if (lender.interest_rate_min && minRate && maxRate && maxRate > minRate) {
          const rateRange = maxRate - minRate
          const normalizedRate = (maxRate - lender.interest_rate_min) / rateRange // 1 = lowest rate, 0 = highest
          const rateBonus = Math.round(normalizedRate * 20)
          score += rateBonus
          if (normalizedRate >= 0.7) {
            factors.push('Competitive interest rate')
          } else if (normalizedRate <= 0.3) {
            riskFlags.push('Higher interest rate')
          }
        }

        // === Loan Amount Coverage (up to 15 points) ===
        const amount = loanAmount || lead.loan_amount
        if (lender.loan_amount_min && lender.loan_amount_max) {
          if (amount >= lender.loan_amount_min && amount <= lender.loan_amount_max) {
            score += 15
            factors.push('Loan amount within range')
            
            // Bonus if lender can offer more headroom
            if (lender.loan_amount_max > amount * 1.2) {
              score += 3
              factors.push('Good loan headroom available')
            }
          } else if (amount < lender.loan_amount_min) {
            score -= 10
            riskFlags.push('Loan amount below minimum')
          } else {
            score -= 5
            riskFlags.push('Loan amount exceeds maximum')
          }
        } else if (lender.loan_amount_max && lender.loan_amount_max >= amount) {
          score += 10
          factors.push('Sufficient loan capacity')
        }

        // === Processing Time Score (up to 10 points) ===
        // Faster processing = higher score
        const processingTime = lender.processing_time_days || lender.processing_time_range_min
        if (processingTime && minTime && maxTime && maxTime > minTime) {
          const timeRange = maxTime - minTime
          const normalizedTime = (maxTime - processingTime) / timeRange // 1 = fastest, 0 = slowest
          const timeBonus = Math.round(normalizedTime * 10)
          score += timeBonus
          if (normalizedTime >= 0.7) {
            factors.push('Fast processing time')
          }
        }

        // === Country/Destination Match (up to 10 points) ===
        const destination = studyDestination || lead.study_destination
        if (lender.country_restrictions?.length) {
          if (lender.country_restrictions.includes(destination?.toUpperCase())) {
            score += 10
            factors.push('Preferred destination')
          } else {
            score -= 5
            riskFlags.push('Non-preferred destination')
          }
        } else {
          // No restrictions = universal coverage (small bonus)
          score += 3
        }

        // === Income Expectations (up to 15 points) ===
        const coAppSalary = coApplicant?.monthly_salary
        if (coAppSalary) {
          if (lender.income_expectations_min && coAppSalary >= lender.income_expectations_min) {
            score += 15
            factors.push('Income meets expectations')
            
            // Extra bonus for significantly exceeding
            if (lender.income_expectations_min && coAppSalary >= lender.income_expectations_min * 1.5) {
              score += 5
              factors.push('Strong income profile')
            }
          } else if (lender.income_expectations_min && coAppSalary < lender.income_expectations_min) {
            score -= 10
            riskFlags.push('Income below expectations')
          } else {
            // No income expectations defined
            score += 5
          }
        }

        // === Employment Type (up to 8 points) ===
        const empType = coApplicant?.employment_type
        if (empType === 'salaried') {
          score += 8
          factors.push('Salaried employment')
        } else if (empType === 'government') {
          score += 10
          factors.push('Government employment')
        } else if (empType === 'self-employed') {
          score += 3
          factors.push('Self-employed')
        }

        // === Preferred Rank Bonus (up to 9 points) ===
        if (lender.preferred_rank && lender.preferred_rank <= 3) {
          const rankBonus = (4 - lender.preferred_rank) * 3
          score += rankBonus
          factors.push(`Priority lender (rank ${lender.preferred_rank})`)
        }

        // === Experience Score (up to 5 points) ===
        if (lender.experience_score) {
          if (lender.experience_score >= 8) {
            score += 5
            factors.push('Excellent service record')
          } else if (lender.experience_score >= 6) {
            score += 3
            factors.push('Good service record')
          }
        }

        // === Education Loan Specialization ===
        const lenderCode = lender.code?.toUpperCase() || ''
        const isEducationFocused = ['CREDILA', 'AVANSE', 'INCRED', 'AUXILO', 'HDFC_CREDILA'].some(
          code => lenderCode.includes(code)
        )
        if (isEducationFocused) {
          score += 5
          factors.push('Education loan specialist')
        }

        // Cap score at 100, floor at 0
        score = Math.min(100, Math.max(0, score))

        // Determine group
        let group: LenderEvaluation['group'] = 'not_suitable'
        if (score >= 80) group = 'best_fit'
        else if (score >= 60) group = 'also_consider'
        else if (score >= 40) group = 'possible_but_risky'

        // Determine probability band
        let probability_band: LenderEvaluation['probability_band'] = 'low'
        if (score >= 80) probability_band = 'high'
        else if (score >= 60) probability_band = 'medium'

        // Generate student-facing reason
        let studentReason = ''
        if (score >= 80) {
          if (factors.includes('Competitive interest rate')) {
            studentReason = 'Best rates with strong approval chances for your profile'
          } else if (factors.includes('Fast processing time')) {
            studentReason = 'Quick processing with competitive terms'
          } else {
            studentReason = 'Excellent match for your loan requirements'
          }
        } else if (score >= 60) {
          studentReason = 'Good fit for your financial profile'
        } else if (score >= 40) {
          studentReason = 'May require additional documentation'
        } else {
          studentReason = 'Limited fit - consider alternatives'
        }

        // Generate justification
        let justification = ''
        if (score >= 80) {
          justification = `${lender.name} is an excellent match. ${factors.slice(0, 3).join(', ')}.`
        } else if (score >= 60) {
          justification = `${lender.name} is a solid option. ${factors.slice(0, 2).join(', ')}.`
        } else if (score >= 40) {
          justification = `${lender.name} may work but has concerns: ${riskFlags.slice(0, 2).join(', ') || 'Limited match'}.`
        } else {
          justification = `${lender.name} is not recommended: ${riskFlags.join(', ') || 'Poor overall fit'}.`
        }

        return {
          lender_id: lender.id,
          lender_name: lender.name,
          fit_score: score,
          probability_band,
          processing_time_estimate: lender.processing_time_range_min && lender.processing_time_range_max
            ? `${lender.processing_time_range_min}-${lender.processing_time_range_max} days`
            : processingTime 
              ? `~${processingTime} days` 
              : 'Not specified',
          justification,
          risk_flags: riskFlags,
          bre_rules_matched: factors,
          group,
          student_facing_reason: studentReason,
        }
      })

      // Calculate overall confidence from average top scores
      const topScores = evaluations
        .sort((a, b) => b.fit_score - a.fit_score)
        .slice(0, 3)
        .map(e => e.fit_score)
      overallConfidence = Math.round(topScores.reduce((a, b) => a + b, 0) / topScores.length)
    }

    // Sort evaluations by fit_score
    evaluations.sort((a, b) => b.fit_score - a.fit_score)

    // Group evaluations
    const groupedEvaluations = {
      best_fit: evaluations.filter(e => e.group === 'best_fit'),
      also_consider: evaluations.filter(e => e.group === 'also_consider'),
      possible_but_risky: evaluations.filter(e => e.group === 'possible_but_risky'),
      not_suitable: evaluations.filter(e => e.group === 'not_suitable'),
    }

    // Create input snapshot
    const inputsSnapshot = {
      lead_id: leadId,
      loan_amount: loanAmount || lead.loan_amount,
      study_destination: studyDestination || lead.study_destination,
      loan_type: lead.loan_type,
      loan_classification: lead.loan_classification,
      student_qualification: student?.highest_qualification,
      co_applicant_salary: coApplicant?.monthly_salary,
      co_applicant_employment: coApplicant?.employment_type,
      universities: universities.map(u => u?.name),
      timestamp: new Date().toISOString(),
    }

    // Get top recommendations (for backward compatibility)
    const topRecommendations = evaluations.slice(0, 3).map(e => ({
      lender_id: e.lender_id,
      lender_name: e.lender_name,
      confidence_score: e.fit_score,
      rationale: e.justification,
      match_factors: e.bre_rules_matched,
    }))

    // Save to database
    const { data: savedRec, error: saveError } = await supabase
      .from('ai_lender_recommendations')
      .insert({
        lead_id: leadId,
        recommended_lender_ids: evaluations.slice(0, 5).map(e => e.lender_id),
        recommended_lenders_data: topRecommendations,
        all_lenders_output: evaluations,
        lender_snapshots: lenderSnapshots,
        rationale: overallConfidence >= 70 
          ? `AI recommends ${evaluations[0]?.lender_name} with ${overallConfidence}% confidence`
          : 'Low confidence - human review recommended',
        confidence_score: overallConfidence,
        model_version: aiUnavailable ? '2.1-rule-based-enhanced' : '2.0-gemini-flash',
        inputs_snapshot: inputsSnapshot,
        ai_unavailable: aiUnavailable,
        student_facing_reason: evaluations[0]?.student_facing_reason || null,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Failed to save recommendation:', saveError)
    }

    console.log(`✅ [suggest-lender] Generated ${evaluations.length} evaluations, confidence: ${overallConfidence}%`)

    return new Response(
      JSON.stringify({
        success: true,
        recommendation: savedRec || {
          recommended_lenders_data: topRecommendations,
          all_lenders_output: evaluations,
          confidence_score: overallConfidence,
          rationale: overallConfidence >= 70 
            ? `AI recommends ${evaluations[0]?.lender_name}`
            : 'Low confidence - human review recommended',
        },
        grouped_evaluations: groupedEvaluations,
        needs_human_review: overallConfidence < 70,
        ai_unavailable: aiUnavailable,
        ai_notes: aiNotes,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('💥 [suggest-lender] Error:', error.message)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        ai_unavailable: true,
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
