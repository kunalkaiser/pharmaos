import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { dbQuery, hasDatabaseUrl } from "@/lib/db/client";
import type { EvidenceEngineDocumentChatResponse } from "@/lib/evidence-engine/types";

const defaultStorageDirectory = process.env.RAILWAY_ENVIRONMENT ? path.join("/tmp", "evidara-data") : path.join(process.cwd(), ".evidara-data");
const storageDirectory = process.env.EVIDARA_STORAGE_DIR ?? defaultStorageDirectory;
const storageFile = path.join(storageDirectory, "evidence-chat.json");

export type EvidenceChatScope = "report" | "sources" | "upload";

export type EvidenceChatConversation = {
  id: string;
  organizationId?: string;
  userId?: string;
  actorId?: string;
  queryRunId?: string;
  scope: EvidenceChatScope;
  title: string;
  sourceTitle?: string;
  sourceHash?: string;
  createdAt: string;
  updatedAt: string;
};

export type EvidenceChatMessage = {
  id: string;
  conversationId: string;
  queryRunId?: string;
  turnIndex: number;
  userMessage: string;
  chatResponse: EvidenceEngineDocumentChatResponse;
  responseHash: string;
  humanReviewRequired: true;
  createdAt: string;
};

type EvidenceChatStore = {
  conversations: EvidenceChatConversation[];
  messages: EvidenceChatMessage[];
};

function now() {
  return new Date().toISOString();
}

function initialStore(): EvidenceChatStore {
  return { conversations: [], messages: [] };
}

async function readStore(): Promise<EvidenceChatStore> {
  try {
    const content = await readFile(storageFile, "utf8");
    return { ...initialStore(), ...(JSON.parse(content) as EvidenceChatStore) };
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return initialStore();
    if (error instanceof SyntaxError) {
      console.warn("[evidence-chat] Local chat store is not valid JSON; starting a fresh preview store.");
      return initialStore();
    }
    throw error;
  }
}

async function writeStore(store: EvidenceChatStore) {
  await mkdir(storageDirectory, { recursive: true });
  const temporaryFile = `${storageFile}.${process.pid}.${Date.now()}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryFile, `${JSON.stringify(store, null, 2)}\n`);
    await rename(temporaryFile, storageFile);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[evidence-chat] Local preview chat store write failed; continuing without durable preview persistence. ${message}`);
  }
}

function hashJson(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function isUuid(value?: string) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

function warnDatabaseFallback(operation: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[evidence-chat] ${operation} failed against Postgres; falling back to local preview chat store. ${message}`);
}

function iso(value?: Date | string | null) {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}

function mapConversation(row: Record<string, unknown>): EvidenceChatConversation {
  return {
    id: String(row.id),
    organizationId: row.organization_id ? String(row.organization_id) : undefined,
    userId: row.user_id ? String(row.user_id) : undefined,
    actorId: row.actor_id ? String(row.actor_id) : undefined,
    queryRunId: row.query_run_id ? String(row.query_run_id) : undefined,
    scope: row.scope as EvidenceChatScope,
    title: String(row.title),
    sourceTitle: row.source_title ? String(row.source_title) : undefined,
    sourceHash: row.source_hash ? String(row.source_hash) : undefined,
    createdAt: iso(row.created_at as Date | string) ?? "",
    updatedAt: iso(row.updated_at as Date | string) ?? "",
  };
}

function mapMessage(row: Record<string, unknown>): EvidenceChatMessage {
  return {
    id: String(row.id),
    conversationId: String(row.conversation_id),
    queryRunId: row.query_run_id ? String(row.query_run_id) : undefined,
    turnIndex: Number(row.turn_index),
    userMessage: String(row.user_message),
    chatResponse: row.chat_response as EvidenceEngineDocumentChatResponse,
    responseHash: String(row.response_hash),
    humanReviewRequired: true,
    createdAt: iso(row.created_at as Date | string) ?? "",
  };
}

export async function listEvidenceChatConversations(input: { actorId?: string; organizationId?: string; limit?: number }) {
  const limit = Math.max(1, Math.min(input.limit ?? 20, 100));
  if (hasDatabaseUrl()) {
    try {
      const result = await dbQuery(
        `SELECT *
         FROM evidence_chat_conversations
         WHERE ($1::uuid IS NULL OR organization_id = $1::uuid)
           AND ($2::text IS NULL OR actor_id = $2::text)
         ORDER BY updated_at DESC
         LIMIT $3`,
        [isUuid(input.organizationId) ? input.organizationId : null, input.actorId ?? null, limit],
      );
      return result.rows.map(mapConversation);
    } catch (error) {
      warnDatabaseFallback("listEvidenceChatConversations", error);
    }
  }
  const store = await readStore();
  return store.conversations
    .filter((item) => (!input.organizationId || item.organizationId === input.organizationId) && (!input.actorId || item.actorId === input.actorId))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit);
}

export async function getEvidenceChatConversation(input: { conversationId: string; actorId?: string; organizationId?: string }) {
  if (hasDatabaseUrl()) {
    try {
      const conversationResult = await dbQuery(
        `SELECT *
         FROM evidence_chat_conversations
         WHERE id = $1
           AND ($2::uuid IS NULL OR organization_id = $2::uuid)
           AND ($3::text IS NULL OR actor_id = $3::text)`,
        [input.conversationId, isUuid(input.organizationId) ? input.organizationId : null, input.actorId ?? null],
      );
      const conversation = conversationResult.rows[0];
      if (!conversation) return null;
      const messageResult = await dbQuery(
        "SELECT * FROM evidence_chat_messages WHERE conversation_id = $1 ORDER BY turn_index, created_at",
        [input.conversationId],
      );
      return { conversation: mapConversation(conversation), messages: messageResult.rows.map(mapMessage) };
    } catch (error) {
      warnDatabaseFallback("getEvidenceChatConversation", error);
    }
  }
  const store = await readStore();
  const conversation = store.conversations.find(
    (item) =>
      item.id === input.conversationId &&
      (!input.organizationId || item.organizationId === input.organizationId) &&
      (!input.actorId || item.actorId === input.actorId),
  );
  if (!conversation) return null;
  return {
    conversation,
    messages: store.messages.filter((item) => item.conversationId === input.conversationId).sort((a, b) => a.turnIndex - b.turnIndex),
  };
}

export async function appendEvidenceChatTurn(input: {
  conversationId?: string;
  organizationId?: string;
  actorId?: string;
  queryRunId?: string;
  scope: EvidenceChatScope;
  title: string;
  sourceTitle?: string;
  sourceHash?: string;
  userMessage: string;
  chatResponse: EvidenceEngineDocumentChatResponse;
}) {
  const timestamp = now();
  const conversationId = input.conversationId || randomUUID();
  const userId = isUuid(input.actorId) ? input.actorId : undefined;
  const organizationId = isUuid(input.organizationId) ? input.organizationId : undefined;
  const responseHash = hashJson(input.chatResponse);

  if (hasDatabaseUrl()) {
    try {
      const conversationResult = await dbQuery(
        `INSERT INTO evidence_chat_conversations (
          id, organization_id, user_id, actor_id, query_run_id, scope, title,
          source_title, source_hash, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)
        ON CONFLICT (id) DO UPDATE SET
          query_run_id = COALESCE(EXCLUDED.query_run_id, evidence_chat_conversations.query_run_id),
          scope = EXCLUDED.scope,
          title = EXCLUDED.title,
          source_title = COALESCE(EXCLUDED.source_title, evidence_chat_conversations.source_title),
          source_hash = COALESCE(EXCLUDED.source_hash, evidence_chat_conversations.source_hash),
          updated_at = EXCLUDED.updated_at
        RETURNING *`,
        [
          conversationId,
          organizationId ?? null,
          userId ?? null,
          input.actorId ?? null,
          isUuid(input.queryRunId) ? input.queryRunId : null,
          input.scope,
          input.title,
          input.sourceTitle ?? null,
          input.sourceHash ?? null,
          timestamp,
        ],
      );
      const turnResult = await dbQuery<{ next_turn: number }>(
        "SELECT COALESCE(MAX(turn_index), 0) + 1 AS next_turn FROM evidence_chat_messages WHERE conversation_id = $1",
        [conversationId],
      );
      const turnIndex = Number(turnResult.rows[0]?.next_turn ?? 1);
      const messageResult = await dbQuery(
        `INSERT INTO evidence_chat_messages (
          id, conversation_id, query_run_id, turn_index, user_message,
          chat_response, response_hash, human_review_required, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,TRUE,$8)
        RETURNING *`,
        [
          randomUUID(),
          conversationId,
          isUuid(input.queryRunId) ? input.queryRunId : null,
          turnIndex,
          input.userMessage,
          JSON.stringify(input.chatResponse),
          responseHash,
          timestamp,
        ],
      );
      return {
        conversation: mapConversation(conversationResult.rows[0]),
        message: mapMessage(messageResult.rows[0]),
      };
    } catch (error) {
      warnDatabaseFallback("appendEvidenceChatTurn", error);
    }
  }

  const store = await readStore();
  let conversation = store.conversations.find((item) => item.id === conversationId);
  if (!conversation) {
    conversation = {
      id: conversationId,
      organizationId: input.organizationId,
      userId,
      actorId: input.actorId,
      queryRunId: input.queryRunId,
      scope: input.scope,
      title: input.title,
      sourceTitle: input.sourceTitle,
      sourceHash: input.sourceHash,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    store.conversations.push(conversation);
  } else {
    conversation.queryRunId = input.queryRunId ?? conversation.queryRunId;
    conversation.scope = input.scope;
    conversation.title = input.title;
    conversation.sourceTitle = input.sourceTitle ?? conversation.sourceTitle;
    conversation.sourceHash = input.sourceHash ?? conversation.sourceHash;
    conversation.updatedAt = timestamp;
  }
  const turnIndex = store.messages.filter((item) => item.conversationId === conversationId).length + 1;
  const message: EvidenceChatMessage = {
    id: randomUUID(),
    conversationId,
    queryRunId: input.queryRunId,
    turnIndex,
    userMessage: input.userMessage,
    chatResponse: input.chatResponse,
    responseHash,
    humanReviewRequired: true,
    createdAt: timestamp,
  };
  store.messages.push(message);
  await writeStore(store);
  return { conversation, message };
}
