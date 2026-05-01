"use client";

import { FormEvent, useState } from "react";
import type { ReactNode } from "react";
import { interestAreas, organizationTypes } from "@/lib/demo-request-options";

type FormState = {
  name: string;
  email: string;
  company: string;
  roleTitle: string;
  organizationType: string;
  interestArea: string;
  message: string;
};

type SubmissionState =
  | { status: "idle"; message: string; requestId?: string; errors?: Record<string, string> }
  | { status: "submitting"; message: string; requestId?: string; errors?: Record<string, string> }
  | { status: "success"; message: string; requestId: string; errors?: Record<string, string> }
  | { status: "error"; message: string; requestId?: string; errors?: Record<string, string> };

const initialForm: FormState = {
  name: "",
  email: "",
  company: "",
  roleTitle: "",
  organizationType: organizationTypes[0],
  interestArea: interestAreas[0],
  message: "",
};

export function DemoRequestForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [submission, setSubmission] = useState<SubmissionState>({ status: "idle", message: "" });

  const isSubmitting = submission.status === "submitting";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmission({ status: "submitting", message: "Saving your request..." });

    try {
      const response = await fetch("/api/demo-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sourcePage: "/demo" }),
      });
      const result = await response.json() as { ok: boolean; requestId?: string; message?: string; errors?: Record<string, string> };

      if (!response.ok || !result.ok || !result.requestId) {
        setSubmission({
          status: "error",
          message: result.errors?.form ?? "Check the highlighted fields and try again.",
          errors: result.errors,
        });
        return;
      }

      setSubmission({
        status: "success",
        message: "Request received. We will use this to prepare a focused EvidaraOS conversation.",
        requestId: result.requestId,
      });
      setForm(initialForm);
    } catch {
      setSubmission({
        status: "error",
        message: "The request could not be submitted. Please try again.",
      });
    }
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Name" error={submission.errors?.name}>
          <input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-teal-300"
            placeholder="Your name"
            autoComplete="name"
          />
        </FormField>
        <FormField label="Work email" error={submission.errors?.email}>
          <input
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-teal-300"
            placeholder="name@company.com"
            autoComplete="email"
          />
        </FormField>
        <FormField label="Company" error={submission.errors?.company}>
          <input
            value={form.company}
            onChange={(event) => updateField("company", event.target.value)}
            className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-teal-300"
            placeholder="Company"
            autoComplete="organization"
          />
        </FormField>
        <FormField label="Role / title" error={submission.errors?.roleTitle}>
          <input
            value={form.roleTitle}
            onChange={(event) => updateField("roleTitle", event.target.value)}
            className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-teal-300"
            placeholder="VP Clinical Development"
            autoComplete="organization-title"
          />
        </FormField>
        <FormField label="Organization type" error={submission.errors?.organizationType}>
          <select
            value={form.organizationType}
            onChange={(event) => updateField("organizationType", event.target.value)}
            className="w-full rounded-2xl border border-white/15 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-300"
          >
            {organizationTypes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Area of interest" error={submission.errors?.interestArea}>
          <select
            value={form.interestArea}
            onChange={(event) => updateField("interestArea", event.target.value)}
            className="w-full rounded-2xl border border-white/15 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-300"
          >
            {interestAreas.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField label="Use case or evidence question" error={submission.errors?.message}>
        <textarea
          value={form.message}
          onChange={(event) => updateField("message", event.target.value)}
          className="min-h-28 w-full resize-y rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-400 focus:border-teal-300"
          placeholder="Example: Evaluate semaglutide for obstructive sleep apnea, including burden, trial landscape, and source traceability."
        />
      </FormField>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-full bg-teal-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Submit demo request"}
        </button>
        <p className="text-xs leading-5 text-slate-400">
          This submits a real request only. It does not run evidence retrieval or generate a report.
        </p>
      </div>

      {submission.status !== "idle" && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${
            submission.status === "success"
              ? "border-teal-300/40 bg-teal-400/10 text-teal-100"
              : submission.status === "error"
                ? "border-orange-300/40 bg-orange-400/10 text-orange-100"
                : "border-white/15 bg-white/8 text-slate-200"
          }`}
          role="status"
        >
          {submission.message}
          {submission.status === "success" && <span className="block text-xs text-teal-200">Request ID: {submission.requestId}</span>}
        </div>
      )}
    </form>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">{label}</span>
      <span className="mt-2 block">{children}</span>
      {error && <span className="mt-2 block text-xs font-semibold text-orange-200">{error}</span>}
    </label>
  );
}
