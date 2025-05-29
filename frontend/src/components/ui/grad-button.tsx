import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "./button";

const gradButtonVariants = cva(
  "relative overflow-hidden transition-all duration-300",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary via-primary/80 to-primary/60 hover:from-primary/90 hover:via-primary/70 hover:to-primary/50 text-primary-foreground",
        success:
          "bg-gradient-to-r from-green-500 via-green-400 to-green-300 hover:from-green-400 hover:via-green-300 hover:to-green-200 text-white",
        warning:
          "bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-300 hover:from-yellow-400 hover:via-yellow-300 hover:to-yellow-200 text-white",
        danger:
          "bg-gradient-to-r from-red-500 via-red-400 to-red-300 hover:from-red-400 hover:via-red-300 hover:to-red-200 text-white",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3",
        lg: "h-10 rounded-md px-6",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface GradButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof gradButtonVariants> {
  asChild?: boolean;
}

const GradButton = React.forwardRef<HTMLButtonElement, GradButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          buttonVariants({ size }),
          gradButtonVariants({ variant, size }),
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-1000 text-background",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
GradButton.displayName = "GradButton";

export { GradButton, gradButtonVariants };
