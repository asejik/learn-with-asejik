import { z } from "zod";

// Pilot signup, written with standard web APIs only so the same code runs in
// the production Cloudflare Worker (worker/index.ts) and in `next dev`
// (app/api/pilot-signup/route.ts).

const PilotSignupSchema = z.object({
  fullName: z
    .string({ error: "Please provide your full name." })
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(100, "Full name must be under 100 characters."),
  email: z
    .string({ error: "Please provide a valid email address." })
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address.")
    .max(100, "Email must be under 100 characters."),
  consent: z.literal(true, {
    error:
      "Explicit, un-ticked consent is required under the Nigeria Data Protection Act (NDPA 2023).",
  }),
  // Pilot signup is for adults only; learners of any age may still read lessons.
  ageConfirmed: z.literal(true, {
    error: "Pilot signup is for learners aged 18 and over. Please confirm you are 18 or older.",
  }),
  consentedAt: z
    .string({ error: "Consent timestamp is required." })
    .min(1, "Consent timestamp is required."),
});

// How long to wait for the roster webhook before giving up.
const WEBHOOK_TIMEOUT_MS = 8000;

function rosterUnavailable() {
  return Response.json(
    {
      success: false,
      error: "We couldn't save your signup right now. Please try again in a moment.",
    },
    { status: 502 }
  );
}

/**
 * Validates a signup, forwards it to the pilot roster webhook, and only
 * reports success once the roster accepted it. Fails closed with 503 when no
 * webhook is configured.
 */
export async function handlePilotSignup(
  req: Request,
  webhookUrl: string | undefined
): Promise<Response> {
  try {
    const body = await req.json();
    const result = PilotSignupSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          success: false,
          error: result.error.issues[0]?.message || "Invalid submission payload.",
        },
        { status: 400 }
      );
    }

    const { fullName, email, consentedAt, ageConfirmed } = result.data;

    // Fail closed: without the roster webhook there is nowhere to record the
    // signup, so never tell the learner they joined.
    if (!webhookUrl) {
      console.error("[Pilot Signup] PILOT_SIGNUP_WEBHOOK_URL is not configured; signup rejected");
      return Response.json(
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
          ageConfirmed,
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

    return Response.json(
      {
        success: true,
        message: "Successfully joined the pilot! Your progress is now linked.",
      },
      { status: 200 }
    );
  } catch {
    return Response.json(
      {
        success: false,
        error: "An unexpected error occurred while processing your signup.",
      },
      { status: 500 }
    );
  }
}
