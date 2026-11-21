import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const PilotSignupSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(100, "Full name must be under 100 characters."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address.")
    .max(100, "Email must be under 100 characters."),
  consent: z.literal(true, {
    errorMap: () => ({
      message:
        "Explicit, un-ticked consent is required under the Nigeria Data Protection Act (NDPA 2023).",
    }),
  }),
  consentedAt: z.string().min(1, "Consent timestamp is required."),
});

// How long to wait for the roster webhook before giving up.
const WEBHOOK_TIMEOUT_MS = 8000;

function rosterUnavailable() {
  return NextResponse.json(
    {
      success: false,
      error: "We couldn't save your signup right now. Please try again in a moment.",
    },
    { status: 502 }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = PilotSignupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.errors[0]?.message || "Invalid submission payload.",
        },
        { status: 400 }
      );
    }

    const { fullName, email, consentedAt } = result.data;

    // Fail closed: without the roster webhook there is nowhere to record the
    // signup, so never tell the learner they joined.
    const webhookUrl = process.env.PILOT_SIGNUP_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error("[Pilot Signup] PILOT_SIGNUP_WEBHOOK_URL is not configured; signup rejected");
      return NextResponse.json(
        {
          success: false,
          error: "Pilot signup isn't available right now. Please try again later.",
        },
        { status: 503 }
      );
    }

    // SECURITY & NDPA PRIVACY: never log personal data (names, emails) or the
    // webhook URL, which acts as a write credential for the roster.
    let webhookStatus: number;
    try {
      const webhookRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          consentedAt,
          source: "learn-with-asejik-pilot",
        }),
        signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
      });
      webhookStatus = webhookRes.status;
    } catch (webhookErr) {
      const reason = webhookErr instanceof Error ? webhookErr.name : "UnknownError";
      console.error(`[Pilot Signup] Roster webhook unreachable (${reason}); signup not recorded`);
      return rosterUnavailable();
    }

    if (webhookStatus < 200 || webhookStatus >= 300) {
      console.error(`[Pilot Signup] Roster webhook returned HTTP ${webhookStatus}; signup not recorded`);
      return rosterUnavailable();
    }

    console.log(
      `[Pilot Signup] Signup recorded with NDPA consent at ${consentedAt} (personal data masked)`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Successfully joined the pilot! Your progress is now linked.",
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while processing your signup.",
      },
      { status: 500 }
    );
  }
}
