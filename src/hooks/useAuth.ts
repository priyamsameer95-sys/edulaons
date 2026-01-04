/**
 * useAuth hook - now a thin wrapper around AuthContext
 * 
 * This hook provides authentication state and methods.
 * All auth logic is centralized in AuthProvider (singleton pattern).
 */
import { useAuthContext, AppUser } from '@/context/AuthContext';

export type { AppUser };

export function useAuth() {
  return useAuthContext();
}
