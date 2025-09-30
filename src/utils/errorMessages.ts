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

// Authentication error messages
export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'The email or password you entered is incorrect. Please try again',
  USER_NOT_FOUND: 'No account found with this email. Please check your email or sign up',
  EMAIL_NOT_CONFIRMED: 'Please verify your email address. Check your inbox for the confirmation link',
  TOO_MANY_REQUESTS: 'Too many login attempts. Please wait a few minutes and try again',
  WEAK_PASSWORD: 'Password must be at least 8 characters with letters and numbers',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists. Try logging in instead',
  SESSION_EXPIRED: 'Your session has expired. Please log in again to continue',
  INVALID_TOKEN: 'Your login link has expired. Please request a new one',
  NETWORK_ERROR: 'Unable to connect to authentication servers. Check your internet connection',
  ACCOUNT_DISABLED: 'This account has been disabled. Please contact support for help',
  UNKNOWN_AUTH_ERROR: 'Unable to log you in right now. Please try again or contact support'
};

// Database error messages
export const DATABASE_ERROR_MESSAGES = {
  DUPLICATE_ENTRY: 'This record already exists in the system. Please check and try again',
  FOREIGN_KEY_VIOLATION: 'Unable to complete this action due to related data. Please contact support',
  NOT_FOUND: 'The requested information could not be found. It may have been deleted',
  CONSTRAINT_VIOLATION: 'This action would violate data rules. Please check your information',
  CONNECTION_ERROR: 'Unable to connect to the database. Please check your internet and try again',
  TIMEOUT: 'The operation is taking too long. Please try again',
  PERMISSION_DENIED: 'You don\'t have permission to access this data. Contact support if this is wrong',
  RLS_POLICY_VIOLATION: 'Security check failed. Please ensure you\'re logged in with the correct account',
  INVALID_INPUT: 'Some information you entered is invalid. Please check all fields',
  TRANSACTION_FAILED: 'Unable to complete the operation. Please try again',
  UNKNOWN_DB_ERROR: 'A database error occurred. Please try again or contact support'
};

// API/Network error messages
export const NETWORK_ERROR_MESSAGES = {
  NO_INTERNET: 'No internet connection detected. Please check your network and try again',
  TIMEOUT: 'The request timed out. Please check your connection and try again',
  SERVER_ERROR: 'Our servers are experiencing issues. Please try again in a few moments',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable. We\'re working to fix this',
  BAD_REQUEST: 'Invalid request. Please check your information and try again',
  NOT_FOUND: 'The requested resource was not found. It may have been moved or deleted',
  RATE_LIMIT: 'Too many requests. Please wait a moment and try again',
  CORS_ERROR: 'Unable to complete request due to security restrictions',
  UNKNOWN_NETWORK_ERROR: 'Network error occurred. Please check your connection and try again'
};

// Backend error message transformation
export const transformBackendError = (error: string | Error | any): string => {
  const errorMessage = typeof error === 'string' ? error : error?.message || '';
  const errorCode = error?.code || '';
  
  // Authentication errors
  if (errorMessage.includes('Invalid login credentials') || errorCode === 'invalid_credentials') {
    return AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS;
  }
  
  if (errorMessage.includes('User not found') || errorCode === 'user_not_found') {
    return AUTH_ERROR_MESSAGES.USER_NOT_FOUND;
  }
  
  if (errorMessage.includes('Email not confirmed') || errorMessage.includes('email_not_confirmed')) {
    return AUTH_ERROR_MESSAGES.EMAIL_NOT_CONFIRMED;
  }
  
  if (errorMessage.includes('too many requests') || errorCode === '429') {
    return AUTH_ERROR_MESSAGES.TOO_MANY_REQUESTS;
  }
  
  if (errorMessage.includes('weak password') || errorMessage.includes('password requirements')) {
    return AUTH_ERROR_MESSAGES.WEAK_PASSWORD;
  }
  
  if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
    return AUTH_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS;
  }
  
  if (errorMessage.includes('session') && errorMessage.includes('expired')) {
    return AUTH_ERROR_MESSAGES.SESSION_EXPIRED;
  }
  
  if (errorMessage.includes('invalid token') || errorMessage.includes('token expired')) {
    return AUTH_ERROR_MESSAGES.INVALID_TOKEN;
  }
  
  // Database-specific errors
  if (errorMessage.includes('duplicate key') || errorCode === '23505') {
    return DATABASE_ERROR_MESSAGES.DUPLICATE_ENTRY;
  }
  
  if (errorMessage.includes('foreign key') || errorCode === '23503') {
    return DATABASE_ERROR_MESSAGES.FOREIGN_KEY_VIOLATION;
  }
  
  if (errorMessage.includes('violates row-level security') || errorMessage.includes('RLS')) {
    return DATABASE_ERROR_MESSAGES.RLS_POLICY_VIOLATION;
  }
  
  if (errorMessage.includes('not found') && !errorMessage.includes('User')) {
    return DATABASE_ERROR_MESSAGES.NOT_FOUND;
  }
  
  if (errorMessage.includes('constraint') || errorCode === '23514') {
    return DATABASE_ERROR_MESSAGES.CONSTRAINT_VIOLATION;
  }
  
  if (errorMessage.includes('permission denied') || errorCode === '42501') {
    return DATABASE_ERROR_MESSAGES.PERMISSION_DENIED;
  }
  
  // Network/Connection errors
  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
    return NETWORK_ERROR_MESSAGES.NO_INTERNET;
  }
  
  if (errorMessage.includes('timeout') || errorCode === 'ETIMEDOUT') {
    return NETWORK_ERROR_MESSAGES.TIMEOUT;
  }
  
  if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
    return NETWORK_ERROR_MESSAGES.SERVER_ERROR;
  }
  
  if (errorMessage.includes('503') || errorMessage.includes('Service Unavailable')) {
    return NETWORK_ERROR_MESSAGES.SERVICE_UNAVAILABLE;
  }
  
  if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
    return NETWORK_ERROR_MESSAGES.BAD_REQUEST;
  }
  
  if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
    return NETWORK_ERROR_MESSAGES.NOT_FOUND;
  }
  
  if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
    return NETWORK_ERROR_MESSAGES.RATE_LIMIT;
  }
  
  if (errorMessage.includes('CORS')) {
    return NETWORK_ERROR_MESSAGES.CORS_ERROR;
  }
  
  // Storage errors
  if (errorMessage.includes('storage') || errorMessage.includes('bucket')) {
    return DOCUMENT_ERROR_MESSAGES.UPLOAD_FAILED;
  }
  
  // File-specific errors
  if (errorMessage.includes('file size') || errorMessage.includes('too large')) {
    return 'File is too large. Please compress it or choose a smaller file';
  }
  
  if (errorMessage.includes('file type') || errorMessage.includes('format')) {
    return 'File format not supported. Please use PDF, JPG, or PNG files';
  }
  
  if (errorMessage.includes('corrupted') || errorMessage.includes('invalid file')) {
    return DOCUMENT_ERROR_MESSAGES.FILE_CORRUPTED;
  }
  
  // Validation errors
  if (errorMessage.includes('validation') || errorMessage.includes('invalid input')) {
    return DATABASE_ERROR_MESSAGES.INVALID_INPUT;
  }
  
  // Generic fallback with original message if it's user-friendly
  if (errorMessage && errorMessage.length < 100 && !errorMessage.includes('Error:')) {
    return errorMessage;
  }
  
  // Final fallback
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
