import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { CLEANUP_SQL, SUPABASE_PROJECT_ID } from './cleanupConstants';

interface SqlCleanupStepProps {
  sqlExecuted: boolean;
  onMarkExecuted: () => void;
}

export function SqlCleanupStep({ sqlExecuted, onMarkExecuted }: SqlCleanupStepProps) {
  const openSqlEditor = () => {
    window.open(`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new`, '_blank');
  };

  return (
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
          <pre className="text-sm">{CLEANUP_SQL}</pre>
        </div>

        <div className="flex items-center gap-4">
          <Button onClick={openSqlEditor} variant="default">
            Open SQL Editor
          </Button>
          <Button
            onClick={onMarkExecuted}
            variant={sqlExecuted ? "outline" : "secondary"}
          >
            {sqlExecuted ? 'SQL Executed ✓' : 'Mark as Executed'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
