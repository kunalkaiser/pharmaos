import "server-only";

import { randomUUID } from "node:crypto";
import { appendImmutableAuditLog } from "@/lib/audit-integrity";
import { dbQuery, hasDatabaseUrl } from "@/lib/db/client";
import { getReviewedEvidencePacketReport } from "@/lib/evidence-foundation";

const factorWeights = {
  epidemiologyEvidence: 0.25,
  patientPopulationEvidence: 0.15,
  clinicalActivityEvidence: 0.15,
  treatmentLandscapeEvidence: 0.15,
  unmetNeedEvidence: 0.15,
  evidenceMaturity: 0.15,
};

export async function scoreEvidencePacket(input: { evidencePacketId: string; organizationId?: string; createdBy?: string }) {
  const report = await getReviewedEvidencePacketReport(input.evidencePacketId);
  if (!report) return null;
  if (report.evidenceRecords.length === 0) {
    throw new Error("EpiEngine scoring requires reviewed evidence records.");
  }

  const recordsByType = new Map<string, number>();
  for (const record of report.evidenceRecords) {
    recordsByType.set(record.recordType, (recordsByType.get(record.recordType) ?? 0) + 1);
  }

  const factorScores = {
    epidemiologyEvidence: boundedPresence((recordsByType.get("incidence") ?? 0) + (recordsByType.get("prevalence") ?? 0)),
    patientPopulationEvidence: boundedPresence(recordsByType.get("patient_population") ?? 0),
    clinicalActivityEvidence: boundedPresence(recordsByType.get("clinical_trial_landscape") ?? 0),
    treatmentLandscapeEvidence: boundedPresence(recordsByType.get("treatment_landscape") ?? 0),
    unmetNeedEvidence: boundedPresence(recordsByType.get("unmet_need") ?? 0),
    evidenceMaturity: evidenceMaturity(report.citations.map((citation) => citation.extractionConfidence)),
  };

  const weightedScore = Object.entries(factorScores).reduce(
    (sum, [key, value]) => sum + value * factorWeights[key as keyof typeof factorWeights],
    0,
  );
  const score = {
    model: "epi_engine_v1_reviewed_evidence",
    version: "v1",
    evidencePacketId: input.evidencePacketId,
    indication: report.packet.diseaseOrIndication,
    score: Number(weightedScore.toFixed(3)),
    factors: factorScores,
    weights: factorWeights,
    recordCounts: Object.fromEntries(recordsByType),
    explanation: "Score reflects reviewed evidence coverage and maturity only. It is not a causal conclusion, medical advice, regulatory advice, or autonomous indication recommendation.",
    generatedClaims: false,
    reviewerVisible: true,
  };

  const limitations = [
    "Scoring uses reviewed evidence coverage only; it does not infer disease burden from unreviewed candidates.",
    "No black-box recommendation or causal claim is generated.",
    "Human review is required before using scoring in decision materials.",
  ];

  if (hasDatabaseUrl()) {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    await dbQuery(
      `INSERT INTO scoring_runs (
        id, organization_id, evidence_packet_id, scoring_model, scoring_version,
        status, score_json, limitations, generated_claims, reviewer_visible, created_by, created_at
      ) VALUES ($1,$2::uuid,$3,'epi_engine_v1_reviewed_evidence','v1','completed',$4::jsonb,$5,FALSE,TRUE,$6,$7)`,
      [
        id,
        input.organizationId ?? null,
        input.evidencePacketId,
        JSON.stringify(score),
        limitations,
        input.createdBy ?? null,
        createdAt,
      ],
    );
    await appendImmutableAuditLog({
      organizationId: input.organizationId,
      actorId: input.createdBy,
      actorType: input.createdBy ? "user" : "system",
      eventType: "epi_engine.scored",
      entityType: "scoring_run",
      entityId: id,
      createdAt,
      metadata: {
        evidencePacketId: input.evidencePacketId,
        scoringModel: score.model,
        scoringVersion: score.version,
        generatedClaims: false,
      },
    });
    return { id, score, limitations, persisted: true };
  }

  return { id: null, score, limitations, persisted: false };
}

function boundedPresence(count: number) {
  if (count <= 0) return 0;
  if (count === 1) return 0.5;
  return 1;
}

function evidenceMaturity(confidenceLabels: string[]) {
  if (!confidenceLabels.length) return 0;
  const values = confidenceLabels.map((label) => {
    if (label === "manual_reviewed" || label === "high") return 1;
    if (label === "medium") return 0.65;
    if (label === "low") return 0.35;
    return 0.15;
  });
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3));
}
