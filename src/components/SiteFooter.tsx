import Link from "next/link";

const groups = [
  {
    title: "Evaluate",
    links: [
      ["Platform", "/"],
      ["Solutions", "/solutions"],
      ["Query Journey", "/query-journey"],
    ],
  },
  {
    title: "Understand",
    links: [
      ["Evidence Engine", "/evidence-engine"],
      ["Architecture", "/architecture"],
      ["Data & Methodology", "/data-methodology"],
    ],
  },
  {
    title: "Trust",
    links: [
      ["Security / Trust", "/security-trust"],
      ["Resources", "/resources"],
      ["Company", "/company"],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 px-5 py-10 text-white md:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.1fr_1.4fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-bold text-slate-950">EO</span>
            <span className="text-base font-semibold tracking-tight">EvidaraOS</span>
          </Link>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
            A white-box pharmaceutical evidence operating system for US biotech and pharma teams evaluating disease burden, evidence strategy, and governed outputs.
          </p>
          <Link href="/demo" className="mt-5 inline-flex rounded-full bg-teal-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-teal-400">
            Request demo
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">{group.title}</p>
              <div className="mt-3 space-y-2">
                {group.links.map(([label, href]) => (
                  <Link key={href} href={href} className="block text-sm text-slate-300 hover:text-white">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
