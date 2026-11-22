import { handlePilotSignup } from "@/lib/pilotSignup";

// Local development only (`npm run dev`). The production site is a static
// export, which drops this route; signups there go through the Cloudflare
// Worker in worker/index.ts, which calls the same handler.
export async function POST(req: Request) {
  return handlePilotSignup(req, process.env.PILOT_SIGNUP_WEBHOOK_URL);
}
