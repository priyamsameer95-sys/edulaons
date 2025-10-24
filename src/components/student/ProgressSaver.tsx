import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Save, Clock } from 'lucide-react';

interface ProgressSaverProps {
  lastSaved?: Date;
  onSave?: () => void;
}

export const ProgressSaver = ({ lastSaved, onSave }: ProgressSaverProps) => {
  const [timeoutWarning, setTimeoutWarning] = useState(false);
  const [minutesRemaining, setMinutesRemaining] = useState(30);

  useEffect(() => {
    // Simulate session timeout warning at 25 minutes
    const warningTimer = setTimeout(() => {
      setTimeoutWarning(true);
    }, 25 * 60 * 1000);

    // Update countdown every minute
    const countdownInterval = setInterval(() => {
      setMinutesRemaining((prev) => Math.max(0, prev - 1));
    }, 60 * 1000);

    return () => {
      clearTimeout(warningTimer);
      clearInterval(countdownInterval);
    };
  }, []);

  const getTimeAgo = (date?: Date) => {
    if (!date) return 'Never';
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  };

  return (
    <>
      {/* Auto-save Indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground animate-fade-in">
        <Save className="h-3 w-3" />
        <span>Draft saved {getTimeAgo(lastSaved)}</span>
      </div>

      {/* Session Timeout Warning */}
      <AlertDialog open={timeoutWarning} onOpenChange={setTimeoutWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Session About to Expire
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your session will expire in {minutesRemaining} minutes due to inactivity.
              Click "Stay Logged In" to continue working on your application.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setTimeoutWarning(false)}>
              Stay Logged In
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
