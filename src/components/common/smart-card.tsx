import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SmartCardProps {
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    action?: React.ReactNode; // Top-right action
    footer?: React.ReactNode;
    children: React.ReactNode;
    loading?: boolean;
    className?: string;
    noPadding?: boolean;
}

export function SmartCard({
    title,
    subtitle,
    action,
    footer,
    children,
    loading = false,
    className,
    noPadding = false
}: SmartCardProps) {

    if (loading) {
        return (
            <Card className={cn("w-full border-border/50 shadow-sm", className)}>
                <CardHeader className="space-y-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("w-full bg-white border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200", className)}>
            {(title || subtitle || action) && (
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                    <div className="space-y-1">
                        {title && <CardTitle className="text-lg font-semibold text-primary">{title}</CardTitle>}
                        {subtitle && <CardDescription className="text-sm font-medium text-muted-foreground">{subtitle}</CardDescription>}
                    </div>
                    {action && <div className="ml-4">{action}</div>}
                </CardHeader>
            )}

            <CardContent className={cn(noPadding ? "p-0" : "pt-0")}>
                {children}
            </CardContent>

            {footer && (
                <CardFooter className="bg-gray-50/50 border-t p-4 flex items-center justify-between">
                    {footer}
                </CardFooter>
            )}
        </Card>
    );
}
