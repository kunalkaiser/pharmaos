import { Icon } from "./Icon";

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const accentStyles = {
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  teal: "border-teal-200 bg-teal-50 text-teal-800",
  purple: "border-violet-200 bg-violet-50 text-violet-800",
  green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  orange: "border-orange-200 bg-orange-50 text-orange-800",
  slate: "border-slate-200 bg-slate-100 text-slate-800",
} as const;

export function DetailPanel({
  eyebrow,
  title,
  description,
  details,
  trust,
}: {
  eyebrow: string;
  title: string;
  description: string;
  details: string[];
  trust?: string;
}) {
  return (
    <aside className="animate-fade-in rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-5 space-y-2">
        {details.map((detail) => (
          <div key={detail} className="flex gap-2 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
            <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
            <span>{detail}</span>
          </div>
        ))}
      </div>
      {trust ? (
        <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">White-box trust point</p>
          <p className="mt-2 text-sm leading-6 text-teal-950">{trust}</p>
        </div>
      ) : null}
    </aside>
  );
}
