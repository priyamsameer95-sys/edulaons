import { useCallback } from 'react';

export const useCurrencyFormatter = () => {
    // Format as Indian Currency (e.g. ₹1,20,000)
    const formatCurrency = useCallback((amount: number | string | null | undefined, showSymbol = true) => {
        if (amount === null || amount === undefined || amount === '') return '';

        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(num)) return '';

        const formatted = new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 0,
            minimumFractionDigits: 0,
        }).format(num);

        return showSymbol ? `₹${formatted}` : formatted;
    }, []);

    // Number to Words (Indian System)
    const numberToWords = useCallback((amount: number | string | null | undefined) => {
        if (amount === null || amount === undefined || amount === '') return '';
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(num)) return '';

        // Simple implementation for Lakhs/Crores
        if (num >= 10000000) {
            return `${(num / 10000000).toFixed(2)} Crore`;
        } else if (num >= 100000) {
            return `${(num / 100000).toFixed(2)} Lakh`;
        } else if (num >= 1000) {
            return `${(num / 1000).toFixed(2)} Thousand`;
        }

        return num.toString();
    }, []);

    return { formatCurrency, numberToWords };
};
