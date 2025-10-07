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
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
        <div>
          <h2 className="text-2xl font-bold">Application Submitted Successfully!</h2>
          <p className="text-muted-foreground mt-2">Your Case ID: <span className="font-mono font-semibold">{caseId}</span></p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recommended Lenders</CardTitle>
          <CardDescription>
            Based on your profile, we recommend these lenders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendedLenders && recommendedLenders.length > 0 ? (
            recommendedLenders.map((lender) => (
              <div key={lender.lender_id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">{lender.lender_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Match Score: {lender.compatibility_score}%
                      {lender.is_preferred && <span className="ml-2 text-green-600">• Preferred</span>}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground">
              Our team will recommend suitable lenders based on your profile
            </p>
          )}
        </CardContent>
      </Card>

      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Next, upload your documents in the Checklist tab to complete your application
        </p>
        <Button onClick={() => navigate('/student')} size="lg">
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default SuccessStep;
