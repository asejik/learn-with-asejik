import { handlePilotSignup } from "../lib/pilotSignup";

// Production entry point on Cloudflare Workers. Pages are plain static files
// from the `out/` export (see wrangler.jsonc); only /api/* reaches this code,
// because `run_worker_first` is limited to that path.

export interface Env {
  /** Roster webhook URL. A Cloudflare secret: never a NEXT_PUBLIC_ variable. */
  PILOT_SIGNUP_WEBHOOK_URL?: string;
}

const SIGNUP_PATH = "/api/pilot-signup";

// public/_headers only covers static files, so API responses get their own:
// never sniffed as another type, never cached.
function withApiHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Cache-Control", "no-store");
  return new Response(response.body, { status: response.status, headers });
}

async function route(request: Request, env: Env): Promise<Response> {
  const { pathname } = new URL(request.url);

  if (pathname !== SIGNUP_PATH) {
    return Response.json({ success: false, error: "Not found." }, { status: 404 });
  }
  if (request.method !== "POST") {
    return Response.json(
      { success: false, error: "Method not allowed." },
      { status: 405, headers: { Allow: "POST" } }
    );
  }
  return handlePilotSignup(request, env.PILOT_SIGNUP_WEBHOOK_URL);
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    return withApiHeaders(await route(request, env));
  },
};

export default worker;
