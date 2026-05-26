"use client";

import { useMemo, useState } from "react";

type CandidateForReview = {
  candidateId: string;
  sourceProvider: string;
  sourceIdentifier?: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceDisplayName?: string;
  evidenceText?: string;
  abstractText?: string;
  limitationNotes?: string[];
  candidateOnly: true;
  generatedClaim: false;
};

type ActionResponse = {
  ok: boolean;
  error?: string;
  promotion?: { id: string; promotionStatus: string };
  rejection?: { id: string; rejectionReason: string };
};

function accessHeaders(): Record<string, string> {
  const token = new URLSearchParams(window.location.search).get("access_token");
  return token ? { "x-evidara-internal-token": token } : {};
}

export function ReviewQueueActions({ candidate, queryRunId }: { candidate?: CandidateForReview; queryRunId: string }) {
  const [reviewerId, setReviewerId] = useState("preview-reviewer");
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("not_relevant");
  const [loadingAction, setLoadingAction] = useState<"promote" | "reject" | null>(null);
  const [response, setResponse] = useState<ActionResponse | null>(null);

  const citationText = useMemo(() => {
    if (!candidate) return "";
    const identifier = candidate.sourceIdentifier ? ` ${candidate.sourceIdentifier}.` : "";
    return `${candidate.sourceTitle}.${identifier} Accessed through ${candidate.sourceDisplayName ?? candidate.sourceProvider}. ${candidate.sourceUrl}`;
  }, [candidate]);

  async function promote() {
    if (!candidate) return;
    setLoadingAction("promote");
    setResponse(null);
    try {
      const result = await fetch("/api/internal/review/candidate-promotions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...accessHeaders(),
        },
        body: JSON.stringify({
          queryRunId,
          candidate,
          citationText,
          humanReviewStatus: "reviewed",
          reviewerAttestation: true,
          reviewNotes: reviewNotes || "Reviewer promoted this source as a citation candidate for downstream evidence packet construction.",
          limitationNotes: candidate.limitationNotes?.join(" ") ?? "Requires full source verification before final evidence use.",
        }),
      });
      setResponse((await result.json()) as ActionResponse);
    } catch (error) {
      setResponse({ ok: false, error: error instanceof Error ? error.message : "Promotion failed." });
    } finally {
      setLoadingAction(null);
    }
  }

  async function reject() {
    if (!candidate) return;
    setLoadingAction("reject");
    setResponse(null);
    try {
      const result = await fetch("/api/internal/review/candidate-rejections", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-evidara-actor-id": reviewerId || "preview-reviewer",
          "x-evidara-actor-email": `${reviewerId || "preview-reviewer"}@evidara.local`,
          ...accessHeaders(),
        },
        body: JSON.stringify({
          queryRunId,
          candidateId: candidate.candidateId,
          sourceProvider: candidate.sourceProvider,
          sourceIdentifier: candidate.sourceIdentifier,
          sourceTitle: candidate.sourceTitle,
          sourceUrl: candidate.sourceUrl,
          rejectionReason,
          reviewerNotes: reviewNotes || "Reviewer rejected this candidate from the current evidence workflow.",
        }),
      });
      setResponse((await result.json()) as ActionResponse);
    } catch (error) {
      setResponse({ ok: false, error: error instanceof Error ? error.message : "Rejection failed." });
    } finally {
      setLoadingAction(null);
    }
  }

  if (!candidate) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-500">
        Candidate event is audit-visible, but the full candidate snapshot is unavailable. Re-run the analysis with the current engine handoff layer to enable promote/reject actions.
      </div>
    );
  }

  return (
    <div className="min-w-72 space-y-3">
      <label className="block">
        <span className="text-xs font-semibold text-slate-600">Reviewer ID</span>
        <input
          value={reviewerId}
          onChange={(event) => setReviewerId(event.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-teal-600"
        />
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-slate-600">Review notes</span>
        <textarea
          value={reviewNotes}
          onChange={(event) => setReviewNotes(event.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs leading-5 outline-none focus:border-teal-600"
          placeholder="Why is this candidate usable or not usable?"
        />
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-slate-600">Rejection reason</span>
        <select
          value={rejectionReason}
          onChange={(event) => setRejectionReason(event.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-teal-600"
        >
          <option value="not_relevant">not_relevant</option>
          <option value="insufficient_provenance">insufficient_provenance</option>
          <option value="duplicate">duplicate</option>
          <option value="restricted_source">restricted_source</option>
          <option value="low_quality">low_quality</option>
          <option value="not_scientific_evidence">not_scientific_evidence</option>
          <option value="other">other</option>
        </select>
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={promote}
          disabled={Boolean(loadingAction)}
          className="rounded-full bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white disabled:bg-slate-400"
        >
          {loadingAction === "promote" ? "Promoting..." : "Promote citation"}
        </button>
        <button
          type="button"
          onClick={reject}
          disabled={Boolean(loadingAction)}
          className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 disabled:text-slate-400"
        >
          {loadingAction === "reject" ? "Rejecting..." : "Reject"}
        </button>
      </div>
      {response ? (
        <div className={`rounded-xl p-3 text-xs leading-5 ${response.ok ? "bg-teal-50 text-teal-900" : "bg-red-50 text-red-800"}`}>
          {response.ok
            ? response.promotion
              ? `Promoted: ${response.promotion.promotionStatus}`
              : `Rejected: ${response.rejection?.rejectionReason ?? "recorded"}`
            : response.error}
        </div>
      ) : null}
    </div>
  );
}
