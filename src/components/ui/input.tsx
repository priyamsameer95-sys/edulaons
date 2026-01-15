import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ease-out hover:border-primary/50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

// Golden Sample: Floating Label Input
interface FloatingLabelInputProps extends InputProps {
  label: string
}

const FloatingLabelInput = React.forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <div className="relative">
        <Input
          ref={ref}
          id={id}
          className={cn("peer pt-4 pb-1 h-14", className)} // Taller for label
          placeholder=" " // Required for peer-placeholder-shown
          {...props}
        />
        <label
          htmlFor={id}
          className="absolute left-3 top-1 z-10 origin-[0] -translate-y-0 transform text-xs text-muted-foreground duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs peer-focus:text-primary"
        >
          {label}
        </label>
      </div>
    )
  }
)
FloatingLabelInput.displayName = "FloatingLabelInput"

export { Input, FloatingLabelInput };
