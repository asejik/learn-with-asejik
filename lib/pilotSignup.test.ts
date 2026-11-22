import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handlePilotSignup } from "./pilotSignup";

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
  return new Request("http://localhost/api/pilot-signup", {
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

describe("handlePilotSignup", () => {
  let logSpies: ReturnType<typeof vi.spyOn>[];
  // The roster webhook URL the handler is given (the server-only secret).
  let webhook: string | undefined;
  const post = (req: Request) => handlePilotSignup(req, webhook);

  beforeEach(() => {
    webhook = undefined;
    logSpies = [
      vi.spyOn(console, "log").mockImplementation(() => {}),
      vi.spyOn(console, "warn").mockImplementation(() => {}),
      vi.spyOn(console, "error").mockImplementation(() => {}),
    ];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns 503 and does not claim success when no webhook is configured", async () => {
    webhook = "";

    const res = await post(signupRequest());
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.success).toBe(false);
  });

  it("returns 502 when the roster webhook answers with an error status", async () => {
    webhook = WEBHOOK;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("boom", { status: 500 })));

    const res = await post(signupRequest());
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.success).toBe(false);
    expect(loggedText(logSpies)).not.toContain(EMAIL);
    expect(loggedText(logSpies)).not.toContain(NAME);
  });

  it("returns 502 when the roster webhook cannot be reached or times out", async () => {
    webhook = WEBHOOK;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("The operation timed out.", "TimeoutError"))
    );

    const res = await post(signupRequest());
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.success).toBe(false);
    expect(loggedText(logSpies)).not.toContain(EMAIL);
    expect(loggedText(logSpies)).not.toContain(WEBHOOK);
  });

  it("sends the webhook request with a timeout signal", async () => {
    webhook = WEBHOOK;
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await post(signupRequest());

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("returns 200 only after the roster webhook accepts the record", async () => {
    webhook = WEBHOOK;
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await post(signupRequest());
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

  it("rejects a submission without consent before contacting the webhook", async () => {
    webhook = WEBHOOK;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    for (const consent of [undefined, false, "true"]) {
      const res = await post(
        signupRequest({ fullName: NAME, email: EMAIL, consent, ageConfirmed: true, consentedAt: "x" })
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe(
        "Explicit, un-ticked consent is required under the Nigeria Data Protection Act (NDPA 2023)."
      );
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a signup without the 18+ confirmation before contacting the webhook", async () => {
    webhook = WEBHOOK;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    for (const ageConfirmed of [undefined, false, "true"]) {
      const res = await post(
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

  it("rejects a malformed email with its own message before contacting the webhook", async () => {
    webhook = WEBHOOK;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await post(
      signupRequest({
        fullName: NAME,
        email: "not-an-email",
        consent: true,
        ageConfirmed: true,
        consentedAt: "2026-11-21T12:00:00.000Z",
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Please provide a valid email address.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("gives its own message when the consent timestamp is missing", async () => {
    webhook = WEBHOOK;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await post(
      signupRequest({ fullName: NAME, email: EMAIL, consent: true, ageConfirmed: true })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Consent timestamp is required.");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
