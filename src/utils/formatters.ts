import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * Shared formatting utilities
 */

export const formatCurrency = (amount: number, currency = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: string | Date, format: 'short' | 'long' = 'short'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'long') {
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  
  return d.toLocaleDateString('en-IN');
};

export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as Indian phone number: +91 XXXXX XXXXX
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  
  return phone;
};

// New formatters
export const formatPercentage = (value: number, decimals = 0): string => 
  `${value.toFixed(decimals)}%`;

export const formatLakhs = (value: number): string => 
  `₹${(value / 100000).toFixed(2)}L`;

export const formatCrores = (value: number): string => 
  `₹${(value / 10000000).toFixed(2)}Cr`;

export const formatCompactCurrency = (value: number): string => {
  if (value >= 10000000) return formatCrores(value);
  if (value >= 100000) return formatLakhs(value);
  return formatCurrency(value);
};

export const formatTrend = (value: number) => ({
  value: `${value > 0 ? '+' : ''}${value}%`,
  color: value > 0 ? 'text-green-600' : 'text-red-600',
  Icon: value > 0 ? ArrowUpRight : ArrowDownRight,
  isPositive: value > 0
});

export const formatRelativeTime = (date: string | Date): string => 
  formatDistanceToNow(new Date(date), { addSuffix: true });

export const formatNumber = (value: number): string => 
  new Intl.NumberFormat('en-IN').format(value);

// Placeholder email patterns - system-generated when real email is not available
const PLACEHOLDER_EMAIL_PATTERNS = [
  '@temp.placeholder',
  '@quick.placeholder',
  '@student.placeholder',
  '@student.loan.app',
  '@lead.',
];

/**
 * Check if an email is a system-generated placeholder
 */
export function isPlaceholderEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const lowerEmail = email.toLowerCase();
  return PLACEHOLDER_EMAIL_PATTERNS.some(pattern => lowerEmail.includes(pattern));
}

/**
 * Format email for display - shows user-friendly text for placeholders
 */
export function formatDisplayEmail(email: string | null | undefined): {
  display: string;
  isPlaceholder: boolean;
  extractedPhone?: string;
} {
  if (!email) {
    return { display: 'Not provided', isPlaceholder: false };
  }
  
  if (isPlaceholderEmail(email)) {
    const phone = email.split('@')[0];
    return {
      display: `No email (Phone: ${phone})`,
      isPlaceholder: true,
      extractedPhone: phone,
    };
  }
  
  return { display: email, isPlaceholder: false };
}

/**
 * Validate email format - returns error message or null if valid
 * Blocks placeholder email patterns from being saved
 */
export function validateEmail(email: string | null | undefined): string | null {
  if (!email || email.trim() === '') {
    return null; // Empty is allowed (optional field)
  }
  
  // Block placeholder patterns
  if (isPlaceholderEmail(email)) {
    return 'Please enter a real email address';
  }
  
  // Standard email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email format';
  }
  
  return null; // Valid
}
