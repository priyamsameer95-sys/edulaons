import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, Bell, DollarSign } from 'lucide-react';

interface ProTipsSectionProps {
  onUploadClick?: () => void;
  onPayoutsClick?: () => void;
}

export const ProTipsSection = ({ onUploadClick, onPayoutsClick }: ProTipsSectionProps) => {
  const tips = [
    {
      icon: Zap,
      title: '⚡ Speed Up Processing',
      items: [
        'Upload documents within 24 hours for fastest processing',
        'Complete profile = 50% faster approval',
      ],
      action: 'Upload Documents',
      onClick: onUploadClick,
    },
    {
      icon: Bell,
      title: '📱 Stay Updated',
      items: [
        'Enable notifications for instant status updates',
        'RM available on WhatsApp for quick questions',
      ],
      action: 'Get Support',
      onClick: () => window.open('https://wa.me/your-number', '_blank'),
    },
    {
      icon: DollarSign,
      title: '💰 Track Earnings',
      items: [
        'View commission breakdown in Payouts tab',
        'Earn bonuses for on-time document submission',
      ],
      action: 'View Payouts',
      onClick: onPayoutsClick,
    },
  ];

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4 text-center">💡 Pro Tips</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tips.map((tip, index) => {
          const Icon = tip.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-all hover:border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  {tip.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="text-xs text-muted-foreground space-y-2">
                  {tip.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                {tip.onClick && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={tip.onClick}
                  >
                    {tip.action}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
