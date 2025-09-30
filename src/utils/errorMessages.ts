export interface ValidationError {
  field: string;
  message: string;
  type: 'required' | 'format' | 'range' | 'duplicate' | 'invalid';
}

// User-friendly error messages for form validation
export const ERROR_MESSAGES = {
  // Required field messages
  REQUIRED: {
    student_name: 'Please enter the student\'s full name',
    student_phone: 'Please enter a mobile number to continue',
    student_email: 'Please enter an email address',
    student_pin_code: 'Please enter the student\'s PIN code',
    country: 'Please select a study destination',
    universities: 'Please select at least one university',
    intake_month: 'Please choose when the student plans to start',
    loan_type: 'Please choose between secured or unsecured loan',
    amount_requested: 'Please enter the loan amount needed',
    co_applicant_name: 'Please enter the co-applicant\'s name',
    co_applicant_salary: 'Please enter the co-applicant\'s monthly salary',
    co_applicant_relationship: 'Please specify the relationship to the student',
    co_applicant_pin_code: 'Please enter the co-applicant\'s PIN code',
  },
  
  // Format validation messages
  FORMAT: {
    student_name: 'Please enter at least 2 characters for the name',
    student_phone: 'Please enter a valid 10-digit mobile number (e.g., 9876543210)',
    student_email: 'Please enter a valid email address (e.g., name@email.com)',
    student_pin_code: 'Please enter a valid 6-digit PIN code (e.g., 110001)',
    co_applicant_pin_code: 'Please enter a valid 6-digit PIN code (e.g., 110001)',
    co_applicant_salary: 'Please enter a valid salary amount in numbers only',
  },
  
  // Range validation messages
  RANGE: {
    gmat_score: 'GMAT score should be between 200-800 (e.g., 650)',
    gre_score: 'GRE score should be between 260-340 (e.g., 320)', 
    toefl_score: 'TOEFL score should be between 0-120 (e.g., 100)',
    pte_score: 'PTE score should be between 10-90 (e.g., 65)',
    ielts_score: 'IELTS score should be between 0-9 (e.g., 7.5)',
    amount_requested: 'Please enter a loan amount between ₹1 lakh and ₹2 crores',
  }
};

// Document upload error messages
export const DOCUMENT_ERROR_MESSAGES = {
  FILE_TOO_LARGE: (maxSizeMB: number, fileType: 'PDF' | 'Image') => 
    `File is too large. Please choose a ${fileType.toLowerCase()} under ${maxSizeMB}MB (about ${fileType === 'PDF' ? '50 pages' : '10 photos'})`,
  
  UNSUPPORTED_FORMAT: (acceptedFormats: string[]) => {
    const formatList = acceptedFormats
      .map(format => format.toUpperCase())
      .join(', ');
    return `File type not supported. Please upload: ${formatList} files only`;
  },
  
  DUPLICATE_FILE: (filename: string) =>
    `A file named "${filename}" already exists. Please rename your file or choose a different one`,
    
  UPLOAD_FAILED: 'Unable to upload your file. Please check your internet connection and try again',
  
  PROCESSING_FAILED: 'File uploaded but couldn\'t be processed. Our team has been notified and will fix this shortly',
  
  FILE_CORRUPTED: 'This file appears to be corrupted or damaged. Please try with a different file',
  
  NETWORK_ERROR: 'Connection problem detected. Please check your internet and try uploading again',
  
  STORAGE_FULL: 'Upload limit reached. Please contact support or try removing some old files',
  
  PERMISSION_DENIED: 'You don\'t have permission to upload files here. Please contact support for help',
  
  LEAD_NOT_FOUND: 'This lead no longer exists. Please refresh the page and try again.',
  
  CONNECTION_LOST: 'Connection lost. Please check your internet and try again.',
  
  TIMEOUT_ERROR: 'Upload is taking too long. Try with a smaller file or check your connection.'
};

// Backend error message transformation
export const transformBackendError = (error: string | Error): string => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // Database errors
  if (errorMessage.includes('duplicate key')) {
    return 'This information already exists in our system. Please check and try again';
  }
  
  if (errorMessage.includes('foreign key')) {
    return 'Some required information is missing. Please fill all required fields';
  }
  
  if (errorMessage.includes('connection')) {
    return 'Unable to connect to our servers. Please check your internet and try again';
  }
  
  if (errorMessage.includes('timeout')) {
    return 'Request is taking too long. Please try again in a moment';
  }
  
  // Storage errors
  if (errorMessage.includes('storage')) {
    return 'Problem saving your file. Please try uploading again';
  }
  
  // Permission errors
  if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
    return 'You don\'t have permission to perform this action. Please contact support';
  }
  
  // Validation errors
  if (errorMessage.includes('validation')) {
    return 'Please check your information and make sure all required fields are filled correctly';
  }
  
  // Network/API errors
  if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
    return 'Network connection problem. Please check your internet and try again';
  }
  
  // File-specific errors
  if (errorMessage.includes('file size')) {
    return 'Your file is too large. Please choose a smaller file or compress it';
  }
  
  if (errorMessage.includes('file type') || errorMessage.includes('format')) {
    return 'File format not supported. Please choose a PDF or image file (JPG, PNG)';
  }
  
  // Generic fallback
  return 'Something went wrong. Please try again or contact support if the problem continues';
};

// Status display mapping
export const STATUS_DISPLAY = {
  // Lead statuses
  'new': { label: 'New Application', description: 'Application received and being reviewed' },
  'in_progress': { label: 'In Progress', description: 'Application is being processed' },
  'approved': { label: 'Approved', description: 'Congratulations! Your application has been approved' },
  'rejected': { label: 'Not Approved', description: 'Application requires additional documentation' },
  
  // Document statuses  
  'pending': { label: 'Documents Needed', description: 'Please upload the required documents' },
  'uploaded': { label: 'Documents Submitted', description: 'Documents received and under review' },
  'verified': { label: 'Documents Verified', description: 'All documents have been verified successfully' },
  
  // Loan types
  'secured': { label: 'Secured Loan', description: 'Loan backed by collateral for better rates' },
  'unsecured': { label: 'Unsecured Loan', description: 'Loan without collateral requirements' },
};

// Helper function to format file size in user-friendly way
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${size} ${sizes[i]}`;
};

// Helper to get user-friendly file type description
export const getFileTypeDescription = (acceptedFormats: string[]): string => {
  const descriptions: Record<string, string> = {
    'pdf': 'PDF documents',
    'jpg': 'JPG images', 
    'jpeg': 'JPEG images',
    'png': 'PNG images',
    'jfif': 'JFIF images',
    'webp': 'WebP images',
    'bmp': 'BMP images',
    'tiff': 'TIFF images'
  };
  
  const uniqueTypes = Array.from(new Set(
    acceptedFormats.map(format => {
      if (['jpg', 'jpeg', 'png', 'jfif', 'webp', 'bmp', 'tiff'].includes(format)) {
        return 'images';
      }
      return descriptions[format] || format.toUpperCase();
    })
  ));
  
  if (uniqueTypes.length === 1) {
    return uniqueTypes[0];
  }
  
  return uniqueTypes.join(' or ');
};

// Helper to suggest file size limits
export const getFileSizeGuidance = (maxSize: number, fileType: 'pdf' | 'image'): string => {
  const maxSizeMB = Math.round(maxSize / (1024 * 1024));
  
  if (fileType === 'pdf') {
    const approximatePages = Math.round(maxSizeMB * 5); // Rough estimate: 5 pages per MB
    return `Maximum ${maxSizeMB}MB (about ${approximatePages} pages)`;
  } else {
    const approximatePhotos = Math.round(maxSizeMB * 2); // Rough estimate: 2 photos per MB
    return `Maximum ${maxSizeMB}MB (about ${approximatePhotos} photos)`;
  }
};
