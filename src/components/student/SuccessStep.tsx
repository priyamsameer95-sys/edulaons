import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SuccessStepProps {
  caseId: string;
  recommendedLenders: Array<{
    lender_id: string;
    lender_name: string;
    lender_code: string;
    compatibility_score: number;
    is_preferred: boolean;
  }>;
}

const SuccessStep = ({ caseId, recommendedLenders }: SuccessStepProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 pb-8">
      {/* Success Icon and Message */}
      <div className="text-center space-y-6 animate-fade-in">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-success/10 animate-scale-in">
          <CheckCircle2 className="h-14 w-14 text-success animate-scale-in" style={{ animationDelay: '100ms' }} />
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent animate-fade-in" style={{ animationDelay: '200ms' }}>
            Application Submitted Successfully!
          </h2>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg border border-border/50 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <p className="text-sm text-muted-foreground">Your Case ID:</p>
            <span className="font-mono font-semibold text-lg text-foreground">{caseId}</span>
          </div>
        </div>
      </div>

      {/* Recommended Lenders Card */}
      <Card className="border-2 transition-shadow hover:shadow-lg animate-fade-in" style={{ animationDelay: '400ms' }}>
        <CardHeader className="space-y-2 pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-5 w-5 text-primary" />
            Recommended Lenders
          </CardTitle>
          <CardDescription className="text-base">
            Based on your profile, we recommend these lenders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recommendedLenders && recommendedLenders.length > 0 ? (
            recommendedLenders.map((lender, index) => (
              <div 
                key={lender.lender_id} 
                className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 border border-border rounded-lg transition-all hover:scale-[1.02] animate-fade-in"
                style={{ animationDelay: `${500 + index * 100}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">{lender.lender_name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-sm text-muted-foreground">
                        Match Score: <span className="font-semibold text-foreground">{lender.compatibility_score}%</span>
                      </p>
                      {lender.is_preferred && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/10 text-success text-xs font-medium rounded-full border border-success/20">
                          ✓ Preferred
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 px-4 bg-muted/20 rounded-lg border border-dashed border-border">
              <Building2 className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">
                Our team will recommend suitable lenders based on your profile
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Steps */}
      <div className="text-center space-y-5 animate-fade-in" style={{ animationDelay: '600ms' }}>
        <div className="max-w-md mx-auto p-4 bg-primary/5 border border-primary/10 rounded-lg">
          <p className="text-sm text-muted-foreground leading-relaxed">
            📋 Next, upload your documents in the <span className="font-semibold text-foreground">Checklist tab</span> to complete your application
          </p>
        </div>
        <Button 
          onClick={() => navigate('/student')} 
          size="lg"
          className="px-8 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default SuccessStep;
