import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Play, CheckCircle2, XCircle } from "lucide-react";

interface TestResult {
    name: string;
    status: "pass" | "fail" | "running" | "pending";
    message?: string;
    details?: any;
}

const SystemTestPage = () => {
    const [results, setResults] = useState<TestResult[]>([
        { name: "Lender Logic: Panic Zone (30 days)", status: "pending" },
        { name: "Lender Logic: Safe Zone (31 days)", status: "pending" },
        { name: "University CRUD: Create Text Rank", status: "pending" },
        { name: "University CRUD: Update Rank", status: "pending" },
    ]);

    const updateResult = (name: string, status: TestResult["status"], message?: string, details?: any) => {
        setResults(prev => prev.map(r => r.name === name ? { ...r, status, message, details } : r));
    };

    const runLenderTests = async () => {
        // Test 1: Panic Zone (37 Days Away -> Effective 30)
        updateResult("Lender Logic: Panic Zone (30 days)", "running");

        try {
            const now = new Date();
            const targetDate = new Date(now);
            targetDate.setDate(now.getDate() + 37); // +37 days

            // INSERT TEST LEAD
            const { data: student } = await supabase.from('students').insert({
                name: "System Test Student",
                email: "test.param@example.com",
                phone: "9999999999"
            }).select().single();

            // Cast to 'any' to bypass strict type checking for incomplete lead object if needed
            const { data: lead } = await supabase.from('leads_new').insert({
                student_id: student?.id,
                loan_amount: 5000000,
                intake_month: targetDate.getMonth() + 1,
                intake_year: targetDate.getFullYear(),
                study_destination: "USA"
            } as any).select().single();

            if (!lead) throw new Error("Failed to create test lead");

            // CALL FUNCTION
            const { data, error } = await supabase.functions.invoke('suggest-lender', {
                body: { leadId: lead.id, loanAmount: 5000000, studyDestination: "USA" }
            });

            if (error) throw error;

            // CLEANUP
            await supabase.from('leads_new').delete().eq('id', lead.id);
            if (student?.id) await supabase.from('students').delete().eq('id', student.id);

            // ASSERTION
            const zone = data?.recommendation_context?.urgency_zone;
            if (zone === "RED" || zone === "SPEED_PRIORITY") {
                updateResult("Lender Logic: Panic Zone (30 days)", "pass", "Correctly identified RED zone (Speed Priority).", data.recommendation_context);
            } else {
                updateResult("Lender Logic: Panic Zone (30 days)", "fail", `Expected RED, got ${zone}`, data.recommendation_context);
            }

        } catch (e: any) {
            updateResult("Lender Logic: Panic Zone (30 days)", "fail", e.message);
        }

        // Test 2: Safe Zone (38 Days -> Effective 31)
        updateResult("Lender Logic: Safe Zone (31 days)", "running");
        try {
            const now = new Date();
            const targetDate = new Date(now);
            targetDate.setDate(now.getDate() + 38);

            // INSERT TEST LEAD
            const { data: student } = await supabase.from('students').insert({
                name: "Test Student 2",
                phone: "8888888888"
            }).select().single();

            const { data: lead } = await supabase.from('leads_new').insert({
                student_id: student?.id,
                loan_amount: 5000000,
                intake_month: targetDate.getMonth() + 1,
                intake_year: targetDate.getFullYear(),
                study_destination: "USA"
            } as any).select().single();

            // CALL FUNCTION
            const { data, error } = await supabase.functions.invoke('suggest-lender', {
                body: { leadId: lead?.id }
            });

            if (error) throw error;

            // CLEANUP
            await supabase.from('leads_new').delete().eq('id', lead?.id);
            await supabase.from('students').delete().eq('id', student?.id);

            // ASSERTION
            const zone = data?.recommendation_context?.urgency_zone;
            if (zone === "YELLOW") {
                updateResult("Lender Logic: Safe Zone (31 days)", "pass", "Correctly identified YELLOW zone.", data.recommendation_context);
            } else {
                updateResult("Lender Logic: Safe Zone (31 days)", "fail", `Expected YELLOW, got ${zone}`, data.recommendation_context);
            }
        } catch (e: any) {
            updateResult("Lender Logic: Safe Zone (31 days)", "fail", e.message);
        }
    };

    const runUniTests = async () => {
        const testName = "QA_System_Test_Uni_" + Date.now();

        // Test 3: Create Text Rank
        updateResult("University CRUD: Create Text Rank", "running");
        try {
            const { error } = await supabase.from('universities').insert({
                name: testName,
                country: "Testland",
                global_rank: "Top 50" as any
            });

            if (error) throw error;
            updateResult("University CRUD: Create Text Rank", "pass", "Successfully created university with rank 'Top 50'");
        } catch (e: any) {
            updateResult("University CRUD: Create Text Rank", "fail", e.message);
            return;
        }

        // Test 4: Update Rank
        updateResult("University CRUD: Update Rank", "running");
        try {
            const { error } = await supabase.from('universities')
                .update({ global_rank: "Rank 1" as any })
                .eq('name', testName);

            if (error) throw error;

            // Verify
            const { data } = await supabase.from('universities').select('global_rank').eq('name', testName).single();
            if (data?.global_rank === "Rank 1" as any) {
                updateResult("University CRUD: Update Rank", "pass", "Successfully updated rank to 'Rank 1'");
            } else {
                updateResult("University CRUD: Update Rank", "fail", `Rank mismatch: ${data?.global_rank}`);
            }

            // Cleanup
            await supabase.from('universities').delete().eq('name', testName);

        } catch (e: any) {
            updateResult("University CRUD: Update Rank", "fail", e.message);
        }
    };

    return (
        <div className="container mx-auto p-8 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">QA System Test Runner</h1>
                <p className="text-muted-foreground">Automated verification of core backend features (Edge Functions & Database).</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Feature Suites</CardTitle>
                            <CardDescription>Click to execute live feature verification.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={runLenderTests}><Play className="mr-2 h-4 w-4" /> Run Lender Logic</Button>
                            <Button onClick={runUniTests} variant="secondary"><Play className="mr-2 h-4 w-4" /> Run University CRUD</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {results.map((res) => (
                                <div key={res.name} className="flex items-start justify-between p-4 border rounded-lg bg-card hover:bg-muted/5 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1">
                                            {res.status === "pass" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                                            {res.status === "fail" && <XCircle className="h-5 w-5 text-destructive" />}
                                            {res.status === "running" && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                                            {res.status === "pending" && <div className="h-5 w-5 rounded-full border-2 border-muted" />}
                                        </div>
                                        <div>
                                            <h3 className="font-medium">{res.name}</h3>
                                            {res.message && <p className="text-sm text-muted-foreground mt-1">{res.message}</p>}
                                            {res.details && (
                                                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto max-w-[500px]">
                                                    {JSON.stringify(res.details, null, 2)}
                                                </pre>
                                            )}
                                        </div>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-wider
                                        ${res.status === 'pass' ? 'bg-green-100 text-green-700' :
                                            res.status === 'fail' ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'}`}>
                                        {res.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SystemTestPage;
