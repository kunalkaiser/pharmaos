import { NextResponse } from "next/server";
import { runEvidenceEngineExport } from "@/lib/evidence-engine/client";

export const runtime = "nodejs";

function cleanString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isExportFormat(value: unknown): value is "markdown" | "pdf" | "pptx" {
  return value === "markdown" || value === "pdf" || value === "pptx";
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON request body is required." }, { status: 400 });
  }

  const title = cleanString(body.title, 240) || "EvidaraOS evidence report";
  const markdown = cleanString(body.markdown, 1_500_000);
  const format = body.format;
  const charts =
    body.charts && typeof body.charts === "object" && !Array.isArray(body.charts)
      ? Object.fromEntries(
          Object.entries(body.charts as Record<string, unknown>)
            .filter(([, value]) => typeof value === "string" && value.includes("<svg"))
            .map(([key, value]) => [key.slice(0, 80), String(value).slice(0, 500_000)]),
        )
      : {};

  if (!markdown) {
    return NextResponse.json({ ok: false, error: "Report markdown is required before export." }, { status: 400 });
  }
  if (!isExportFormat(format)) {
    return NextResponse.json({ ok: false, error: "Unsupported export format." }, { status: 400 });
  }

  try {
    const artifact = await runEvidenceEngineExport({ title, markdown, format, charts });
    const bytes = Buffer.from(artifact.base64_content, "base64");
    return new Response(bytes, {
      headers: {
        "content-type": artifact.media_type,
        "content-disposition": `attachment; filename="${artifact.filename.replace(/"/g, "")}"`,
        "x-evidara-candidate-only": "true",
        "x-evidara-generated-claims": "false",
        "x-evidara-export-warnings": encodeURIComponent(artifact.warnings.join(" | ")),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Evidence engine export failed.",
      },
      { status: 502 },
    );
  }
}
