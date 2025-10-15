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
