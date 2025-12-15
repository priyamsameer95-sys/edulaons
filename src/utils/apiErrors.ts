/**
 * Centralized API Error Handling with Consistent Copy & Colours
 * 
 * COPY SYSTEM:
 * - Success (Green): "Partner added successfully." / "Lead added successfully."
 * - Duplicate/Conflict (Red): "This email ID already exists in the system. Please use a different email ID."
 * - Validation (Amber): "Please enter a valid email address." / "This field cannot be empty."
 * - Permission (Red): "You do not have permission to perform this action."
 * 
 * COLOUR SYSTEM:
 * - Success: Green (only after backend confirmation)
 * - Error/Blocking: Red (duplicate, permission denied, role conflict)
 * - Warning/Validation: Amber (format issues, missing fields)
 * - Loading: Grey/Blue (disable submit while processing)
 */

export type ErrorType = 'duplicate' | 'validation' | 'permission' | 'network' | 'server' | 'unknown';

export interface ApiError {
  type: ErrorType;
  message: string;
  field?: string;
  code?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  fieldErrors?: Record<string, string>;
}

// Standard error messages - user-friendly copy
export const ERROR_COPY = {
  // Duplicate/Conflict errors (Red)
  EMAIL_EXISTS: 'This email ID already exists in the system. Please use a different email ID.',
  EMAIL_EXISTS_AS_STUDENT: 'This email is already registered as a student account. Please use a different email ID.',
  EMAIL_EXISTS_AS_PARTNER: 'This email is already registered as a partner account. Please use a different email ID.',
  EMAIL_EXISTS_AS_ADMIN: 'This email is already registered as an admin account. Please use a different email ID.',
  EMAIL_PROTECTED: 'This email is reserved for system use and cannot be used.',
  PARTNER_CODE_EXISTS: 'This partner code already exists. Please choose a different code.',
  DUPLICATE_APPLICATION: 'You already have an active application for this intake and destination.',
  
  // Permission errors (Red)
  NO_PERMISSION: 'You do not have permission to perform this action.',
  UNAUTHORIZED: 'Please log in to continue.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  ACCOUNT_INACTIVE: 'Your account is inactive. Please contact support.',
  
  // Validation errors (Amber)
  REQUIRED_FIELD: 'This field cannot be empty.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PHONE: 'Please enter a valid 10-digit phone number.',
  INVALID_PIN_CODE: 'Please enter a valid 6-digit PIN code.',
  WEAK_PASSWORD: 'Password must be at least 8 characters long.',
  INVALID_PARTNER_CODE: 'Partner code must contain only lowercase letters and numbers.',
  MISSING_FIELDS: 'Please fill in all required fields.',
  
  // Network/Server errors (Red)
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
  SERVER_ERROR: 'Something went wrong. Please try again later.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  
  // Generic
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

// Success messages (Green)
export const SUCCESS_COPY = {
  PARTNER_CREATED: 'Partner added successfully.',
  LEAD_CREATED: 'Lead added successfully.',
  USER_CREATED: 'User added successfully.',
  UPDATED: 'Changes saved successfully.',
  DELETED: 'Removed successfully.',
} as const;

/**
 * Parse API error response and return user-friendly message
 */
export function parseApiError(error: unknown): ApiError {
  if (typeof error === 'string') {
    return mapErrorMessage(error);
  }
  
  if (error instanceof Error) {
    return mapErrorMessage(error.message);
  }
  
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    
    // Try to extract nested error message from various structures
    const message = extractErrorMessage(err);
    if (message) {
      return mapErrorMessage(message);
    }
  }
  
  return {
    type: 'unknown',
    message: ERROR_COPY.UNKNOWN_ERROR,
  };
}

/**
 * Extract error message from various response structures
 */
function extractErrorMessage(obj: Record<string, unknown>): string | null {
  // Direct properties
  const directProps = ['message', 'error', 'msg', 'detail', 'details'];
  for (const prop of directProps) {
    if (typeof obj[prop] === 'string' && obj[prop]) {
      return obj[prop] as string;
    }
  }
  
  // Nested error object
  if (typeof obj.error === 'object' && obj.error !== null) {
    const nestedError = obj.error as Record<string, unknown>;
    for (const prop of directProps) {
      if (typeof nestedError[prop] === 'string' && nestedError[prop]) {
        return nestedError[prop] as string;
      }
    }
  }
  
  // Context object (Supabase FunctionsHttpError structure)
  if (typeof obj.context === 'object' && obj.context !== null) {
    const context = obj.context as Record<string, unknown>;
    if (typeof context.error === 'string') {
      return context.error;
    }
  }
  
  return null;
}

/**
 * Map raw error message to user-friendly copy
 */
function mapErrorMessage(rawMessage: string): ApiError {
  const msg = rawMessage.toLowerCase();
  
  // Email exists with specific role - check for role-specific patterns first
  if (msg.includes('as student') || (msg.includes('student') && msg.includes('email'))) {
    return {
      type: 'duplicate',
      message: ERROR_COPY.EMAIL_EXISTS_AS_STUDENT,
      field: 'email',
      code: 'EMAIL_EXISTS_AS_STUDENT',
    };
  }
  
  if (msg.includes('as partner') || (msg.includes('partner') && msg.includes('email') && msg.includes('exists'))) {
    return {
      type: 'duplicate',
      message: ERROR_COPY.EMAIL_EXISTS_AS_PARTNER,
      field: 'email',
      code: 'EMAIL_EXISTS_AS_PARTNER',
    };
  }
  
  if (msg.includes('as admin') || (msg.includes('admin') && msg.includes('email') && msg.includes('exists'))) {
    return {
      type: 'duplicate',
      message: ERROR_COPY.EMAIL_EXISTS_AS_ADMIN,
      field: 'email',
      code: 'EMAIL_EXISTS_AS_ADMIN',
    };
  }
  
  // Protected/reserved email
  if (msg.includes('reserved') || msg.includes('protected')) {
    return {
      type: 'duplicate',
      message: ERROR_COPY.EMAIL_PROTECTED,
      field: 'email',
      code: 'EMAIL_PROTECTED',
    };
  }
  
  // Generic email exists patterns
  if (
    msg.includes('email already exists') ||
    msg.includes('email id already exists') ||
    msg.includes('already registered') ||
    msg.includes('email is already in use') ||
    msg.includes('cannot be reused for another role')
  ) {
    return {
      type: 'duplicate',
      message: ERROR_COPY.EMAIL_EXISTS,
      field: 'email',
      code: 'EMAIL_EXISTS',
    };
  }
  
  // Partner code exists
  if (msg.includes('partner code already exists') || msg.includes('code already exists')) {
    return {
      type: 'duplicate',
      message: ERROR_COPY.PARTNER_CODE_EXISTS,
      field: 'partnerCode',
      code: 'PARTNER_CODE_EXISTS',
    };
  }
  
  // Duplicate application
  if (msg.includes('already have an active application') || msg.includes('duplicate application')) {
    return {
      type: 'duplicate',
      message: ERROR_COPY.DUPLICATE_APPLICATION,
      code: 'DUPLICATE_APPLICATION',
    };
  }
  
  // Permission errors
  if (msg.includes('permission') || msg.includes('not authorized') || msg.includes('forbidden')) {
    return {
      type: 'permission',
      message: ERROR_COPY.NO_PERMISSION,
      code: 'NO_PERMISSION',
    };
  }
  
  if (msg.includes('unauthorized') || msg.includes('must be logged in')) {
    return {
      type: 'permission',
      message: ERROR_COPY.UNAUTHORIZED,
      code: 'UNAUTHORIZED',
    };
  }
  
  if (msg.includes('inactive') || msg.includes('deactivated')) {
    return {
      type: 'permission',
      message: ERROR_COPY.ACCOUNT_INACTIVE,
      code: 'ACCOUNT_INACTIVE',
    };
  }
  
  // Validation errors
  if (msg.includes('missing') && msg.includes('field')) {
    return {
      type: 'validation',
      message: ERROR_COPY.MISSING_FIELDS,
      code: 'MISSING_FIELDS',
    };
  }
  
  if (msg.includes('invalid email') || msg.includes('email format')) {
    return {
      type: 'validation',
      message: ERROR_COPY.INVALID_EMAIL,
      field: 'email',
      code: 'INVALID_EMAIL',
    };
  }
  
  if (msg.includes('password') && (msg.includes('weak') || msg.includes('8 character') || msg.includes('too short'))) {
    return {
      type: 'validation',
      message: ERROR_COPY.WEAK_PASSWORD,
      field: 'password',
      code: 'WEAK_PASSWORD',
    };
  }
  
  // Network errors
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection')) {
    return {
      type: 'network',
      message: ERROR_COPY.NETWORK_ERROR,
      code: 'NETWORK_ERROR',
    };
  }
  
  if (msg.includes('timeout')) {
    return {
      type: 'network',
      message: ERROR_COPY.TIMEOUT_ERROR,
      code: 'TIMEOUT_ERROR',
    };
  }
  
  // Server errors
  if (msg.includes('internal server') || msg.includes('500')) {
    return {
      type: 'server',
      message: ERROR_COPY.SERVER_ERROR,
      code: 'SERVER_ERROR',
    };
  }
  
  // If message is already user-friendly (starts with capital, no technical jargon), use it
  if (/^[A-Z]/.test(rawMessage) && !msg.includes('error:') && rawMessage.length < 150) {
    return {
      type: 'unknown',
      message: rawMessage,
    };
  }
  
  // Default
  return {
    type: 'unknown',
    message: ERROR_COPY.UNKNOWN_ERROR,
  };
}

/**
 * Get toast variant based on error type
 * Returns: 'destructive' for errors, 'default' for warnings
 */
export function getToastVariant(errorType: ErrorType): 'destructive' | 'default' {
  switch (errorType) {
    case 'validation':
      return 'default'; // Amber/warning style
    case 'duplicate':
    case 'permission':
    case 'network':
    case 'server':
    case 'unknown':
    default:
      return 'destructive'; // Red/error style
  }
}

/**
 * Normalize email: trim + lowercase
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Validate phone number (10-digit Indian mobile)
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 && /^[6-9]/.test(cleaned);
}

/**
 * Validate PIN code (6-digit Indian postal code)
 */
export function isValidPinCode(pinCode: string): boolean {
  const cleaned = pinCode.replace(/\D/g, '');
  return cleaned.length === 6 && /^[1-9]/.test(cleaned);
}

/**
 * Check if value is empty or whitespace-only
 */
export function isEmpty(value: string | undefined | null): boolean {
  return !value || value.trim().length === 0;
}
