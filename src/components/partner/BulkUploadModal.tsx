/**
 * Bulk Upload Modal
 * 
 * Allows Partners to upload Excel/CSV files for bulk lead creation.
 * Features: Drag-drop, preview with error highlights, template download.
 * (Updated import fix)
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    CollapsibleModal
} from '@/components/common/collapsible-modal';
import {
    Upload,
    Download,
    FileSpreadsheet,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    ArrowRight,
    RefreshCw,
    Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseSpreadsheet, generateTemplate, ParseResult, ParsedLeadRow } from '@/utils/excelParser';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BulkUploadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    partnerId: string;
    onSuccess: () => void;
}

type UploadState = 'idle' | 'parsing' | 'preview' | 'uploading' | 'complete' | 'error';

export function BulkUploadModal({
    open,
    onOpenChange,
    partnerId,
    onSuccess,
}: BulkUploadModalProps) {
    const { toast } = useToast();
    const [state, setState] = useState<UploadState>('idle');
    const [parseResult, setParseResult] = useState<ParseResult | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedCount, setUploadedCount] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);

    // Reset state
    const resetState = () => {
        setState('idle');
        setParseResult(null);
        setUploadProgress(0);
        setUploadedCount(0);
        setErrorMessage(null);
    };

    // Handle file selection
    const handleFile = useCallback(async (file: File) => {
        if (!file) return;

        // Validate file type
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
            'application/vnd.ms-excel', // xls
            'text/csv',
        ];
        if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
            setErrorMessage('Please upload an Excel (.xlsx) or CSV file');
            setState('error');
            return;
        }

        setState('parsing');
        try {
            const result = await parseSpreadsheet(file);
            setParseResult(result);
            setState('preview');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to parse file');
            setState('error');
        }
    }, []);

    // Handle drag and drop
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    // Handle file input change
    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    // Download template
    const downloadTemplate = () => {
        const blob = generateTemplate();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lead_upload_template.csv';
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: 'Template downloaded!' });
    };

    // Upload valid leads
    const handleUpload = async () => {
        if (!parseResult) return;

        const validRows = parseResult.rows.filter(r => r.isValid);
        if (validRows.length === 0) {
            toast({ title: 'No valid rows to upload', variant: 'destructive' });
            return;
        }

        setState('uploading');
        setUploadProgress(0);
        setUploadedCount(0);

        let successCount = 0;
        const errors: string[] = [];

        try {
            // Structure payload for bulk API
            const payload = {
                partner_id: partnerId,
                rows: validRows.map(r => ({
                    student_name: r.data.student_name,
                    student_email: r.data.student_email,
                    student_phone: r.data.student_phone,
                    student_dob: r.data.student_dob || null,
                    student_gender: r.data.student_gender || null,
                    study_destination: r.data.study_destination,
                    university_name: r.data.university_name || null,
                    intake_month: r.data.intake_month,
                    intake_year: r.data.intake_year,
                    course_type: r.data.course_type || null,
                    amount_requested: r.data.loan_amount,
                    loan_type: r.data.loan_type,
                    co_applicant_name: r.data.co_applicant_name || null,
                    co_applicant_relationship: r.data.co_applicant_relationship || null,
                    co_applicant_phone: r.data.co_applicant_phone || null,
                    co_applicant_monthly_salary: r.data.co_applicant_salary || null,
                    co_applicant_occupation: r.data.co_applicant_occupation || null,
                }))
            };

            const { data, error } = await supabase.functions.invoke('bulk-create-leads', {
                body: payload
            });

            if (error) throw error;

            if (data?.results) {
                // Process results from server
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data.results.forEach((res: any) => {
                    if (res.success) {
                        successCount++;
                    } else {
                        errors.push(`Row ${res.row}: ${res.error}`);
                    }
                });
            } else {
                successCount = validRows.length; // Fallback assumption if no detailed results
            }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            errors.push(`Batch upload failed: ${err.message}`);
            console.error('Batch upload error:', err);
        }

        // Progress is immediate for batch (or we could fake it, but 100% is fine)
        setUploadProgress(100);
        setUploadedCount(successCount);

        if (errors.length > 0) {
            console.error('Bulk upload errors:', errors);
        }

        if (successCount > 0) {
            toast({
                title: `${successCount} leads created successfully!`,
                description: errors.length > 0 ? `${errors.length} failed` : undefined,
            });
            setState('complete');
            onSuccess();
        } else {
            setErrorMessage('All uploads failed. Check console for details.');
            setState('error');
        }
    };

    return (
        <CollapsibleModal
            open={open}
            onOpenChange={(newOpen) => {
                if (!newOpen) resetState();
                onOpenChange(newOpen);
            }}
            title="Bulk Lead Upload"
            description="Upload Excel or CSV file to create multiple leads at once"
            footer={
                state === 'preview' ? (
                    <>
                        <Button variant="outline" onClick={resetState}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Start Over
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={!parseResult || parseResult.validRows === 0}
                            className="gap-2"
                        >
                            Upload {parseResult?.validRows} Valid Leads
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </>
                ) : state === 'complete' ? (
                    <Button onClick={() => onOpenChange(false)}>
                        Done
                    </Button>
                ) : null
            }
        >
            <div className="space-y-4">
                {/* Idle State: File Drop Zone */}
                {state === 'idle' && (
                    <>
                        <Card
                            className={cn(
                                "border-2 border-dashed transition-colors cursor-pointer",
                                dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                            )}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                        >
                            <CardContent className="py-12 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                                    <Upload className="h-8 w-8 text-primary" />
                                </div>
                                <p className="text-lg font-semibold mb-1">
                                    Drag & drop your file here
                                </p>
                                <p className="text-sm text-muted-foreground mb-4">
                                    or click to browse (Excel, CSV)
                                </p>
                                <input
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileInput}
                                    className="hidden"
                                    id="bulk-upload-input"
                                />
                                <label htmlFor="bulk-upload-input">
                                    <Button variant="outline" asChild>
                                        <span>
                                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                                            Select File
                                        </span>
                                    </Button>
                                </label>
                            </CardContent>
                        </Card>

                        <div className="flex justify-center">
                            <Button variant="ghost" size="sm" onClick={downloadTemplate} className="gap-2">
                                <Download className="h-4 w-4" />
                                Download Template
                            </Button>
                        </div>
                    </>
                )}

                {/* Parsing State */}
                {state === 'parsing' && (
                    <div className="py-12 text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">Parsing your file...</p>
                    </div>
                )}

                {/* Preview State */}
                {state === 'preview' && parseResult && (
                    <div className="space-y-4">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-3 gap-3">
                            <Card className="bg-success/10 border-success/20">
                                <CardContent className="p-3 text-center">
                                    <CheckCircle2 className="h-5 w-5 text-success mx-auto mb-1" />
                                    <p className="text-2xl font-bold text-success">{parseResult.validRows}</p>
                                    <p className="text-xs text-success/80">Valid</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-amber-50 border-amber-200">
                                <CardContent className="p-3 text-center">
                                    <AlertTriangle className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                                    <p className="text-2xl font-bold text-amber-700">{parseResult.warningRows}</p>
                                    <p className="text-xs text-amber-600">Warnings</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-destructive/10 border-destructive/20">
                                <CardContent className="p-3 text-center">
                                    <XCircle className="h-5 w-5 text-destructive mx-auto mb-1" />
                                    <p className="text-2xl font-bold text-destructive">{parseResult.invalidRows}</p>
                                    <p className="text-xs text-destructive/80">Errors</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Preview Table */}
                        <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-muted sticky top-0">
                                    <tr>
                                        <th className="px-3 py-2 text-left w-12">#</th>
                                        <th className="px-3 py-2 text-left">Status</th>
                                        <th className="px-3 py-2 text-left">Name</th>
                                        <th className="px-3 py-2 text-left">Phone</th>
                                        <th className="px-3 py-2 text-left">Amount</th>
                                        <th className="px-3 py-2 text-left">Issues</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parseResult.rows.slice(0, 50).map((row) => (
                                        <tr
                                            key={row.rowNumber}
                                            className={cn(
                                                "border-t",
                                                !row.isValid ? "bg-destructive/5" :
                                                    row.warnings.length > 0 ? "bg-amber-50" : ""
                                            )}
                                        >
                                            <td className="px-3 py-2 text-muted-foreground">{row.rowNumber}</td>
                                            <td className="px-3 py-2">
                                                {!row.isValid ? (
                                                    <XCircle className="h-4 w-4 text-destructive" />
                                                ) : row.warnings.length > 0 ? (
                                                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                                                ) : (
                                                    <CheckCircle2 className="h-4 w-4 text-success" />
                                                )}
                                            </td>
                                            <td className="px-3 py-2 font-medium truncate max-w-[150px]">
                                                {row.data.student_name || '-'}
                                            </td>
                                            <td className="px-3 py-2 font-mono">{row.data.student_phone || '-'}</td>
                                            <td className="px-3 py-2">
                                                {row.data.loan_amount ? `₹${(row.data.loan_amount / 100000).toFixed(1)}L` : '-'}
                                            </td>
                                            <td className="px-3 py-2">
                                                {row.errors.length > 0 && (
                                                    <span className="text-destructive">{row.errors[0]}</span>
                                                )}
                                                {row.errors.length === 0 && row.warnings.length > 0 && (
                                                    <span className="text-amber-600">{row.warnings[0]}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {parseResult.totalRows > 50 && (
                                <div className="p-2 text-center text-xs text-muted-foreground bg-muted">
                                    Showing 50 of {parseResult.totalRows} rows
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Uploading State */}
                {state === 'uploading' && (
                    <div className="py-8 space-y-4">
                        <Progress value={uploadProgress} className="h-3" />
                        <p className="text-center text-sm">
                            <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                            Uploading... {uploadedCount} of {parseResult?.validRows} leads
                        </p>
                    </div>
                )}

                {/* Complete State */}
                {state === 'complete' && (
                    <div className="py-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
                            <CheckCircle2 className="h-8 w-8 text-success" />
                        </div>
                        <p className="text-lg font-semibold text-success mb-1">
                            {uploadedCount} Leads Created!
                        </p>
                        <p className="text-sm text-muted-foreground">
                            They are now visible in your Leads table.
                        </p>
                    </div>
                )}

                {/* Error State */}
                {state === 'error' && (
                    <div className="py-8 space-y-4">
                        <Alert variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>{errorMessage}</AlertDescription>
                        </Alert>
                        <div className="text-center">
                            <Button variant="outline" onClick={resetState}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Try Again
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </CollapsibleModal>
    );
}
