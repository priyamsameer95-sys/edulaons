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
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
  const formatIntake = () => {
    if (lead.intake_month && lead.intake_year) {
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return `${months[lead.intake_month - 1]} ${lead.intake_year}`;
    }
    return 'Not Specified';
  };

  // Helper functions
  const addTitle = (text: string) => {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235); // Blue
    doc.text(text, margin, y);
    y += 10;
  };

  const addSubtitle = (text: string) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128); // Gray
    doc.text(text, margin, y);
    y += 8;
  };

  const addSectionHeader = (text: string) => {
    y += 6;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235); // Blue
    doc.text(text, margin, y);
    y += 2;
    // Draw line under header
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + contentWidth, y);
    y += 8;
  };

  const addField = (label: string, value: string) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 65, 81); // Dark gray
    doc.text(`${label}:`, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(17, 24, 39); // Near black
    doc.text(value || 'Not Provided', margin + 45, y);
    y += 6;
  };

  const checkPageBreak = (requiredSpace: number = 30) => {
    if (y > doc.internal.pageSize.getHeight() - requiredSpace) {
      doc.addPage();
      y = margin;
    }
  };

  // Title
  addTitle('STUDENT APPLICATION PROFILE');
  
  // Subtitle with Case ID and date
  const generatedDate = format(new Date(), 'dd MMMM yyyy, HH:mm');
  addSubtitle(`Case ID: ${lead.case_id}  |  Generated: ${generatedDate}`);
  
  // Horizontal line
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);
  y += 10;

  // Student Details Section
  addSectionHeader('STUDENT DETAILS');
  addField('Name', lead.student?.name || 'N/A');
  addField('Phone', lead.student?.phone || 'N/A');
  addField('Email', lead.student?.email || 'N/A');
  addField('PIN Code', lead.student?.postal_code || 'N/A');
  addField('City', lead.student?.city || 'N/A');
  addField('State', lead.student?.state || 'N/A');
  if (lead.student?.date_of_birth) {
    addField('Date of Birth', format(new Date(lead.student.date_of_birth), 'dd MMMM yyyy'));
  }
  addField('Qualification', lead.student?.highest_qualification || 'N/A');

  checkPageBreak();

  // Co-Applicant Details Section
  addSectionHeader('CO-APPLICANT DETAILS');
  addField('Name', lead.co_applicant?.name || 'N/A');
  addField('Relationship', lead.co_applicant?.relationship || 'N/A');
  addField('Phone', lead.co_applicant?.phone || 'N/A');
  addField('Email', lead.co_applicant?.email || 'N/A');
  addField('PIN Code', lead.co_applicant?.pin_code || 'N/A');
  addField('Occupation', lead.co_applicant?.occupation || 'N/A');
  addField('Employer', lead.co_applicant?.employer || 'N/A');
  addField('Annual Salary', lead.co_applicant?.salary ? formatCurrency(lead.co_applicant.salary) : 'N/A');

  checkPageBreak();

  // Loan Details Section
  addSectionHeader('LOAN DETAILS');
  addField('Amount Requested', formatCurrency(lead.loan_amount));
  addField('Loan Type', lead.loan_type?.replace('_', ' ').toUpperCase() || 'N/A');
  addField('Classification', lead.loan_classification?.replace('_', ' ').toUpperCase() || 'Not Set');
  addField('Assigned Lender', lead.lender?.name || 'Not Assigned');

  checkPageBreak();

  // Study Destination Section
  addSectionHeader('STUDY DESTINATION');
  addField('Country', lead.study_destination || 'N/A');
  addField('Intake', formatIntake());
  
  y += 4;
  if (universities.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 65, 81);
    doc.text('Universities Applied:', margin, y);
    y += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(17, 24, 39);
    universities.forEach((uni, idx) => {
      checkPageBreak();
      doc.text(`${idx + 1}. ${uni.name} - ${uni.city}, ${uni.country}`, margin + 5, y);
      y += 5;
    });
  } else {
    addField('Universities', 'No universities selected');
  }

  checkPageBreak();

  // Application Status Section
  addSectionHeader('APPLICATION STATUS');
  addField('Current Status', lead.status?.replace(/_/g, ' ').toUpperCase() || 'N/A');
  addField('Created', lead.created_at ? format(new Date(lead.created_at), 'dd MMMM yyyy') : 'N/A');

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
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
    const studentName = lead.student?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Student';
    const shortId = lead.id.slice(0, 8);

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

    // Generate PDF profile summary
    onProgress?.('Generating profile PDF...');
    const profilePdf = generateProfilePDF(lead, universities);
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

    // Trigger download
    const zipFileName = `${studentName}_${shortId}.zip`;
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
