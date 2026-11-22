import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import worker from "./index";

const WEBHOOK = "https://webhook.example.test/roster";
const SIGNUP = {
  fullName: "Test Learner",
  email: "learner@example.test",
  consent: true,
  ageConfirmed: true,
  consentedAt: "2026-11-21T12:00:00.000Z",
};

function request(path: string, method = "POST", body: unknown = SIGNUP) {
  return new Request(`https://learn.example.test${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "POST" ? JSON.stringify(body) : undefined,
  });
}

describe("Cloudflare Worker", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("records a signup using the webhook secret from the Worker environment", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await worker.fetch(request("/api/pilot-signup"), { PILOT_SIGNUP_WEBHOOK_URL: WEBHOOK });

    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe(WEBHOOK);
  });

  it("fails closed with 503 when the secret is not set", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await worker.fetch(request("/api/pilot-signup"), {});

    expect(res.status).toBe(503);
    expect((await res.json()).success).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("validates the signup before contacting the roster", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await worker.fetch(request("/api/pilot-signup", "POST", { ...SIGNUP, consent: false }), {
      PILOT_SIGNUP_WEBHOOK_URL: WEBHOOK,
    });

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("only accepts POST on the signup path", async () => {
    const res = await worker.fetch(request("/api/pilot-signup", "GET"), { PILOT_SIGNUP_WEBHOOK_URL: WEBHOOK });
    expect(res.status).toBe(405);
    expect(res.headers.get("Allow")).toBe("POST");
  });

  it("marks every API response as no-sniff and never cached", async () => {
    for (const res of [
      await worker.fetch(request("/api/pilot-signup"), {}),
      await worker.fetch(request("/api/pilot-signup", "GET"), {}),
      await worker.fetch(request("/api/other"), {}),
    ]) {
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(res.headers.get("Cache-Control")).toBe("no-store");
    }
  });

  it("returns 404 for any other API path", async () => {
    const res = await worker.fetch(request("/api/other"), { PILOT_SIGNUP_WEBHOOK_URL: WEBHOOK });
    expect(res.status).toBe(404);
  });
});
