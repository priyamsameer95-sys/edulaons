import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Check,
    Info,
    Shield,
    ArrowRight,
    Lock,
    MoreHorizontal,
    Wallet,
    Clock,
    Percent,
    Sparkles,
    Zap,
    Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Reuse types from Grid/Card or define subset needed for display
interface LenderData {
    lender_id: string;
    lender_name: string;
    logo_url: string | null;
    interest_rate_min: number | null;
    loan_amount_max: number | null;
    processing_time_days: number | null;
    processing_fee?: number | null;
    moratorium_period?: string | null;
    compatibility_score: number;
    badges?: string[] | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    student_facing_reason?: any; // String or Object
    status?: 'BEST_FIT' | 'GOOD_FIT' | 'BACKUP' | 'LOCKED' | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eligible_expenses?: any[] | null;
}

interface LenderComparisonTableProps {
    lenders: LenderData[];
    selectedLenderId: string | null;
    onSelect: (lenderId: string) => void;
    isUpdating: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recommendationContext?: any;
}

const LenderComparisonTable = ({
    lenders,
    selectedLenderId,
    onSelect,
    isUpdating,
    recommendationContext
}: LenderComparisonTableProps) => {
    // Only show top 3 qualified lenders in the main table
    // Using slice(0, 3) because typical comparison tables get crowded with >3
    const displayLenders = lenders.slice(0, 3);
    const bestLender = displayLenders[0];

    const formatProcessingFee = (fee: number | null | undefined): string => {
        if (!fee) return '~1%';
        if (fee >= 9) return `₹${fee.toLocaleString('en-IN')}`;
        return `${fee}%`;
    };

    const formatAmount = (amount: number | null | undefined): string => {
        if (!amount) return '—';
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
        return `₹${(amount / 100000).toFixed(0)}L`;
    };

    return (
        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b-2 border-border/60">
                        {/* Feature Column Header */}
                        <TableHead className="w-[200px] bg-muted/20 font-black text-slate-700 uppercase tracking-wide text-xs align-bottom pb-5 pl-6">
                            Features
                        </TableHead>

                        {/* Lender Headers */}
                        {displayLenders.map((lender, index) => {
                            const isTop = index === 0;
                            return (
                                <TableHead
                                    key={lender.lender_id}
                                    className={cn(
                                        "min-w-[220px] align-bottom pb-5 pt-12 relative", // Added pt-12 for banner space
                                        isTop ? "bg-primary/5" : "bg-transparent"
                                    )}
                                >
                                    {isTop && (
                                        <div className="absolute top-0 inset-x-0 h-1 bg-primary" />
                                    )}
                                    {isTop && (
                                        <Badge className="absolute top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground shadow-sm hover:bg-primary z-10 whitespace-nowrap px-3 py-1">
                                            <Sparkles className="w-3 h-3 mr-1.5 fill-current" />
                                            Top Choice
                                        </Badge>
                                    )}

                                    <div className="flex flex-col items-center gap-3">
                                        {/* Logo & Name */}
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-14 h-14 rounded-xl border bg-background p-1.5 flex items-center justify-center shadow-sm">
                                                {lender.logo_url ? (
                                                    <img src={lender.logo_url} alt={lender.lender_name} className="w-full h-full object-contain" />
                                                ) : (
                                                    <Building2 className="h-7 w-7 text-primary/80" />
                                                )}
                                            </div>
                                            <div className="text-center px-2">
                                                <div className="font-bold text-slate-900 text-lg leading-tight">
                                                    {lender.lender_name}
                                                </div>
                                                <div className="text-xs font-semibold text-slate-500 mt-1">
                                                    Match Score: <span className={cn(
                                                        lender.compatibility_score >= 80 ? "text-emerald-600" : "text-primary"
                                                    )}>{lender.compatibility_score}%</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Primary Action */}
                                        <Button
                                            size="lg"
                                            className={cn(
                                                "w-full max-w-[160px] font-bold h-10",
                                                selectedLenderId === lender.lender_id
                                                    ? "bg-success hover:bg-success"
                                                    : isTop ? "bg-primary shadow-lg shadow-primary/20 hover:bg-primary/90" : "bg-white border-2 border-slate-200 text-slate-700 hover:border-primary hover:text-primary hover:bg-primary/5 shadow-none"
                                            )}
                                            onClick={() => onSelect(lender.lender_id)}
                                            disabled={isUpdating}
                                        >
                                            {selectedLenderId === lender.lender_id ? (
                                                <><Check className="w-4 h-4 mr-1.5" /> Selected</>
                                            ) : (
                                                "Select"
                                            )}
                                        </Button>
                                    </div>
                                </TableHead>
                            );
                        })}
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {/* 1. KEY FINANCIALS (Highlighted) */}
                    <TableRow className="hover:bg-transparent bg-slate-50/50">
                        <TableCell className="font-bold text-slate-600 pl-6 h-16">Interest Rate</TableCell>
                        {displayLenders.map((lender, i) => (
                            <TableCell key={lender.lender_id} className={cn("text-center align-middle h-16", i === 0 && "bg-primary/5")}>
                                <div className="flex flex-col items-center justify-center">
                                    <span className="text-2xl font-black text-slate-900 tabular-nums tracking-tight">
                                        {lender.interest_rate_min ? `${lender.interest_rate_min}%` : '—'}
                                    </span>
                                    {i === 0 && (
                                        <span className="text-xs text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full mt-1">
                                            Lowest Rate
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                        ))}
                    </TableRow>

                    <TableRow className="hover:bg-transparent">
                        <TableCell className="font-bold text-slate-600 pl-6 h-14">Max Loan Amount</TableCell>
                        {displayLenders.map((lender, i) => (
                            <TableCell key={lender.lender_id} className={cn("text-center align-middle h-14", i === 0 && "bg-primary/5")}>
                                <span className="font-bold text-lg text-slate-900 tabular-nums">
                                    {formatAmount(lender.loan_amount_max)}
                                </span>
                            </TableCell>
                        ))}
                    </TableRow>

                    <TableRow className="hover:bg-transparent bg-slate-50/50">
                        <TableCell className="font-bold text-slate-600 pl-6 h-14">Processing Fee</TableCell>
                        {displayLenders.map((lender, i) => (
                            <TableCell key={lender.lender_id} className={cn("text-center align-middle h-14", i === 0 && "bg-primary/5")}>
                                <span className="font-semibold text-base text-slate-800">
                                    {formatProcessingFee(lender.processing_fee)}
                                </span>
                            </TableCell>
                        ))}
                    </TableRow>

                    {/* 2. TIMELINE & TERMS */}
                    <TableRow className="hover:bg-transparent">
                        <TableCell className="font-bold text-slate-600 pl-6 h-14 flex items-center gap-1.5">
                            Processing Time
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger><Info className="w-4 h-4 text-slate-400" /></TooltipTrigger>
                                    <TooltipContent>Estimated business days from document submission to sanction.</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </TableCell>
                        {displayLenders.map((lender, i) => (
                            <TableCell key={lender.lender_id} className={cn("text-center align-middle h-14", i === 0 && "bg-primary/5")}>
                                <div className="flex items-center justify-center gap-1.5">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <span className={cn(
                                        "font-bold text-base",
                                        (lender.processing_time_days || 30) < 10 ? "text-emerald-700" : "text-slate-800"
                                    )}>
                                        {lender.processing_time_days || '7-10'} days
                                    </span>
                                </div>
                            </TableCell>
                        ))}
                    </TableRow>

                    <TableRow className="hover:bg-transparent bg-slate-50/50">
                        <TableCell className="font-bold text-slate-600 pl-6 h-14">Moratorium</TableCell>
                        {displayLenders.map((lender, i) => (
                            <TableCell key={lender.lender_id} className={cn("text-center align-middle h-14 font-medium text-slate-700", i === 0 && "bg-primary/5")}>
                                {lender.moratorium_period || "Course + 6 months"}
                            </TableCell>
                        ))}
                    </TableRow>

                    <TableRow className="hover:bg-transparent">
                        <TableCell className="font-bold text-slate-600 pl-6 h-14">Collateral</TableCell>
                        {displayLenders.map((lender, i) => {
                            // Infer from Secured badge in original card or use generic logic
                            const isSecured = lender.badges?.some(b => b.toLowerCase().includes('secured'));
                            return (
                                <TableCell key={lender.lender_id} className={cn("text-center align-middle h-14", i === 0 && "bg-primary/5")}>
                                    {isSecured ? (
                                        <div className="inline-flex items-center gap-1.5 text-amber-700 font-bold bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                                            <Shield className="w-3.5 h-3.5" /> Secured
                                        </div>
                                    ) : (
                                        <span className="text-slate-500 font-medium">Flexible</span>
                                    )}
                                </TableCell>
                            );
                        })}
                    </TableRow>

                    {/* 3. AI WHY */}
                    <TableRow className="hover:bg-transparent border-t-2 border-primary/10">
                        <TableCell className="font-black text-primary uppercase tracking-wide text-xs align-top pt-6 pl-6">Why We Picked It</TableCell>
                        {displayLenders.map((lender, i) => {
                            // Extract string reason or object reason
                            const reasonText = typeof lender.student_facing_reason === 'string'
                                ? lender.student_facing_reason
                                : lender.student_facing_reason?.greeting || "Matches your profile criteria";

                            return (
                                <TableCell key={lender.lender_id} className={cn("align-top pt-6 pb-8 px-4", i === 0 && "bg-primary/5")}>
                                    <div className="flex gap-2.5">
                                        <div className="mt-0.5 shrink-0">
                                            {i === 0 ? <Zap className="w-5 h-5 text-amber-500 fill-amber-500" /> : <Check className="w-5 h-5 text-primary" />}
                                        </div>
                                        <p className="text-sm leading-relaxed text-slate-700 font-medium">
                                            {reasonText}
                                        </p>
                                    </div>
                                </TableCell>
                            )
                        })}
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
};

export default LenderComparisonTable;
