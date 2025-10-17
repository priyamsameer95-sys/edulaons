import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EMAILS_TO_DELETE } from './cleanupConstants';
import { CleanupResults } from './CleanupResults';

interface AuthUsersCleanupStepProps {
  sqlExecuted: boolean;
}

export function AuthUsersCleanupStep({ sqlExecuted }: AuthUsersCleanupStepProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleExecuteCleanup = async () => {
    if (!sqlExecuted) {
      toast.error('Please run the SQL cleanup script first (Step 1)');
      return;
    }

    try {
      setIsExecuting(true);
      setResults(null);

      const { data, error } = await supabase.functions.invoke('cleanup-auth-users', {
        body: {
          emails: EMAILS_TO_DELETE,
          dry_run: false
        }
      });

      if (error) throw error;

      setResults(data);
      
      if (data.success) {
        toast.success(`Successfully deleted ${data.deleted} auth users`);
      } else {
        toast.error('Cleanup completed with errors');
      }
    } catch (error) {
      console.error('Cleanup error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to execute cleanup');
      setResults({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {results?.success ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          )}
          Step 2: Delete Auth Users
        </CardTitle>
        <CardDescription>
          Permanently delete 6 auth users (except Super Admin)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            This will permanently delete the following auth users:
          </AlertDescription>
        </Alert>

        <ul className="space-y-1 text-sm">
          {EMAILS_TO_DELETE.map((email) => (
            <li key={email} className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              {email}
            </li>
          ))}
        </ul>

        <Button
          onClick={handleExecuteCleanup}
          disabled={!sqlExecuted || isExecuting}
          variant="destructive"
          className="w-full"
        >
          {isExecuting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Executing Cleanup...
            </>
          ) : (
            'Execute Auth User Cleanup'
          )}
        </Button>

        {!sqlExecuted && (
          <p className="text-sm text-muted-foreground">
            ⚠️ Please complete Step 1 first before running this step
          </p>
        )}

        {results && <CleanupResults results={results} />}
      </CardContent>
    </Card>
  );
}
