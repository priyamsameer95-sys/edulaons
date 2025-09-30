import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  details?: any;
}

interface ValidationReport {
  timestamp: string;
  totalIssues: number;
  errors: number;
  warnings: number;
  info: number;
  issues: ValidationIssue[];
  statistics: {
    totalLeads: number;
    totalDocuments: number;
    totalPartners: number;
    totalStudents: number;
    totalCoApplicants: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Starting data sanity check...');
    const issues: ValidationIssue[] = [];

    // 1. VALIDATE LEAD STATISTICS
    console.log('Checking lead statistics...');
    const { data: allLeads, error: leadsError } = await supabase
      .from('leads_new')
      .select('id, status, documents_status, loan_amount, student_id, co_applicant_id, partner_id, lender_id');

    if (leadsError) {
      issues.push({
        severity: 'error',
        category: 'Database Query',
        message: 'Failed to fetch leads data',
        details: leadsError,
      });
    } else {
      // Check status counts
      const statusCounts = allLeads.reduce((acc: any, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {});

      // Check document status counts
      const docStatusCounts = allLeads.reduce((acc: any, lead) => {
        acc[lead.documents_status] = (acc[lead.documents_status] || 0) + 1;
        return acc;
      }, {});

      console.log('Lead status counts:', statusCounts);
      console.log('Document status counts:', docStatusCounts);

      // Validate total loan amounts
      const totalLoanAmount = allLeads.reduce((sum, lead) => sum + Number(lead.loan_amount || 0), 0);
      console.log('Total loan amount:', totalLoanAmount);

      // Check for NULL required fields
      allLeads.forEach((lead) => {
        if (!lead.student_id) {
          issues.push({
            severity: 'error',
            category: 'Data Integrity',
            message: `Lead ${lead.id} has no student_id`,
            details: lead,
          });
        }
        if (!lead.co_applicant_id) {
          issues.push({
            severity: 'error',
            category: 'Data Integrity',
            message: `Lead ${lead.id} has no co_applicant_id`,
            details: lead,
          });
        }
        if (!lead.partner_id) {
          issues.push({
            severity: 'warning',
            category: 'Data Integrity',
            message: `Lead ${lead.id} has no partner_id`,
            details: lead,
          });
        }
        if (!lead.lender_id) {
          issues.push({
            severity: 'error',
            category: 'Data Integrity',
            message: `Lead ${lead.id} has no lender_id`,
            details: lead,
          });
        }
      });
    }

    // 2. VALIDATE REFERENTIAL INTEGRITY
    console.log('Checking referential integrity...');

    // Check students exist
    const { data: students } = await supabase.from('students').select('id');
    const studentIds = new Set(students?.map((s) => s.id) || []);

    // Check co-applicants exist
    const { data: coApplicants } = await supabase.from('co_applicants').select('id');
    const coApplicantIds = new Set(coApplicants?.map((c) => c.id) || []);

    // Check partners exist
    const { data: partners } = await supabase.from('partners').select('id');
    const partnerIds = new Set(partners?.map((p) => p.id) || []);

    // Check lenders exist
    const { data: lenders } = await supabase.from('lenders').select('id');
    const lenderIds = new Set(lenders?.map((l) => l.id) || []);

    allLeads?.forEach((lead) => {
      if (lead.student_id && !studentIds.has(lead.student_id)) {
        issues.push({
          severity: 'error',
          category: 'Referential Integrity',
          message: `Lead ${lead.id} references non-existent student ${lead.student_id}`,
        });
      }
      if (lead.co_applicant_id && !coApplicantIds.has(lead.co_applicant_id)) {
        issues.push({
          severity: 'error',
          category: 'Referential Integrity',
          message: `Lead ${lead.id} references non-existent co-applicant ${lead.co_applicant_id}`,
        });
      }
      if (lead.partner_id && !partnerIds.has(lead.partner_id)) {
        issues.push({
          severity: 'error',
          category: 'Referential Integrity',
          message: `Lead ${lead.id} references non-existent partner ${lead.partner_id}`,
        });
      }
      if (lead.lender_id && !lenderIds.has(lead.lender_id)) {
        issues.push({
          severity: 'error',
          category: 'Referential Integrity',
          message: `Lead ${lead.id} references non-existent lender ${lead.lender_id}`,
        });
      }
    });

    // 3. CHECK FOR ORPHANED RECORDS
    console.log('Checking for orphaned records...');

    // Find students not linked to any lead
    const leadStudentIds = new Set(allLeads?.map((l) => l.student_id) || []);
    students?.forEach((student) => {
      if (!leadStudentIds.has(student.id)) {
        issues.push({
          severity: 'warning',
          category: 'Orphaned Records',
          message: `Student ${student.id} is not linked to any lead`,
        });
      }
    });

    // Find co-applicants not linked to any lead
    const leadCoApplicantIds = new Set(allLeads?.map((l) => l.co_applicant_id) || []);
    coApplicants?.forEach((coApplicant) => {
      if (!leadCoApplicantIds.has(coApplicant.id)) {
        issues.push({
          severity: 'warning',
          category: 'Orphaned Records',
          message: `Co-applicant ${coApplicant.id} is not linked to any lead`,
        });
      }
    });

    // 4. VALIDATE DOCUMENT DATA
    console.log('Checking document integrity...');
    const { data: documents } = await supabase
      .from('lead_documents')
      .select('id, lead_id, document_type_id, verification_status');

    if (documents) {
      const leadIds = new Set(allLeads?.map((l) => l.id) || []);
      
      documents.forEach((doc) => {
        if (!doc.lead_id) {
          issues.push({
            severity: 'error',
            category: 'Data Integrity',
            message: `Document ${doc.id} has no lead_id`,
          });
        } else if (!leadIds.has(doc.lead_id)) {
          issues.push({
            severity: 'error',
            category: 'Referential Integrity',
            message: `Document ${doc.id} references non-existent lead ${doc.lead_id}`,
          });
        }
        
        if (!doc.document_type_id) {
          issues.push({
            severity: 'error',
            category: 'Data Integrity',
            message: `Document ${doc.id} has no document_type_id`,
          });
        }
      });

      // Validate document status consistency with leads
      const leadDocumentCounts = documents.reduce((acc: any, doc) => {
        if (!acc[doc.lead_id]) {
          acc[doc.lead_id] = { total: 0, byStatus: {} };
        }
        acc[doc.lead_id].total++;
        acc[doc.lead_id].byStatus[doc.verification_status] = 
          (acc[doc.lead_id].byStatus[doc.verification_status] || 0) + 1;
        return acc;
      }, {});

      allLeads?.forEach((lead) => {
        const docCount = leadDocumentCounts[lead.id];
        if (lead.documents_status === 'pending' && docCount && docCount.total > 0) {
          issues.push({
            severity: 'warning',
            category: 'Status Mismatch',
            message: `Lead ${lead.id} has documents_status='pending' but has ${docCount.total} uploaded documents`,
            details: { leadId: lead.id, docCount: docCount.total },
          });
        }
      });
    }

    // 5. VALIDATE PARTNER STATISTICS
    console.log('Validating partner statistics...');
    const partnerLeadCounts = allLeads?.reduce((acc: any, lead) => {
      if (lead.partner_id) {
        if (!acc[lead.partner_id]) {
          acc[lead.partner_id] = { count: 0, totalLoanAmount: 0 };
        }
        acc[lead.partner_id].count++;
        acc[lead.partner_id].totalLoanAmount += Number(lead.loan_amount || 0);
      }
      return acc;
    }, {});

    partners?.forEach((partner) => {
      const calculated = partnerLeadCounts[partner.id] || { count: 0, totalLoanAmount: 0 };
      issues.push({
        severity: 'info',
        category: 'Partner Statistics',
        message: `Partner ${partner.id} has ${calculated.count} leads with total loan amount ₹${calculated.totalLoanAmount.toLocaleString('en-IN')}`,
        details: calculated,
      });
    });

    // 6. CHECK FOR DUPLICATE RECORDS
    console.log('Checking for duplicates...');
    const { data: studentsWithEmail } = await supabase
      .from('students')
      .select('email, name');
    
    if (studentsWithEmail) {
      const emailCounts: any = {};
      studentsWithEmail.forEach((student) => {
        if (student.email) {
          emailCounts[student.email] = (emailCounts[student.email] || 0) + 1;
        }
      });

      Object.entries(emailCounts).forEach(([email, count]) => {
        if ((count as number) > 1) {
          issues.push({
            severity: 'warning',
            category: 'Duplicate Records',
            message: `Duplicate student email found: ${email} (${count} occurrences)`,
          });
        }
      });
    }

    // Generate summary statistics
    const statistics = {
      totalLeads: allLeads?.length || 0,
      totalDocuments: documents?.length || 0,
      totalPartners: partners?.length || 0,
      totalStudents: students?.length || 0,
      totalCoApplicants: coApplicants?.length || 0,
    };

    const report: ValidationReport = {
      timestamp: new Date().toISOString(),
      totalIssues: issues.length,
      errors: issues.filter((i) => i.severity === 'error').length,
      warnings: issues.filter((i) => i.severity === 'warning').length,
      info: issues.filter((i) => i.severity === 'info').length,
      issues,
      statistics,
    };

    console.log('✅ Data sanity check complete:', {
      totalIssues: report.totalIssues,
      errors: report.errors,
      warnings: report.warnings,
    });

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('❌ Error during sanity check:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
