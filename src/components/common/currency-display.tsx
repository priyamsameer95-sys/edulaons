import { formatIndianNumber, convertINRToWords } from "@/utils/currencyFormatter";
import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
    amount: number | string;
    showWords?: boolean;
    currencySymbol?: string;
    className?: string;
    wordsClassName?: string;
}

export function CurrencyDisplay({
    amount,
    showWords = false,
    currencySymbol = "₹",
    className,
    wordsClassName
}: CurrencyDisplayProps) {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.]/g, '')) : amount;

    if (isNaN(numericAmount)) return <span className={className}>-</span>;

    const formatted = formatIndianNumber(numericAmount);
    const words = showWords ? convertINRToWords(numericAmount) : null;

    return (
        <div className="flex flex-col">
            <span className={cn("font-medium text-gray-900", className)}>
                {currencySymbol}{formatted}
            </span>
            {showWords && words && (
                <span className={cn("text-xs text-muted-foreground capitalize mt-0.5", wordsClassName)}>
                    {words}
                </span>
            )}
        </div>
    );
}
