import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Mail, 
  Phone, 
  MapPin, 
  ExternalLink,
  FileText,
  CheckCircle,
  TrendingUp,
  Users,
  Building
} from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import PublicLayout from "@/components/layouts/PublicLayout";

interface Partner {
  id: string;
  name: string;
  partner_code: string;
  email: string;
  phone?: string;
  address?: string;
  is_active: boolean;
}

interface PartnerStats {
  totalLeads: number;
  activeLeads: number;
  successRate: string;
}

const PublicPartner = () => {
  const { partnerCode } = useParams();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPartnerData = async () => {
      if (!partnerCode) {
        setError('Partner code is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch partner details
        const { data: partnerData, error: partnerError } = await supabase
          .from('partners')
          .select('*')
          .eq('partner_code', partnerCode)
          .eq('is_active', true)
          .single();

        if (partnerError) {
          setError('Partner not found');
          return;
        }

        setPartner(partnerData);

        // Fetch partner statistics
        const { data: leads, error: leadsError } = await supabase
          .from('leads_new')
          .select('status')
          .eq('partner_id', partnerData.id);

        if (!leadsError && leads) {
          const totalLeads = leads.length;
          const activeLeads = leads.filter(lead => 
            lead.status === 'new' || lead.status === 'in_progress'
          ).length;
          const approvedLeads = leads.filter(lead => 
            lead.status === 'approved'
          ).length;
          const successRate = totalLeads > 0 
            ? ((approvedLeads / totalLeads) * 100).toFixed(1)
            : '0';

          setStats({
            totalLeads,
            activeLeads,
            successRate
          });
        }

      } catch (error) {
        console.error('Error fetching partner data:', error);
        setError('Failed to load partner information');
      } finally {
        setLoading(false);
      }
    };

    fetchPartnerData();
  }, [partnerCode]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-6 py-12 max-w-4xl">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !partner) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-6 py-12 text-center">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-destructive mb-4">Partner Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The partner you're looking for doesn't exist or is no longer active.
            </p>
            <Link to="/login">
              <Button>Go to Login</Button>
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building className="h-8 w-8 text-primary" />
            <Badge variant="secondary" className="text-sm">
              Partner Code: {partner.partner_code}
            </Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4">{partner.name}</h1>
          <p className="text-xl text-muted-foreground">
            Your trusted education loan partner
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Total Applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{stats.totalLeads}</div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Active Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-warning">{stats.activeLeads}</div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">{stats.successRate}%</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Contact Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription>
              Get in touch with our education loan specialists
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">{partner.email}</span>
            </div>
            {partner.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{partner.phone}</span>
              </div>
            )}
            {partner.address && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{partner.address}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center bg-muted/50 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Your Application?</h2>
          <p className="text-muted-foreground mb-6">
            Contact {partner.name} today to begin your education loan journey
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <a href={`mailto:${partner.email}`}>
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </a>
            </Button>
            {partner.phone && (
              <Button size="lg" variant="outline" asChild>
                <a href={`tel:${partner.phone}`}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call Now
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Powered by Education Loan Platform
          </p>
        </div>
      </div>
    </PublicLayout>
  );
};

export default PublicPartner;