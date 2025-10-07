import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Clock, Shield, Users, CheckCircle, FileText, Search, ThumbsUp } from 'lucide-react';

interface EmptyStateHeroProps {
  onStartApplication: () => void;
}

export const EmptyStateHero = ({ onStartApplication }: EmptyStateHeroProps) => {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
          <GraduationCap className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold">Ready to Fund Your Dreams? 🎓</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Get matched with the best education loan options for your study abroad journey. Fast, simple, and transparent.
        </p>
        <Button onClick={onStartApplication} size="lg" className="mt-6">
          Get Started - Takes Only 10 Minutes
        </Button>
      </div>

      {/* Trust Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">500+</div>
            <div className="text-sm text-muted-foreground">Students Funded</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">₹50Cr+</div>
            <div className="text-sm text-muted-foreground">Loans Disbursed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">15+</div>
            <div className="text-sm text-muted-foreground">Partner Lenders</div>
          </CardContent>
        </Card>
      </div>

      {/* Process Timeline */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold mb-6 text-center">How It Works - 4 Simple Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center space-y-2">
              <div className="inline-block p-3 bg-primary/10 rounded-full mb-2">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="font-semibold">1. Fill Application</div>
              <div className="text-sm text-muted-foreground">
                Share your details and study plans (10 mins)
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="inline-block p-3 bg-primary/10 rounded-full mb-2">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="font-semibold">2. Upload Documents</div>
              <div className="text-sm text-muted-foreground">
                Submit required documents (5 mins)
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="inline-block p-3 bg-primary/10 rounded-full mb-2">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <div className="font-semibold">3. Get Matched</div>
              <div className="text-sm text-muted-foreground">
                We find the best lenders for you (1-2 days)
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="inline-block p-3 bg-primary/10 rounded-full mb-2">
                <ThumbsUp className="h-6 w-6 text-primary" />
              </div>
              <div className="font-semibold">4. Get Approved</div>
              <div className="text-sm text-muted-foreground">
                Receive your loan offer (3-5 days)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <Clock className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Fast Processing</h3>
            <p className="text-sm text-muted-foreground">
              Get matched with lenders within 48 hours. No waiting weeks for responses.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Users className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Multiple Options</h3>
            <p className="text-sm text-muted-foreground">
              Compare offers from 15+ lenders to find the best rates and terms for you.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Shield className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Expert Support</h3>
            <p className="text-sm text-muted-foreground">
              Our team guides you through every step, from application to disbursement.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
