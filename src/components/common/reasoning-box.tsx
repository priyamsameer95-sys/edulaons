import { DataPoints } from "@/components/ui/data-points";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface ReasoningBoxProps {
    title?: string;
    points: string[];
    variant?: "feature" | "insight";
    className?: string;
}

export function ReasoningBox({
    title = "Why This Lender?",
    points,
    variant = "insight",
    className
}: ReasoningBoxProps) {
    if (!points || points.length === 0) return null;

    const isInsight = variant === "insight";

    return (
        <div className={cn(
            "rounded-lg p-4 border",
            isInsight
                ? "bg-warning-light/50 border-warning/30"
                : "bg-muted/50 border-border",
            className
        )}>
            <div className="flex items-center gap-2 mb-3">
                {isInsight && <Sparkles className="h-4 w-4 text-warning" />}
                <h4 className={cn(
                    "font-semibold text-sm",
                    isInsight ? "text-warning-dark" : "text-foreground"
                )}>
                    {title}
                </h4>
            </div>

            <DataPoints
                points={points}
                variant={variant}
                className="pl-1"
            />
        </div>
    );
}
