import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Papa from 'papaparse';
import { parseCourseData, importCourses } from '@/utils/dataImport';
import { toast } from 'sonner';

export default function DataImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleImport = async () => {
    try {
      setIsImporting(true);
      setProgress(0);
      setStatus('Loading CSV file...');
      setResult(null);

      // Fetch the CSV file
      const response = await fetch('/src/data/Program_level_combined_output-5.csv');
      const csvText = await response.text();

      setStatus('Parsing CSV data...');
      
      // Parse CSV with PapaParse
      const parseResult = await new Promise<any>((resolve) => {
        Papa.parse(csvText, {
          complete: resolve,
          skipEmptyLines: true,
          encoding: 'UTF-8',
        });
      });

      if (!parseResult.data || parseResult.data.length === 0) {
        throw new Error('No data found in CSV file');
      }

      setStatus(`Extracted ${parseResult.data.length} rows from CSV`);
      console.log('CSV parsed:', parseResult.data.length, 'rows');

      // Parse the course data
      const courses = parseCourseData(parseResult.data);
      
      if (courses.length === 0) {
        throw new Error('No valid courses found after parsing');
      }

      console.log('Courses parsed:', courses.length);
      setStatus(`Parsed ${courses.length} courses. Starting import...`);

      // Import courses with progress tracking
      const importResult = await importCourses(
        courses,
        (progressValue, statusMessage) => {
          setProgress(progressValue);
          setStatus(statusMessage);
        }
      );

      setResult(importResult);
      
      if (importResult.errors > 0) {
        toast.warning('Import completed with errors', {
          description: `${importResult.success} courses imported, ${importResult.errors} errors`,
        });
      } else {
        toast.success('Import completed successfully!', {
          description: `${importResult.success} courses imported`,
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Import failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      setStatus('Import failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Course Data Import</CardTitle>
          <CardDescription>
            Import course data from Program_level_combined_output-5.csv
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isImporting && !result && (
            <Button onClick={handleImport} size="lg" className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              Start Import
            </Button>
          )}

          {isImporting && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
              
              <Alert>
                <AlertDescription>{status}</AlertDescription>
              </Alert>
              
              <p className="text-sm text-muted-foreground">
                This may take 5-10 minutes. Please keep this page open.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="font-medium">
                  Import Complete
                </AlertDescription>
              </Alert>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Courses Imported</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{result.success}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{result.total}</div>
                  </CardContent>
                </Card>

                {result.unmatchedUniversities.length > 0 && (
                  <Card className="sm:col-span-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        Unmatched Universities ({result.unmatchedUniversities.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground max-h-40 overflow-y-auto">
                        {result.unmatchedUniversities.slice(0, 20).join(', ')}
                        {result.unmatchedUniversities.length > 20 && '...'}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {result.errors > 0 && (
                  <Card className="sm:col-span-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Errors Encountered
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{result.errors}</div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                Import More Data
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
