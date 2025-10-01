import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-button hover:bg-primary-hover hover:shadow-button-hover active:bg-primary-active active:shadow-button-active disabled:bg-primary-disabled disabled:shadow-none",
        destructive: "bg-destructive text-destructive-foreground shadow-button hover:bg-destructive-hover hover:shadow-button-hover active:bg-destructive-active active:shadow-button-active disabled:bg-destructive-disabled disabled:shadow-none",
        outline: "border-2 border-input bg-background text-foreground shadow-button hover:border-input-hover hover:bg-secondary hover:shadow-button-hover active:bg-secondary-active active:shadow-button-active disabled:border-border disabled:bg-background disabled:text-muted-foreground disabled:shadow-none",
        secondary: "bg-secondary text-secondary-foreground shadow-button hover:bg-secondary-hover hover:shadow-button-hover active:bg-secondary-active active:shadow-button-active disabled:bg-secondary-disabled disabled:text-muted-foreground disabled:shadow-none",
        ghost: "hover:bg-secondary hover:text-secondary-foreground active:bg-secondary-active disabled:text-muted-foreground",
        link: "text-link underline-offset-4 hover:underline hover:text-link-hover active:text-link-active disabled:text-muted-foreground disabled:no-underline",
        success: "bg-success text-success-foreground shadow-button hover:bg-success-hover hover:shadow-button-hover active:bg-success-active active:shadow-button-active disabled:opacity-50 disabled:shadow-none",
        warning: "bg-warning text-warning-foreground shadow-button hover:bg-warning-hover hover:shadow-button-hover active:bg-warning-active active:shadow-button-active disabled:opacity-50 disabled:shadow-none",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
