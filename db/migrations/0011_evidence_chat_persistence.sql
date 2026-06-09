CREATE TABLE IF NOT EXISTS evidence_chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations (id) ON DELETE RESTRICT,
  user_id UUID REFERENCES users (id) ON DELETE SET NULL,
  actor_id TEXT,
  query_run_id UUID REFERENCES query_runs (id) ON DELETE SET NULL,
  scope TEXT NOT NULL CHECK (scope IN ('report', 'sources', 'upload')),
  title TEXT NOT NULL,
  source_title TEXT,
  source_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS evidence_chat_conversations_organization_id_idx ON evidence_chat_conversations (organization_id);
CREATE INDEX IF NOT EXISTS evidence_chat_conversations_user_id_idx ON evidence_chat_conversations (user_id);
CREATE INDEX IF NOT EXISTS evidence_chat_conversations_actor_id_idx ON evidence_chat_conversations (actor_id);
CREATE INDEX IF NOT EXISTS evidence_chat_conversations_query_run_id_idx ON evidence_chat_conversations (query_run_id);
CREATE INDEX IF NOT EXISTS evidence_chat_conversations_updated_at_idx ON evidence_chat_conversations (updated_at DESC);

CREATE TABLE IF NOT EXISTS evidence_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES evidence_chat_conversations (id) ON DELETE CASCADE,
  query_run_id UUID REFERENCES query_runs (id) ON DELETE SET NULL,
  turn_index INTEGER NOT NULL,
  user_message TEXT NOT NULL,
  chat_response JSONB NOT NULL,
  response_hash TEXT NOT NULL,
  human_review_required BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (conversation_id, turn_index)
);

CREATE INDEX IF NOT EXISTS evidence_chat_messages_conversation_id_idx ON evidence_chat_messages (conversation_id);
CREATE INDEX IF NOT EXISTS evidence_chat_messages_query_run_id_idx ON evidence_chat_messages (query_run_id);
CREATE INDEX IF NOT EXISTS evidence_chat_messages_response_hash_idx ON evidence_chat_messages (response_hash);
