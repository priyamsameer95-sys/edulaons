import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, Clock, User, Calendar, Phone, Building2, AlertTriangle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface LeadMetadata {
  id: string;
  case_id: string;
  created_at: string;
  updated_at: string;
  created_by_role?: string | null;
  created_by_user_id?: string | null;
  current_stage_started_at?: string | null;
  status: string;
  status_updated_at?: string | null;
  lan_number?: string | null;
  sanction_amount?: number | null;
  sanction_date?: string | null;
  sanction_letter_date?: string | null;
  pd_call_status?: string | null;
  pd_call_scheduled_at?: string | null;
  property_verification_status?: string | null;
  case_complexity?: string | null;
  loan_type?: string;
  is_quick_lead?: boolean | null;
  quick_lead_completed_at?: string | null;
  source?: string | null;
}

interface Partner {
  id: string;
  name: string;
  partner_code: string;
}

interface LeadMetadataCardProps {
  lead: LeadMetadata;
  partner?: Partner | null;
  createdByEmail?: string | null;
}

export function LeadMetadataCard({ lead, partner, createdByEmail }: LeadMetadataCardProps) {
  const getRoleBadgeColor = (role: string | null | undefined) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'partner': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'student': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getComplexityBadge = (complexity: string | null | undefined) => {
    switch (complexity?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTATDuration = () => {
    if (!lead.current_stage_started_at) return null;
    try {
      return formatDistanceToNow(new Date(lead.current_stage_started_at), { addSuffix: false });
    } catch {
      return null;
    }
  };

  const tatDuration = getTATDuration();
  const isSecuredLoan = lead.loan_type === 'secured';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Info className="h-4 w-4" />
          Admin Metadata
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Creation Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Created By</p>
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <Badge className={getRoleBadgeColor(lead.created_by_role)}>
                {lead.created_by_role || 'Unknown'}
              </Badge>
            </div>
            {createdByEmail && (
              <p className="text-xs text-muted-foreground truncate">{createdByEmail}</p>
            )}
          </div>
          
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Source</p>
            <p className="text-sm font-medium">{lead.source || (lead.is_quick_lead ? 'Quick Lead' : 'Standard')}</p>
          </div>
          
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Created At</p>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-sm font-medium">{format(new Date(lead.created_at), 'dd MMM yyyy, h:mm a')}</p>
            </div>
          </div>
          
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Last Updated</p>
            <p className="text-sm font-medium">{format(new Date(lead.updated_at), 'dd MMM yyyy, h:mm a')}</p>
          </div>
        </div>

        {/* Partner Info */}
        {partner && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-1.5 mb-2">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Partner</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{partner.name}</p>
              <Badge variant="outline" className="text-xs">{partner.partner_code}</Badge>
            </div>
          </div>
        )}

        {/* TAT Tracking */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">TAT Tracking</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Current Stage Since</p>
              <p className="text-sm font-medium">
                {lead.current_stage_started_at 
                  ? format(new Date(lead.current_stage_started_at), 'dd MMM yyyy')
                  : '—'}
              </p>
            </div>
            {tatDuration && (
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Time in Stage</p>
                <p className="text-sm font-medium">{tatDuration}</p>
              </div>
            )}
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Case Complexity</p>
              {lead.case_complexity ? (
                <Badge className={getComplexityBadge(lead.case_complexity)}>
                  {lead.case_complexity}
                </Badge>
              ) : (
                <p className="text-sm font-medium">—</p>
              )}
            </div>
          </div>
        </div>

        {/* Sanction Info (if available) */}
        {(lead.lan_number || lead.sanction_amount) && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">Sanction Details</p>
            <div className="grid grid-cols-2 gap-3">
              {lead.lan_number && (
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">LAN Number</p>
                  <p className="text-sm font-medium font-mono">{lead.lan_number}</p>
                </div>
              )}
              {lead.sanction_amount && (
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Sanction Amount</p>
                  <p className="text-sm font-medium">₹{lead.sanction_amount.toLocaleString('en-IN')}</p>
                </div>
              )}
              {lead.sanction_date && (
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Sanction Date</p>
                  <p className="text-sm font-medium">{format(new Date(lead.sanction_date), 'dd MMM yyyy')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PD Call Status */}
        {(lead.pd_call_status || lead.pd_call_scheduled_at) && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-1.5 mb-2">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">PD Call</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant="outline">{lead.pd_call_status || 'Not Scheduled'}</Badge>
              </div>
              {lead.pd_call_scheduled_at && (
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Scheduled</p>
                  <p className="text-sm font-medium">{format(new Date(lead.pd_call_scheduled_at), 'dd MMM yyyy, h:mm a')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Property Verification (for secured loans) */}
        {isSecuredLoan && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Property Verification</span>
            </div>
            <Badge variant={lead.property_verification_status === 'verified' ? 'default' : 'outline'}>
              {lead.property_verification_status || 'Pending'}
            </Badge>
          </div>
        )}

        {/* Quick Lead Info */}
        {lead.is_quick_lead && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Quick Lead</Badge>
              {lead.quick_lead_completed_at && (
                <span className="text-xs text-muted-foreground">
                  Completed {format(new Date(lead.quick_lead_completed_at), 'dd MMM yyyy')}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
