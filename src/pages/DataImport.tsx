import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, CheckCircle, XCircle, AlertTriangle, Building2, BookOpen } from 'lucide-react';
import Papa from 'papaparse';
import { parseCourseData, importCourses, parseUniversityData, importUniversities } from '@/utils/dataImport';
import { toast } from 'sonner';

export default function DataImport() {
  // University import state
  const [isImportingUniversities, setIsImportingUniversities] = useState(false);
  const [universityProgress, setUniversityProgress] = useState(0);
  const [universityStatus, setUniversityStatus] = useState('');
  const [universityResult, setUniversityResult] = useState<any>(null);
  
  // Course import state
  const [isImportingCourses, setIsImportingCourses] = useState(false);
  const [courseProgress, setCourseProgress] = useState(0);
  const [courseStatus, setCourseStatus] = useState('');
  const [courseResult, setCourseResult] = useState<any>(null);

  const handleUniversityImport = async () => {
    try {
      setIsImportingUniversities(true);
      setUniversityProgress(0);
      setUniversityStatus('Loading university CSV file...');
      setUniversityResult(null);

      // Fetch the university CSV file
      const response = await fetch('/src/data/University_Level_data-3.csv');
      const csvText = await response.text();

      setUniversityStatus('Parsing university data...');
      setUniversityProgress(10);
      
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

      setUniversityStatus(`Extracted ${parseResult.data.length} rows from CSV`);
      console.log('University CSV parsed:', parseResult.data.length, 'rows');
      setUniversityProgress(30);

      // Parse the university data
      const universities = parseUniversityData(parseResult.data);
      
      if (universities.length === 0) {
        throw new Error('No valid universities found after parsing');
      }

      console.log('Universities parsed:', universities.length);
      setUniversityStatus(`Parsed ${universities.length} universities. Starting import...`);
      setUniversityProgress(50);

      // Import universities
      const importResult = await importUniversities(universities);
      setUniversityProgress(100);

      setUniversityResult({
        success: importResult.length,
        total: universities.length,
      });
      
      toast.success('Universities imported successfully!', {
        description: `${importResult.length} universities imported`,
      });
      
      setUniversityStatus(`✅ Import complete! ${importResult.length} universities imported.`);
    } catch (error) {
      console.error('University import error:', error);
      toast.error('University import failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      setUniversityStatus('Import failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsImportingUniversities(false);
    }
  };

  const handleCourseImport = async () => {
    try {
      setIsImportingCourses(true);
      setCourseProgress(0);
      setCourseStatus('Loading course CSV file...');
      setCourseResult(null);

      // Fetch the CSV file
      const response = await fetch('/src/data/Program_level_combined_output-5.csv');
      const csvText = await response.text();

      setCourseStatus('Parsing CSV data...');
      
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

      setCourseStatus(`Extracted ${parseResult.data.length} rows from CSV`);
      console.log('CSV parsed:', parseResult.data.length, 'rows');

      // Parse the course data
      const courses = parseCourseData(parseResult.data);
      
      if (courses.length === 0) {
        throw new Error('No valid courses found after parsing');
      }

      console.log('Courses parsed:', courses.length);
      setCourseStatus(`Parsed ${courses.length} courses. Starting import...`);

      // Import courses with progress tracking
      const importResult = await importCourses(
        courses,
        (progressValue, statusMessage) => {
          setCourseProgress(progressValue);
          setCourseStatus(statusMessage);
        }
      );

      setCourseResult(importResult);
      
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
      setCourseStatus('Import failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsImportingCourses(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Data Import</CardTitle>
          <CardDescription>
            Import university and course data from CSV files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="universities" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="universities">
                <Building2 className="h-4 w-4 mr-2" />
                Universities (1,474)
              </TabsTrigger>
              <TabsTrigger value="courses">
                <BookOpen className="h-4 w-4 mr-2" />
                Courses
              </TabsTrigger>
            </TabsList>
            
            {/* UNIVERSITIES TAB */}
            <TabsContent value="universities" className="space-y-6">
              <Alert>
                <Building2 className="h-4 w-4" />
                <AlertDescription>
                  This will import universities from <strong>University_Level_data-3.csv</strong> (1,474 universities)
                </AlertDescription>
              </Alert>

              {!isImportingUniversities && !universityResult && (
                <Button onClick={handleUniversityImport} size="lg" className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  Import Universities
                </Button>
              )}

              {isImportingUniversities && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{universityProgress}%</span>
                    </div>
                    <Progress value={universityProgress} />
                  </div>
                  
                  <Alert>
                    <AlertDescription>{universityStatus}</AlertDescription>
                  </Alert>
                  
                  <p className="text-sm text-muted-foreground">
                    This should take less than a minute.
                  </p>
                </div>
              )}

              {universityResult && (
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
                        <CardTitle className="text-sm font-medium">Universities Imported</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">{universityResult.success}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{universityResult.total}</div>
                      </CardContent>
                    </Card>
                  </div>

                  <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                    Import More Data
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* COURSES TAB */}
            <TabsContent value="courses" className="space-y-6">
              <Alert>
                <BookOpen className="h-4 w-4" />
                <AlertDescription>
                  This will import courses from <strong>Program_level_combined_output-5.csv</strong>. 
                  Make sure universities are imported first!
                </AlertDescription>
              </Alert>

              {!isImportingCourses && !courseResult && (
                <Button onClick={handleCourseImport} size="lg" className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  Import Courses
                </Button>
              )}

              {isImportingCourses && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{courseProgress}%</span>
                    </div>
                    <Progress value={courseProgress} />
                  </div>
                  
                  <Alert>
                    <AlertDescription>{courseStatus}</AlertDescription>
                  </Alert>
                  
                  <p className="text-sm text-muted-foreground">
                    This may take 5-10 minutes. Please keep this page open.
                  </p>
                </div>
              )}

              {courseResult && (
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
                        <div className="text-2xl font-bold text-green-600">{courseResult.success}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{courseResult.total}</div>
                      </CardContent>
                    </Card>

                    {courseResult.unmatchedUniversities?.length > 0 && (
                      <Card className="sm:col-span-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            Unmatched Universities ({courseResult.unmatchedUniversities.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-muted-foreground max-h-40 overflow-y-auto">
                            {courseResult.unmatchedUniversities.slice(0, 20).join(', ')}
                            {courseResult.unmatchedUniversities.length > 20 && '...'}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {courseResult.errors > 0 && (
                      <Card className="sm:col-span-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            Errors Encountered
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-red-600">{courseResult.errors}</div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                    Import More Data
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
