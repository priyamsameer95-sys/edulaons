/**
 * Document Verification Badge
 * 
 * Shows AI verification status on document cards.
 * Displays: Verified, Mismatch Warning, Pending, or Not Verified.
 */

import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger
} from '@/components/ui/tooltip';
import {
    CheckCircle2,
    AlertTriangle,
    Clock,
    HelpCircle,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentVerificationBadgeProps {
    aiVerified?: boolean | null;
    aiConfidenceScore?: number | null;
    aiMismatchFlag?: boolean | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    aiExtractedData?: any | null;
    className?: string;
}

export function DocumentVerificationBadge({
    aiVerified,
    aiConfidenceScore,
    aiMismatchFlag,
    aiExtractedData,
    className,
}: DocumentVerificationBadgeProps) {
    // Determine status
    const getStatus = () => {
        if (aiVerified === null || aiVerified === undefined) {
            return 'pending';
        }
        if (aiVerified && !aiMismatchFlag && (aiConfidenceScore || 0) >= 0.8) {
            return 'verified';
        }
        if (aiMismatchFlag) {
            return 'mismatch';
        }
        if (aiVerified && (aiConfidenceScore || 0) < 0.5) {
            return 'low_confidence';
        }
        return 'checked';
    };

    const status = getStatus();

    const statusConfig = {
        verified: {
            icon: CheckCircle2,
            label: 'AI Verified',
            tooltip: `Verified with ${Math.round((aiConfidenceScore || 0) * 100)}% confidence`,
            className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        },
        mismatch: {
            icon: AlertTriangle,
            label: 'Mismatch',
            tooltip: 'AI found potential discrepancies - review recommended',
            className: 'bg-amber-100 text-amber-700 border-amber-200',
        },
        low_confidence: {
            icon: HelpCircle,
            label: 'Low Conf.',
            tooltip: 'AI verification has low confidence - manual review needed',
            className: 'bg-slate-100 text-slate-600 border-slate-200',
        },
        checked: {
            icon: Sparkles,
            label: 'AI Checked',
            tooltip: 'Document processed by AI',
            className: 'bg-blue-100 text-blue-700 border-blue-200',
        },
        pending: {
            icon: Clock,
            label: 'Pending',
            tooltip: 'Awaiting AI verification',
            className: 'bg-slate-50 text-slate-500 border-slate-200',
        },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Badge
                    variant="outline"
                    className={cn(
                        "gap-1 text-[10px] h-5 px-1.5 cursor-help",
                        config.className,
                        className
                    )}
                >
                    <Icon className="h-3 w-3" />
                    {config.label}
                </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px]">
                <p className="text-xs">{config.tooltip}</p>
                {aiExtractedData?.parsing_notes?.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {aiExtractedData.parsing_notes[0]}
                    </p>
                )}
            </TooltipContent>
        </Tooltip>
    );
}
