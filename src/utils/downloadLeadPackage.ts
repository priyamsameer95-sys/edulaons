/**
 * Lead Package Download Utility
 * 
 * Creates a ZIP file containing:
 * - Profile_Summary.pdf (generated using the new PDF module)
 * - Documents organized by category
 * - manifest.json with document details
 */

import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';
import { generateProfilePDF } from './pdf/profileSummary';
import type { LeadData, LeadDocument, LeadUniversity, TestScore, StatusHistoryRecord } from './pdf/types';

// Re-export types for backward compatibility
export type { LeadData, LeadDocument, LeadUniversity };

// ============================================================
// DOCUMENT CATEGORY MAPPINGS
// ============================================================

const CATEGORY_ORDER: Record<string, { order: number; folder: string }> = {
  'KYC': { order: 1, folder: '01_KYC' },
  'Academic': { order: 2, folder: '02_Academic' },
  'Financial': { order: 3, folder: '03_Financial' },
  'Collateral': { order: 4, folder: '04_Collateral' },
  'Admission': { order: 5, folder: '05_Admission' },
  'Other': { order: 6, folder: '06_Other' },
};

function getCategoryFolder(category: string): string {
  return CATEGORY_ORDER[category]?.folder || CATEGORY_ORDER['Other'].folder;
}

function getVerificationStatusLabel(status?: string): string {
  switch (status?.toLowerCase()) {
    case 'verified':
      return 'Verified';
    case 'rejected':
      return 'Rejected';
    case 'pending':
    default:
      return 'Pending';
  }
}

// ============================================================
// MANIFEST INTERFACES
// ============================================================

interface DocumentManifestEntry {
  type: string;
  category: string;
  filename: string;
  status: string;
  verified_by?: string;
  verified_at?: string;
  ai_status?: string;
  uploaded_at?: string;
}

interface DocumentManifest {
  generated_at: string;
  case_id: string;
  student_name: string;
  total_documents: number;
  verified: number;
  pending: number;
  rejected: number;
  documents: DocumentManifestEntry[];
}

// ============================================================
// FILE DOWNLOAD UTILITIES
// ============================================================

async function fetchDocumentFile(filePath: string): Promise<Blob | null> {
  try {
    const { data, error } = await supabase.storage
      .from('lead-documents')
      .download(filePath);

    if (error) {
      console.error('Error downloading file:', filePath, error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching document:', filePath, error);
    return null;
  }
}

// ============================================================
// DATA FETCHING
// ============================================================

async function fetchCompleteLeadData(leadId: string, fallbackLead: LeadData): Promise<{
  lead: LeadData;
  universities: LeadUniversity[];
  documents: LeadDocument[];
}> {
  // Fetch complete lead data with all related records
  const { data: fullLeadData, error: leadError } = await supabase
    .from('leads_new')
    .select(`
      *,
      student:students!leads_new_student_id_fkey(
        id, name, email, phone, postal_code, city, state, 
        date_of_birth, highest_qualification, country, nationality,
        tenth_percentage, twelfth_percentage, bachelors_cgpa, bachelors_percentage,
        credit_score, gender, street_address
      ),
      co_applicant:co_applicants!leads_new_co_applicant_id_fkey(
        id, name, relationship, salary, phone, email, 
        pin_code, occupation, employer, employment_type,
        employment_duration_years, monthly_salary, credit_score
      ),
      lender:lenders!leads_new_lender_id_fkey(id, name, code),
      partner:partners!leads_new_partner_id_fkey(id, name, partner_code)
    `)
    .eq('id', leadId)
    .maybeSingle();

  if (leadError) {
    console.warn('Could not fetch complete lead data, using partial data:', leadError);
  }

  // Fetch test scores
  let testScores: TestScore[] = [];
  if (fullLeadData?.student_id) {
    const studentId = Array.isArray(fullLeadData.student) 
      ? fullLeadData.student[0]?.id 
      : fullLeadData.student?.id;
    if (studentId) {
      const { data: testData } = await supabase
        .from('academic_tests')
        .select('test_type, score, test_date, expiry_date')
        .eq('student_id', studentId);
      testScores = testData || [];
    }
  }

  // Fetch status history
  const { data: historyData } = await supabase
    .from('lead_status_history')
    .select('new_status, created_at, changed_by')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true })
    .limit(10);
  const statusHistory: StatusHistoryRecord[] = historyData || [];

  // Fetch universities
  const { data: univData } = await supabase
    .from('lead_universities')
    .select('university_id, universities(name, city, country)')
    .eq('lead_id', leadId);

  const universities: LeadUniversity[] = (univData || [])
    .filter((u: any) => u.universities)
    .map((u: any) => ({
      name: u.universities.name,
      city: u.universities.city,
      country: u.universities.country
    }));

  // Fetch complete document data
  const { data: fullDocuments } = await supabase
    .from('lead_documents')
    .select(`
      id, document_type_id, original_filename, file_path,
      verification_status, verified_at, verified_by, verification_notes,
      ai_validation_status, uploaded_at,
      document_types(name, category, required)
    `)
    .eq('lead_id', leadId);

  const documents: LeadDocument[] = (fullDocuments || []).map((doc: any) => ({
    id: doc.id,
    document_type_id: doc.document_type_id,
    original_filename: doc.original_filename,
    file_path: doc.file_path,
    verification_status: doc.verification_status,
    verified_at: doc.verified_at,
    verified_by: doc.verified_by,
    verification_notes: doc.verification_notes,
    ai_validation_status: doc.ai_validation_status,
    uploaded_at: doc.uploaded_at,
    document_types: doc.document_types,
  }));

  // Extract first element from arrays (Supabase returns joined data as arrays)
  const studentData = fullLeadData 
    ? (Array.isArray(fullLeadData.student) ? fullLeadData.student[0] : fullLeadData.student) 
    : null;
  const coApplicantData = fullLeadData 
    ? (Array.isArray(fullLeadData.co_applicant) ? fullLeadData.co_applicant[0] : fullLeadData.co_applicant) 
    : null;
  const lenderData = fullLeadData 
    ? (Array.isArray(fullLeadData.lender) ? fullLeadData.lender[0] : fullLeadData.lender) 
    : null;
  const partnerData = fullLeadData 
    ? (Array.isArray(fullLeadData.partner) ? fullLeadData.partner[0] : fullLeadData.partner) 
    : null;

  // Build complete lead object
  const completeLead: LeadData = fullLeadData ? {
    id: fullLeadData.id,
    case_id: fullLeadData.case_id,
    student: studentData ? {
      name: studentData.name,
      phone: studentData.phone,
      email: studentData.email,
      postal_code: studentData.postal_code,
      city: studentData.city,
      state: studentData.state,
      date_of_birth: studentData.date_of_birth,
      highest_qualification: studentData.highest_qualification,
      tenth_percentage: studentData.tenth_percentage,
      twelfth_percentage: studentData.twelfth_percentage,
      bachelors_cgpa: studentData.bachelors_cgpa,
      bachelors_percentage: studentData.bachelors_percentage,
      credit_score: studentData.credit_score,
      gender: studentData.gender,
      street_address: studentData.street_address,
      nationality: studentData.nationality,
    } : fallbackLead.student,
    co_applicant: coApplicantData ? {
      name: coApplicantData.name,
      relationship: coApplicantData.relationship,
      salary: coApplicantData.salary,
      phone: coApplicantData.phone,
      email: coApplicantData.email,
      pin_code: coApplicantData.pin_code,
      occupation: coApplicantData.occupation,
      employer: coApplicantData.employer,
      employment_type: coApplicantData.employment_type,
      employment_duration_years: coApplicantData.employment_duration_years,
      monthly_salary: coApplicantData.monthly_salary,
      credit_score: coApplicantData.credit_score,
    } : fallbackLead.co_applicant,
    loan_amount: fullLeadData.loan_amount,
    loan_type: fullLeadData.loan_type,
    loan_classification: fullLeadData.loan_classification,
    lender: lenderData ? { name: lenderData.name, code: lenderData.code } : fallbackLead.lender,
    partner: partnerData ? { name: partnerData.name, partner_code: partnerData.partner_code } : undefined,
    study_destination: fullLeadData.study_destination,
    intake_month: fullLeadData.intake_month,
    intake_year: fullLeadData.intake_year,
    status: fullLeadData.status,
    created_at: fullLeadData.created_at,
    test_scores: testScores,
    status_history: statusHistory,
    sanction_amount: fullLeadData.sanction_amount,
    sanction_date: fullLeadData.sanction_date,
  } : fallbackLead;

  return { lead: completeLead, universities, documents };
}

// ============================================================
// MAIN EXPORT FUNCTION
// ============================================================

export async function downloadLeadPackage(
  lead: LeadData,
  documents: LeadDocument[],
  onProgress?: (message: string) => void
): Promise<boolean> {
  try {
    const zip = new JSZip();

    onProgress?.('Fetching complete lead data...');

    // Fetch all data
    const { 
      lead: completeLead, 
      universities, 
      documents: enrichedDocuments 
    } = await fetchCompleteLeadData(lead.id, lead);

    const studentName = completeLead.student?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Student';

    // Generate PDF profile summary using new module
    onProgress?.('Generating profile PDF...');
    const profilePdf = generateProfilePDF(completeLead, universities, enrichedDocuments);
    zip.file('Profile_Summary.pdf', profilePdf);

    // Create category-based document folders
    const docsFolder = zip.folder('Documents');
    const failedDownloads: string[] = [];
    
    // Group documents by category
    const docsByCategory: Record<string, LeadDocument[]> = {};
    enrichedDocuments.forEach(doc => {
      const category = doc.document_types?.category || 'Other';
      if (!docsByCategory[category]) {
        docsByCategory[category] = [];
      }
      docsByCategory[category].push(doc);
    });

    if (enrichedDocuments.length > 0) {
      onProgress?.(`Downloading ${enrichedDocuments.length} documents...`);
      
      // Create manifest
      const manifest: DocumentManifest = {
        generated_at: new Date().toISOString(),
        case_id: completeLead.case_id,
        student_name: completeLead.student?.name || 'Unknown',
        total_documents: enrichedDocuments.length,
        verified: enrichedDocuments.filter(d => d.verification_status === 'verified').length,
        pending: enrichedDocuments.filter(d => d.verification_status === 'pending' || !d.verification_status).length,
        rejected: enrichedDocuments.filter(d => d.verification_status === 'rejected').length,
        documents: [],
      };

      // Track document type counts for duplicate naming
      const docTypeCount: Record<string, number> = {};

      // Download all documents and organize by category
      for (const [category, docs] of Object.entries(docsByCategory)) {
        const categoryFolder = getCategoryFolder(category);
        const catFolder = docsFolder?.folder(categoryFolder);

        for (const doc of docs) {
          const docIndex = enrichedDocuments.indexOf(doc) + 1;
          onProgress?.(`Downloading ${docIndex}/${enrichedDocuments.length}: ${doc.document_types?.name || doc.original_filename}`);
          
          const blob = await fetchDocumentFile(doc.file_path);
          
          if (blob && catFolder) {
            // Generate clean filename using document type name only
            const docTypeName = doc.document_types?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Document';
            const verificationStatus = getVerificationStatusLabel(doc.verification_status);
            
            // Get file extension from original filename
            const originalParts = doc.original_filename.split('.');
            const extension = originalParts.length > 1 ? `.${originalParts[originalParts.length - 1]}` : '';
            
            // Handle duplicates by adding counter
            const docKey = `${categoryFolder}_${docTypeName}`;
            docTypeCount[docKey] = (docTypeCount[docKey] || 0) + 1;
            
            // Filename format: DocTypeName_Status.ext or DocTypeName_Status_2.ext for duplicates
            const fileName = docTypeCount[docKey] > 1 
              ? `${docTypeName}_${verificationStatus}_${docTypeCount[docKey]}${extension}`
              : `${docTypeName}_${verificationStatus}${extension}`;
            
            catFolder.file(fileName, blob);
            
            // Add to manifest
            manifest.documents.push({
              type: doc.document_types?.name || 'Unknown',
              category: category,
              filename: fileName,
              status: verificationStatus.toLowerCase(),
              verified_by: doc.verified_by || undefined,
              verified_at: doc.verified_at || undefined,
              ai_status: doc.ai_validation_status || undefined,
              uploaded_at: doc.uploaded_at || undefined,
            });
          } else {
            failedDownloads.push(doc.original_filename);
          }
        }
      }

      // Add manifest file
      docsFolder?.file('manifest.json', JSON.stringify(manifest, null, 2));

      // Add error log if any downloads failed
      if (failedDownloads.length > 0) {
        const errorLog = `Download Errors Report
Generated: ${new Date().toISOString()}
Case ID: ${completeLead.case_id}

Failed to download ${failedDownloads.length} document(s):
${failedDownloads.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Please re-download these documents individually from the application.
`;
        docsFolder?.file('_download_errors.txt', errorLog);
      }
    } else {
      docsFolder?.file('_no_documents_uploaded.txt', 'No documents have been uploaded for this lead yet.');
    }

    // Generate ZIP file
    onProgress?.('Creating ZIP file...');
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    // Format intake date for filename (e.g., Mar_2026)
    const formatIntakeForFilename = (): string => {
      if (completeLead.intake_month && completeLead.intake_year) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[completeLead.intake_month - 1]}_${completeLead.intake_year}`;
      }
      return 'NoIntake';
    };

    // Trigger download with student name + intake date format
    const zipFileName = `${studentName}_${formatIntakeForFilename()}.zip`;
    console.log('Creating ZIP file:', zipFileName, 'Size:', zipBlob.size, 'bytes');
    
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = zipFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onProgress?.('Download complete!');
    return true;
  } catch (error) {
    console.error('Error creating lead package:', error);
    throw error;
  }
}
