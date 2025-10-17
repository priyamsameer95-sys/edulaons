import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { SUPABASE_PROJECT_ID } from './cleanupConstants';

export function StorageCleanupStep() {
  const openStorageBucket = () => {
    window.open(
      `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/storage/buckets/lead-documents`,
      '_blank'
    );
  };

  return (
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
        <Button onClick={openStorageBucket} variant="outline">
          Open Storage Bucket
        </Button>
      </CardContent>
    </Card>
  );
}
