import type { HTMLAttributes } from "react";
import { cn } from "./cn";

type BadgeVariant = "primary" | "success" | "warning" | "neutral" | "overlay";

const badgeVariants: Record<BadgeVariant, string> = {
  primary: "bg-primary-50 text-primary-700",
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  neutral: "bg-gray-100 text-gray-600",
  overlay: "bg-white/95 text-gray-800 shadow-sm",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  variant = "primary",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
