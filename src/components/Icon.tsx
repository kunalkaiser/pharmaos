type IconName =
  | "arrow"
  | "ask"
  | "audit"
  | "chain"
  | "check"
  | "database"
  | "governance"
  | "layers"
  | "network"
  | "source"
  | "spark"
  | "target";

const paths: Record<IconName, string> = {
  arrow: "M5 12h14m-6-6 6 6-6 6",
  ask: "M11 19a8 8 0 1 1 5.3-2l3.2 3.2-1.8 1.8-3.1-3.1A8 8 0 0 1 11 19Zm0-11v4l3 2",
  audit: "M8 4h8l3 3v13H5V4h3Zm8 0v4h4M8 12h8M8 16h6",
  chain: "M8 12h8m-9 4H6a4 4 0 0 1 0-8h3m6 0h3a4 4 0 0 1 0 8h-3",
  check: "m5 12 4 4L19 6",
  database: "M5 7c0-2 14-2 14 0v10c0 2-14 2-14 0V7Zm0 0c0 2 14 2 14 0M5 12c0 2 14 2 14 0",
  governance: "M12 3 19 6v5c0 5-3.2 8.1-7 10-3.8-1.9-7-5-7-10V6l7-3Z",
  layers: "m12 3 9 5-9 5-9-5 9-5Zm-7 9 7 4 7-4M5 16l7 4 7-4",
  network: "M6 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 7l8 10M16 7 8 17",
  source: "M6 4h12v16H6V4Zm3 4h6M9 12h6M9 16h4",
  spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm6 12 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-3a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
};

export function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={paths[name]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
