/**
 * AI Lender Suggestion Edge Function
 * 
 * Per Knowledge Base:
 * - AI suggests lenders + rationale + confidence
 * - Store snapshot in ai_lender_recommendations
 * - If confidence below threshold → "Needs human review"
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LenderRecommendation {
  lender_id: string;
  lender_name: string;
  confidence_score: number;
  rationale: string;
  match_factors: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { leadId, studyDestination, loanAmount } = await req.json()
    
    console.log('🤖 [suggest-lender] Processing lead:', leadId)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch lead details with related data
    const { data: lead, error: leadError } = await supabase
      .from('leads_new')
      .select(`
        id, loan_amount, loan_type, study_destination,
        student:students(name, highest_qualification, credit_score),
        co_applicant:co_applicants(monthly_salary, employment_type, relationship)
      `)
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      throw new Error('Lead not found')
    }

    // Fetch all active lenders
    const { data: lenders, error: lendersError } = await supabase
      .from('lenders')
      .select('id, name, code, interest_rate_min, interest_rate_max, loan_amount_min, loan_amount_max, preferred_rank')
      .eq('is_active', true)
      .order('preferred_rank', { ascending: true })

    if (lendersError || !lenders?.length) {
      throw new Error('No active lenders found')
    }

    // Simple scoring algorithm (can be replaced with ML model)
    const recommendations: LenderRecommendation[] = lenders.map(lender => {
      let score = 50; // Base score
      const factors: string[] = [];

      // Loan amount fit
      const amount = loanAmount || lead.loan_amount
      if (lender.loan_amount_min && lender.loan_amount_max) {
        if (amount >= lender.loan_amount_min && amount <= lender.loan_amount_max) {
          score += 20
          factors.push('Loan amount within range')
        } else if (amount < lender.loan_amount_min) {
          score -= 10
          factors.push('Loan amount below minimum')
        }
      }

      // Preferred rank bonus
      if (lender.preferred_rank && lender.preferred_rank <= 3) {
        score += (4 - lender.preferred_rank) * 5
        factors.push(`Priority lender (rank ${lender.preferred_rank})`)
      }

      // Co-applicant salary consideration
      const coAppSalary = (lead.co_applicant as any)?.monthly_salary
      if (coAppSalary && coAppSalary >= 75000) {
        score += 10
        factors.push('Strong co-applicant income')
      }

      // Employment type
      const empType = (lead.co_applicant as any)?.employment_type
      if (empType === 'salaried' || empType === 'government') {
        score += 5
        factors.push('Stable employment type')
      }

      // Cap score at 100
      score = Math.min(100, Math.max(0, score))

      return {
        lender_id: lender.id,
        lender_name: lender.name,
        confidence_score: score,
        rationale: generateRationale(lender.name, score, factors),
        match_factors: factors,
      }
    })

    // Sort by confidence score
    recommendations.sort((a, b) => b.confidence_score - a.confidence_score)

    // Take top 3
    const topRecommendations = recommendations.slice(0, 3)
    const topScore = topRecommendations[0]?.confidence_score || 0

    // Create input snapshot
    const inputsSnapshot = {
      lead_id: leadId,
      loan_amount: loanAmount || lead.loan_amount,
      study_destination: studyDestination || lead.study_destination,
      loan_type: lead.loan_type,
      co_applicant_salary: (lead.co_applicant as any)?.monthly_salary,
      timestamp: new Date().toISOString(),
    }

    // Store recommendation
    const { data: savedRec, error: saveError } = await supabase
      .from('ai_lender_recommendations')
      .insert({
        lead_id: leadId,
        recommended_lender_ids: topRecommendations.map(r => r.lender_id),
        recommended_lenders_data: topRecommendations,
        rationale: topScore >= 70 
          ? `AI recommends ${topRecommendations[0]?.lender_name} with ${topScore}% confidence`
          : 'Low confidence - human review recommended',
        confidence_score: topScore,
        model_version: '1.0-rule-based',
        inputs_snapshot: inputsSnapshot,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Failed to save recommendation:', saveError)
    }

    console.log('✅ [suggest-lender] Generated recommendations:', topRecommendations.length)

    return new Response(
      JSON.stringify({
        success: true,
        recommendation: savedRec || {
          recommended_lenders_data: topRecommendations,
          confidence_score: topScore,
          rationale: topScore >= 70 
            ? `AI recommends ${topRecommendations[0]?.lender_name}`
            : 'Low confidence - human review recommended',
        },
        needs_human_review: topScore < 70,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('💥 [suggest-lender] Error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateRationale(lenderName: string, score: number, factors: string[]): string {
  if (score >= 85) {
    return `${lenderName} is an excellent match based on: ${factors.slice(0, 2).join(', ')}`
  } else if (score >= 70) {
    return `${lenderName} is a good fit. ${factors[0] || ''}`
  } else {
    return `${lenderName} may work but requires review`
  }
}
