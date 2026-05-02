import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { dbQuery } from "@/lib/db/client";

export type ImmutableAuditEventInput = {
  organizationId?: string;
  actorId?: string;
  actorType?: "system" | "user" | "admin";
  eventType: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
};

export function auditEventHash(input: ImmutableAuditEventInput & { id: string; previousEventHash?: string }) {
  return createHash("sha256")
    .update(JSON.stringify({
      id: input.id,
      organizationId: input.organizationId ?? null,
      actorId: input.actorId ?? null,
      actorType: input.actorType ?? "system",
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? {},
      previousEventHash: input.previousEventHash ?? null,
      createdAt: input.createdAt,
    }))
    .digest("hex");
}

export async function appendImmutableAuditLog(input: ImmutableAuditEventInput) {
  const id = randomUUID();
  const createdAt = input.createdAt ?? new Date().toISOString();
  const previousResult = await dbQuery<{ event_hash: string | null }>(
    "SELECT event_hash FROM audit_logs WHERE event_hash IS NOT NULL ORDER BY created_at DESC LIMIT 1",
  );
  const previousEventHash = previousResult.rows[0]?.event_hash ?? undefined;
  const eventHash = auditEventHash({ ...input, id, createdAt, previousEventHash });

  await dbQuery(
    `INSERT INTO audit_logs (
      id, organization_id, actor_id, actor_type, event_type, entity_type, entity_id,
      metadata_json, previous_event_hash, event_hash, created_at
    ) VALUES ($1,$2::uuid,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11)`,
    [
      id,
      input.organizationId ?? null,
      input.actorId ?? null,
      input.actorType ?? "system",
      input.eventType,
      input.entityType,
      input.entityId ?? null,
      JSON.stringify(input.metadata ?? {}),
      previousEventHash ?? null,
      eventHash,
      createdAt,
    ],
  );

  return { id, previousEventHash, eventHash, createdAt };
}
