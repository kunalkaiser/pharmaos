import Link from "next/link";

const groups = [
  {
    title: "Start",
    links: [
      ["Run Analysis", "/api/preview-access?token=evidaraos-preview-access"],
      ["Request demo", "/demo"],
      ["How it works", "/query-journey"],
    ],
  },
  {
    title: "Learn",
    links: [
      ["Solutions", "/solutions"],
      ["Resources", "/resources"],
      ["Company", "/company"],
    ],
  },
  {
    title: "Diligence",
    links: [
      ["Architecture Status", "/architecture"],
      ["Data & Methodology", "/data-methodology"],
      ["Trust", "/security-trust"],
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
            A source-linked biomedical evidence workbench for teams that need reports, review queues, document extraction, charts, and governance boundaries without hiding the method.
          </p>
          <Link href="/api/preview-access?token=evidaraos-preview-access" className="mt-5 inline-flex rounded-full bg-teal-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-teal-400">
            Start evidence run
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">{group.title}</p>
              <div className="mt-3 space-y-2">
                {group.links.map(([label, href]) => (
                  <Link key={`${group.title}-${label}-${href}`} href={href} className="block text-sm text-slate-300 hover:text-white">
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
