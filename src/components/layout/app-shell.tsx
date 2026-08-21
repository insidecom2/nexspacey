import type { ReactNode } from "react";
import { SiteNav } from "@/components/layout/site-nav";

type AppShellProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function AppShell({ title, description, children }: AppShellProps) {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
        <header className="mb-10 max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-sky-700">Nexspacey</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-base text-slate-600">{description}</p>
        </header>
        {children}
      </main>
    </>
  );
}
