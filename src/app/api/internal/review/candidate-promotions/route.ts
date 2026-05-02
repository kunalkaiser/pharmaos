import { NextResponse } from "next/server";
import { listEvidenceFoundationRecords, promoteEvidenceCandidate } from "@/lib/evidence-foundation";
import type { EvidenceCandidate } from "@/lib/connectors/types";
import type { EvidenceRecordType, HumanReviewStatus } from "@/lib/evidence-foundation";

export const runtime = "nodejs";

const evidenceRecordTypes: EvidenceRecordType[] = [
  "disease_overview",
  "incidence",
  "prevalence",
  "patient_population",
  "clinical_trial_landscape",
  "treatment_landscape",
  "unmet_need",
  "limitation",
];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isEvidenceCandidate(value: unknown): value is EvidenceCandidate {
  if (!isObject(value)) return false;
  return (
    typeof value.candidateId === "string" &&
    typeof value.sourceProvider === "string" &&
    typeof value.sourceTitle === "string" &&
    typeof value.sourceUrl === "string" &&
    value.candidateOnly === true &&
    value.generatedClaim === false &&
    Array.isArray(value.limitationNotes)
  );
}

function reviewStatus(value: unknown): Extract<HumanReviewStatus, "reviewed" | "approved"> | null {
  return value === "reviewed" || value === "approved" ? value : null;
}

export async function GET() {
  const store = await listEvidenceFoundationRecords();
  return NextResponse.json({
    ok: true,
    generatedClaims: false,
    fakeRows: false,
    candidatePromotions: store.candidatePromotions,
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!isObject(body)) return NextResponse.json({ ok: false, error: "Request body must be an object." }, { status: 400 });
  if (!isEvidenceCandidate(body.candidate)) {
    return NextResponse.json({ ok: false, error: "A real EvidenceCandidate with candidateOnly=true and generatedClaim=false is required." }, { status: 400 });
  }

  const humanReviewStatus = reviewStatus(body.humanReviewStatus);
  if (!humanReviewStatus) return NextResponse.json({ ok: false, error: "humanReviewStatus must be reviewed or approved." }, { status: 400 });
  if (body.reviewerAttestation !== true) return NextResponse.json({ ok: false, error: "reviewerAttestation=true is required." }, { status: 400 });
  if (typeof body.citationText !== "string" || body.citationText.trim().length < 8) {
    return NextResponse.json({ ok: false, error: "citationText is required and must be human reviewed." }, { status: 400 });
  }
  if (typeof body.reviewNotes !== "string" || body.reviewNotes.trim().length < 8) {
    return NextResponse.json({ ok: false, error: "reviewNotes are required." }, { status: 400 });
  }

  let evidenceRecord;
  if (isObject(body.evidenceRecord)) {
    if (typeof body.evidenceRecord.evidencePacketId !== "string") {
      return NextResponse.json({ ok: false, error: "evidenceRecord.evidencePacketId is required when creating an evidence record." }, { status: 400 });
    }
    if (!evidenceRecordTypes.includes(body.evidenceRecord.recordType as EvidenceRecordType)) {
      return NextResponse.json({ ok: false, error: "evidenceRecord.recordType is invalid." }, { status: 400 });
    }
    if (typeof body.evidenceRecord.claimText !== "string" || body.evidenceRecord.claimText.trim().length < 12) {
      return NextResponse.json({ ok: false, error: "Human-supplied evidenceRecord.claimText is required." }, { status: 400 });
    }
    evidenceRecord = {
      evidencePacketId: body.evidenceRecord.evidencePacketId,
      recordType: body.evidenceRecord.recordType as EvidenceRecordType,
      claimText: body.evidenceRecord.claimText,
      extractedField: typeof body.evidenceRecord.extractedField === "string" ? body.evidenceRecord.extractedField : undefined,
      valueText: typeof body.evidenceRecord.valueText === "string" ? body.evidenceRecord.valueText : undefined,
      unit: typeof body.evidenceRecord.unit === "string" ? body.evidenceRecord.unit : undefined,
      geography: typeof body.evidenceRecord.geography === "string" ? body.evidenceRecord.geography : undefined,
      limitationNotes: typeof body.evidenceRecord.limitationNotes === "string" ? body.evidenceRecord.limitationNotes : undefined,
    };
  }

  try {
    const result = await promoteEvidenceCandidate({
      candidate: body.candidate,
      queryRunId: typeof body.queryRunId === "string" ? body.queryRunId : undefined,
      citationText: body.citationText,
      extractedField: typeof body.extractedField === "string" ? body.extractedField : undefined,
      humanReviewStatus,
      reviewNotes: body.reviewNotes,
      reviewerAttestation: true,
      reviewerType: "anonymous_internal",
      limitationNotes: typeof body.limitationNotes === "string" ? body.limitationNotes : undefined,
      evidenceRecord,
    });

    return NextResponse.json({
      ok: true,
      generatedClaims: false,
      candidateOnly: true,
      promotion: result.promotion,
      source: result.source,
      citation: result.citation,
      evidenceRecord: result.evidenceRecord,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Candidate promotion failed." }, { status: 400 });
  }
}
