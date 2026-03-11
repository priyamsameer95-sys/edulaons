/**
 * Lender Selection Panel
 * 
 * Displayed after successful lead creation to allow internal users
 * to select a lender after discussing with the customer.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Phone, Copy, CheckCircle2, Building2, Star,
    ArrowRight, Loader2, ExternalLink, PhoneCall,
    Trophy, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatIndianNumber } from '@/utils/currencyFormatter';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RecommendedLender {
    lender_id: string;
    lender_name: string;
    lender_code: string;
    lender_description?: string;
    compatibility_score?: number;
    is_preferred?: boolean;
    interest_rate_min?: number;
    interest_rate_max?: number;
    logo_url?: string;
}

interface LeadInfo {
    id: string;
    case_id: string;
    requested_amount: number;
}

interface LenderSelectionPanelProps {
    lead: LeadInfo;
    studentName: string;
    studentPhone: string;
    studyDestination: string;
    recommendedLenders: RecommendedLender[];
    onComplete: () => void;
    onSkip: () => void;
}

export function LenderSelectionPanel({
    lead,
    studentName,
    studentPhone,
    studyDestination,
    recommendedLenders,
    onComplete,
    onSkip,
}: LenderSelectionPanelProps) {
    const { toast } = useToast();
    const [selectedLenderId, setSelectedLenderId] = useState<string | null>(null);
    const [isAssigning, setIsAssigning] = useState(false);
    const [phoneCopied, setPhoneCopied] = useState(false);

    const handleCopyPhone = async () => {
        try {
            await navigator.clipboard.writeText(`+91${studentPhone}`);
            setPhoneCopied(true);
            toast({ title: 'Phone copied!' });
            setTimeout(() => setPhoneCopied(false), 2000);
        } catch {
            toast({ title: 'Failed to copy', variant: 'destructive' });
        }
    };

    const handleAssignLender = async () => {
        if (!selectedLenderId) return;

        setIsAssigning(true);
        try {
            const { error } = await supabase
                .from('leads_new')
                .update({ target_lender_id: selectedLenderId })
                .eq('id', lead.id);

            if (error) throw error;

            toast({
                title: 'Lender Assigned!',
                description: `Lead ${lead.case_id} assigned successfully.`
            });
            onComplete();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            toast({
                title: 'Failed to assign lender',
                description: err.message,
                variant: 'destructive'
            });
        } finally {
            setIsAssigning(false);
        }
    };

    const getScoreColor = (score?: number) => {
        if (!score) return 'bg-muted text-muted-foreground';
        if (score >= 80) return 'bg-emerald-100 text-emerald-700';
        if (score >= 60) return 'bg-blue-100 text-blue-700';
        if (score >= 40) return 'bg-amber-100 text-amber-700';
        return 'bg-red-100 text-red-700';
    };

    const getFlagEmoji = (country: string) => {
        const flags: Record<string, string> = {
            'United States': '🇺🇸', 'USA': '🇺🇸',
            'United Kingdom': '🇬🇧', 'UK': '🇬🇧',
            'Canada': '🇨🇦', 'Australia': '🇦🇺',
            'Germany': '🇩🇪', 'Ireland': '🇮🇪',
            'New Zealand': '🇳🇿', 'Singapore': '🇸🇬',
        };
        return flags[country] || '🌍';
    };

    return (
        <div className="space-y-6">
            {/* Success Header */}
            <div className="text-center py-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 mb-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Lead Created Successfully!</h3>
                <p className="text-sm text-slate-600">Case ID: <span className="font-mono font-semibold">{lead.case_id}</span></p>
            </div>

            {/* Lead Summary */}
            <Card className="border-slate-200">
                <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-wide">Student</p>
                            <p className="font-semibold truncate">{studentName}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-wide">Amount</p>
                            <p className="font-semibold">₹{formatIndianNumber(lead.requested_amount)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-wide">Destination</p>
                            <p className="font-semibold">{getFlagEmoji(studyDestination)} {studyDestination}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Call Customer Panel */}
            <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <PhoneCall className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Call Customer to Confirm</p>
                                <p className="font-bold text-lg">+91 {studentPhone.replace(/(\d{5})(\d{5})/, '$1 $2')}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopyPhone}
                                className="gap-1.5"
                            >
                                {phoneCopied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {phoneCopied ? 'Copied' : 'Copy'}
                            </Button>
                            <Button
                                size="sm"
                                className="gap-1.5"
                                asChild
                            >
                                <a href={`tel:+91${studentPhone}`}>
                                    <Phone className="w-4 h-4" />
                                    Call
                                </a>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Separator />

            {/* Lender Selection */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Select Lender</h4>
                    <Badge variant="secondary" className="text-xs">
                        {recommendedLenders.length} options
                    </Badge>
                </div>

                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                    {recommendedLenders.length > 0 ? (
                        recommendedLenders.map((lender, index) => (
                            <button
                                key={lender.lender_id}
                                onClick={() => setSelectedLenderId(lender.lender_id)}
                                className={cn(
                                    "w-full p-3 rounded-lg border-2 text-left transition-all",
                                    selectedLenderId === lender.lender_id
                                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                )}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                            {index === 0 ? (
                                                <Trophy className="w-5 h-5 text-amber-500" />
                                            ) : (
                                                <Building2 className="w-5 h-5 text-slate-400" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm truncate">{lender.lender_name}</span>
                                                {lender.is_preferred && (
                                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                {lender.interest_rate_min && (
                                                    <span>From {lender.interest_rate_min}%</span>
                                                )}
                                                {lender.lender_description && (
                                                    <span className="truncate">{lender.lender_description}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {lender.compatibility_score && (
                                            <Badge className={cn("text-xs", getScoreColor(lender.compatibility_score))}>
                                                {lender.compatibility_score}%
                                            </Badge>
                                        )}
                                        {selectedLenderId === lender.lender_id && (
                                            <CheckCircle2 className="w-5 h-5 text-primary" />
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No lender recommendations available</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
                <Button
                    variant="outline"
                    onClick={onSkip}
                    className="flex-1"
                >
                    Skip for Now
                </Button>
                <Button
                    onClick={handleAssignLender}
                    disabled={!selectedLenderId || isAssigning}
                    className="flex-1 gap-2"
                >
                    {isAssigning ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <ArrowRight className="w-4 h-4" />
                    )}
                    Assign Lender
                </Button>
            </div>
        </div>
    );
}
