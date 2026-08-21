import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 disabled:pointer-events-none disabled:opacity-50", { variants: { variant: { default: "bg-sky-700 text-white hover:bg-sky-800", secondary: "border border-slate-300 bg-white text-slate-800 hover:border-sky-300 hover:bg-sky-50", ghost: "text-slate-700 hover:bg-sky-50 hover:text-sky-800", destructive: "bg-red-700 text-white hover:bg-red-800" } }, defaultVariants: { variant: "default" } });
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;
export function Button({ className, variant, ...props }: ButtonProps) { return <button className={cn(buttonVariants({ variant }), className)} {...props} />; }
