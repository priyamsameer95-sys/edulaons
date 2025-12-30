import JSZip from 'jszip';
import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

// ============================================================
// INTERFACES
// ============================================================

interface StudentData {
  name: string;
  phone: string;
  email?: string;
  postal_code?: string;
  city?: string;
  state?: string;
  date_of_birth?: string;
  highest_qualification?: string;
  tenth_percentage?: number;
  twelfth_percentage?: number;
  bachelors_cgpa?: number;
  bachelors_percentage?: number;
  credit_score?: number;
}

interface CoApplicantData {
  name: string;
  relationship: string;
  salary: number;
  phone?: string;
  email?: string;
  pin_code?: string;
  occupation?: string;
  employer?: string;
  employment_type?: string;
  credit_score?: number;
}

interface TestScore {
  test_type: string;
  score: string;
  test_date?: string;
}

interface StatusHistoryRecord {
  new_status: string;
  created_at: string;
  changed_by?: string;
}

interface LeadData {
  id: string;
  case_id: string;
  student?: StudentData;
  co_applicant?: CoApplicantData;
  loan_amount: number;
  loan_type: string;
  loan_classification?: string;
  lender?: {
    name: string;
    code?: string;
  };
  partner?: {
    name: string;
    partner_code: string;
  };
  study_destination: string;
  intake_month?: number;
  intake_year?: number;
  status: string;
  created_at: string;
  test_scores?: TestScore[];
  status_history?: StatusHistoryRecord[];
  sanction_amount?: number;
  sanction_date?: string;
}

interface LeadDocument {
  id: string;
  document_type_id: string;
  original_filename: string;
  file_path: string;
  verification_status?: string;
  verified_at?: string;
  verified_by?: string;
  verification_notes?: string;
  ai_validation_status?: string;
  uploaded_at?: string;
  document_types?: {
    name: string;
    category: string;
    required?: boolean;
  } | null;
}

interface LeadUniversity {
  name: string;
  city: string;
  country: string;
}

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
// PDF GENERATION
// ============================================================

function generateProfilePDF(
  lead: LeadData,
  universities: LeadUniversity[],
  documents: LeadDocument[]
): Blob {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let y = 0;

  // Colors
  const primaryBlue = [37, 99, 235] as const;
  const lightBlue = [239, 246, 255] as const;
  const darkGray = [55, 65, 81] as const;
  const black = [17, 24, 39] as const;
  const gray = [107, 114, 128] as const;
  const lightGray = [243, 244, 246] as const;
  const green = [22, 163, 74] as const;
  const amber = [217, 119, 6] as const;
  const red = [220, 38, 38] as const;

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
  const formatIntake = () => {
    if (lead.intake_month && lead.intake_year) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[lead.intake_month - 1]} ${lead.intake_year}`;
    }
    return 'Not Specified';
  };

  // Helper: Draw rounded rectangle
  const drawRoundedRect = (x: number, rY: number, w: number, h: number, r: number, fill?: readonly [number, number, number], stroke?: readonly [number, number, number]) => {
    if (fill) {
      doc.setFillColor(fill[0], fill[1], fill[2]);
    }
    if (stroke) {
      doc.setDrawColor(stroke[0], stroke[1], stroke[2]);
      doc.setLineWidth(0.3);
    }
    doc.roundedRect(x, rY, w, h, r, r, fill && stroke ? 'FD' : fill ? 'F' : 'S');
  };

  // ============= HEADER BAR =============
  doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Branding
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('EDULOAN by CashKaro', margin, 12);
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Application Profile', margin, 25);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Case ID: ${lead.case_id}`, margin, 34);
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, pageWidth - margin, 34, { align: 'right' });
  
  y = 50;

  // ============= SUMMARY CARDS =============
  const cardWidth = (contentWidth - 10) / 2;
  const cardHeight = 45;
  
  // Left Card - Loan Summary
  drawRoundedRect(margin, y, cardWidth, cardHeight, 3, lightBlue, [219, 234, 254]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.text('LOAN SUMMARY', margin + 8, y + 12);
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(black[0], black[1], black[2]);
  doc.text(formatCurrency(lead.loan_amount), margin + 8, y + 26);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(gray[0], gray[1], gray[2]);
  const loanTypeText = lead.loan_type?.replace('_', ' ').toUpperCase() || 'N/A';
  doc.text(`${loanTypeText} • ${lead.lender?.name || 'Lender TBD'}`, margin + 8, y + 36);

  // Right Card - Study Destination
  const rightCardX = margin + cardWidth + 10;
  drawRoundedRect(rightCardX, y, cardWidth, cardHeight, 3, lightBlue, [219, 234, 254]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.text('STUDY DESTINATION', rightCardX + 8, y + 12);
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(black[0], black[1], black[2]);
  doc.text(lead.study_destination || 'N/A', rightCardX + 8, y + 26);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(gray[0], gray[1], gray[2]);
  doc.text(`Intake: ${formatIntake()}`, rightCardX + 8, y + 36);

  y += cardHeight + 15;

  // ============= HELPER FUNCTIONS FOR SECTIONS =============
  const checkPageBreak = (requiredSpace: number = 50) => {
    if (y > pageHeight - requiredSpace) {
      doc.addPage();
      y = 20;
    }
  };

  const drawSectionBox = (title: string, fields: Array<{label: string, value: string}>) => {
    checkPageBreak(fields.length * 7 + 30);
    
    const boxY = y;
    const fieldRows = Math.ceil(fields.length / 2);
    const boxHeight = 22 + (fieldRows * 14);
    
    // Box background
    drawRoundedRect(margin, boxY, contentWidth, boxHeight, 4, lightGray);
    
    // Header bar
    doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.roundedRect(margin, boxY, contentWidth, 16, 4, 4, 'F');
    doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.rect(margin, boxY + 8, contentWidth, 8, 'F');
    
    // Section title
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(title, margin + 10, boxY + 11);
    
    // Fields in two columns
    const colWidth = (contentWidth - 20) / 2;
    let fieldY = boxY + 26;
    
    doc.setFontSize(9);
    for (let i = 0; i < fields.length; i += 2) {
      // Left column
      const leftField = fields[i];
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.text(leftField.label, margin + 10, fieldY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(black[0], black[1], black[2]);
      doc.text(leftField.value || 'N/A', margin + 10, fieldY + 6);
      
      // Right column
      if (fields[i + 1]) {
        const rightField = fields[i + 1];
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(gray[0], gray[1], gray[2]);
        doc.text(rightField.label, margin + 10 + colWidth, fieldY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(black[0], black[1], black[2]);
        doc.text(rightField.value || 'N/A', margin + 10 + colWidth, fieldY + 6);
      }
      
      fieldY += 14;
    }
    
    y = boxY + boxHeight + 10;
  };

  // ============= STUDENT DETAILS SECTION =============
  drawSectionBox('STUDENT DETAILS', [
    { label: 'Name', value: lead.student?.name || 'N/A' },
    { label: 'Phone', value: lead.student?.phone || 'N/A' },
    { label: 'Email', value: lead.student?.email || 'N/A' },
    { label: 'PIN Code', value: lead.student?.postal_code || 'N/A' },
    { label: 'City', value: lead.student?.city || 'N/A' },
    { label: 'State', value: lead.student?.state || 'N/A' },
    { label: 'Date of Birth', value: lead.student?.date_of_birth ? format(new Date(lead.student.date_of_birth), 'dd MMM yyyy') : 'N/A' },
    { label: 'Qualification', value: lead.student?.highest_qualification || 'N/A' },
  ]);

  // ============= ACADEMIC SCORES SECTION (NEW) =============
  const academicFields: Array<{label: string, value: string}> = [];
  
  if (lead.student?.tenth_percentage) {
    academicFields.push({ label: '10th Percentage', value: `${lead.student.tenth_percentage}%` });
  }
  if (lead.student?.twelfth_percentage) {
    academicFields.push({ label: '12th Percentage', value: `${lead.student.twelfth_percentage}%` });
  }
  if (lead.student?.bachelors_cgpa) {
    academicFields.push({ label: 'Bachelor\'s CGPA', value: lead.student.bachelors_cgpa.toString() });
  }
  if (lead.student?.bachelors_percentage) {
    academicFields.push({ label: 'Bachelor\'s %', value: `${lead.student.bachelors_percentage}%` });
  }
  if (lead.student?.credit_score) {
    academicFields.push({ label: 'Credit Score', value: lead.student.credit_score.toString() });
  }
  
  // Add test scores if available
  if (lead.test_scores && lead.test_scores.length > 0) {
    lead.test_scores.forEach(ts => {
      academicFields.push({ label: ts.test_type.toUpperCase(), value: ts.score });
    });
  }

  if (academicFields.length > 0) {
    drawSectionBox('ACADEMIC SCORES', academicFields);
  }

  // ============= CO-APPLICANT DETAILS SECTION =============
  drawSectionBox('CO-APPLICANT DETAILS', [
    { label: 'Name', value: lead.co_applicant?.name || 'N/A' },
    { label: 'Relationship', value: lead.co_applicant?.relationship || 'N/A' },
    { label: 'Phone', value: lead.co_applicant?.phone || 'N/A' },
    { label: 'Email', value: lead.co_applicant?.email || 'N/A' },
    { label: 'PIN Code', value: lead.co_applicant?.pin_code || 'N/A' },
    { label: 'Occupation', value: lead.co_applicant?.occupation || 'N/A' },
    { label: 'Employer', value: lead.co_applicant?.employer || 'N/A' },
    { label: 'Annual Salary', value: lead.co_applicant?.salary ? formatCurrency(lead.co_applicant.salary) : 'N/A' },
    ...(lead.co_applicant?.credit_score ? [{ label: 'Credit Score', value: lead.co_applicant.credit_score.toString() }] : []),
  ]);

  // ============= LOAN DETAILS SECTION =============
  const loanFields = [
    { label: 'Amount Requested', value: formatCurrency(lead.loan_amount) },
    { label: 'Loan Type', value: lead.loan_type?.replace('_', ' ').toUpperCase() || 'N/A' },
    { label: 'Classification', value: lead.loan_classification?.replace('_', ' ').toUpperCase() || 'Not Set' },
    { label: 'Assigned Lender', value: lead.lender?.name || 'Not Assigned' },
  ];
  
  if (lead.sanction_amount) {
    loanFields.push({ label: 'Sanction Amount', value: formatCurrency(lead.sanction_amount) });
  }
  if (lead.sanction_date) {
    loanFields.push({ label: 'Sanction Date', value: format(new Date(lead.sanction_date), 'dd MMM yyyy') });
  }

  drawSectionBox('LOAN DETAILS', loanFields);

  // ============= REFERRAL PARTNER SECTION (NEW) =============
  if (lead.partner) {
    drawSectionBox('REFERRAL PARTNER', [
      { label: 'Partner Name', value: lead.partner.name },
      { label: 'Partner Code', value: lead.partner.partner_code },
    ]);
  }

  // ============= UNIVERSITIES SECTION =============
  if (universities.length > 0) {
    checkPageBreak(30 + universities.length * 8);
    
    const uniBoxY = y;
    const uniBoxHeight = 22 + (universities.length * 8) + 5;
    
    drawRoundedRect(margin, uniBoxY, contentWidth, uniBoxHeight, 4, lightGray);
    
    doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.roundedRect(margin, uniBoxY, contentWidth, 16, 4, 4, 'F');
    doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.rect(margin, uniBoxY + 8, contentWidth, 8, 'F');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('UNIVERSITIES APPLIED', margin + 10, uniBoxY + 11);
    
    let uniY = uniBoxY + 26;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(black[0], black[1], black[2]);
    
    universities.forEach((uni, idx) => {
      doc.text(`${idx + 1}. ${uni.name} — ${uni.city}, ${uni.country}`, margin + 10, uniY);
      uniY += 8;
    });
    
    y = uniBoxY + uniBoxHeight + 10;
  }

  // ============= DOCUMENT STATUS SECTION (NEW) =============
  if (documents.length > 0) {
    checkPageBreak(40 + Math.ceil(documents.length / 2) * 10);
    
    const verifiedCount = documents.filter(d => d.verification_status === 'verified').length;
    const pendingCount = documents.filter(d => d.verification_status === 'pending' || !d.verification_status).length;
    const rejectedCount = documents.filter(d => d.verification_status === 'rejected').length;
    
    const docBoxY = y;
    const docRows = Math.ceil(documents.length / 2);
    const docBoxHeight = 35 + (docRows * 10);
    
    drawRoundedRect(margin, docBoxY, contentWidth, docBoxHeight, 4, lightGray);
    
    doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.roundedRect(margin, docBoxY, contentWidth, 16, 4, 4, 'F');
    doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.rect(margin, docBoxY + 8, contentWidth, 8, 'F');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('DOCUMENT STATUS', margin + 10, docBoxY + 11);
    
    // Summary line
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`${verifiedCount} Verified • ${pendingCount} Pending • ${rejectedCount} Rejected`, pageWidth - margin - 10, docBoxY + 11, { align: 'right' });
    
    // Document list with icons
    let docY = docBoxY + 26;
    const colWidth = (contentWidth - 20) / 2;
    
    doc.setFontSize(9);
    for (let i = 0; i < documents.length; i += 2) {
      // Left column
      const leftDoc = documents[i];
      const leftStatus = leftDoc.verification_status;
      const leftIcon = leftStatus === 'verified' ? '✓' : leftStatus === 'rejected' ? '✗' : '○';
      const leftColor = leftStatus === 'verified' ? green : leftStatus === 'rejected' ? red : amber;
      
      doc.setTextColor(leftColor[0], leftColor[1], leftColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(leftIcon, margin + 10, docY);
      doc.setTextColor(black[0], black[1], black[2]);
      doc.setFont('helvetica', 'normal');
      const leftName = leftDoc.document_types?.name || 'Document';
      doc.text(leftName.length > 25 ? leftName.substring(0, 22) + '...' : leftName, margin + 18, docY);
      
      // Right column
      if (documents[i + 1]) {
        const rightDoc = documents[i + 1];
        const rightStatus = rightDoc.verification_status;
        const rightIcon = rightStatus === 'verified' ? '✓' : rightStatus === 'rejected' ? '✗' : '○';
        const rightColor = rightStatus === 'verified' ? green : rightStatus === 'rejected' ? red : amber;
        
        doc.setTextColor(rightColor[0], rightColor[1], rightColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(rightIcon, margin + 10 + colWidth, docY);
        doc.setTextColor(black[0], black[1], black[2]);
        doc.setFont('helvetica', 'normal');
        const rightName = rightDoc.document_types?.name || 'Document';
        doc.text(rightName.length > 25 ? rightName.substring(0, 22) + '...' : rightName, margin + 18 + colWidth, docY);
      }
      
      docY += 10;
    }
    
    y = docBoxY + docBoxHeight + 10;
  }

  // ============= STATUS TIMELINE SECTION (NEW) =============
  if (lead.status_history && lead.status_history.length > 0) {
    const keyMilestones = lead.status_history.slice(0, 6); // Show up to 6 milestones
    
    checkPageBreak(50);
    
    const timelineBoxY = y;
    const timelineBoxHeight = 45;
    
    drawRoundedRect(margin, timelineBoxY, contentWidth, timelineBoxHeight, 4, lightGray);
    
    doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.roundedRect(margin, timelineBoxY, contentWidth, 16, 4, 4, 'F');
    doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.rect(margin, timelineBoxY + 8, contentWidth, 8, 'F');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('STATUS TIMELINE', margin + 10, timelineBoxY + 11);
    
    // Draw timeline
    const timelineY = timelineBoxY + 28;
    const stepWidth = (contentWidth - 30) / Math.max(keyMilestones.length - 1, 1);
    
    doc.setFontSize(7);
    keyMilestones.forEach((milestone, idx) => {
      const stepX = margin + 15 + (idx * stepWidth);
      
      // Circle
      doc.setFillColor(green[0], green[1], green[2]);
      doc.circle(stepX, timelineY, 3, 'F');
      
      // Line to next
      if (idx < keyMilestones.length - 1) {
        doc.setDrawColor(green[0], green[1], green[2]);
        doc.setLineWidth(1);
        doc.line(stepX + 3, timelineY, stepX + stepWidth - 3, timelineY);
      }
      
      // Status label
      doc.setTextColor(black[0], black[1], black[2]);
      const statusLabel = milestone.new_status.replace(/_/g, ' ').substring(0, 10);
      doc.text(statusLabel, stepX, timelineY + 8, { align: 'center' });
      
      // Date
      doc.setTextColor(gray[0], gray[1], gray[2]);
      const dateLabel = format(new Date(milestone.created_at), 'dd MMM');
      doc.text(dateLabel, stepX, timelineY + 13, { align: 'center' });
    });
    
    y = timelineBoxY + timelineBoxHeight + 10;
  }

  // ============= STATUS FOOTER BAR =============
  checkPageBreak(25);
  
  const statusY = y;
  const status = lead.status?.replace(/_/g, ' ').toUpperCase() || 'N/A';
  const isApproved = ['DISBURSED', 'SANCTIONED', 'PF_PAID', 'SANCTION_LETTER'].some(s => status.includes(s));
  const statusColor = isApproved ? green : amber;
  
  drawRoundedRect(margin, statusY, contentWidth, 20, 4, statusColor);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`Status: ${status}`, margin + 10, statusY + 13);
  
  doc.setFont('helvetica', 'normal');
  const createdText = `Created: ${lead.created_at ? format(new Date(lead.created_at), 'dd MMM yyyy') : 'N/A'}`;
  doc.text(createdText, pageWidth - margin - 10, statusY + 13, { align: 'right' });

  // ============= PAGE FOOTER =============
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text('EduLoan by CashKaro | Contact: priyam.sameer@cashkaro.com', margin, pageHeight - 8);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  return doc.output('blob');
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

    // Fetch complete lead data with all related records
    const { data: fullLeadData, error: leadError } = await supabase
      .from('leads_new')
      .select(`
        *,
        student:students!leads_new_student_id_fkey(
          id, name, email, phone, postal_code, city, state, 
          date_of_birth, highest_qualification, country, nationality,
          tenth_percentage, twelfth_percentage, bachelors_cgpa, bachelors_percentage,
          credit_score
        ),
        co_applicant:co_applicants!leads_new_co_applicant_id_fkey(
          id, name, relationship, salary, phone, email, 
          pin_code, occupation, employer, employment_type,
          monthly_salary, credit_score
        ),
        lender:lenders!leads_new_lender_id_fkey(id, name, code),
        partner:partners!leads_new_partner_id_fkey(id, name, partner_code)
      `)
      .eq('id', lead.id)
      .maybeSingle();

    // Fetch test scores
    let testScores: TestScore[] = [];
    if (fullLeadData?.student_id) {
      const studentId = Array.isArray(fullLeadData.student) ? fullLeadData.student[0]?.id : fullLeadData.student?.id;
      if (studentId) {
        const { data: testData } = await supabase
          .from('academic_tests')
          .select('test_type, score, test_date')
          .eq('student_id', studentId);
        testScores = testData || [];
      }
    }

    // Fetch status history
    let statusHistory: StatusHistoryRecord[] = [];
    const { data: historyData } = await supabase
      .from('lead_status_history')
      .select('new_status, created_at, changed_by')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: true })
      .limit(10);
    statusHistory = historyData || [];

    // Extract first element from arrays (Supabase returns joined data as arrays when isOneToOne: false)
    const studentData = fullLeadData ? (Array.isArray(fullLeadData.student) ? fullLeadData.student[0] : fullLeadData.student) : null;
    const coApplicantData = fullLeadData ? (Array.isArray(fullLeadData.co_applicant) ? fullLeadData.co_applicant[0] : fullLeadData.co_applicant) : null;
    const lenderData = fullLeadData ? (Array.isArray(fullLeadData.lender) ? fullLeadData.lender[0] : fullLeadData.lender) : null;
    const partnerData = fullLeadData ? (Array.isArray(fullLeadData.partner) ? fullLeadData.partner[0] : fullLeadData.partner) : null;

    // Use fetched data or fall back to passed lead data
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
      } : lead.student,
      co_applicant: coApplicantData ? {
        name: coApplicantData.name,
        relationship: coApplicantData.relationship,
        salary: coApplicantData.salary,
        phone: coApplicantData.phone,
        email: coApplicantData.email,
        pin_code: coApplicantData.pin_code,
        occupation: coApplicantData.occupation,
        employer: coApplicantData.employer,
        credit_score: coApplicantData.credit_score,
      } : lead.co_applicant,
      loan_amount: fullLeadData.loan_amount,
      loan_type: fullLeadData.loan_type,
      loan_classification: fullLeadData.loan_classification,
      lender: lenderData ? { name: lenderData.name, code: lenderData.code } : lead.lender,
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
    } : lead;

    if (leadError) {
      console.warn('Could not fetch complete lead data, using partial data:', leadError);
    }

    const studentName = completeLead.student?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Student';

    onProgress?.('Fetching universities...');

    // Fetch universities
    const { data: univData } = await supabase
      .from('lead_universities')
      .select('university_id, universities(name, city, country)')
      .eq('lead_id', lead.id);

    const universities: LeadUniversity[] = (univData || [])
      .filter((u: any) => u.universities)
      .map((u: any) => ({
        name: u.universities.name,
        city: u.universities.city,
        country: u.universities.country
      }));

    // Fetch complete document data with verification status
    onProgress?.('Fetching document details...');
    const { data: fullDocuments } = await supabase
      .from('lead_documents')
      .select(`
        id, document_type_id, original_filename, file_path,
        verification_status, verified_at, verified_by, verification_notes,
        ai_validation_status, uploaded_at,
        document_types(name, category, required)
      `)
      .eq('lead_id', lead.id);

    const enrichedDocuments: LeadDocument[] = (fullDocuments || documents).map((doc: any) => ({
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

    // Generate PDF profile summary with complete data
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
    console.log('ZIP contents:', Object.keys(zip.files));
    
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
    onProgress?.('Error creating package. Please try again.');
    return false;
  }
}
