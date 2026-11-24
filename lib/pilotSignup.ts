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
  // The consent time is not accepted from the browser: the server records it
  // (see handlePilotSignup). Unknown fields in the body are ignored.
  // Pilot signup is for adults only; learners of any age may still read lessons.
  ageConfirmed: z.literal(true, {
    error: "Pilot signup is for learners aged 18 and over. Please confirm you are 18 or older.",
  }),
});

// How long to wait for the roster webhook before giving up.
const WEBHOOK_TIMEOUT_MS = 8000;

// A real signup is a few hundred bytes; anything bigger is not from the form.
const MAX_BODY_BYTES = 2048;

function refuse(status: number, error: string) {
  return Response.json({ success: false, error }, { status });
}

// Cheap checks that run before the body is read. They stop other sites and
// scripts that do not send the form's JSON from reaching the roster.
function refuseUnlessFromForm(req: Request): Response | null {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return refuse(415, "Please send the signup as JSON.");
  }
  // Browsers say where a request came from; only our own pages are allowed.
  const fetchSite = req.headers.get("sec-fetch-site");
  const origin = req.headers.get("origin");
  if (
    (fetchSite !== null && fetchSite !== "same-origin" && fetchSite !== "none") ||
    (origin !== null && origin !== new URL(req.url).origin)
  ) {
    return refuse(403, "This request did not come from the signup form.");
  }
  if (Number(req.headers.get("content-length")) > MAX_BODY_BYTES) {
    return refuse(413, "That request is too large.");
  }
  return null;
}

function isRosterConfirmation(reply: unknown): boolean {
  return typeof reply === "object" && reply !== null && (reply as { ok?: unknown }).ok === true;
}

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
    const refused = refuseUnlessFromForm(req);
    if (refused) return refused;

    // Read as text so the size limit also holds when no length was declared.
    const text = await req.text();
    if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
      return refuse(413, "That request is too large.");
    }
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return refuse(400, "Invalid submission payload.");
    }
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

    const { fullName, email, ageConfirmed } = result.data;
    // The consent time is the moment the server received the signup.
    const consentedAt = new Date().toISOString();

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
    let webhookReply: unknown = null;
    let replyReadError: string | null = null;
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
      // A reply that is not JSON (or arrives after the timeout) counts as no
      // confirmation; it is handled below as "not recorded".
      webhookReply = await webhookRes.json().catch((readErr: unknown) => {
        replyReadError = readErr instanceof Error ? readErr.name : "UnknownError";
        return null;
      });
    } catch (webhookErr) {
      const reason = webhookErr instanceof Error ? webhookErr.name : "UnknownError";
      console.error(`[Pilot Signup] Roster webhook unreachable (${reason}); signup not recorded`);
      return rosterUnavailable();
    }

    if (webhookStatus < 200 || webhookStatus >= 300) {
      console.error(`[Pilot Signup] Roster webhook returned HTTP ${webhookStatus}; signup not recorded`);
      return rosterUnavailable();
    }

    // The roster (a Google Apps Script) answers HTTP 200 even when it fails,
    // so only an explicit {"ok": true} counts as recorded.
    if (!isRosterConfirmation(webhookReply)) {
      const detail = replyReadError ? ` (reply unreadable: ${replyReadError})` : "";
      console.error(
        `[Pilot Signup] Roster webhook did not confirm the record${detail}; signup not recorded`
      );
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
  } catch (err) {
    const reason = err instanceof Error ? err.name : "UnknownError";
    console.error(`[Pilot Signup] Unexpected error (${reason})`);
    return Response.json(
      {
        success: false,
        error: "An unexpected error occurred while processing your signup.",
      },
      { status: 500 }
    );
  }
}
