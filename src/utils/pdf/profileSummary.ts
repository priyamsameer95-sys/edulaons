/**
 * Profile Summary PDF Generator
 * 
 * Generates a complete profile PDF with ALL fields from the Add Lead form.
 * Uses ASCII-safe characters only to avoid font rendering issues.
 */

import jsPDF from 'jspdf';
import { format } from 'date-fns';
import type { LeadData, LeadUniversity, LeadDocument, PDFField } from './types';
import {
  createLayoutState,
  checkPageBreak,
  drawRoundedRect,
  drawSectionBox,
  drawSectionHeader,
  formatCurrency,
  formatDateSafe,
  getStatusText,
  drawStatusIndicator,
  addPageNumbers,
  PDF_COLORS,
  type LayoutState,
} from './layout';

/**
 * Format intake month/year
 */
function formatIntake(lead: LeadData): string {
  if (lead.intake_month && lead.intake_year) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[lead.intake_month - 1]} ${lead.intake_year}`;
  }
  return 'N/A';
}

/**
 * Draw the header bar with branding
 */
function drawHeader(state: LayoutState, lead: LeadData): void {
  const { doc, margin, pageWidth } = state;
  
  // Blue header bar
  doc.setFillColor(PDF_COLORS.primaryBlue[0], PDF_COLORS.primaryBlue[1], PDF_COLORS.primaryBlue[2]);
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
  
  state.y = 50;
}

/**
 * Draw summary cards (loan + destination)
 */
function drawSummaryCards(state: LayoutState, lead: LeadData): void {
  const { doc, margin, contentWidth } = state;
  const cardWidth = (contentWidth - 10) / 2;
  const cardHeight = 45;
  const y = state.y;
  
  // Left Card - Loan Summary
  drawRoundedRect(doc, margin, y, cardWidth, cardHeight, 3, PDF_COLORS.lightBlue, [219, 234, 254]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(PDF_COLORS.primaryBlue[0], PDF_COLORS.primaryBlue[1], PDF_COLORS.primaryBlue[2]);
  doc.text('LOAN SUMMARY', margin + 8, y + 12);
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(PDF_COLORS.black[0], PDF_COLORS.black[1], PDF_COLORS.black[2]);
  doc.text(formatCurrency(lead.loan_amount), margin + 8, y + 26);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(PDF_COLORS.gray[0], PDF_COLORS.gray[1], PDF_COLORS.gray[2]);
  const loanTypeText = lead.loan_type?.replace('_', ' ').toUpperCase() || 'N/A';
  doc.text(`${loanTypeText} | ${lead.lender?.name || 'Lender TBD'}`, margin + 8, y + 36);

  // Right Card - Study Destination
  const rightCardX = margin + cardWidth + 10;
  drawRoundedRect(doc, rightCardX, y, cardWidth, cardHeight, 3, PDF_COLORS.lightBlue, [219, 234, 254]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(PDF_COLORS.primaryBlue[0], PDF_COLORS.primaryBlue[1], PDF_COLORS.primaryBlue[2]);
  doc.text('STUDY DESTINATION', rightCardX + 8, y + 12);
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(PDF_COLORS.black[0], PDF_COLORS.black[1], PDF_COLORS.black[2]);
  doc.text(lead.study_destination || 'N/A', rightCardX + 8, y + 26);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(PDF_COLORS.gray[0], PDF_COLORS.gray[1], PDF_COLORS.gray[2]);
  doc.text(`Intake: ${formatIntake(lead)}`, rightCardX + 8, y + 36);

  state.y += cardHeight + 15;
}

/**
 * Build student fields array - ALL fields, show N/A for missing
 */
function getStudentFields(lead: LeadData): PDFField[] {
  const s = lead.student;
  return [
    { label: 'Name', value: s?.name || 'N/A' },
    { label: 'Phone', value: s?.phone || 'N/A' },
    { label: 'Email', value: s?.email || 'N/A' },
    { label: 'Gender', value: s?.gender || 'N/A' },
    { label: 'Date of Birth', value: formatDateSafe(s?.date_of_birth) },
    { label: 'Nationality', value: s?.nationality || 'N/A' },
    { label: 'PIN Code', value: s?.postal_code && s.postal_code !== '000000' ? s.postal_code : 'N/A' },
    { label: 'City', value: s?.city || 'N/A' },
    { label: 'State', value: s?.state || 'N/A' },
    { label: 'Street Address', value: s?.street_address || 'N/A' },
    { label: 'Highest Qualification', value: s?.highest_qualification || 'N/A' },
    { label: 'Credit Score', value: s?.credit_score ? s.credit_score.toString() : 'N/A' },
  ];
}

/**
 * Build academic scores fields
 */
function getAcademicFields(lead: LeadData): PDFField[] {
  const s = lead.student;
  const fields: PDFField[] = [
    { label: '10th Percentage', value: s?.tenth_percentage ? `${s.tenth_percentage}%` : 'N/A' },
    { label: '12th Percentage', value: s?.twelfth_percentage ? `${s.twelfth_percentage}%` : 'N/A' },
    { label: "Bachelor's CGPA", value: s?.bachelors_cgpa ? s.bachelors_cgpa.toString() : 'N/A' },
    { label: "Bachelor's Percentage", value: s?.bachelors_percentage ? `${s.bachelors_percentage}%` : 'N/A' },
  ];
  
  // Add test scores
  if (lead.test_scores && lead.test_scores.length > 0) {
    lead.test_scores.forEach(ts => {
      let testValue = ts.score;
      if (ts.test_date) {
        testValue += ` (${formatDateSafe(ts.test_date, 'dd MMM yyyy')}`;
        if (ts.expiry_date) {
          testValue += ` to ${formatDateSafe(ts.expiry_date, 'dd MMM yyyy')}`;
        }
        testValue += ')';
      }
      fields.push({ label: ts.test_type.toUpperCase(), value: testValue });
    });
  }
  
  return fields;
}

/**
 * Build co-applicant fields - ALL fields, show N/A for missing
 */
function getCoApplicantFields(lead: LeadData): PDFField[] {
  const c = lead.co_applicant;
  const isPlaceholder = !c || c.name === 'Co-Applicant' || (c.salary === 0 && !c.phone);
  
  if (isPlaceholder) {
    return [
      { label: 'Status', value: 'No co-applicant data provided' },
    ];
  }
  
  // Format salary - prefer annual, show monthly if available
  let salaryValue = 'N/A';
  if (c.salary && c.salary > 0) {
    salaryValue = `${formatCurrency(c.salary)} (Annual)`;
  } else if (c.monthly_salary && c.monthly_salary > 0) {
    salaryValue = `${formatCurrency(c.monthly_salary)} (Monthly)`;
  }
  
  return [
    { label: 'Name', value: c.name || 'N/A' },
    { label: 'Relationship', value: c.relationship || 'N/A' },
    { label: 'Phone', value: c.phone || 'N/A' },
    { label: 'Email', value: c.email || 'N/A' },
    { label: 'PIN Code', value: c.pin_code && c.pin_code !== '000000' ? c.pin_code : 'N/A' },
    { label: 'Occupation', value: c.occupation || 'N/A' },
    { label: 'Employer', value: c.employer || 'N/A' },
    { label: 'Employment Type', value: c.employment_type || 'N/A' },
    { label: 'Employment Duration', value: c.employment_duration_years ? `${c.employment_duration_years} years` : 'N/A' },
    { label: 'Salary', value: salaryValue },
    { label: 'Credit Score', value: c.credit_score ? c.credit_score.toString() : 'N/A' },
  ];
}

/**
 * Build loan details fields
 */
function getLoanFields(lead: LeadData): PDFField[] {
  const fields: PDFField[] = [
    { label: 'Amount Requested', value: formatCurrency(lead.loan_amount) },
    { label: 'Loan Type', value: lead.loan_type?.replace('_', ' ').toUpperCase() || 'N/A' },
    { label: 'Classification', value: lead.loan_classification?.replace('_', ' ').toUpperCase() || 'N/A' },
    { label: 'Assigned Lender', value: lead.lender?.name || 'Not Assigned' },
    { label: 'Study Destination', value: lead.study_destination || 'N/A' },
    { label: 'Intake', value: formatIntake(lead) },
  ];
  
  if (lead.sanction_amount) {
    fields.push({ label: 'Sanction Amount', value: formatCurrency(lead.sanction_amount) });
  }
  if (lead.sanction_date) {
    fields.push({ label: 'Sanction Date', value: formatDateSafe(lead.sanction_date) });
  }
  
  return fields;
}

/**
 * Draw universities section
 */
function drawUniversitiesSection(state: LayoutState, universities: LeadUniversity[]): void {
  const { doc, margin, contentWidth } = state;
  
  checkPageBreak(state, 30 + universities.length * 8);
  
  const boxY = state.y;
  const boxHeight = universities.length > 0 ? 22 + (universities.length * 8) + 5 : 35;
  
  drawRoundedRect(doc, margin, boxY, contentWidth, boxHeight, 4, PDF_COLORS.lightGray);
  
  // Header
  doc.setFillColor(PDF_COLORS.primaryBlue[0], PDF_COLORS.primaryBlue[1], PDF_COLORS.primaryBlue[2]);
  doc.roundedRect(margin, boxY, contentWidth, 16, 4, 4, 'F');
  doc.setFillColor(PDF_COLORS.primaryBlue[0], PDF_COLORS.primaryBlue[1], PDF_COLORS.primaryBlue[2]);
  doc.rect(margin, boxY + 8, contentWidth, 8, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('UNIVERSITIES APPLIED', margin + 10, boxY + 11);
  
  let uniY = boxY + 26;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(PDF_COLORS.black[0], PDF_COLORS.black[1], PDF_COLORS.black[2]);
  
  if (universities.length > 0) {
    universities.forEach((uni, idx) => {
      doc.text(`${idx + 1}. ${uni.name} - ${uni.city}, ${uni.country}`, margin + 10, uniY);
      uniY += 8;
    });
  } else {
    doc.text('No universities specified', margin + 10, uniY);
  }
  
  state.y = boxY + boxHeight + 10;
}

/**
 * Draw document status section with text-based status (no unicode icons)
 */
function drawDocumentStatusSection(state: LayoutState, documents: LeadDocument[]): void {
  const { doc, margin, contentWidth, pageWidth } = state;
  
  const docRows = Math.ceil(documents.length / 2);
  const boxHeight = documents.length > 0 ? 35 + (docRows * 12) : 35;
  
  checkPageBreak(state, boxHeight + 10);
  
  const verifiedCount = documents.filter(d => d.verification_status === 'verified').length;
  const pendingCount = documents.filter(d => d.verification_status === 'pending' || !d.verification_status).length;
  const rejectedCount = documents.filter(d => d.verification_status === 'rejected').length;
  
  const boxY = state.y;
  
  drawRoundedRect(doc, margin, boxY, contentWidth, boxHeight, 4, PDF_COLORS.lightGray);
  
  // Header
  doc.setFillColor(PDF_COLORS.primaryBlue[0], PDF_COLORS.primaryBlue[1], PDF_COLORS.primaryBlue[2]);
  doc.roundedRect(margin, boxY, contentWidth, 16, 4, 4, 'F');
  doc.setFillColor(PDF_COLORS.primaryBlue[0], PDF_COLORS.primaryBlue[1], PDF_COLORS.primaryBlue[2]);
  doc.rect(margin, boxY + 8, contentWidth, 8, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('DOCUMENT STATUS', margin + 10, boxY + 11);
  
  // Summary
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${verifiedCount} Verified | ${pendingCount} Pending | ${rejectedCount} Rejected`, pageWidth - margin - 10, boxY + 11, { align: 'right' });
  
  if (documents.length === 0) {
    doc.setFontSize(9);
    doc.setTextColor(PDF_COLORS.black[0], PDF_COLORS.black[1], PDF_COLORS.black[2]);
    doc.text('No documents uploaded', margin + 10, boxY + 26);
    state.y = boxY + boxHeight + 10;
    return;
  }
  
  // Document list with colored squares instead of unicode
  let docY = boxY + 26;
  const colWidth = (contentWidth - 20) / 2;
  
  doc.setFontSize(9);
  for (let i = 0; i < documents.length; i += 2) {
    // Left column
    const leftDoc = documents[i];
    const leftStatus = getStatusText(leftDoc.verification_status);
    
    // Draw colored indicator square
    drawStatusIndicator(doc, margin + 10, docY, leftDoc.verification_status as 'verified' | 'pending' | 'rejected' || 'pending');
    
    doc.setTextColor(PDF_COLORS.black[0], PDF_COLORS.black[1], PDF_COLORS.black[2]);
    doc.setFont('helvetica', 'normal');
    const leftName = leftDoc.document_types?.name || 'Document';
    const truncatedLeft = leftName.length > 28 ? leftName.substring(0, 25) + '...' : leftName;
    doc.text(truncatedLeft, margin + 18, docY);
    
    // Right column
    if (documents[i + 1]) {
      const rightDoc = documents[i + 1];
      
      drawStatusIndicator(doc, margin + 10 + colWidth, docY, rightDoc.verification_status as 'verified' | 'pending' | 'rejected' || 'pending');
      
      doc.setTextColor(PDF_COLORS.black[0], PDF_COLORS.black[1], PDF_COLORS.black[2]);
      const rightName = rightDoc.document_types?.name || 'Document';
      const truncatedRight = rightName.length > 28 ? rightName.substring(0, 25) + '...' : rightName;
      doc.text(truncatedRight, margin + 18 + colWidth, docY);
    }
    
    docY += 12;
  }
  
  state.y = boxY + boxHeight + 10;
}

/**
 * Draw status timeline as a table (much more reliable than graphical)
 */
function drawStatusTimeline(state: LayoutState, lead: LeadData): void {
  const { doc, margin, contentWidth, pageWidth } = state;
  const history = lead.status_history;
  
  if (!history || history.length === 0) return;
  
  const displayHistory = history.slice(-8); // Show last 8 entries
  const rowHeight = 10;
  const boxHeight = 22 + (displayHistory.length * rowHeight) + 5;
  
  checkPageBreak(state, boxHeight + 10);
  
  const boxY = state.y;
  
  drawRoundedRect(doc, margin, boxY, contentWidth, boxHeight, 4, PDF_COLORS.lightGray);
  
  // Header
  doc.setFillColor(PDF_COLORS.primaryBlue[0], PDF_COLORS.primaryBlue[1], PDF_COLORS.primaryBlue[2]);
  doc.roundedRect(margin, boxY, contentWidth, 16, 4, 4, 'F');
  doc.setFillColor(PDF_COLORS.primaryBlue[0], PDF_COLORS.primaryBlue[1], PDF_COLORS.primaryBlue[2]);
  doc.rect(margin, boxY + 8, contentWidth, 8, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('STATUS HISTORY', margin + 10, boxY + 11);
  
  // Table headers
  const col1X = margin + 10;
  const col2X = margin + 50;
  const col3X = margin + 130;
  
  let rowY = boxY + 26;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(PDF_COLORS.gray[0], PDF_COLORS.gray[1], PDF_COLORS.gray[2]);
  doc.text('Date', col1X, rowY);
  doc.text('Status', col2X, rowY);
  doc.text('Changed By', col3X, rowY);
  
  rowY += rowHeight;
  
  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(PDF_COLORS.black[0], PDF_COLORS.black[1], PDF_COLORS.black[2]);
  
  displayHistory.forEach(entry => {
    const dateStr = formatDateSafe(entry.created_at, 'dd MMM yyyy');
    const statusStr = entry.new_status.replace(/_/g, ' ');
    const changedBy = entry.changed_by || 'System';
    
    doc.text(dateStr, col1X, rowY);
    doc.text(statusStr.length > 25 ? statusStr.substring(0, 22) + '...' : statusStr, col2X, rowY);
    doc.text(changedBy.length > 20 ? changedBy.substring(0, 17) + '...' : changedBy, col3X, rowY);
    
    rowY += rowHeight;
  });
  
  state.y = boxY + boxHeight + 10;
}

/**
 * Draw partner section
 */
function drawPartnerSection(state: LayoutState, lead: LeadData): void {
  const fields: PDFField[] = lead.partner 
    ? [
        { label: 'Partner Name', value: lead.partner.name },
        { label: 'Partner Code', value: lead.partner.partner_code },
      ]
    : [
        { label: 'Partner Assignment', value: 'Not assigned to a partner' },
      ];
  
  drawSectionBox(state, 'REFERRAL PARTNER', fields);
}

/**
 * Draw status footer bar
 */
function drawStatusFooter(state: LayoutState, lead: LeadData): void {
  const { doc, margin, contentWidth, pageWidth } = state;
  
  checkPageBreak(state, 25);
  
  const statusY = state.y;
  const status = lead.status?.replace(/_/g, ' ').toUpperCase() || 'N/A';
  const isPositive = ['DISBURSED', 'SANCTIONED', 'PF_PAID', 'SANCTION_LETTER'].some(s => status.includes(s));
  const statusColor = isPositive ? PDF_COLORS.green : PDF_COLORS.amber;
  
  drawRoundedRect(doc, margin, statusY, contentWidth, 20, 4, statusColor);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`Status: ${status}`, margin + 10, statusY + 13);
  
  doc.setFont('helvetica', 'normal');
  const createdText = `Created: ${formatDateSafe(lead.created_at)}`;
  doc.text(createdText, pageWidth - margin - 10, statusY + 13, { align: 'right' });
  
  state.y = statusY + 25;
}

/**
 * Main PDF generation function
 * 
 * Generates a complete profile PDF with ALL Add Lead form fields.
 * Uses ASCII-safe characters only to prevent font rendering issues.
 */
export function generateProfilePDF(
  lead: LeadData,
  universities: LeadUniversity[],
  documents: LeadDocument[]
): Blob {
  const doc = new jsPDF();
  const state = createLayoutState(doc);
  
  // Draw all sections
  drawHeader(state, lead);
  drawSummaryCards(state, lead);
  
  // Student section - ALL fields
  drawSectionBox(state, 'STUDENT DETAILS', getStudentFields(lead));
  
  // Academic scores section - always show
  drawSectionBox(state, 'ACADEMIC SCORES', getAcademicFields(lead));
  
  // Co-applicant section - always show (even if placeholder)
  drawSectionBox(state, 'CO-APPLICANT DETAILS', getCoApplicantFields(lead));
  
  // Loan details section
  drawSectionBox(state, 'LOAN DETAILS', getLoanFields(lead));
  
  // Partner section - always show
  drawPartnerSection(state, lead);
  
  // Universities section - always show
  drawUniversitiesSection(state, universities);
  
  // Document status section - always show
  drawDocumentStatusSection(state, documents);
  
  // Status timeline as table
  drawStatusTimeline(state, lead);
  
  // Status footer
  drawStatusFooter(state, lead);
  
  // Page numbers
  addPageNumbers(doc, state.margin);
  
  return doc.output('blob');
}
