import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataPointProps {
    points: string[];
    variant?: "feature" | "insight"; // feature = Check (Green), insight = Sparkle (Gold)
    className?: string;
}

export function DataPoints({ points, variant = "feature", className }: DataPointProps) {
    if (!points || points.length === 0) return null;

    return (
        <ul className={cn("space-y-2", className)}>
            {points.map((point, index) => (
                <li key={index} className="flex items-start gap-2.5">
                    {variant === "feature" ? (
                        <div className="mt-0.5 flex-shrink-0 rounded-full bg-emerald-50 p-0.5">
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                    ) : (
                        <div className="mt-0.5 flex-shrink-0 rounded-full bg-amber-50 p-0.5">
                            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                        </div>
                    )}
                    <span className="text-sm text-gray-600 leading-tight">
                        {point}
                    </span>
                </li>
            ))}
        </ul>
    );
}
