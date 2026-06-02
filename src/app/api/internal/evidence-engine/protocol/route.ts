import { NextResponse } from "next/server";
import { buildEvidenceEngineProtocol } from "@/lib/evidence-engine/client";

export const runtime = "nodejs";

const supportedFrameworks = new Set(["PICO", "PECO", "PICOC", "CoCoPop", "SPICE", "ECLIPSE"]);

function cleanString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON request body is required." }, { status: 400 });
  }

  const question = cleanString(body.question, 1200);
  const requestedFramework = cleanString(body.framework, 24);
  const normalizedFramework = requestedFramework === "PICOT" ? "PICO" : requestedFramework;
  const framework = supportedFrameworks.has(normalizedFramework) ? normalizedFramework : undefined;

  if (!question) {
    return NextResponse.json({ ok: false, error: "A question is required before protocol auto-fill." }, { status: 400 });
  }

  try {
    const protocol = await buildEvidenceEngineProtocol({ question, framework });
    return NextResponse.json({
      ok: true,
      engineConnected: true,
      internalOnly: true,
      protocol,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        engineConnected: false,
        internalOnly: true,
        error: error instanceof Error ? error.message : "Protocol auto-fill failed.",
      },
      { status: 502 },
    );
  }
}
