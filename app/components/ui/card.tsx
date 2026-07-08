import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import { Text } from "./text";

/* ---------- Card ---------- */

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-100 bg-white p-5 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

/* ---------- StatCard (כרטיס מדד לדשבורד) ---------- */

export interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, hint, icon, className }: StatCardProps) {
  return (
    <Card className={cn("flex items-start justify-between gap-3", className)}>
      <div>
        <Text as="span" variant="muted">
          {label}
        </Text>
        <p className="mt-1 text-2xl font-extrabold text-gray-900">{value}</p>
        {hint && (
          <Text as="p" variant="small" className="mt-1">
            {hint}
          </Text>
        )}
      </div>
      {icon && (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          {icon}
        </span>
      )}
    </Card>
  );
}
