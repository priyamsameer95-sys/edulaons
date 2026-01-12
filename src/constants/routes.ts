/**
 * Centralized route constants to eliminate hardcoded URLs
 * and prevent redirect chains from legacy paths.
 */
export const ROUTES = {
  // Login pages
  LOGIN: {
    STUDENT: '/login/student',
    PARTNER: '/login/partner',
    ADMIN: '/login', // Legacy admin login
  },
  
  // Dashboard pages
  DASHBOARD: {
    AUTO: '/dashboard', // Auto-routes based on role
    STUDENT: '/dashboard/student',
    ADMIN: '/dashboard/admin',
    PARTNER: (code: string) => `/partner/${code}`,
  },
  
  // Admin dashboard tabs
  ADMIN_TAB: {
    LEADS: '/dashboard/admin?tab=leads',
    PARTNERS: '/dashboard/admin?tab=partners',
    LENDERS: '/dashboard/admin?tab=lenders',
    DOCUMENTS: '/dashboard/admin?tab=documents',
    ANALYTICS: '/dashboard/admin?tab=analytics',
    USERS: '/dashboard/admin?tab=users',
    SETTINGS: '/dashboard/admin?tab=settings',
  },
  
  // Student pages
  STUDENT: {
    APPLY: '/student/apply',
    WELCOME: '/student/welcome',
  },
  
  // Partner pages
  PARTNER: {
    NEW_LEAD: (code: string) => `/partner/${code}/new-lead`,
    DOCUMENTS: (code: string, leadId: string) => `/partner/${code}/lead/${leadId}/documents`,
    PUBLIC: (code: string) => `/public/partner/${code}`,
  },
} as const;
