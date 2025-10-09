/**
 * Role checking utilities for consistent role validation across the application
 * Centralizes all role-based authorization logic
 */

export type AppRole = 'partner' | 'admin' | 'super_admin' | 'student';

/**
 * Check if user has admin role (either admin or super_admin)
 */
export const isAdmin = (role?: string | null): boolean => {
  return role === 'admin' || role === 'super_admin';
};

/**
 * Check if user has super admin role
 */
export const isSuperAdmin = (role?: string | null): boolean => {
  return role === 'super_admin';
};

/**
 * Check if user has partner role
 */
export const isPartner = (role?: string | null): boolean => {
  return role === 'partner';
};

/**
 * Check if user has student role
 */
export const isStudent = (role?: string | null): boolean => {
  return role === 'student';
};

/**
 * Check if user can perform admin actions (admin or super_admin)
 */
export const canPerformAdminActions = (role?: string | null): boolean => {
  return isAdmin(role);
};

/**
 * Check if user can manage other admins (only super_admin)
 */
export const canManageAdmins = (role?: string | null): boolean => {
  return isSuperAdmin(role);
};

/**
 * Check if user can manage partners
 */
export const canManagePartners = (role?: string | null): boolean => {
  return isAdmin(role);
};

/**
 * Check if user can manage users (create, update, deactivate)
 */
export const canManageUsers = (role?: string | null): boolean => {
  return isAdmin(role);
};

/**
 * Type guard to narrow role type to admin or super_admin
 */
export const assertAdminRole = (role?: string | null): role is 'admin' | 'super_admin' => {
  return isAdmin(role);
};

/**
 * Get role display name
 */
export const getRoleDisplayName = (role?: string | null): string => {
  switch (role) {
    case 'super_admin':
      return 'Super Admin';
    case 'admin':
      return 'Admin';
    case 'partner':
      return 'Partner';
    case 'student':
      return 'Student';
    default:
      return 'Unknown';
  }
};

/**
 * Get role badge variant
 */
export const getRoleBadgeVariant = (role?: string | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (role) {
    case 'super_admin':
      return 'destructive';
    case 'admin':
      return 'default';
    case 'partner':
      return 'secondary';
    default:
      return 'outline';
  }
};
