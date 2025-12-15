// Shared utilities for lead tables and displays
import { differenceInDays } from 'date-fns';
import type { PaginatedLead } from '@/hooks/usePaginatedLeads';

/**
 * Format currency amount to Indian notation
 */
export function formatLoanAmount(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Get age in days from a date string
 */
export function getAgeDays(createdAt: string): number {
  return differenceInDays(new Date(), new Date(createdAt));
}

/**
 * Get color class based on lead age
 */
export function getAgeColor(createdAt: string): string {
  const days = getAgeDays(createdAt);
  if (days < 3) return 'text-green-600';
  if (days < 7) return 'text-amber-600';
  if (days < 30) return 'text-orange-600';
  return 'text-red-600 font-semibold';
}

/**
 * Check if lead is urgent (needs immediate attention)
 */
export function isLeadUrgent(lead: PaginatedLead): boolean {
  return (
    lead.documents_status === 'rejected' ||
    lead.documents_status === 'resubmission_required'
  );
}

/**
 * Check if lead needs admin action
 */
export function needsAdminAction(lead: PaginatedLead): { needed: boolean; reason: string } {
  if (lead.status === 'new') {
    return { needed: true, reason: 'New lead - needs contact' };
  }
  if (lead.documents_status === 'uploaded') {
    return { needed: true, reason: 'Documents need verification' };
  }
  if (lead.documents_status === 'resubmission_required') {
    return { needed: true, reason: 'Re-submitted docs need review' };
  }
  return { needed: false, reason: '' };
}
