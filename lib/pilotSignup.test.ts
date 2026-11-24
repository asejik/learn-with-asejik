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

// What the Google Apps Script roster answers: always HTTP 200, with the
// outcome in the JSON body.
function rosterReply(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
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

  it("returns 502 when the roster answers 200 but reports a failure", async () => {
    webhook = WEBHOOK;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(rosterReply({ ok: false, error: "server" })));

    const res = await post(signupRequest());
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.success).toBe(false);
    expect(loggedText(logSpies)).not.toContain(EMAIL);
    expect(loggedText(logSpies)).not.toContain(WEBHOOK);
  });

  it("returns 502 when the roster answers 200 without a JSON confirmation", async () => {
    webhook = WEBHOOK;
    for (const reply of [
      new Response("ok", { status: 200 }),
      new Response("<html>Sign in</html>", { status: 200, headers: { "Content-Type": "text/html" } }),
      rosterReply({ ok: "true" }),
      rosterReply(null),
    ]) {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reply));
      const res = await post(signupRequest());
      expect(res.status).toBe(502);
      expect((await res.json()).success).toBe(false);
    }
  });

  it("returns 502 and logs the reason when the reply body times out", async () => {
    webhook = WEBHOOK;
    const stalledBody = new ReadableStream({
      start(controller) {
        controller.error(new DOMException("The operation timed out.", "TimeoutError"));
      },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(stalledBody, { status: 200 })));

    const res = await post(signupRequest());

    expect(res.status).toBe(502);
    expect((await res.json()).success).toBe(false);
    expect(loggedText(logSpies)).toContain("TimeoutError");
    expect(loggedText(logSpies)).not.toContain(EMAIL);
    expect(loggedText(logSpies)).not.toContain(WEBHOOK);
  });

  it("sends the webhook request with a timeout signal", async () => {
    webhook = WEBHOOK;
    const fetchMock = vi.fn().mockResolvedValue(rosterReply({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await post(signupRequest());

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("returns 200 only after the roster webhook accepts the record", async () => {
    webhook = WEBHOOK;
    const fetchMock = vi.fn().mockResolvedValue(rosterReply({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await post(signupRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(WEBHOOK);
    const sent = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    // The consent time is the server's, not the browser's (which said 2026-11-21)
    expect(sent).toEqual({
      fullName: NAME,
      email: EMAIL,
      consentedAt: expect.any(String),
      ageConfirmed: true,
      source: "learn-with-asejik-pilot",
    });
    expect(sent.consentedAt).not.toBe("2026-11-21T12:00:00.000Z");
    expect(Math.abs(Date.now() - new Date(sent.consentedAt).getTime())).toBeLessThan(5000);
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

  it("does not need a consent time from the browser", async () => {
    webhook = WEBHOOK;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(rosterReply({ ok: true })));

    const res = await post(
      signupRequest({ fullName: NAME, email: EMAIL, consent: true, ageConfirmed: true })
    );

    expect(res.status).toBe(200);
  });

  describe("request checks", () => {
    let fetchMock: ReturnType<typeof vi.fn>;
    const valid = { fullName: NAME, email: EMAIL, consent: true, ageConfirmed: true };

    beforeEach(() => {
      webhook = WEBHOOK;
      fetchMock = vi.fn().mockResolvedValue(rosterReply({ ok: true }));
      vi.stubGlobal("fetch", fetchMock);
    });

    function request(init: { headers?: Record<string, string>; body?: string }) {
      return new Request("https://learn.example.test/api/pilot-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...init.headers },
        body: init.body ?? JSON.stringify(valid),
      });
    }

    it("refuses a body that is not JSON content with 415", async () => {
      const res = await post(request({ headers: { "Content-Type": "text/plain" } }));
      expect(res.status).toBe(415);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("refuses requests from another site with 403, and accepts the same site", async () => {
      const blocked: Record<string, string>[] = [
        { Origin: "https://evil.example" },
        { "Sec-Fetch-Site": "cross-site" },
        { "Sec-Fetch-Site": "same-site" },
      ];
      for (const headers of blocked) {
        const res = await post(request({ headers }));
        expect(res.status, JSON.stringify(headers)).toBe(403);
      }
      expect(fetchMock).not.toHaveBeenCalled();

      const ok = await post(
        request({ headers: { Origin: "https://learn.example.test", "Sec-Fetch-Site": "same-origin" } })
      );
      expect(ok.status).toBe(200);
    });

    it("refuses an oversized body with 413, declared or not", async () => {
      const big = JSON.stringify({ ...valid, fullName: "x".repeat(5000) });
      const declared = await post(request({ body: big, headers: { "Content-Length": String(big.length) } }));
      expect(declared.status).toBe(413);
      const undeclared = await post(request({ body: big }));
      expect(undeclared.status).toBe(413);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("answers malformed JSON with 400, not 500", async () => {
      const res = await post(request({ body: "{bad" }));
      expect(res.status).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("logs only the error name for an unexpected failure", async () => {
      const req = request({});
      req.text = () => Promise.reject(new TypeError("secret detail " + EMAIL));
      const res = await post(req);
      expect(res.status).toBe(500);
      expect(loggedText(logSpies)).not.toContain(EMAIL);
      expect(loggedText(logSpies)).toContain("TypeError");
    });
  });
});
