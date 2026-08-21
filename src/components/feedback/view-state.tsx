type ViewStateProps = {
  title: string;
  detail: string;
};

export function ViewState({ title, detail }: ViewStateProps) {
  return (
    <section className="rounded-2xl border border-dashed border-sky-200 bg-white p-6" aria-live="polite">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{detail}</p>
    </section>
  );
}
