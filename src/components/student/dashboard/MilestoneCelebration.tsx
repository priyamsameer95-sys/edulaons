import { useEffect, useState } from "react";
import { CheckCircle2, PartyPopper, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MilestoneCelebrationProps {
  status: string;
  onDismiss: () => void;
}

export const MilestoneCelebration = ({ status, onDismiss }: MilestoneCelebrationProps) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (status === "approved") {
      setShowConfetti(true);
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status, onDismiss]);

  if (!visible || status !== "approved") return null;

  return (
    <>
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div
                className={cn(
                  "w-2 h-2 md:w-3 md:h-3 rounded-sm",
                  i % 5 === 0 && "bg-primary",
                  i % 5 === 1 && "bg-amber-400",
                  i % 5 === 2 && "bg-emerald-400",
                  i % 5 === 3 && "bg-blue-400",
                  i % 5 === 4 && "bg-pink-400"
                )}
              />
            </div>
          ))}
        </div>
      )}

      {/* Celebration Card */}
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-scale-in text-center">
          <div className="relative inline-flex mb-4">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 h-6 w-6 text-amber-400 animate-pulse" />
            <PartyPopper className="absolute -bottom-1 -left-1 h-6 w-6 text-primary animate-bounce" />
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Congratulations! 🎉
          </h2>
          <p className="text-muted-foreground mb-6">
            Your education loan has been approved! The next step is to complete the disbursement process.
          </p>

          <div className="space-y-3">
            <Button className="w-full" size="lg" onClick={onDismiss}>
              View Next Steps
            </Button>
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
