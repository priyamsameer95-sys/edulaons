import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, FileUp, Download, CheckCircle2, AlertCircle, FileSpreadsheet, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const MAX_ROWS = 10000;
// const REQUIRED_HEADERS = ['Global Rank', 'University_Name', 'Country'];

interface ValidationResult {
    valid: boolean;
    errors: string[];
    data: any[];
}

export const UniversityBulkUpload = () => {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [summary, setSummary] = useState<{ updated: number; errors: number; errorList: string[] } | null>(null);

    const resetState = () => {
        setFile(null);
        setSummary(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const downloadTemplate = () => {
        const headers = ['Global Rank', 'University_Name', 'Country'];
        const sampleData = [
            ['1', 'Massachusetts Institute of Technology (MIT)', 'Cambridge, United States'],
            ['2', 'Imperial College London', 'London, United Kingdom'],
            ['1201-1400', 'Example Range Uni', 'Australia']
        ];

        // Create CSV content
        const csvContent = [
            headers.join(','),
            ...sampleData.map(row => row.map(cell => {
                // Escape commas in cells if needed (simple quote wrap)
                return cell.includes(',') ? `"${cell}"` : cell;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'university_upload_template.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    const validateData = (data: any[]): ValidationResult => {
        const errors: string[] = [];
        const validRows: any[] = [];

        if (data.length > MAX_ROWS) {
            return { valid: false, errors: [`File exceeds maximum limit of ${MAX_ROWS} rows.`], data: [] };
        }

        data.forEach((row, index) => {
            // Normalize keys to lowercase for flexible matching
            const normalizedRow: any = {};
            Object.keys(row).forEach(key => {
                // specific fix for "Global Rank" -> "global rank" and "University_Name" -> "university_name"
                normalizedRow[key.toLowerCase().trim()] = row[key];
            });

            // Expected keys after normalization: 'global rank', 'university_name', 'country'

            // Try to find the keys. 'global rank' might be 'global_rank' in some CSV parsers depending on header cleaning
            // But here we rely on the normalized keys.

            const name = normalizedRow['university_name'];
            const country = normalizedRow['country'];
            const rank = normalizedRow['global rank'];

            // Basic Checks
            if (!name || !name.toString().trim()) {
                errors.push(`Row ${index + 2}: Missing 'University_Name'`);
                return;
            }
            if (!country || !country.toString().trim()) {
                errors.push(`Row ${index + 2}: Missing 'Country'`);
                return;
            }

            // Rank validation (allow string)
            let global_rank = null;
            if (rank) {
                // String input might come as "=123" from some CSV exports if formulas were used
                global_rank = String(rank).trim().replace(/^=/, '');
            }

            validRows.push({
                name: name.toString().trim(),
                country: country.toString().trim(),
                city: '', // Default to empty
                global_rank: global_rank,
                url: null, // Website not in this specific template
            });
        });

        return { valid: errors.length === 0, errors, data: validRows };
    };

    const processFile = async () => {
        if (!file) return;
        setLoading(true);
        setSummary(null);

        const parseComplete = async (results: any[]) => {
            const validation = validateData(results);

            if (!validation.valid && validation.errors.length > 0 && validation.data.length === 0) {
                setSummary({ updated: 0, errors: validation.errors.length, errorList: validation.errors.slice(0, 10) });
                setLoading(false);
                return;
            }

            // Perform Upsert in Batches
            const BATCH_SIZE = 100;
            let successCount = 0;
            let upsertErrors: string[] = [...validation.errors];

            for (let i = 0; i < validation.data.length; i += BATCH_SIZE) {
                const batch = validation.data.slice(i, i + BATCH_SIZE);
                const { error } = await supabase.from('universities').upsert(batch, {
                    onConflict: 'name',
                    ignoreDuplicates: false
                });

                if (error) {
                    upsertErrors.push(`Batch ${i / BATCH_SIZE + 1} failed: ${error.message}`);
                } else {
                    successCount += batch.length;
                }
            }

            setSummary({
                updated: successCount,
                errors: upsertErrors.length,
                errorList: upsertErrors.slice(0, 10) // Show top 10 errors
            });
            setLoading(false);

            if (successCount > 0) {
                toast({ title: "Upload Complete", description: `Successfully processed ${successCount} universities.` });
                resetState();
            }
        };

        try {
            if (file.name.endsWith('.csv')) {
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => parseComplete(results.data),
                    error: (err) => {
                        setSummary({ updated: 0, errors: 1, errorList: [`CSV Parse Error: ${err.message}`] });
                        setLoading(false);
                    }
                });
            } else if (file.name.endsWith('.xlsx')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                    parseComplete(jsonData);
                };
                reader.readAsArrayBuffer(file);
            } else {
                toast({ variant: "destructive", title: "Invalid File", description: "Please upload .csv or .xlsx" });
                setLoading(false);
            }
        } catch (e: any) {
            setSummary({ updated: 0, errors: 1, errorList: [e.message] });
            setLoading(false);
        }
    };

    const handleDeleteAll = async () => {
        setLoading(true);
        try {
            // Delete all rows - using a condition that is always true for UUIDs or just not null
            // For safety, we might normally want a WHERE clause, but to delete all:
            const { error, count } = await supabase
                .from('universities')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000') // Deletes everything assuming no one has this exact nil UUID, or just use a filter that matches all.
                .select('*', { count: 'exact', head: true });

            if (error) throw error;

            toast({ title: "Database Cleared", description: `All universities have been permanently deleted.` });
            setSummary(null);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-3xl mx-auto shadow-md">
            <CardHeader className="pb-4 border-b bg-muted/20">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Upload className="h-5 w-5 text-primary" />
                            Bulk Upload Universities
                        </CardTitle>
                        <CardDescription>
                            Update the global university master list via CSV or Excel.
                        </CardDescription>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="gap-2" disabled={loading}>
                                <Trash2 className="h-4 w-4" />
                                Clear Database
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete ALL universities from the database.
                                    You will need to re-upload the data strictly.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive hover:bg-destructive/90">
                                    Yes, Delete All
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
                        <Download className="h-4 w-4" /> Template
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 hover:bg-muted/10 transition-colors">
                    <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-4" />
                    <div className="text-center space-y-1 mb-4">
                        <p className="text-sm font-medium">Drag and drop or click to upload</p>
                        <p className="text-xs text-muted-foreground">Supported formats: .csv, .xlsx (Max 10,000 rows)</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept=".csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            className="hidden"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <Button onClick={() => fileInputRef.current?.click()} variant="secondary">
                            {file ? 'Change File' : 'Select File'}
                        </Button>
                        {file && <span className="text-sm font-medium">{file.name}</span>}
                        {file && (
                            <Button onClick={processFile} disabled={loading} className="gap-2">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                                Upload Now
                            </Button>
                        )}
                    </div>
                </div>

                {summary && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Alert variant={summary.errors > 0 ? "destructive" : "default"} className={summary.errors === 0 ? "border-green-500 bg-green-50 text-green-900" : ""}>
                            {summary.errors === 0 ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4" />}
                            <AlertTitle>Upload Summary</AlertTitle>
                            <AlertDescription>
                                Processed with <strong>{summary.updated} successful updates</strong> and <strong>{summary.errors} errors</strong>.
                                {summary.errorList.length > 0 && (
                                    <ul className="mt-2 text-xs list-disc pl-4 space-y-1 opacity-90 max-h-32 overflow-y-auto">
                                        {summary.errorList.map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                        {summary.errors > 10 && <li>...and {summary.errors - 10} more errors</li>}
                                    </ul>
                                )}
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
