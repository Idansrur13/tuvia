/** מחבר מחלקות CSS ומסנן ערכים ריקים. */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
