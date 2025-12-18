import JSZip from 'jszip';
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
  partners?: {
    name: string;
  };
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

function generateProfileSummary(
  lead: LeadData,
  universities: LeadUniversity[]
): string {
  const generatedDate = format(new Date(), 'dd MMM yyyy, HH:mm');
  const createdDate = lead.created_at ? format(new Date(lead.created_at), 'dd MMM yyyy') : 'N/A';
  
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
  const formatIntake = () => {
    if (lead.intake_month && lead.intake_year) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[lead.intake_month - 1]} ${lead.intake_year}`;
    }
    return 'N/A';
  };

  let summary = `# Student Application Profile
Generated: ${generatedDate}
Case ID: ${lead.case_id}

================================================================================
STUDENT DETAILS
================================================================================
Name:           ${lead.student?.name || 'N/A'}
Phone:          ${lead.student?.phone || 'N/A'}
Email:          ${lead.student?.email || 'N/A'}
PIN Code:       ${lead.student?.postal_code || 'N/A'}
City:           ${lead.student?.city || 'N/A'}
State:          ${lead.student?.state || 'N/A'}
Date of Birth:  ${lead.student?.date_of_birth ? format(new Date(lead.student.date_of_birth), 'dd MMM yyyy') : 'N/A'}
Qualification:  ${lead.student?.highest_qualification || 'N/A'}

================================================================================
CO-APPLICANT DETAILS
================================================================================
Name:           ${lead.co_applicant?.name || 'N/A'}
Relationship:   ${lead.co_applicant?.relationship || 'N/A'}
Phone:          ${lead.co_applicant?.phone || 'N/A'}
Email:          ${lead.co_applicant?.email || 'N/A'}
PIN Code:       ${lead.co_applicant?.pin_code || 'N/A'}
Occupation:     ${lead.co_applicant?.occupation || 'N/A'}
Employer:       ${lead.co_applicant?.employer || 'N/A'}
Annual Salary:  ${lead.co_applicant?.salary ? formatCurrency(lead.co_applicant.salary) : 'N/A'}

================================================================================
LOAN DETAILS
================================================================================
Amount:         ${formatCurrency(lead.loan_amount)}
Type:           ${lead.loan_type?.replace('_', ' ').toUpperCase() || 'N/A'}
Classification: ${lead.loan_classification?.replace('_', ' ').toUpperCase() || 'Not Set'}
Current Lender: ${lead.lender?.name || 'Not Assigned'}

================================================================================
STUDY DESTINATION
================================================================================
Country:        ${lead.study_destination || 'N/A'}
Intake:         ${formatIntake()}

Universities:
`;

  if (universities.length > 0) {
    universities.forEach((uni, idx) => {
      summary += `  ${idx + 1}. ${uni.name} - ${uni.city}, ${uni.country}\n`;
    });
  } else {
    summary += `  No universities selected\n`;
  }

  summary += `
================================================================================
APPLICATION INFO
================================================================================
Status:         ${lead.status?.replace('_', ' ').toUpperCase() || 'N/A'}
Created:        ${createdDate}
Partner:        ${lead.partners?.name || 'Direct'}

================================================================================
END OF PROFILE
================================================================================
`;

  return summary;
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

    // Generate profile summary
    onProgress?.('Generating profile summary...');
    const profileSummary = generateProfileSummary(lead, universities);
    zip.file('Profile_Summary.txt', profileSummary);

    // Create documents folder
    const docsFolder = zip.folder('Documents');
    
    if (documents.length > 0) {
      onProgress?.(`Downloading ${documents.length} documents...`);
      
      // Download all documents in parallel (with limit)
      const downloadPromises = documents.map(async (doc, index) => {
        onProgress?.(`Downloading ${index + 1}/${documents.length}: ${doc.original_filename}`);
        
        const blob = await fetchDocumentFile(doc.file_path);
        if (blob && docsFolder) {
          // Use document type name as prefix for clarity
          const docTypeName = doc.document_types?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Document';
          const extension = doc.original_filename.split('.').pop() || 'pdf';
          const fileName = `${docTypeName}_${doc.original_filename}`;
          
          docsFolder.file(fileName, blob);
        }
        return { success: !!blob, name: doc.original_filename };
      });

      await Promise.all(downloadPromises);
    } else {
      // Add placeholder file if no documents
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
