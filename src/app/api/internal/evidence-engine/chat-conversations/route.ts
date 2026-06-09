import { NextResponse } from "next/server";
import { getEvidenceChatConversation, listEvidenceChatConversations } from "@/lib/evidence-chat-persistence";

export const runtime = "nodejs";

function cleanString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const conversationId = cleanString(url.searchParams.get("conversation_id"), 80);
  const actorId = request.headers.get("x-evidara-actor-id") ?? undefined;
  const organizationId = request.headers.get("x-evidara-organization-id") ?? undefined;

  if (conversationId) {
    const conversation = await getEvidenceChatConversation({ conversationId, actorId, organizationId });
    if (!conversation) {
      return NextResponse.json({ ok: false, error: "Conversation not found.", candidateOnly: true }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      candidateOnly: true,
      generatedClaims: false,
      ...conversation,
    });
  }

  const conversations = await listEvidenceChatConversations({ actorId, organizationId, limit: 25 });
  return NextResponse.json({
    ok: true,
    candidateOnly: true,
    generatedClaims: false,
    conversations,
  });
}
