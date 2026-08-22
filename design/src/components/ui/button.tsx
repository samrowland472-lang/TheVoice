import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-phosphor/70",
  {
    variants: {
      variant: {
        primary: "bg-phosphor text-phosphor-ink hover:bg-phosphor/90",
        secondary: "border border-border bg-glass text-ink hover:border-phosphor hover:bg-surface-alt",
        ghost: "text-ink-dim hover:bg-surface-alt hover:text-ink",
        danger: "border border-alert/40 text-alert hover:bg-alert/10",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-[8px]",
        md: "h-10 px-4 text-sm rounded-[12px]",
        icon: "size-10 rounded-[12px]",
        "icon-sm": "size-8 rounded-[8px]",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";
