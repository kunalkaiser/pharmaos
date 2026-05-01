import Link from "next/link";

const links = [
  { href: "/", label: "Platform" },
  { href: "/solutions", label: "Solutions" },
  { href: "/evidence-engine", label: "Evidence Engine" },
  { href: "/data-methodology", label: "Data & Methodology" },
  { href: "/security-trust", label: "Security / Trust" },
  { href: "/resources", label: "Resources" },
  { href: "/company", label: "Company" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/92 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-5 py-4 md:px-8">
        <Link href="/" className="mr-auto flex items-center gap-3 text-slate-950">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white">EO</span>
          <span className="text-base font-semibold tracking-tight">EvidaraOS</span>
        </Link>
        <div className="flex flex-wrap items-center gap-1">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
              {link.label}
            </Link>
          ))}
        </div>
        <Link href="/demo" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
          Request Access
        </Link>
      </nav>
    </header>
  );
}
