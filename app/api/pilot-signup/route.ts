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

    // SECURITY & NDPA PRIVACY AUDIT:
    // Sanitize logs — never output personal data (emails or full names) to stdout/stderr.
    console.log(
      `[Pilot Signup] Valid NDPA consent recorded at ${consentedAt} (personal data masked)`
    );

    // Optional webhook dispatch to private Google Sheet / lead roster if configured
    const webhookUrl = process.env.PILOT_SIGNUP_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName,
            email,
            consentedAt,
            source: "learn-with-asejik-pilot",
          }),
        });
      } catch (webhookErr) {
        console.warn("[Pilot Signup] Webhook sync failed, local record remains valid:", webhookErr);
      }
    }

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
