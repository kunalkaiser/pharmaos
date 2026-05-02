import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { dbQuery, hasDatabaseUrl } from "@/lib/db/client";

export const runtime = "nodejs";

const allowedReasons = new Set([
  "not_relevant",
  "insufficient_provenance",
  "duplicate",
  "restricted_source",
  "low_quality",
  "not_scientific_evidence",
  "other",
]);

function candidateHash(input: { sourceProvider: string; sourceIdentifier?: string; sourceUrl: string }) {
  return createHash("sha256").update(`${input.sourceProvider}|${input.sourceIdentifier ?? ""}|${input.sourceUrl}`).digest("hex");
}

export async function GET(request: Request) {
  if (!hasDatabaseUrl()) {
    return NextResponse.json({ ok: true, rejections: [], persistence: "not_configured", fakeRows: false });
  }
  const organizationId = request.headers.get("x-evidara-organization-id");
  const result = await dbQuery(
    `SELECT *
     FROM candidate_rejections
     WHERE ($1::uuid IS NULL OR organization_id = $1::uuid)
     ORDER BY rejected_at DESC
     LIMIT 100`,
    [organizationId || null],
  );
  return NextResponse.json({ ok: true, rejections: result.rows, fakeRows: false });
}

export async function POST(request: Request) {
  if (!hasDatabaseUrl()) {
    return NextResponse.json({ ok: false, error: "Candidate rejection requires DATABASE_URL persistence." }, { status: 503 });
  }

  const reviewerId = request.headers.get("x-evidara-actor-id");
  const reviewerEmail = request.headers.get("x-evidara-actor-email");
  const organizationId = request.headers.get("x-evidara-organization-id");
  if (!reviewerId) {
    return NextResponse.json({ ok: false, error: "Authenticated reviewer identity is required. No fake reviewer fallback is allowed." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as {
    queryRunId?: string;
    candidateId?: string;
    sourceProvider?: string;
    sourceIdentifier?: string;
    sourceTitle?: string;
    sourceUrl?: string;
    rejectionReason?: string;
    reviewerNotes?: string;
  } | null;

  if (!body?.candidateId || !body.sourceProvider || !body.sourceTitle || !body.sourceUrl) {
    return NextResponse.json({ ok: false, error: "candidateId, sourceProvider, sourceTitle, and sourceUrl are required." }, { status: 400 });
  }
  if (!body.rejectionReason || !allowedReasons.has(body.rejectionReason)) {
    return NextResponse.json({ ok: false, error: `rejectionReason must be one of: ${[...allowedReasons].join(", ")}` }, { status: 400 });
  }
  if (!body.reviewerNotes?.trim()) {
    return NextResponse.json({ ok: false, error: "reviewerNotes are required for rejection auditability." }, { status: 400 });
  }

  const id = randomUUID();
  const hash = candidateHash({
    sourceProvider: body.sourceProvider,
    sourceIdentifier: body.sourceIdentifier,
    sourceUrl: body.sourceUrl,
  });
  const rejectedAt = new Date().toISOString();

  await dbQuery(
    `INSERT INTO candidate_rejections (
      id, organization_id, query_run_id, candidate_id, candidate_hash, source_provider,
      source_identifier, source_title, source_url, rejection_reason, reviewer_notes,
      reviewer_id, reviewer_email, rejected_at, created_at
    ) VALUES ($1,$2::uuid,$3::uuid,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14)`,
    [
      id,
      organizationId || null,
      body.queryRunId || null,
      body.candidateId,
      hash,
      body.sourceProvider,
      body.sourceIdentifier ?? null,
      body.sourceTitle,
      body.sourceUrl,
      body.rejectionReason,
      body.reviewerNotes.trim(),
      reviewerId,
      reviewerEmail,
      rejectedAt,
    ],
  );

  await dbQuery(
    `INSERT INTO audit_logs (
      id, organization_id, actor_id, actor_type, event_type, entity_type, entity_id, metadata_json, created_at
    ) VALUES ($1,$2::uuid,$3,'user','candidate.rejected','candidate_rejection',$4,$5::jsonb,$6)`,
    [
      randomUUID(),
      organizationId || null,
      reviewerId,
      id,
      JSON.stringify({
        queryRunId: body.queryRunId,
        candidateId: body.candidateId,
        sourceProvider: body.sourceProvider,
        sourceIdentifier: body.sourceIdentifier,
        rejectionReason: body.rejectionReason,
      }),
      rejectedAt,
    ],
  );

  return NextResponse.json({
    ok: true,
    rejection: {
      id,
      candidateId: body.candidateId,
      candidateHash: hash,
      rejectionReason: body.rejectionReason,
      reviewerId,
      reviewerEmail,
      rejectedAt,
    },
    fakeReviewer: false,
    deletedCandidate: false,
  });
}
