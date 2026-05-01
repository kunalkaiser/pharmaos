import { NextResponse } from "next/server";
import { createDemoRequest, validateDemoRequest } from "@/lib/demo-requests";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, errors: { form: "Submit the request as JSON." } }, { status: 400 });
  }

  const validation = validateDemoRequest(payload);

  if (!validation.ok) {
    return NextResponse.json({ ok: false, errors: validation.errors }, { status: 400 });
  }

  try {
    const demoRequest = await createDemoRequest(validation.value);

    return NextResponse.json(
      {
        ok: true,
        requestId: demoRequest.id,
        message: "Demo request received.",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        errors: {
          form: "The request could not be saved. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}
