import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover hover:shadow-sm",
        secondary: "border-transparent bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary-hover hover:shadow-sm",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive-hover hover:shadow-sm",
        success: "border-transparent bg-success text-success-foreground shadow-xs hover:bg-success-hover hover:shadow-sm",
        warning: "border-transparent bg-warning text-warning-foreground shadow-xs hover:bg-warning-hover hover:shadow-sm",
        outline: "text-foreground border-2 hover:bg-secondary hover:border-input-hover",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
