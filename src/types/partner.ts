// Centralized Partner type definitions

export interface Partner {
  id: string;
  name: string;
  partner_code: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PartnerKPIs {
  totalLeads: number;
  inPipeline: number;
  sanctioned: number;
  sanctionedAmount: number;
  disbursed: number;
}

export interface PartnerStats extends Partner {
  lead_count: number;
  last_activity?: string | null;
  // Extended fields for admin dashboard
  totalLeads?: number;
  activeLenders?: number;
  recentActivity?: string | null;
}
