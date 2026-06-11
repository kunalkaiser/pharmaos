import "server-only";

export function sanitizeQuery(query: string) {
  return query.trim().replace(/\s+/g, " ").slice(0, 500);
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function stableCandidateId(providerId: string, identifier: string) {
  return `${providerId}:${identifier}`.replace(/\s+/g, "-").toLowerCase();
}

export async function fetchJson<T>(url: string, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: "application/json",
        "user-agent": "EvidaraOS internal source connector; contact: internal-development",
      },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json() as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchText(url: string, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: "application/xml,text/xml,text/plain,*/*",
        "user-agent": "EvidaraOS internal source connector; contact: internal-development",
      },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export function xmlText(input: string, tag: string) {
  const match = input.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decodeXml(match?.[1]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ?? "");
}

export function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function parseRssItems(xml: string) {
  return [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)].map((match) => {
    const item = match[0];
    return {
      title: xmlText(item, "title"),
      link: xmlText(item, "link"),
      description: xmlText(item, "description"),
      pubDate: xmlText(item, "pubDate"),
      guid: xmlText(item, "guid"),
    };
  });
}
