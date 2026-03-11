// BRE Audit Script for Lead EDU-1768476475591
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://amwlcjkkazftrpdwetfx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditBRE() {
    const caseId = 'EDU-1768476475591';

    console.log('='.repeat(80));
    console.log(`BRE AUDIT FOR CASE: ${caseId}`);
    console.log('='.repeat(80));

    // 1. Get Lead details
    const { data: lead, error: leadError } = await supabase
        .from('leads_new')
        .select(`
      *,
      students:student_id (*),
      co_applicants:co_applicant_id (*),
      lenders:target_lender_id (*)
    `)
        .eq('case_id', caseId)
        .single();

    if (leadError) {
        console.error('Lead not found:', leadError);
        return;
    }

    console.log('\n📋 LEAD DETAILS:');
    console.log('-'.repeat(40));
    console.log('Lead ID:', lead.id);
    console.log('Case ID:', lead.case_id);
    console.log('Study Destination:', lead.study_destination);
    console.log('Loan Amount:', lead.requested_amount);
    console.log('Loan Type:', lead.loan_type);
    console.log('Intake:', `${lead.intake_month}/${lead.intake_year}`);
    console.log('Current Lender:', lead.lenders?.name || 'None');

    console.log('\n👨‍🎓 STUDENT INFO:');
    console.log('-'.repeat(40));
    if (lead.students) {
        console.log('Name:', lead.students.name);
        console.log('Credit Score:', lead.students.credit_score || 'N/A');
        console.log('10th %:', lead.students.tenth_percentage || 'N/A');
        console.log('12th %:', lead.students.twelfth_percentage || 'N/A');
        console.log('Bachelor %:', lead.students.bachelors_percentage || 'N/A');
        console.log('Bachelor CGPA:', lead.students.bachelors_cgpa || 'N/A');
    }

    console.log('\n👥 CO-APPLICANT INFO:');
    console.log('-'.repeat(40));
    if (lead.co_applicants) {
        console.log('Name:', lead.co_applicants.name);
        console.log('Relationship:', lead.co_applicants.relationship);
        console.log('Monthly Salary:', lead.co_applicants.monthly_salary);
        console.log('Employment Type:', lead.co_applicants.employment_type);
        console.log('Credit Score:', lead.co_applicants.credit_score || 'N/A');
    }

    // 2. Get University associations
    const { data: universities } = await supabase
        .from('lead_universities')
        .select('universities (*)')
        .eq('lead_id', lead.id);

    console.log('\n🎓 UNIVERSITIES:');
    console.log('-'.repeat(40));
    if (universities && universities.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        universities.forEach((u: any) => {
            console.log(`- ${u.universities?.name} (${u.universities?.country})`);
        });
    } else {
        console.log('No universities linked');
    }

    // 3. Get AI Recommendation
    const { data: aiRec, error: aiError } = await supabase
        .from('ai_lender_recommendations')
        .select('*')
        .eq('lead_id', lead.id)
        .order('version', { ascending: false })
        .limit(1)
        .single();

    console.log('\n🤖 AI LENDER RECOMMENDATION:');
    console.log('-'.repeat(40));
    if (aiRec) {
        console.log('Model Version:', aiRec.model_version);
        console.log('Confidence Score:', aiRec.confidence_score, '%');
        console.log('Assignment Mode:', aiRec.assignment_mode || 'Pending');
        console.log('Urgency Zone:', aiRec.urgency_zone || 'N/A');
        console.log('Strategy:', aiRec.strategy || 'N/A');
        console.log('Student Tier:', aiRec.student_tier || 'N/A');
        console.log('Rationale:', aiRec.rationale);
        console.log('Created At:', aiRec.created_at);

        console.log('\n📊 ALL LENDER EVALUATIONS:');
        console.log('-'.repeat(40));
        const evaluations = aiRec.all_lenders_output || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        evaluations.forEach((e: any, i: number) => {
            console.log(`\n[${i + 1}] ${e.lender_name} - Score: ${e.score || e.fit_score || 0}%`);
            console.log('    Status:', e.status || e.group);
            console.log('    Reason:', e.reason || e.justification || 'N/A');
            console.log('    Processing Time:', e.processing_time_estimate || 'N/A');
            console.log('    Interest Rate:', e.interest_rate_display || 'N/A');
            console.log('    Probability Band:', e.probability_band || 'N/A');
            if (e.pillar_breakdown) {
                console.log('    Pillar Scores:');
                console.log('      - Future Earnings:', e.pillar_breakdown.future?.score || 'N/A');
                console.log('      - Financial Security:', e.pillar_breakdown.financial?.score || 'N/A');
                console.log('      - Past Record:', e.pillar_breakdown.past?.score || 'N/A');
            }
            if (e.university_boost && e.university_boost.type !== 'none') {
                console.log('    University Boost:', e.university_boost.type, '+', e.university_boost.amount, 'pts');
            }
            if (e.fit_factors && e.fit_factors.length > 0) {
                console.log('    Fit Factors:', e.fit_factors.join(', '));
            }
            if (e.risk_flags && e.risk_flags.length > 0) {
                console.log('    Risk Flags:', e.risk_flags.join(', '));
            }
        });

        if (aiRec.pillar_scores) {
            console.log('\n📊 GLOBAL PILLAR SCORES:');
            console.log('-'.repeat(40));
            console.log(JSON.stringify(aiRec.pillar_scores, null, 2));
        }
    } else {
        console.log('No AI recommendation found for this lead');
        console.log('Error:', aiError);
    }

    // 4. Get Eligibility Scores
    const { data: eligibility } = await supabase
        .from('eligibility_scores')
        .select('*, lenders (*)')
        .eq('lead_id', lead.id);

    if (eligibility && eligibility.length > 0) {
        console.log('\n📈 ELIGIBILITY SCORES:');
        console.log('-'.repeat(40));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        eligibility.forEach((e: any) => {
            console.log(`${e.lenders?.name}: ${e.overall_score}% overall`);
            if (e.breakdown) {
                console.log('  Breakdown:', JSON.stringify(e.breakdown));
            }
        });
    }

    console.log('\n' + '='.repeat(80));
}

auditBRE().catch(console.error);
