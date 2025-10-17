import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function DatabaseCleanupPanel() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [sqlExecuted, setSqlExecuted] = useState(false);

  const emailsToDelete = [
    'priyam.sameer.95@gmail.com',
    'riddhi@cashkaro.com',
    'mohsinfd@gmail.com',
    'priyam.sameer.khet@gmail.com',
    'kartik@cashkaro.com',
    'shahrukh.khan@cashkaro.com'
  ];

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
          emails: emailsToDelete,
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
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Database Cleanup</h1>
        <p className="text-muted-foreground">Execute the complete database cleanup process</p>
      </div>

      {/* Step 1: SQL Cleanup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {sqlExecuted ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            )}
            Step 1: Run SQL Cleanup Script
          </CardTitle>
          <CardDescription>
            Delete all database records except Super Admin, universities, and courses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Open the Supabase SQL Editor and execute the SQL script provided below.
              This will delete all students, partners, lenders, leads, and related data.
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-4 rounded-md overflow-x-auto">
            <pre className="text-sm">
{`BEGIN;

-- Nullify Super Admin's partner_id
UPDATE public.app_users 
SET partner_id = NULL 
WHERE id = '01675fb4-4255-474d-bba7-824956bf3d27';

-- Delete lead-related data
DELETE FROM public.lead_documents;
DELETE FROM public.lead_universities;
DELETE FROM public.academic_tests;
DELETE FROM public.application_activities;
DELETE FROM public.application_comments;
DELETE FROM public.lead_status_history;
DELETE FROM public.lender_assignment_history;
DELETE FROM public.eligibility_scores;
DELETE FROM public.leads_new;
DELETE FROM public.co_applicants;
DELETE FROM public.students;
DELETE FROM public.lenders;
DELETE FROM public.partners;

-- Delete app_users except Super Admin
DELETE FROM public.app_users 
WHERE id != '01675fb4-4255-474d-bba7-824956bf3d27';
DELETE FROM public.user_roles 
WHERE user_id != '01675fb4-4255-474d-bba7-824956bf3d27';

-- Clean audit tables
DELETE FROM public.admin_security_audit;
DELETE FROM public.data_access_logs;
DELETE FROM public.activity_completions;
DELETE FROM public.notifications;
DELETE FROM public.auth_error_logs;

COMMIT;`}
            </pre>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={() => window.open('https://supabase.com/dashboard/project/cdcoukzjumcfwskkcxkr/sql/new', '_blank')}
              variant="default"
            >
              Open SQL Editor
            </Button>
            <Button
              onClick={() => setSqlExecuted(true)}
              variant={sqlExecuted ? "outline" : "secondary"}
            >
              {sqlExecuted ? 'SQL Executed ✓' : 'Mark as Executed'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Auth Users Cleanup */}
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
            {emailsToDelete.map((email) => (
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

          {results && (
            <div className="mt-4 p-4 border rounded-md">
              <h4 className="font-semibold mb-2">Cleanup Results:</h4>
              <div className="space-y-1 text-sm">
                <p>Total Processed: {results.total_processed}</p>
                <p className="text-green-600">✓ Deleted: {results.deleted}</p>
                <p className="text-red-600">✗ Failed: {results.failed}</p>
                <p className="text-yellow-600">⚠ Protected: {results.protected}</p>
              </div>

              {results.details && results.details.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-semibold mb-2">Details:</h5>
                  <ul className="space-y-1 text-sm">
                    {results.details.map((detail: any, idx: number) => (
                      <li key={idx} className="flex items-center gap-2">
                        {detail.status === 'deleted' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        {detail.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
                        {detail.status === 'protected' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                        <span>{detail.email} - {detail.status}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 3: Storage Cleanup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Step 3: Clean Storage Bucket (Manual)
          </CardTitle>
          <CardDescription>
            Delete all files from the lead-documents bucket
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => window.open('https://supabase.com/dashboard/project/cdcoukzjumcfwskkcxkr/storage/buckets/lead-documents', '_blank')}
            variant="outline"
          >
            Open Storage Bucket
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
