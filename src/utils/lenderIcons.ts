import { 
  GraduationCap, 
  BookOpen, 
  Plane, 
  Home, 
  Shield,
  LucideIcon
} from 'lucide-react';

// Shared icon mapping for lender eligible expenses
export const expenseIconMap: Record<string, LucideIcon> = {
  GraduationCap,
  BookOpen,
  Plane,
  Home,
  Shield
};

// Get icon component by name, with fallback
export const getExpenseIcon = (iconName: string): LucideIcon => {
  return expenseIconMap[iconName] || GraduationCap;
};
