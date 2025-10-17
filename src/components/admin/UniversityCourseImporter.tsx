import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ImportOptions {
  skipExistingUniversities: boolean;
  skipDuplicateCourses: boolean;
  defaultCountry: string;
  defaultCity: string;
}

interface ImportSummary {
  success: boolean;
  summary: {
    universitiesCreated: number;
    universitiesSkipped: number;
    coursesCreated: number;
    coursesFailed: number;
    totalProcessed: number;
  };
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  processingTime: number;
}

export function UniversityCourseImporter() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [options, setOptions] = useState<ImportOptions>({
    skipExistingUniversities: true,
    skipDuplicateCourses: true,
    defaultCountry: 'Not Specified',
    defaultCity: 'Not Specified',
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        setResult(null);
      }
    },
  });

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);
    setResult(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 90));
      }, 500);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('options', JSON.stringify(options));

      const { data, error } = await supabase.functions.invoke('import-university-courses', {
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) {
        throw error;
      }

      setResult(data as ImportSummary);

      if (data.success) {
        toast({
          title: 'Import Completed Successfully!',
          description: `Created ${data.summary.coursesCreated} courses and ${data.summary.universitiesCreated} universities`,
        });
      } else {
        toast({
          title: 'Import Failed',
          description: 'Some errors occurred during import. Check the error log below.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadErrorLog = () => {
    if (!result?.errors.length) return;

    const csv = [
      ['Row', 'Field', 'Message'].join(','),
      ...result.errors.map((error) =>
        [error.row, error.field, `"${error.message}"`].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import-errors.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    setProgress(0);
  };

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload University & Course Data</CardTitle>
          <CardDescription>
            Upload a CSV file containing university and course information. The file should include columns:
            university_name, degree, stream_name, program_name, study_level, etc.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!file ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                {isDragActive ? 'Drop your file here' : 'Drag & drop your CSV file here'}
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse (Max 50MB, CSV format)
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={clearFile} disabled={importing}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Options */}
      {file && !result && (
        <Card>
          <CardHeader>
            <CardTitle>Import Options</CardTitle>
            <CardDescription>Configure how the import should handle data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="skip-universities" className="flex-1">
                Skip Existing Universities
                <p className="text-sm text-muted-foreground font-normal">
                  Don't create universities that already exist in the database
                </p>
              </Label>
              <Switch
                id="skip-universities"
                checked={options.skipExistingUniversities}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, skipExistingUniversities: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="skip-duplicates" className="flex-1">
                Skip Duplicate Courses
                <p className="text-sm text-muted-foreground font-normal">
                  Skip courses that already exist for a university
                </p>
              </Label>
              <Switch
                id="skip-duplicates"
                checked={options.skipDuplicateCourses}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, skipDuplicateCourses: checked })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default-country">Default Country</Label>
                <Input
                  id="default-country"
                  value={options.defaultCountry}
                  onChange={(e) => setOptions({ ...options, defaultCountry: e.target.value })}
                  placeholder="Not Specified"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default-city">Default City</Label>
                <Input
                  id="default-city"
                  value={options.defaultCity}
                  onChange={(e) => setOptions({ ...options, defaultCity: e.target.value })}
                  placeholder="Not Specified"
                />
              </div>
            </div>

            <Button
              onClick={handleImport}
              disabled={importing}
              className="w-full"
              size="lg"
            >
              {importing ? 'Importing...' : 'Start Import'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      {importing && (
        <Card>
          <CardHeader>
            <CardTitle>Import Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-center text-muted-foreground">
              Processing... {progress}%
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              Import {result.success ? 'Completed' : 'Failed'}
            </CardTitle>
            <CardDescription>
              Processing time: {(result.processingTime / 1000).toFixed(2)}s
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Universities Created</p>
                <p className="text-2xl font-bold text-green-600">
                  {result.summary.universitiesCreated}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Universities Skipped</p>
                <p className="text-2xl font-bold text-blue-600">
                  {result.summary.universitiesSkipped}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Courses Created</p>
                <p className="text-2xl font-bold text-green-600">
                  {result.summary.coursesCreated}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Courses Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {result.summary.coursesFailed}
                </p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{result.errors.length} errors occurred during import</span>
                  <Button variant="outline" size="sm" onClick={downloadErrorLog}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Error Log
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <Button onClick={clearFile} variant="outline" className="w-full">
              Import Another File
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
