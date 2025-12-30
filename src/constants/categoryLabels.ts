/**
 * Centralized Category Labels
 * 
 * Single source of truth for document category labels.
 * Keys are LOWERCASE to match database values.
 * This prevents underscore leaks in UI text.
 */

import { formatDisplayText } from '@/utils/formatters';

// Category labels - keys match database lowercase values
export const CATEGORY_LABELS: Record<string, string> = {
  student: 'Student Documents',
  financial_co_applicant: 'Financial Co-Applicant',
  non_financial_co_applicant: 'Non-Financial Co-Applicant',
  nri_financial: 'NRI Financial Documents',
  collateral: 'Collateral & Property',
  kyc: 'Student KYC',
  academic: 'Academic Documents',
  financial: 'Financial Documents',
  'co-applicant': 'Co-Applicant Documents',
};

// Category colors - keys match database lowercase values
export const CATEGORY_COLORS: Record<string, {
  bg: string;
  border: string;
  text: string;
  accent: string;
  progressBg: string;
  progressFill: string;
}> = {
  student: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    accent: 'bg-blue-500',
    progressBg: 'bg-blue-100 dark:bg-blue-900',
    progressFill: 'bg-blue-500'
  },
  financial_co_applicant: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    accent: 'bg-emerald-500',
    progressBg: 'bg-emerald-100 dark:bg-emerald-900',
    progressFill: 'bg-emerald-500'
  },
  nri_financial: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-700 dark:text-purple-300',
    accent: 'bg-purple-500',
    progressBg: 'bg-purple-100 dark:bg-purple-900',
    progressFill: 'bg-purple-500'
  },
  non_financial_co_applicant: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    accent: 'bg-amber-500',
    progressBg: 'bg-amber-100 dark:bg-amber-900',
    progressFill: 'bg-amber-500'
  },
  collateral: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-700 dark:text-orange-300',
    accent: 'bg-orange-500',
    progressBg: 'bg-orange-100 dark:bg-orange-900',
    progressFill: 'bg-orange-500'
  }
};

export const DEFAULT_CATEGORY_COLORS = {
  bg: 'bg-slate-50 dark:bg-slate-950/30',
  border: 'border-slate-200 dark:border-slate-800',
  text: 'text-slate-700 dark:text-slate-300',
  accent: 'bg-slate-500',
  progressBg: 'bg-slate-100 dark:bg-slate-900',
  progressFill: 'bg-slate-500'
};

/**
 * Get category label with safe fallback
 * Auto-formats unknown keys using formatDisplayText
 */
export function getCategoryLabel(category: string | null | undefined): string {
  if (!category) return 'Other';
  const normalized = category.toLowerCase();
  return CATEGORY_LABELS[normalized] || formatDisplayText(category);
}

/**
 * Get category colors with safe fallback
 */
export function getCategoryColors(category: string | null | undefined) {
  if (!category) return DEFAULT_CATEGORY_COLORS;
  const normalized = category.toLowerCase();
  return CATEGORY_COLORS[normalized] || DEFAULT_CATEGORY_COLORS;
}
