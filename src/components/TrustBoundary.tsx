import Link from "next/link";

export function TrustBoundary({
  title = "Preview boundary",
  copy,
  href = "/data-methodology",
  linkLabel = "Review methodology",
}: {
  title?: string;
  copy: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <aside className="rounded-3xl border border-orange-200 bg-orange-50 p-5">
      <p className="text-sm font-semibold text-orange-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-orange-900">{copy}</p>
      <Link href={href} className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
        {linkLabel}
      </Link>
    </aside>
  );
}
