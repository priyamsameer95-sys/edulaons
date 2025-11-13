import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle,
  Bell,
  Upload,
  ClipboardCheck,
  Users,
  FileCheck,
  TrendingUp,
} from 'lucide-react';
import { ProcessStepCard } from './ProcessStepCard';

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
  totalLeads = 0,
}: ProcessFlowGuideProps) => {
  const steps = [
    { stepNumber: 1, icon: CheckCircle, title: 'Lead Created' },
    { stepNumber: 2, icon: Bell, title: 'Student Notified' },
    { stepNumber: 3, icon: Upload, title: 'Upload Docs' },
    { stepNumber: 4, icon: ClipboardCheck, title: 'RM Verifies' },
    { stepNumber: 5, icon: Users, title: 'Coordination' },
    { stepNumber: 6, icon: FileCheck, title: 'File Logged' },
    { stepNumber: 7, icon: TrendingUp, title: 'Processing' },
  ];

  // Only show for partners with fewer than 5 leads (onboarding helper)
  if (totalLeads > 5) {
    return null;
  }

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        {/* Simple Header */}
        <div className="text-sm text-muted-foreground mb-4 text-center">
          Process Flow: Lead → Student → Documents → Verification → Coordination → Submission → Approval
        </div>

        {/* Desktop Layout: Single Row */}
        <div className="hidden md:grid md:grid-cols-7 gap-3">
          {steps.map((step) => (
            <ProcessStepCard
              key={step.stepNumber}
              {...step}
              isActive={step.stepNumber === currentStep}
              isCompleted={completedSteps.includes(step.stepNumber)}
            />
          ))}
        </div>

        {/* Tablet Layout: Two Rows */}
        <div className="hidden sm:grid md:hidden grid-cols-4 gap-3">
          {steps.map((step) => (
            <ProcessStepCard
              key={step.stepNumber}
              {...step}
              isActive={step.stepNumber === currentStep}
              isCompleted={completedSteps.includes(step.stepNumber)}
            />
          ))}
        </div>

        {/* Mobile Layout: Horizontal Scroll */}
        <div className="sm:hidden overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {steps.map((step) => (
              <div key={step.stepNumber} className="w-24">
                <ProcessStepCard
                  {...step}
                  isActive={step.stepNumber === currentStep}
                  isCompleted={completedSteps.includes(step.stepNumber)}
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
