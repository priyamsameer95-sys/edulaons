import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, Mail, Phone, MapPin, CheckCircle, Edit, Eye, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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

  const formatLastActivity = (dateStr: string | null) => {
    if (!dateStr) return 'No activity yet';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Active today';
    if (diffDays === 1) return 'Active yesterday';
    if (diffDays < 7) return `Active ${diffDays} days ago`;
    if (diffDays < 30) return `Active ${Math.floor(diffDays / 7)} weeks ago`;
    return `Active ${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader className="pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <SheetTitle className="text-lg font-semibold">{partner.name}</SheetTitle>
              <p className="text-sm text-muted-foreground font-mono">{partner.partner_code}</p>
            </div>
            <Badge 
              variant={partner.is_active ? 'default' : 'secondary'}
              className={partner.is_active ? 'bg-green-500/10 text-green-600 border-green-200' : ''}
            >
              {partner.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </SheetHeader>

        <div className="space-y-5">
          {/* Contact Information */}
          <div className="space-y-3">
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-2.5 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate max-w-[220px]">{partner.email}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyToClipboard(partner.email, 'Email')}
              >
                {copied === 'Email' ? (
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>

            {partner.phone && (
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2.5 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{partner.phone}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => copyToClipboard(partner.phone!, 'Phone')}
                >
                  {copied === 'Phone' ? (
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            )}

            {partner.address && (
              <div className="flex items-center gap-2.5 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{partner.address}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Stats Row */}
          {stats && (
            <>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/50 rounded-lg text-sm">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-medium">{stats.totalLeads} Leads</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  {formatLastActivity(stats.recentActivity)}
                </span>
              </div>
              <Separator />
            </>
          )}

          {/* Partner Since */}
          <p className="text-sm text-muted-foreground">
            Partner since {format(new Date(partner.created_at), 'MMM yyyy')}
          </p>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              className="flex-1" 
              variant="outline" 
              size="sm"
              onClick={onViewLeads}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              View Leads
            </Button>
            <Button 
              className="flex-1" 
              variant="outline" 
              size="sm"
              onClick={onEdit}
            >
              <Edit className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
