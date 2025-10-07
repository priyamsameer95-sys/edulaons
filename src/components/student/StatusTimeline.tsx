import { CheckCircle, Circle, Clock, FileText, Search, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatusTimelineProps {
  status: string;
  documentsStatus: string;
  createdAt: string;
}

export const StatusTimeline = ({ status, documentsStatus, createdAt }: StatusTimelineProps) => {
  const getStageStatus = (stage: number): 'complete' | 'current' | 'pending' => {
    const statusMap: Record<string, number> = {
      'new': 1,
      'in_progress': 2,
      'approved': 4,
      'rejected': 4,
    };
    
    const currentStage = statusMap[status] || 1;
    
    if (stage < currentStage) return 'complete';
    if (stage === currentStage) return 'current';
    return 'pending';
  };

  const stages = [
    {
      title: 'Application Submitted',
      description: `We received your application on ${new Date(createdAt).toLocaleDateString()}`,
      icon: CheckCircle,
      stage: 1,
    },
    {
      title: 'Documents Upload',
      description: documentsStatus === 'verified' 
        ? 'All documents verified ✓' 
        : documentsStatus === 'uploaded'
        ? 'Documents under review'
        : 'Upload required documents (takes 5 mins)',
      icon: FileText,
      stage: 2,
    },
    {
      title: 'Under Review',
      description: 'Your application is being reviewed (typically takes 3-5 days)',
      icon: Search,
      stage: 3,
    },
    {
      title: status === 'approved' ? 'Approved!' : status === 'rejected' ? 'Decision' : 'Final Decision',
      description: status === 'approved' 
        ? 'Congratulations! Your loan is approved 🎉'
        : status === 'rejected'
        ? 'Application requires attention'
        : 'Waiting for final decision',
      icon: status === 'approved' ? CheckCircle : status === 'rejected' ? AlertCircle : Clock,
      stage: 4,
    },
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-6">Application Progress</h3>
        <div className="space-y-8">
          {stages.map((stage, index) => {
            const stageStatus = getStageStatus(stage.stage);
            const Icon = stage.icon;
            
            return (
              <div key={index} className="flex gap-4 relative">
                {/* Connector Line */}
                {index < stages.length - 1 && (
                  <div className={`absolute left-5 top-12 w-0.5 h-full ${
                    stageStatus === 'complete' ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
                
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  stageStatus === 'complete' 
                    ? 'bg-primary text-primary-foreground' 
                    : stageStatus === 'current'
                    ? 'bg-primary/20 text-primary border-2 border-primary'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                
                {/* Content */}
                <div className="flex-1 pb-8">
                  <div className="font-semibold">{stage.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {stage.description}
                  </div>
                  {stageStatus === 'current' && stage.stage === 2 && documentsStatus === 'pending' && (
                    <div className="mt-2 text-sm font-medium text-primary">
                      → Action Required: Upload documents now
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Estimated Time */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="text-sm font-medium mb-1">Estimated Time Remaining</div>
          <div className="text-sm text-muted-foreground">
            {status === 'new' && 'Complete your application and upload documents to proceed'}
            {status === 'in_progress' && 'Typically completed in 2-3 days'}
            {status === 'approved' && 'Application complete! 🎉'}
            {status === 'rejected' && 'Please contact support for next steps'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
