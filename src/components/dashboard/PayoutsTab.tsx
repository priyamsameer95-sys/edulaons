import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EnhancedEmptyState } from "@/components/ui/enhanced-empty-state";
import { Download, FileText, BadgeIndianRupee } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Payout {
  case_id: string;
  student_name: string;
  lender_name: string;
  loan_type: 'secured' | 'unsecured';
  sanction_amount: number;
  disbursal_date: string;
  notes?: string;
}

export const PayoutsTab = () => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  // TODO: Replace with Supabase queries filtered by status='disbursed'
  useEffect(() => {
    // Simulate initial load
    const timer = setTimeout(() => {
      setPayouts([]); // Start with empty data
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  const getLoanTypeBadge = (type: string) => {
    return type === 'secured' ? 
      'bg-primary text-primary-foreground' : 
      'bg-secondary text-secondary-foreground';
  };

  const handleExportCSV = async () => {
    setExporting(true);
    
    try {
      // TODO: Replace with actual edge function call to /exports
      // const response = await fetch('/api/exports', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ filters: currentFilters })
      // });

      // Simulate processing delay for demo
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock CSV generation
      const csvData = [
        ['Case ID', 'Student Name', 'Lender', 'Loan Type', 'Sanction Amount', 'Disbursal Date', 'Notes'],
        ...payouts.map(payout => [
          payout.case_id,
          payout.student_name,
          payout.lender_name,
          payout.loan_type,
          payout.sanction_amount,
          format(new Date(payout.disbursal_date), 'dd-MM-yyyy'),
          payout.notes || ''
        ])
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `payouts_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: "Payouts data has been downloaded as CSV file.",
      });

    } catch (error) {
      toast({
        title: "Export Failed", 
        description: "Unable to export payouts data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-md bg-gradient-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center">
                <BadgeIndianRupee className="h-5 w-5 mr-2 text-primary" />
                Disbursed Payouts
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Track all successfully disbursed education loans
              </p>
            </div>
            <Button
              onClick={handleExportCSV}
              disabled={exporting || payouts.length === 0}
              className="bg-gradient-primary hover:bg-primary-hover"
            >
              {exporting ? (
                <>
                  <Skeleton className="h-4 w-4 mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Payouts Table */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-muted">
                  <TableHead className="font-semibold">Case ID</TableHead>
                  <TableHead className="font-semibold">Student</TableHead>
                  <TableHead className="font-semibold">Lender</TableHead>
                  <TableHead className="font-semibold">Loan Type</TableHead>
                  <TableHead className="font-semibold">Sanction Amount</TableHead>
                  <TableHead className="font-semibold">Disbursal Date</TableHead>
                  <TableHead className="font-semibold">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    </TableRow>
                  ))
                ) : payouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <EnhancedEmptyState
                        variant="no-data"
                        icon={BadgeIndianRupee}
                        title="No Disbursed Payouts Yet"
                        description="Once your loan is approved and disbursed, you'll see the details here."
                        supportingText="Track your loan disbursal timeline and payment schedules in one place."
                        className="my-8"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  payouts.map((payout) => (
                    <TableRow key={payout.case_id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{payout.case_id}</TableCell>
                      <TableCell className="font-medium">{payout.student_name}</TableCell>
                      <TableCell>{payout.lender_name}</TableCell>
                      <TableCell>
                        <Badge className={cn("capitalize", getLoanTypeBadge(payout.loan_type))}>
                          {payout.loan_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-success">
                        ₹{(payout.sanction_amount / 100000).toFixed(1)}L
                      </TableCell>
                      <TableCell>
                        {format(new Date(payout.disbursal_date), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {payout.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {!loading && payouts.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {payouts.length}
                </p>
                <p className="text-sm text-muted-foreground">Total Payouts</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-success">
                  ₹{(payouts.reduce((sum, p) => sum + p.sanction_amount, 0) / 10000000).toFixed(1)}Cr
                </p>
                <p className="text-sm text-muted-foreground">Total Disbursed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  ₹{(payouts.reduce((sum, p) => sum + p.sanction_amount, 0) / payouts.length / 100000).toFixed(1)}L
                </p>
                <p className="text-sm text-muted-foreground">Average Amount</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};