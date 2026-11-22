import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

// The dev-only route must pass the server-only secret to the shared handler.
describe("POST /api/pilot-signup (next dev)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("fails closed with 503 when the webhook secret is not set", async () => {
    vi.stubEnv("PILOT_SIGNUP_WEBHOOK_URL", "");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(
      new Request("http://localhost/api/pilot-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "Test Learner",
          email: "learner@example.test",
          consent: true,
          ageConfirmed: true,
          consentedAt: "2026-11-21T12:00:00.000Z",
        }),
      })
    );
    expect(res.status).toBe(503);
  });
});
