import { useEffect, useState } from 'react';
import { Sparkles, Trophy, Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CelebrationConfettiProps {
  show: boolean;
  onClose: () => void;
  achievement?: {
    icon: string;
    title: string;
    description: string;
    xpReward: number;
  };
}

export const CelebrationConfetti = ({
  show,
  onClose,
  achievement,
}: CelebrationConfettiProps) => {
  const [confettiPieces, setConfettiPieces] = useState<Array<{ id: number; left: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    if (show) {
      // Generate confetti pieces
      const pieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
      }));
      setConfettiPieces(pieces);
    }
  }, [show]);

  if (!achievement) return null;

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="max-w-md overflow-hidden">
        {/* Confetti Animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {confettiPieces.map((piece) => (
            <div
              key={piece.id}
              className="absolute w-3 h-3 rounded-full animate-fall"
              style={{
                left: `${piece.left}%`,
                top: '-10px',
                backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
                animationDelay: `${piece.delay}s`,
                animationDuration: `${piece.duration}s`,
              }}
            />
          ))}
        </div>

        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-primary/20 to-purple-500/20 blur-3xl animate-pulse" />

        <DialogHeader className="relative z-10">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Achievement Icon with Animation */}
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-500/30 rounded-full blur-xl animate-pulse" />
              <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 flex items-center justify-center border-4 border-yellow-500/30 animate-bounce">
                <span className="text-6xl">{achievement.icon}</span>
              </div>
              <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-500 animate-spin" />
              <Star className="absolute -bottom-1 -left-1 h-5 w-5 text-yellow-500 animate-pulse" />
            </div>

            {/* Achievement Info */}
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">
                <Trophy className="h-3 w-3 mr-1" />
                Achievement Unlocked!
              </Badge>
              
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-500 bg-clip-text text-transparent">
                {achievement.title}
              </DialogTitle>
              
              <p className="text-muted-foreground">
                {achievement.description}
              </p>

              {/* XP Reward */}
              <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-bold text-primary">+{achievement.xpReward} XP</span>
              </div>
            </div>

            {/* Motivational Message */}
            <div className="p-4 rounded-lg bg-muted/30 border">
              <p className="text-sm font-medium">
                🎉 Keep crushing it! You're amazing!
              </p>
            </div>

            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
            >
              Awesome! Let's Continue
            </Button>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

// Add custom animation to index.css for falling confetti
