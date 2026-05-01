import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { interestAreas, organizationTypes } from "./demo-request-options";

const storageDirectory = process.env.EVIDARA_STORAGE_DIR ?? path.join(process.cwd(), ".evidara-data");
const storageFile = path.join(storageDirectory, "demo-requests.jsonl");

export type DemoRequest = {
  id: string;
  name: string;
  email: string;
  company: string;
  roleTitle: string;
  organizationType: (typeof organizationTypes)[number];
  interestArea: (typeof interestAreas)[number];
  message: string;
  sourcePage: string;
  createdAt: string;
};

export type DemoRequestInput = Omit<DemoRequest, "id" | "createdAt">;

export type DemoRequestValidationResult =
  | { ok: true; value: DemoRequestInput }
  | { ok: false; errors: Record<string, string> };

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isAllowedValue<T extends readonly string[]>(value: string, allowed: T): value is T[number] {
  return allowed.includes(value);
}

export function validateDemoRequest(payload: unknown): DemoRequestValidationResult {
  const body = typeof payload === "object" && payload !== null ? payload as Record<string, unknown> : {};
  const name = cleanString(body.name);
  const email = cleanString(body.email).toLowerCase();
  const company = cleanString(body.company);
  const roleTitle = cleanString(body.roleTitle);
  const organizationType = cleanString(body.organizationType);
  const interestArea = cleanString(body.interestArea);
  const message = cleanString(body.message);
  const sourcePage = cleanString(body.sourcePage) || "/demo";
  const errors: Record<string, string> = {};

  if (name.length < 2) errors.name = "Enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid work email.";
  if (company.length < 2) errors.company = "Enter your company.";
  if (roleTitle.length < 2) errors.roleTitle = "Enter your role or title.";
  if (!isAllowedValue(organizationType, organizationTypes)) errors.organizationType = "Select an organization type.";
  if (!isAllowedValue(interestArea, interestAreas)) errors.interestArea = "Select an area of interest.";
  if (message.length < 12) errors.message = "Share a short note about the use case.";
  if (message.length > 1200) errors.message = "Keep the note under 1,200 characters.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      name,
      email,
      company,
      roleTitle,
      organizationType: organizationType as (typeof organizationTypes)[number],
      interestArea: interestArea as (typeof interestAreas)[number],
      message,
      sourcePage,
    },
  };
}

export async function createDemoRequest(input: DemoRequestInput): Promise<DemoRequest> {
  const request: DemoRequest = {
    id: randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  };

  await mkdir(storageDirectory, { recursive: true });
  await writeFile(storageFile, `${JSON.stringify(request)}\n`, { flag: "a" });

  return request;
}

export async function listDemoRequests(): Promise<DemoRequest[]> {
  try {
    const content = await readFile(storageFile, "utf8");
    return content
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as DemoRequest);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
}

export const demoRequestOptions = {
  organizationTypes,
  interestAreas,
};
