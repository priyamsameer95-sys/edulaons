import JSZip from 'jszip';
import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface LeadData {
  id: string;
  case_id: string;
  student?: {
    name: string;
    phone: string;
    email?: string;
    postal_code?: string;
    city?: string;
    state?: string;
    date_of_birth?: string;
    highest_qualification?: string;
  };
  co_applicant?: {
    name: string;
    relationship: string;
    salary: number;
    phone?: string;
    email?: string;
    pin_code?: string;
    occupation?: string;
    employer?: string;
  };
  loan_amount: number;
  loan_type: string;
  loan_classification?: string;
  lender?: {
    name: string;
  };
  study_destination: string;
  intake_month?: number;
  intake_year?: number;
  status: string;
  created_at: string;
}

interface LeadDocument {
  id: string;
  document_type_id: string;
  original_filename: string;
  file_path: string;
  document_types?: {
    name: string;
    category: string;
  } | null;
}

interface LeadUniversity {
  name: string;
  city: string;
  country: string;
}

function generateProfilePDF(
  lead: LeadData,
  universities: LeadUniversity[]
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
  ]);

  // ============= LOAN DETAILS SECTION =============
  drawSectionBox('LOAN DETAILS', [
    { label: 'Amount Requested', value: formatCurrency(lead.loan_amount) },
    { label: 'Loan Type', value: lead.loan_type?.replace('_', ' ').toUpperCase() || 'N/A' },
    { label: 'Classification', value: lead.loan_classification?.replace('_', ' ').toUpperCase() || 'Not Set' },
    { label: 'Assigned Lender', value: lead.lender?.name || 'Not Assigned' },
  ]);

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

  // ============= STATUS FOOTER BAR =============
  checkPageBreak(25);
  
  const statusY = y;
  const status = lead.status?.replace(/_/g, ' ').toUpperCase() || 'N/A';
  const isApproved = ['DISBURSED', 'SANCTIONED', 'PF_PAID'].some(s => status.includes(s));
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

export async function downloadLeadPackage(
  lead: LeadData,
  documents: LeadDocument[],
  onProgress?: (message: string) => void
): Promise<boolean> {
  try {
    const zip = new JSZip();
    const shortId = lead.id.slice(0, 8);

    onProgress?.('Fetching complete lead data...');

    // Fetch complete lead data with all related records
    const { data: fullLeadData, error: leadError } = await supabase
      .from('leads_new')
      .select(`
        *,
        student:students!leads_new_student_id_fkey(
          id, name, email, phone, postal_code, city, state, 
          date_of_birth, highest_qualification, country, nationality,
          tenth_percentage, twelfth_percentage, bachelors_cgpa, bachelors_percentage
        ),
        co_applicant:co_applicants!leads_new_co_applicant_id_fkey(
          id, name, relationship, salary, phone, email, 
          pin_code, occupation, employer, employment_type,
          monthly_salary, credit_score
        ),
        lender:lenders!leads_new_lender_id_fkey(id, name, code)
      `)
      .eq('id', lead.id)
      .maybeSingle();

    // Extract first element from arrays (Supabase returns joined data as arrays when isOneToOne: false)
    const studentData = fullLeadData ? (Array.isArray(fullLeadData.student) ? fullLeadData.student[0] : fullLeadData.student) : null;
    const coApplicantData = fullLeadData ? (Array.isArray(fullLeadData.co_applicant) ? fullLeadData.co_applicant[0] : fullLeadData.co_applicant) : null;
    const lenderData = fullLeadData ? (Array.isArray(fullLeadData.lender) ? fullLeadData.lender[0] : fullLeadData.lender) : null;

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
      } : lead.co_applicant,
      loan_amount: fullLeadData.loan_amount,
      loan_type: fullLeadData.loan_type,
      loan_classification: fullLeadData.loan_classification,
      lender: lenderData ? { name: lenderData.name } : lead.lender,
      study_destination: fullLeadData.study_destination,
      intake_month: fullLeadData.intake_month,
      intake_year: fullLeadData.intake_year,
      status: fullLeadData.status,
      created_at: fullLeadData.created_at,
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

    // Generate PDF profile summary with complete data
    onProgress?.('Generating profile PDF...');
    const profilePdf = generateProfilePDF(completeLead, universities);
    zip.file('Profile_Summary.pdf', profilePdf);

    // Create documents folder
    const docsFolder = zip.folder('Documents');
    
    if (documents.length > 0) {
      onProgress?.(`Downloading ${documents.length} documents...`);
      
      // Download all documents in parallel
      const downloadPromises = documents.map(async (doc, index) => {
        onProgress?.(`Downloading ${index + 1}/${documents.length}: ${doc.original_filename}`);
        
        const blob = await fetchDocumentFile(doc.file_path);
        if (blob && docsFolder) {
          const docTypeName = doc.document_types?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Document';
          const fileName = `${docTypeName}_${doc.original_filename}`;
          docsFolder.file(fileName, blob);
        }
        return { success: !!blob, name: doc.original_filename };
      });

      await Promise.all(downloadPromises);
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
    return false;
  }
}
