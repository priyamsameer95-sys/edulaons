import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Copy, Mail, Phone, MapPin, Calendar, Link2, Users, TrendingUp, CheckCircle, XCircle, Edit, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatRelativeTime } from '@/utils/formatters';

interface PartnerDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    partner_code: string;
    is_active: boolean;
    created_at: string;
  } | null;
  stats?: {
    totalLeads: number;
    activeLenders: number;
    recentActivity: string | null;
  };
  onEdit?: () => void;
  onViewLeads?: () => void;
}

export const PartnerDetailsSheet = ({
  open,
  onOpenChange,
  partner,
  stats,
  onEdit,
  onViewLeads,
}: PartnerDetailsSheetProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  if (!partner) return null;

  const dashboardUrl = `${window.location.origin}/partner/${partner.partner_code}`;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
      toast({ title: 'Copied!', description: `${label} copied to clipboard` });
    } catch {
      toast({ title: 'Copy Failed', variant: 'destructive' });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl">{partner.name}</SheetTitle>
            <Badge variant={partner.is_active ? 'default' : 'secondary'}>
              {partner.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <SheetDescription>
            Partner Code: <code className="bg-muted px-1.5 py-0.5 rounded">{partner.partner_code}</code>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Dashboard URL */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Dashboard URL</label>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-muted rounded-md px-3 py-2 text-sm truncate">
                {dashboardUrl}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(dashboardUrl, 'Dashboard URL')}
              >
                {copied === 'Dashboard URL' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Contact Information</h4>
            
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">{partner.email}</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                onClick={() => copyToClipboard(partner.email, 'Email')}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>

            {partner.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1">{partner.phone}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={() => copyToClipboard(partner.phone!, 'Phone')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}

            {partner.address && (
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="flex-1">{partner.address}</span>
              </div>
            )}

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Created {formatRelativeTime(partner.created_at)}</span>
            </div>
          </div>

          <Separator />

          {/* Stats */}
          {stats && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-lg font-semibold">{stats.totalLeads}</p>
                      <p className="text-xs text-muted-foreground">Total Leads</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-lg font-semibold">{stats.activeLenders}</p>
                      <p className="text-xs text-muted-foreground">Active Lenders</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {stats.recentActivity && (
                <p className="text-sm text-muted-foreground">
                  Last activity: {formatRelativeTime(stats.recentActivity)}
                </p>
              )}

              <Separator />
            </>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <Button className="w-full" variant="outline" onClick={onViewLeads}>
              <Eye className="mr-2 h-4 w-4" />
              View Partner's Leads
            </Button>
            <Button className="w-full" variant="outline" onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Partner Details
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
