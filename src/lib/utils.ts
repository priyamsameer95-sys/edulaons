import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertNumberToWords(amount: number): string {
  if (amount === 0) return "Zero";
  if (amount < 0) return "Negative " + convertNumberToWords(Math.abs(amount));
  if (isNaN(amount)) return "";

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertHundreds(num: number): string {
    let result = "";
    
    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + " Hundred ";
      num %= 100;
    }
    
    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + " ";
      num %= 10;
    } else if (num >= 10) {
      result += teens[num - 10] + " ";
      return result.trim();
    }
    
    if (num > 0) {
      result += ones[num] + " ";
    }
    
    return result.trim();
  }

  let result = "";
  
  // Handle crores
  if (amount >= 10000000) {
    result += convertHundreds(Math.floor(amount / 10000000)) + " Crore ";
    amount %= 10000000;
  }
  
  // Handle lakhs
  if (amount >= 100000) {
    result += convertHundreds(Math.floor(amount / 100000)) + " Lakh ";
    amount %= 100000;
  }
  
  // Handle thousands
  if (amount >= 1000) {
    result += convertHundreds(Math.floor(amount / 1000)) + " Thousand ";
    amount %= 1000;
  }
  
  // Handle remaining hundreds, tens, and ones
  if (amount > 0) {
    result += convertHundreds(amount);
  }
  
  return result.trim();
}
