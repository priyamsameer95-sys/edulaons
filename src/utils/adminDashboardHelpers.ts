import { RefactoredLead } from '@/types/refactored-lead';
import type { LeadStatus, DocumentStatus } from '@/utils/statusUtils';

/**
 * Format number as Indian Rupee currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Get status color for lead status
 */
export const getStatusColor = (status: LeadStatus): string => {
  const colors: Partial<Record<LeadStatus, string>> = {
    new: 'hsl(var(--primary))',
    in_progress: 'hsl(var(--warning))',
    approved: 'hsl(var(--success))',
    rejected: 'hsl(var(--destructive))',
    contacted: 'hsl(var(--info))',
    document_review: 'hsl(var(--warning))',
    withdrawn: 'hsl(var(--muted))',
  };
  return colors[status] || 'hsl(var(--muted-foreground))';
};

/**
 * Get status background class for UI styling
 */
export const getStatusBgClass = (status: string): string => {
  const classes: Record<string, string> = {
    new: 'bg-primary',
    in_progress: 'bg-warning',
    approved: 'bg-success',
    rejected: 'bg-destructive',
  };
  return classes[status] || 'bg-muted';
};

/**
 * Get document status color class
 */
export const getDocStatusColor = (status: DocumentStatus): string => {
  const colors: Partial<Record<DocumentStatus, string>> = {
    pending: 'text-warning',
    verified: 'text-success',
    rejected: 'text-destructive',
    uploaded: 'text-info',
    resubmission_required: 'text-warning',
  };
  return colors[status] || 'text-muted-foreground';
};

/**
 * Status distribution chart data structure
 */
export interface StatusChartData {
  name: string;
  value: number;
  color: string;
}

/**
 * Calculate status distribution for chart visualization
 */
export const calculateStatusDistribution = (leads: RefactoredLead[]): StatusChartData[] => {
  const statusCounts: Record<string, number> = {};
  
  leads.forEach(lead => {
    statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
  });

  const statusColors: Record<string, string> = {
    'new': 'hsl(var(--primary))',
    'in_progress': 'hsl(var(--warning))',
    'approved': 'hsl(var(--success))',
    'rejected': 'hsl(var(--destructive))',
    'contacted': 'hsl(var(--info))',
    'document_review': 'hsl(var(--warning))',
    'withdrawn': 'hsl(var(--muted))',
  };

  return Object.entries(statusCounts).map(([status, count]) => ({
    name: status.replace('_', ' ').toUpperCase(),
    value: count,
    color: statusColors[status] || 'hsl(var(--muted-foreground))'
  }));
};

/**
 * Calculate document status distribution
 */
export const calculateDocumentStatusCounts = (leads: RefactoredLead[]): Record<string, number> => {
  return leads.reduce((acc, lead) => {
    acc[lead.documents_status] = (acc[lead.documents_status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

/**
 * Calculate status breakdown by category
 */
export const calculateStatusBreakdown = (leads: RefactoredLead[], totalLeads: number) => {
  const statusCounts = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusOrder = ['new', 'in_progress', 'approved', 'rejected'];
  const statusLabels: Record<string, string> = {
    new: 'New',
    in_progress: 'In Progress',
    approved: 'Approved',
    rejected: 'Rejected'
  };

  return statusOrder.map((status) => {
    const count = statusCounts[status] || 0;
    const percentage = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
    
    return {
      status,
      label: statusLabels[status],
      count,
      percentage,
    };
  });
};

/**
 * Partner statistics data structure
 */
export interface PartnerStats {
  id: string;
  name: string;
  partner_code: string;
  totalLeads: number;
  activeLenders: number;
  recentActivity: string;
}

/**
 * Top partner data structure
 */
export interface TopPartnerData {
  name: string;
  total_leads: number;
  percentage: number;
}

/**
 * Calculate top partner from partner statistics
 */
export const calculateTopPartner = (partnerStats: PartnerStats[]): TopPartnerData | null => {
  if (partnerStats.length === 0) return null;

  const topPartner = partnerStats.reduce((max, partner) => 
    partner.totalLeads > max.totalLeads ? partner : max
  );
  
  const totalLeads = partnerStats.reduce((sum, partner) => sum + partner.totalLeads, 0);
  
  return {
    name: topPartner.name,
    total_leads: topPartner.totalLeads,
    percentage: totalLeads > 0 ? Math.round((topPartner.totalLeads / totalLeads) * 100) : 0
  };
};

/**
 * Generate leaderboard data from partner stats
 * Returns top 5 partners sorted by total leads
 */
export const generateLeaderboardData = (partnerStats: PartnerStats[]) => {
  return partnerStats
    .map(partner => ({
      id: partner.id,
      name: partner.name,
      totalLeads: partner.totalLeads,
      // Mock conversion rate calculation
      conversionRate: Math.min(Math.round((partner.totalLeads * 0.7) + Math.random() * 20), 95),
      rank: 0,
    }))
    .sort((a, b) => b.totalLeads - a.totalLeads)
    .map((partner, index) => ({ ...partner, rank: index + 1 }))
    .slice(0, 5);
};
