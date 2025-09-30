import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle, CheckCircle2, Info, Database, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  details?: any;
}

interface ValidationReport {
  timestamp: string;
  totalIssues: number;
  errors: number;
  warnings: number;
  info: number;
  issues: ValidationIssue[];
  statistics: {
    totalLeads: number;
    totalDocuments: number;
    totalPartners: number;
    totalStudents: number;
    totalCoApplicants: number;
  };
}

export function DataSanityCheck() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ValidationReport | null>(null);

  const runSanityCheck = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('data-sanity-check');

      if (error) throw error;

      setReport(data as ValidationReport);
      
      if (data.errors > 0) {
        toast.error(`Found ${data.errors} critical errors`);
      } else if (data.warnings > 0) {
        toast.warning(`Found ${data.warnings} warnings`);
      } else {
        toast.success('All data validation checks passed!');
      }
    } catch (error) {
      console.error('Sanity check failed:', error);
      toast.error('Failed to run sanity check');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'info':
        return <Info className="h-4 w-4 text-primary" />;
      default:
        return null;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'warning':
        return <Badge variant="outline" className="border-warning text-warning">Warning</Badge>;
      case 'info':
        return <Badge variant="secondary">Info</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Sanity Check
            </CardTitle>
            <CardDescription>
              Validate data integrity, referential consistency, and statistical accuracy across the platform
            </CardDescription>
          </div>
          <Button onClick={runSanityCheck} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Checks...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Run Sanity Check
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {report && (
        <CardContent className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{report.statistics.totalLeads}</div>
                  <div className="text-xs text-muted-foreground">Total Leads</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{report.statistics.totalDocuments}</div>
                  <div className="text-xs text-muted-foreground">Documents</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{report.statistics.totalPartners}</div>
                  <div className="text-xs text-muted-foreground">Partners</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{report.statistics.totalStudents}</div>
                  <div className="text-xs text-muted-foreground">Students</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{report.statistics.totalCoApplicants}</div>
                  <div className="text-xs text-muted-foreground">Co-Applicants</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Issue Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Alert variant={report.errors > 0 ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Errors</AlertTitle>
              <AlertDescription className="text-2xl font-bold">
                {report.errors}
              </AlertDescription>
            </Alert>
            <Alert>
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertTitle>Warnings</AlertTitle>
              <AlertDescription className="text-2xl font-bold">
                {report.warnings}
              </AlertDescription>
            </Alert>
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertTitle>Info</AlertTitle>
              <AlertDescription className="text-2xl font-bold">
                {report.info}
              </AlertDescription>
            </Alert>
          </div>

          <Separator />

          {/* Issues List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Validation Issues</h3>
            {report.issues.length === 0 ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-success" />
                <AlertTitle>All Clear!</AlertTitle>
                <AlertDescription>
                  No data integrity issues found. All validation checks passed successfully.
                </AlertDescription>
              </Alert>
            ) : (
              <ScrollArea className="h-[500px] rounded-md border">
                <div className="p-4 space-y-3">
                  {report.issues.map((issue, index) => (
                    <Card key={index} className="border-l-4" style={{
                      borderLeftColor: issue.severity === 'error' ? 'hsl(var(--destructive))' : 
                                      issue.severity === 'warning' ? 'hsl(var(--warning))' : 
                                      'hsl(var(--primary))'
                    }}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          {getSeverityIcon(issue.severity)}
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              {getSeverityBadge(issue.severity)}
                              <Badge variant="outline">{issue.category}</Badge>
                            </div>
                            <p className="text-sm">{issue.message}</p>
                            {issue.details && (
                              <details className="text-xs text-muted-foreground">
                                <summary className="cursor-pointer hover:text-foreground">
                                  Show details
                                </summary>
                                <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                                  {JSON.stringify(issue.details, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Timestamp */}
          <div className="text-xs text-muted-foreground text-center">
            Last checked: {new Date(report.timestamp).toLocaleString()}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
