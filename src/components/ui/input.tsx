import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) { return <input className={cn("min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none placeholder:text-slate-400 focus:border-sky-700 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-100", className)} {...props} />; }
