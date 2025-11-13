import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProcessStepCard } from './ProcessStepCard';
import { ProTipsSection } from './ProTipsSection';
import {
  CheckCircle,
  Bell,
  Upload,
  ClipboardCheck,
  Users,
  FileCheck,
  TrendingUp,
} from 'lucide-react';

interface ProcessFlowGuideProps {
  leadId?: string;
  currentStep?: number;
  completedSteps?: number[];
  partnerName?: string;
  onActionClick?: (action: string) => void;
  variant?: 'default' | 'compact';
  totalLeads?: number;
}

export const ProcessFlowGuide = ({
  currentStep = 1,
  completedSteps = [],
  partnerName,
  onActionClick,
  totalLeads = 0,
}: ProcessFlowGuideProps) => {
  const steps = [
    {
      stepNumber: 1,
      icon: CheckCircle,
      title: 'Lead Submitted Successfully',
      description: 'Your lead is now in our system and assigned to a dedicated RM',
      timeline: 'Just now',
      trustElement: 'Instantly processed',
    },
    {
      stepNumber: 2,
      icon: Bell,
      title: 'Student Receives Welcome Email',
      description: 'Automatic notification sent with next steps and document checklist',
      timeline: 'Within 5 minutes',
      trustElement: 'Automated • Tracked delivery',
    },
    {
      stepNumber: 3,
      icon: Upload,
      title: 'Documents Upload',
      description: 'RM, partner, or student can upload documents directly on the dashboard',
      timeline: '1-3 days',
      ctaLabel: 'Upload Documents',
      trustElement: 'Secure upload',
    },
    {
      stepNumber: 4,
      icon: ClipboardCheck,
      title: 'RM Reviews & Verifies',
      description: 'Our expert RM checks all documents for completeness and accuracy',
      timeline: 'Within 24 hours',
      trustElement: '100% accuracy guarantee',
    },
    {
      stepNumber: 5,
      icon: Users,
      title: 'Multi-Party Coordination',
      description: 'RM coordinates between student, partner, and lender for seamless processing',
      timeline: '2-5 days',
      trustElement: 'Daily status updates • WhatsApp support',
    },
    {
      stepNumber: 6,
      icon: FileCheck,
      title: 'Application Submitted to Lender',
      description: 'Complete application package logged with the lender system',
      timeline: 'Same day',
      trustElement: 'Lender reference number provided',
    },
    {
      stepNumber: 7,
      icon: TrendingUp,
      title: 'Lender Processing',
      description: 'Lender reviews application and moves toward sanction and disbursal',
      timeline: '7-14 days',
      trustElement: 'Real-time tracking • RM follows up daily',
    },
  ];

  const handleCtaClick = (stepNumber: number) => {
    if (onActionClick) {
      const actions: Record<number, string> = {
        3: 'upload_documents',
      };
      onActionClick(actions[stepNumber] || 'unknown');
    }
  };

  // Only show for partners with fewer than 5 leads (onboarding helper)
  if (totalLeads > 5) {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background shadow-lg">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="inline-flex items-center gap-2 mx-auto">
            <span className="text-4xl">🎉</span>
            <h2 className="text-3xl font-bold">
              Welcome{partnerName ? `, ${partnerName}` : ''}! Here's What Happens Next
            </h2>
          </div>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Thank you for submitting the lead. Our Relationship Manager will connect with you{' '}
            <span className="font-semibold text-primary">within 2 hours</span> to begin the journey.
          </p>
          
          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Badge variant="outline" className="gap-2 py-2 px-4">
              <span>✓</span>
              <span>2-hour response guarantee</span>
            </Badge>
            <Badge variant="outline" className="gap-2 py-2 px-4">
              <span>✓</span>
              <span>98% success rate</span>
            </Badge>
            <Badge variant="outline" className="gap-2 py-2 px-4">
              <span>✓</span>
              <span>24/7 RM support</span>
            </Badge>
          </div>
        </CardHeader>

        {/* Process Steps */}
        <CardContent className="px-6 pb-8">
          {/* Desktop: Horizontal Layout */}
          <div className="hidden lg:grid lg:grid-cols-7 gap-4 relative">
            {/* Connecting lines */}
            <div className="absolute top-12 left-0 right-0 h-0.5 bg-border -z-10" />
            
            {steps.map((step) => (
              <ProcessStepCard
                key={step.stepNumber}
                {...step}
                isActive={currentStep === step.stepNumber}
                isCompleted={completedSteps.includes(step.stepNumber)}
                onCtaClick={step.ctaLabel ? () => handleCtaClick(step.stepNumber) : undefined}
              />
            ))}
          </div>

          {/* Tablet: 2 rows */}
          <div className="hidden md:grid lg:hidden grid-cols-4 gap-4">
            {steps.slice(0, 4).map((step) => (
              <ProcessStepCard
                key={step.stepNumber}
                {...step}
                isActive={currentStep === step.stepNumber}
                isCompleted={completedSteps.includes(step.stepNumber)}
                onCtaClick={step.ctaLabel ? () => handleCtaClick(step.stepNumber) : undefined}
              />
            ))}
            <div className="col-span-4 grid grid-cols-3 gap-4 mt-4">
              {steps.slice(4).map((step) => (
                <ProcessStepCard
                  key={step.stepNumber}
                  {...step}
                  isActive={currentStep === step.stepNumber}
                  isCompleted={completedSteps.includes(step.stepNumber)}
                  onCtaClick={step.ctaLabel ? () => handleCtaClick(step.stepNumber) : undefined}
                />
              ))}
            </div>
          </div>

          {/* Mobile: Vertical Timeline */}
          <div className="md:hidden space-y-4 relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border -z-10" />
            {steps.map((step) => (
              <ProcessStepCard
                key={step.stepNumber}
                {...step}
                isActive={currentStep === step.stepNumber}
                isCompleted={completedSteps.includes(step.stepNumber)}
                onCtaClick={step.ctaLabel ? () => handleCtaClick(step.stepNumber) : undefined}
              />
            ))}
          </div>

          {/* Timeline Summary */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Average Timeline:</span> 14 days to disbursal
            </p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-muted-foreground">
                Your progress will be tracked in real-time
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pro Tips Section */}
      <ProTipsSection
        onUploadClick={() => onActionClick?.('upload_documents')}
        onPayoutsClick={() => onActionClick?.('view_payouts')}
      />
    </div>
  );
};
