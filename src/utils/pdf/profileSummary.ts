/**
 * Profile Summary PDF Generator
 * 
 * Generates a beautiful, professional student pitch document.
 * Designed to impress lenders with a clean, modern layout.
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
  drawFieldsGrid,
  drawModernCard,
  drawMetricCard,
  drawGradientHeader,
  drawStatusPill,
  drawProgressBar,
  drawScoreBadge,
  drawStatusIndicator,
  formatCurrency,
  formatDateSafe,
  getStatusText,
  addPageNumbers,
  calculateDocCompletion,
  PDF_COLORS,
  EXTENDED_COLORS,
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
 * Get profile strength based on data completeness
 */
function getProfileStrength(lead: LeadData, documents: LeadDocument[]): { 
  label: string; 
  color: readonly [number, number, number];
  score: number;
} {
  let score = 0;
  
  // Student details (30 points)
  if (lead.student?.name) score += 5;
  if (lead.student?.phone) score += 5;
  if (lead.student?.email) score += 5;
  if (lead.student?.date_of_birth) score += 5;
  if (lead.student?.highest_qualification) score += 5;
  if (lead.student?.postal_code && lead.student.postal_code !== '000000') score += 5;
  
  // Academic (20 points)
  if (lead.student?.tenth_percentage) score += 5;
  if (lead.student?.twelfth_percentage) score += 5;
  if (lead.test_scores && lead.test_scores.length > 0) score += 10;
  
  // Co-applicant (20 points)
  if (lead.co_applicant?.name && lead.co_applicant.name !== 'Co-Applicant') {
    score += 10;
    if (lead.co_applicant.salary > 0 || (lead.co_applicant.monthly_salary && lead.co_applicant.monthly_salary > 0)) {
      score += 10;
    }
  }
  
  // Documents (30 points)
  const verifiedDocs = documents.filter(d => d.verification_status === 'verified').length;
  score += Math.min(verifiedDocs * 5, 30);
  
  if (score >= 80) return { label: 'Strong', color: PDF_COLORS.green, score };
  if (score >= 50) return { label: 'Good', color: EXTENDED_COLORS.accent, score };
  if (score >= 30) return { label: 'Moderate', color: PDF_COLORS.amber, score };
  return { label: 'Needs Data', color: PDF_COLORS.red, score };
}

/**
 * Draw the hero header section
 */
function drawHeroHeader(state: LayoutState, lead: LeadData): void {
  const { doc, margin, pageWidth, contentWidth } = state;
  
  // Gradient header background
  drawGradientHeader(doc, 0, 0, pageWidth, 48);
  
  // Branding - top left
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(230, 230, 255);
  doc.text('EDULOAN by CashKaro', margin, 10);
  
  // Student name - hero text
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  const studentName = lead.student?.name || 'Student Profile';
  doc.text(studentName, margin, 26);
  
  // Case ID badge
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 220, 255);
  doc.text(`Case ID: ${lead.case_id}`, margin, 36);
  
  // Status pill - top right
  const status = lead.status?.replace(/_/g, ' ').toUpperCase() || 'NEW';
  const isPositive = ['DISBURSED', 'SANCTIONED', 'PF_PAID', 'SANCTION_LETTER'].some(s => status.includes(s));
  const pillColor = isPositive ? PDF_COLORS.green : EXTENDED_COLORS.accent;
  
  doc.setFontSize(7);
  const statusWidth = doc.getTextWidth(status) + 10;
  const pillX = pageWidth - margin - statusWidth;
  
  // White pill background
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pillX, 22, statusWidth, 12, 6, 6, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(pillColor[0], pillColor[1], pillColor[2]);
  doc.text(status, pillX + 5, 30);
  
  // Generation date
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 255);
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, pageWidth - margin, 10, { align: 'right' });
  
  state.y = 56;
}

/**
 * Draw the hero metric cards (3 cards)
 */
function drawHeroCards(state: LayoutState, lead: LeadData, documents: LeadDocument[]): void {
  const { doc, margin, contentWidth } = state;
  const cardWidth = (contentWidth - 8) / 3;
  const cardHeight = 38;
  const y = state.y;
  
  // Card 1: Loan Amount
  drawMetricCard(
    doc, margin, y, cardWidth, cardHeight,
    'Loan Amount',
    formatCurrency(lead.loan_amount),
    `${lead.loan_type?.replace('_', ' ') || 'N/A'} | ${lead.lender?.name || 'Lender TBD'}`,
    PDF_COLORS.primaryBlue
  );
  
  // Card 2: Study Destination
  drawMetricCard(
    doc, margin + cardWidth + 4, y, cardWidth, cardHeight,
    'Destination',
    lead.study_destination || 'N/A',
    `Intake: ${formatIntake(lead)}`,
    EXTENDED_COLORS.purple
  );
  
  // Card 3: Profile Strength
  const profile = getProfileStrength(lead, documents);
  const docCompletion = calculateDocCompletion(documents);
  
  drawModernCard(doc, margin + (cardWidth + 4) * 2, y, cardWidth, cardHeight, profile.color);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(PDF_COLORS.gray[0], PDF_COLORS.gray[1], PDF_COLORS.gray[2]);
  doc.text('PROFILE STRENGTH', margin + (cardWidth + 4) * 2 + 8, y + 10);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(profile.color[0], profile.color[1], profile.color[2]);
  doc.text(profile.label, margin + (cardWidth + 4) * 2 + 8, y + 22);
  
  // Progress bar for documents
  const barX = margin + (cardWidth + 4) * 2 + 8;
  const barWidth = cardWidth - 16;
  drawProgressBar(doc, barX, y + 28, barWidth, 4, docCompletion.percentage, EXTENDED_COLORS.cardBorder, profile.color);
  
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(PDF_COLORS.gray[0], PDF_COLORS.gray[1], PDF_COLORS.gray[2]);
  doc.text(`${docCompletion.verified}/${docCompletion.total} docs verified`, barX, y + 36);
  
  state.y = y + cardHeight + 8;
}

/**
 * Draw student snapshot section (compact two-column card)
 */
function drawStudentSnapshot(state: LayoutState, lead: LeadData): void {
  const { doc, margin, contentWidth } = state;
  const s = lead.student;
  
  const boxY = state.y;
  const boxHeight = 68;
  
  // Section card
  drawRoundedRect(doc, margin, boxY, contentWidth, boxHeight, 4, PDF_COLORS.white, EXTENDED_COLORS.cardBorder);
  
  // Header
  doc.setFillColor(PDF_COLORS.primaryBlue[0], PDF_COLORS.primaryBlue[1], PDF_COLORS.primaryBlue[2]);
  doc.roundedRect(margin, boxY, contentWidth, 12, 4, 4, 'F');
  doc.rect(margin, boxY + 6, contentWidth, 6, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('STUDENT PROFILE', margin + 6, boxY + 8);
  
  // Two column layout
  const colWidth = (contentWidth - 12) / 2;
  let leftY = boxY + 20;
  let rightY = boxY + 20;
  
  const leftFields: PDFField[] = [
    { label: 'Phone', value: s?.phone || 'N/A' },
    { label: 'Email', value: s?.email || 'N/A' },
    { label: 'DOB', value: formatDateSafe(s?.date_of_birth) },
    { label: 'Gender', value: s?.gender || 'N/A' },
  ];
  
  const rightFields: PDFField[] = [
    { label: 'Location', value: `${s?.city || 'N/A'}, ${s?.state || ''}`.replace(/, $/, '') },
    { label: 'PIN Code', value: s?.postal_code && s.postal_code !== '000000' ? s.postal_code : 'N/A' },
    { label: 'Qualification', value: s?.highest_qualification || 'N/A' },
    { label: 'Credit Score', value: s?.credit_score ? s.credit_score.toString() : 'N/A' },
  ];
  
  doc.setFontSize(7);
  
  // Left column
  leftFields.forEach((field, i) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PDF_COLORS.gray[0], PDF_COLORS.gray[1], PDF_COLORS.gray[2]);
    doc.text(field.label + ':', margin + 6, leftY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PDF_COLORS.darkGray[0], PDF_COLORS.darkGray[1], PDF_COLORS.darkGray[2]);
    const truncated = field.value.length > 30 ? field.value.substring(0, 27) + '...' : field.value;
    doc.text(truncated, margin + 32, leftY);
    leftY += 10;
  });
  
  // Right column
  rightFields.forEach((field, i) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PDF_COLORS.gray[0], PDF_COLORS.gray[1], PDF_COLORS.gray[2]);
    doc.text(field.label + ':', margin + 6 + colWidth, rightY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PDF_COLORS.darkGray[0], PDF_COLORS.darkGray[1], PDF_COLORS.darkGray[2]);
    const truncated = field.value.length > 25 ? field.value.substring(0, 22) + '...' : field.value;
    doc.text(truncated, margin + 32 + colWidth, rightY);
    rightY += 10;
  });
  
  state.y = boxY + boxHeight + 6;
}

/**
 * Draw academic scores with test badges
 */
function drawAcademicSection(state: LayoutState, lead: LeadData): void {
  const { doc, margin, contentWidth } = state;
  const s = lead.student;
  
  checkPageBreak(state, 55);
  
  const boxY = state.y;
  const hasTests = lead.test_scores && lead.test_scores.length > 0;
  const boxHeight = hasTests ? 50 : 35;
  
  // Section card
  drawRoundedRect(doc, margin, boxY, contentWidth, boxHeight, 4, PDF_COLORS.white, EXTENDED_COLORS.cardBorder);
  
  // Header
  doc.setFillColor(PDF_COLORS.primaryBlue[0], PDF_COLORS.primaryBlue[1], PDF_COLORS.primaryBlue[2]);
  doc.roundedRect(margin, boxY, contentWidth, 12, 4, 4, 'F');
  doc.rect(margin, boxY + 6, contentWidth, 6, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('ACADEMIC PROFILE', margin + 6, boxY + 8);
  
  // Academic scores as inline badges
  let badgeX = margin + 6;
  const badgeY = boxY + 20;
  
  if (s?.tenth_percentage) {
    badgeX += drawScoreBadge(doc, badgeX, badgeY, '10th', `${s.tenth_percentage}%`, PDF_COLORS.primaryBlue);
  }
  if (s?.twelfth_percentage) {
    badgeX += drawScoreBadge(doc, badgeX, badgeY, '12th', `${s.twelfth_percentage}%`, PDF_COLORS.primaryBlue);
  }
  if (s?.bachelors_cgpa) {
    badgeX += drawScoreBadge(doc, badgeX, badgeY, 'CGPA', s.bachelors_cgpa.toString(), EXTENDED_COLORS.purple);
  }
  if (s?.bachelors_percentage) {
    badgeX += drawScoreBadge(doc, badgeX, badgeY, "Bachelor's", `${s.bachelors_percentage}%`, EXTENDED_COLORS.purple);
  }
  
  // Test scores row
  if (hasTests) {
    let testX = margin + 6;
    const testY = boxY + 36;
    
    lead.test_scores!.forEach(ts => {
      const testLabel = ts.test_type.toUpperCase();
      testX += drawScoreBadge(doc, testX, testY, testLabel, ts.score, PDF_COLORS.green);
    });
  }
  
  state.y = boxY + boxHeight + 6;
}

/**
 * Draw co-applicant section
 */
function drawCoApplicantSection(state: LayoutState, lead: LeadData): void {
  const c = lead.co_applicant;
  const isPlaceholder = !c || c.name === 'Co-Applicant' || (c.salary === 0 && !c.phone);
  
  if (isPlaceholder) {
    const fields: PDFField[] = [{ label: 'Status', value: 'No co-applicant data provided' }];
    drawSectionBox(state, 'CO-APPLICANT', fields);
    return;
  }
  
  // Format salary
  let salaryValue = 'N/A';
  if (c.salary && c.salary > 0) {
    salaryValue = `${formatCurrency(c.salary)} (Annual)`;
  } else if (c.monthly_salary && c.monthly_salary > 0) {
    salaryValue = `${formatCurrency(c.monthly_salary)} (Monthly)`;
  }
  
  const fields: PDFField[] = [
    { label: 'Name', value: c.name || 'N/A' },
    { label: 'Relationship', value: c.relationship || 'N/A' },
    { label: 'Phone', value: c.phone || 'N/A' },
    { label: 'Email', value: c.email || 'N/A' },
    { label: 'Occupation', value: c.occupation || 'N/A' },
    { label: 'Employer', value: c.employer || 'N/A' },
    { label: 'Employment Type', value: c.employment_type || 'N/A' },
    { label: 'Salary', value: salaryValue },
    { label: 'PIN Code', value: c.pin_code && c.pin_code !== '000000' ? c.pin_code : 'N/A' },
    { label: 'Credit Score', value: c.credit_score ? c.credit_score.toString() : 'N/A' },
  ];
  
  drawSectionBox(state, 'CO-APPLICANT', fields);
}

/**
 * Draw universities section
 */
function drawUniversitiesSection(state: LayoutState, universities: LeadUniversity[]): void {
  const { doc, margin, contentWidth } = state;
  
  checkPageBreak(state, 25 + universities.length * 7);
  
  const boxY = state.y;
  const boxHeight = universities.length > 0 ? 16 + (universities.length * 7) + 4 : 28;
  
  // Section card
  drawRoundedRect(doc, margin, boxY, contentWidth, boxHeight, 4, PDF_COLORS.white, EXTENDED_COLORS.cardBorder);
  
  // Header
  doc.setFillColor(PDF_COLORS.primaryBlue[0], PDF_COLORS.primaryBlue[1], PDF_COLORS.primaryBlue[2]);
  doc.roundedRect(margin, boxY, contentWidth, 12, 4, 4, 'F');
  doc.rect(margin, boxY + 6, contentWidth, 6, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('UNIVERSITIES APPLIED', margin + 6, boxY + 8);
  
  // Count badge
  doc.setFontSize(7);
  doc.text(`${universities.length} ${universities.length === 1 ? 'university' : 'universities'}`, contentWidth + margin - 6, boxY + 8, { align: 'right' });
  
  let uniY = boxY + 20;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(PDF_COLORS.darkGray[0], PDF_COLORS.darkGray[1], PDF_COLORS.darkGray[2]);
  
  if (universities.length > 0) {
    universities.forEach((uni, idx) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}.`, margin + 6, uniY);
      doc.setFont('helvetica', 'normal');
      const uniText = `${uni.name} - ${uni.city}, ${uni.country}`;
      const truncated = uniText.length > 80 ? uniText.substring(0, 77) + '...' : uniText;
      doc.text(truncated, margin + 12, uniY);
      uniY += 7;
    });
  } else {
    doc.text('No universities specified', margin + 6, uniY);
  }
  
  state.y = boxY + boxHeight + 6;
}

/**
 * Draw document status dashboard
 */
function drawDocumentDashboard(state: LayoutState, documents: LeadDocument[]): void {
  const { doc, margin, contentWidth, pageWidth } = state;
  
  const docRows = Math.ceil(documents.length / 2);
  const boxHeight = documents.length > 0 ? 28 + (docRows * 9) : 28;
  
  checkPageBreak(state, boxHeight + 8);
  
  const verifiedCount = documents.filter(d => d.verification_status === 'verified').length;
  const pendingCount = documents.filter(d => d.verification_status === 'pending' || !d.verification_status).length;
  const rejectedCount = documents.filter(d => d.verification_status === 'rejected').length;
  
  const boxY = state.y;
  
  // Section card
  drawRoundedRect(doc, margin, boxY, contentWidth, boxHeight, 4, PDF_COLORS.white, EXTENDED_COLORS.cardBorder);
  
  // Header
  doc.setFillColor(PDF_COLORS.primaryBlue[0], PDF_COLORS.primaryBlue[1], PDF_COLORS.primaryBlue[2]);
  doc.roundedRect(margin, boxY, contentWidth, 12, 4, 4, 'F');
  doc.rect(margin, boxY + 6, contentWidth, 6, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('DOCUMENT STATUS', margin + 6, boxY + 8);
  
  // Summary counts in header
  doc.setFontSize(6);
  const summaryText = `${verifiedCount} Verified | ${pendingCount} Pending | ${rejectedCount} Rejected`;
  doc.text(summaryText, contentWidth + margin - 6, boxY + 8, { align: 'right' });
  
  if (documents.length === 0) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PDF_COLORS.gray[0], PDF_COLORS.gray[1], PDF_COLORS.gray[2]);
    doc.text('No documents uploaded', margin + 6, boxY + 20);
    state.y = boxY + boxHeight + 6;
    return;
  }
  
  // Document grid
  let docY = boxY + 20;
  const colWidth = (contentWidth - 12) / 2;
  
  doc.setFontSize(7);
  for (let i = 0; i < documents.length; i += 2) {
    // Left column
    const leftDoc = documents[i];
    drawStatusIndicator(doc, margin + 6, docY, leftDoc.verification_status as 'verified' | 'pending' | 'rejected' || 'pending');
    
    doc.setTextColor(PDF_COLORS.darkGray[0], PDF_COLORS.darkGray[1], PDF_COLORS.darkGray[2]);
    doc.setFont('helvetica', 'normal');
    const leftName = leftDoc.document_types?.name || 'Document';
    const truncatedLeft = leftName.length > 32 ? leftName.substring(0, 29) + '...' : leftName;
    doc.text(truncatedLeft, margin + 14, docY);
    
    // Right column
    if (documents[i + 1]) {
      const rightDoc = documents[i + 1];
      drawStatusIndicator(doc, margin + 6 + colWidth, docY, rightDoc.verification_status as 'verified' | 'pending' | 'rejected' || 'pending');
      
      const rightName = rightDoc.document_types?.name || 'Document';
      const truncatedRight = rightName.length > 32 ? rightName.substring(0, 29) + '...' : rightName;
      doc.text(truncatedRight, margin + 14 + colWidth, docY);
    }
    
    docY += 9;
  }
  
  state.y = boxY + boxHeight + 6;
}

/**
 * Draw status timeline as clean table
 */
function drawStatusTimeline(state: LayoutState, lead: LeadData): void {
  const { doc, margin, contentWidth } = state;
  const history = lead.status_history;
  
  if (!history || history.length === 0) return;
  
  const displayHistory = history.slice(-6); // Show last 6 entries
  const rowHeight = 8;
  const boxHeight = 16 + (displayHistory.length * rowHeight) + 4;
  
  checkPageBreak(state, boxHeight + 8);
  
  const boxY = state.y;
  
  // Section card
  drawRoundedRect(doc, margin, boxY, contentWidth, boxHeight, 4, PDF_COLORS.white, EXTENDED_COLORS.cardBorder);
  
  // Header
  doc.setFillColor(PDF_COLORS.primaryBlue[0], PDF_COLORS.primaryBlue[1], PDF_COLORS.primaryBlue[2]);
  doc.roundedRect(margin, boxY, contentWidth, 12, 4, 4, 'F');
  doc.rect(margin, boxY + 6, contentWidth, 6, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('STATUS TIMELINE', margin + 6, boxY + 8);
  
  // Table rows
  let rowY = boxY + 20;
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(PDF_COLORS.darkGray[0], PDF_COLORS.darkGray[1], PDF_COLORS.darkGray[2]);
  
  displayHistory.forEach((entry, idx) => {
    const dateStr = formatDateSafe(entry.created_at, 'dd MMM yyyy');
    const statusStr = entry.new_status.replace(/_/g, ' ');
    const changedBy = entry.changed_by || 'System';
    
    // Alternating row background
    if (idx % 2 === 0) {
      doc.setFillColor(PDF_COLORS.lightGray[0], PDF_COLORS.lightGray[1], PDF_COLORS.lightGray[2]);
      doc.rect(margin + 2, rowY - 5, contentWidth - 4, rowHeight, 'F');
    }
    
    doc.setTextColor(PDF_COLORS.gray[0], PDF_COLORS.gray[1], PDF_COLORS.gray[2]);
    doc.text(dateStr, margin + 6, rowY);
    
    doc.setTextColor(PDF_COLORS.darkGray[0], PDF_COLORS.darkGray[1], PDF_COLORS.darkGray[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(statusStr.length > 28 ? statusStr.substring(0, 25) + '...' : statusStr, margin + 40, rowY);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PDF_COLORS.gray[0], PDF_COLORS.gray[1], PDF_COLORS.gray[2]);
    doc.text(changedBy.length > 25 ? changedBy.substring(0, 22) + '...' : changedBy, margin + 110, rowY);
    
    rowY += rowHeight;
  });
  
  state.y = boxY + boxHeight + 6;
}

/**
 * Draw partner attribution section
 */
function drawPartnerSection(state: LayoutState, lead: LeadData): void {
  if (!lead.partner) return;
  
  const { doc, margin, contentWidth } = state;
  
  checkPageBreak(state, 30);
  
  const boxY = state.y;
  const boxHeight = 24;
  
  // Section card with accent
  drawModernCard(doc, margin, boxY, contentWidth, boxHeight, EXTENDED_COLORS.accent);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(PDF_COLORS.gray[0], PDF_COLORS.gray[1], PDF_COLORS.gray[2]);
  doc.text('REFERRAL PARTNER', margin + 8, boxY + 8);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(PDF_COLORS.darkGray[0], PDF_COLORS.darkGray[1], PDF_COLORS.darkGray[2]);
  doc.text(lead.partner.name, margin + 8, boxY + 18);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(PDF_COLORS.gray[0], PDF_COLORS.gray[1], PDF_COLORS.gray[2]);
  doc.text(`Code: ${lead.partner.partner_code}`, margin + contentWidth - 8, boxY + 18, { align: 'right' });
  
  state.y = boxY + boxHeight + 6;
}

/**
 * Main PDF generation function
 */
export function generateProfilePDF(
  lead: LeadData,
  universities: LeadUniversity[],
  documents: LeadDocument[]
): Blob {
  const doc = new jsPDF();
  const state = createLayoutState(doc);
  
  // Page 1: Executive Summary
  drawHeroHeader(state, lead);
  drawHeroCards(state, lead, documents);
  drawStudentSnapshot(state, lead);
  drawAcademicSection(state, lead);
  drawCoApplicantSection(state, lead);
  
  // Page 2: Details (may continue from page 1)
  drawUniversitiesSection(state, universities);
  drawDocumentDashboard(state, documents);
  drawStatusTimeline(state, lead);
  drawPartnerSection(state, lead);
  
  // Add page numbers and footer
  addPageNumbers(doc, state.margin);
  
  return doc.output('blob');
}
