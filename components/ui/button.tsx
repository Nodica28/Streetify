import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        signal:
          "bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_1px_0_0_hsl(var(--foreground)/0.06),0_6px_20px_-8px_hsl(var(--accent)/0.55)]",
        outline: "border border-border bg-transparent hover:bg-muted",
        ghost: "hover:bg-muted",
        link: "underline-offset-4 hover:underline text-foreground",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-sm",
        sm: "h-8 px-3 rounded-sm text-xs",
        lg: "h-12 px-6 rounded-sm text-base",
        icon: "h-9 w-9 rounded-sm",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
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
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
