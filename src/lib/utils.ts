import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export the proper INR to words converter for backward compatibility
export { convertINRToWords as convertNumberToWords } from '@/utils/currencyFormatter';
