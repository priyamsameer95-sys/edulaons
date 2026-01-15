import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface ErrorBannerProps {
    title?: string;
    message: string;
    className?: string;
}

export function ErrorBanner({ title = "Action Required", message, className }: ErrorBannerProps) {
    if (!message) return null;

    return (
        <Alert variant="destructive" className={cn("bg-red-50 border-red-200 text-red-900", className)}>
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-700 font-semibold ml-2">{title}</AlertTitle>
            <AlertDescription className="text-red-600 ml-2">
                {message}
            </AlertDescription>
        </Alert>
    );
}
