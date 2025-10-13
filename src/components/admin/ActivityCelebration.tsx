import { useEffect, useState } from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ActivityCelebrationProps {
  show: boolean;
  onClose: () => void;
  activityType?: string;
  impactAmount?: number;
}

export const ActivityCelebration = ({
  show,
  onClose,
  activityType = 'activity',
  impactAmount
}: ActivityCelebrationProps) => {
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number }>>([]);

  useEffect(() => {
    if (show) {
      // Generate confetti pieces
      const pieces = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5
      }));
      setConfetti(pieces);

      // Auto-close after 3 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  const getMessage = () => {
    if (activityType === 'document_pending') {
      return 'Document verified! 🎉';
    }
    if (activityType === 'status_change') {
      return 'Status updated! 🚀';
    }
    if (activityType === 'new_lead') {
      return 'Lead contacted! 💪';
    }
    return 'Action completed! ✨';
  };

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-0 bg-gradient-to-br from-primary/10 via-background to-success/10">
        <div className="relative overflow-hidden">
          {/* Confetti */}
          {confetti.map((piece) => (
            <div
              key={piece.id}
              className="absolute w-2 h-2 bg-primary rounded-full animate-fall"
              style={{
                left: `${piece.left}%`,
                animationDelay: `${piece.delay}s`,
                top: '-10px'
              }}
            />
          ))}

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative">
              <CheckCircle className="h-20 w-20 text-success animate-scale-in" />
              <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-warning animate-spin-in" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-primary via-success to-primary bg-clip-text text-transparent">
                {getMessage()}
              </h3>
              
              {impactAmount && (
                <p className="text-sm text-muted-foreground">
                  Impact: ₹{(impactAmount / 100000).toFixed(1)}L secured
                </p>
              )}

              <p className="text-sm font-medium text-primary">
                +10 XP earned!
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
