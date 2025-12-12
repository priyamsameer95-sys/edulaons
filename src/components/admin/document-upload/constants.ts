// Document type help text mapping
export const DOCUMENT_HELP_TEXT: Record<string, string> = {
  'PAN Copy': 'Upload a clear copy of your PAN card. Ensure the PAN number and photo are clearly visible, not blurred or cropped.',
  'Aadhaar Copy': 'Upload front and back of Aadhaar card. Ensure the Aadhaar number, photo, and address are readable.',
  'Passport': 'Upload the photo page of your passport. Ensure passport number, photo, and validity dates are visible.',
  'Photo': 'Upload a recent passport-size photo with white background. Face should be clearly visible.',
  'English Proficiency Test Result': 'Upload your IELTS/TOEFL/PTE score card. Ensure all scores and test date are visible.',
  'Offer Letter / Condition Letter': 'Upload the official offer or conditional offer letter from your university.',
  'Income Proof': 'Upload salary slips (last 3 months) or ITR for business income.',
  'Bank Statement': 'Upload last 6 months bank statement. Ensure account number and transactions are visible.',
  'Property Documents': 'Upload property valuation report, ownership documents, or encumbrance certificate.',
};

export const MAX_FILE_SIZE_MB = 10;
export const ACCEPTED_FORMATS = ['PDF', 'JPG', 'JPEG', 'PNG'];

export function getHelpText(docName: string): string {
  return DOCUMENT_HELP_TEXT[docName] || 'Upload a clear, legible copy of this document.';
}

export function validateFileSize(file: File): string | null {
  const sizeMB = file.size / 1024 / 1024;
  if (sizeMB > MAX_FILE_SIZE_MB) {
    return `File size (${sizeMB.toFixed(2)} MB) exceeds maximum allowed (${MAX_FILE_SIZE_MB} MB)`;
  }
  return null;
}

export function validateFileFormat(file: File): string | null {
  const ext = file.name.split('.').pop()?.toUpperCase();
  if (!ext || !ACCEPTED_FORMATS.includes(ext)) {
    return `Invalid format. Accepted: ${ACCEPTED_FORMATS.join(', ')}`;
  }
  return null;
}
