import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

const WEBHOOK = "https://webhook.example.test/roster";
const NAME = "Test Learner";
const EMAIL = "learner@example.test";

function signupRequest(body: unknown = {
  fullName: NAME,
  email: EMAIL,
  consent: true,
  ageConfirmed: true,
  consentedAt: "2026-11-21T12:00:00.000Z",
}) {
  return new NextRequest("http://localhost/api/pilot-signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Every console line the route writes, so tests can check no personal data leaks.
function loggedText(spies: ReturnType<typeof vi.spyOn>[]) {
  return spies
    .flatMap((spy) => spy.mock.calls)
    .map((args) => args.map((a: unknown) => String(a)).join(" "))
    .join("\n");
}

describe("POST /api/pilot-signup", () => {
  let logSpies: ReturnType<typeof vi.spyOn>[];

  beforeEach(() => {
    logSpies = [
      vi.spyOn(console, "log").mockImplementation(() => {}),
      vi.spyOn(console, "warn").mockImplementation(() => {}),
      vi.spyOn(console, "error").mockImplementation(() => {}),
    ];
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns 503 and does not claim success when no webhook is configured", async () => {
    vi.stubEnv("PILOT_SIGNUP_WEBHOOK_URL", "");

    const res = await POST(signupRequest());
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.success).toBe(false);
  });

  it("returns 502 when the roster webhook answers with an error status", async () => {
    vi.stubEnv("PILOT_SIGNUP_WEBHOOK_URL", WEBHOOK);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("boom", { status: 500 })));

    const res = await POST(signupRequest());
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.success).toBe(false);
    expect(loggedText(logSpies)).not.toContain(EMAIL);
    expect(loggedText(logSpies)).not.toContain(NAME);
  });

  it("returns 502 when the roster webhook cannot be reached or times out", async () => {
    vi.stubEnv("PILOT_SIGNUP_WEBHOOK_URL", WEBHOOK);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("The operation timed out.", "TimeoutError"))
    );

    const res = await POST(signupRequest());
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.success).toBe(false);
    expect(loggedText(logSpies)).not.toContain(EMAIL);
    expect(loggedText(logSpies)).not.toContain(WEBHOOK);
  });

  it("sends the webhook request with a timeout signal", async () => {
    vi.stubEnv("PILOT_SIGNUP_WEBHOOK_URL", WEBHOOK);
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await POST(signupRequest());

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("returns 200 only after the roster webhook accepts the record", async () => {
    vi.stubEnv("PILOT_SIGNUP_WEBHOOK_URL", WEBHOOK);
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(signupRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(WEBHOOK);
    const sent = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(sent).toEqual({
      fullName: NAME,
      email: EMAIL,
      consentedAt: "2026-11-21T12:00:00.000Z",
      ageConfirmed: true,
      source: "learn-with-asejik-pilot",
    });
    expect(loggedText(logSpies)).not.toContain(EMAIL);
    expect(loggedText(logSpies)).not.toContain(NAME);
  });

  it("still rejects a submission without consent before contacting the webhook", async () => {
    vi.stubEnv("PILOT_SIGNUP_WEBHOOK_URL", WEBHOOK);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(
      signupRequest({ fullName: NAME, email: EMAIL, consent: false, ageConfirmed: true, consentedAt: "x" })
    );

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a signup without the 18+ confirmation before contacting the webhook", async () => {
    vi.stubEnv("PILOT_SIGNUP_WEBHOOK_URL", WEBHOOK);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    for (const ageConfirmed of [undefined, false, "true"]) {
      const res = await POST(
        signupRequest({
          fullName: NAME,
          email: EMAIL,
          consent: true,
          ageConfirmed,
          consentedAt: "2026-11-21T12:00:00.000Z",
        })
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toMatch(/18/);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
