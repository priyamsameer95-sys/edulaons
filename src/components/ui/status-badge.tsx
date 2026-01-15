import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const statusBadgeVariants = cva(
    "text-xs font-semibold px-2.5 py-0.5 rounded-full border shadow-sm transition-colors",
    {
        variants: {
            status: {
                default: "bg-gray-100 text-gray-700 border-gray-200", // Incomplete / Draft
                success: "bg-emerald-50 text-emerald-700 border-emerald-200", // Sanctioned
                warning: "bg-amber-50 text-amber-700 border-amber-200", // Top Choice / Pending
                info: "bg-blue-50 text-blue-700 border-blue-200", // Disbursed / Active
                destructive: "bg-red-50 text-red-700 border-red-200", // Declined
                outline: "bg-transparent border-gray-300 text-gray-600",
            },
        },
        defaultVariants: {
            status: "default",
        },
    }
);

export interface StatusBadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
    status?: "default" | "success" | "warning" | "info" | "destructive" | "outline";
}

export function StatusBadge({ className, status, ...props }: StatusBadgeProps) {
    return (
        <div className={cn(statusBadgeVariants({ status }), className)} {...props} />
    );
}
