import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

/* ---------- Button ---------- */

type ButtonVariant = "primary" | "outline" | "ghost" | "white";
type ButtonSize = "sm" | "md" | "lg";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-linear-to-br from-primary-500 to-primary-600 text-white shadow-brand hover:from-primary-400 hover:to-primary-600 active:scale-[0.98]",
  outline:
    "border border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-700",
  ghost: "text-gray-700 hover:bg-gray-100",
  white: "bg-white text-primary-600 shadow-lg hover:bg-primary-50",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "px-4 py-1.5 text-sm",
  md: "px-5 py-2 text-sm",
  lg: "px-8 py-3",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "rounded-full font-semibold transition",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    />
  );
}

/* ---------- IconButton ---------- */

type IconButtonVariant = "solid" | "overlay";

const iconButtonVariants: Record<IconButtonVariant, string> = {
  solid: "h-9 w-9 bg-primary-500 text-white hover:bg-primary-600",
  overlay:
    "bg-white/90 p-1.5 text-gray-700 shadow hover:scale-105 hover:bg-white",
};

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  /** חובה לכפתור ללא טקסט */
  "aria-label": string;
}

export function IconButton({
  variant = "solid",
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full transition",
        iconButtonVariants[variant],
        className,
      )}
      {...props}
    />
  );
}

/* ---------- Chip (כפתור סינון/קטגוריה) ---------- */

type ChipSize = "sm" | "md";
type ChipTone = "primary" | "danger";

const chipSizes: Record<ChipSize, string> = {
  sm: "gap-1.5 px-3 py-1.5 text-xs",
  md: "gap-2 px-4 py-2 text-sm",
};

const chipActiveTones: Record<ChipTone, string> = {
  primary: "border-primary-500 bg-primary-50 text-primary-700",
  danger: "border-danger-500 bg-danger-50 text-danger-700",
};

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: ReactNode;
  size?: ChipSize;
  /** צבע מצב פעיל — danger לסינונים של דחיפות/איחור */
  tone?: ChipTone;
}

export function Chip({
  active,
  icon,
  size = "md",
  tone = "primary",
  className,
  children,
  ...props
}: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex shrink-0 items-center rounded-full border font-medium transition",
        chipSizes[size],
        active
          ? chipActiveTones[tone]
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900",
        className,
      )}
      {...props}
    >
      {icon && <span aria-hidden>{icon}</span>}
      {children}
    </button>
  );
}

/* ---------- ToggleGroup (מתג בחירה אחת מתוך כמה) ---------- */

type ToggleGroupSize = "sm" | "md";

const toggleGroupSizes: Record<ToggleGroupSize, string> = {
  sm: "gap-1.5 px-3 py-1.5 text-xs",
  md: "gap-2 px-6 py-2 text-sm",
};

export interface ToggleGroupProps<T extends string> {
  /** [ערך, תווית] — התווית יכולה לכלול אייקון */
  options: ReadonlyArray<readonly [T, ReactNode]>;
  value: T;
  onChange: (value: T) => void;
  size?: ToggleGroupSize;
  className?: string;
}

export function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  className,
}: ToggleGroupProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm",
        className,
      )}
    >
      {options.map(([optionValue, label]) => (
        <button
          key={optionValue}
          type="button"
          onClick={() => onChange(optionValue)}
          className={cn(
            "flex items-center rounded-full font-semibold transition",
            toggleGroupSizes[size],
            value === optionValue
              ? "bg-primary-500 text-white shadow"
              : "text-gray-600 hover:text-gray-900",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
