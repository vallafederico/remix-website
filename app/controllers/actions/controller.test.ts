import * as assert from "remix/assert";
import { afterEach, beforeEach, describe, it } from "remix/test";
import { routes } from "../../routes";
import actionsController from "./controller";

describe("Newsletter subscribe route", () => {
  let originalConvertKitKey = process.env.CONVERTKIT_KEY;

  beforeEach(() => {
    process.env.CONVERTKIT_KEY = "test-convertkit-key";
  });

  afterEach(() => {
    process.env.CONVERTKIT_KEY = originalConvertKitKey;
  });

  async function submitNewsletter(body: URLSearchParams) {
    let formData = new FormData();
    for (let [key, value] of body.entries()) {
      formData.append(key, value);
    }

    type NewsletterContext = Parameters<
      typeof actionsController.actions.newsletter
    >[0];
    let context = {
      request: new Request(
        `http://localhost:3000${routes.actions.newsletter.href()}`,
        { method: "POST" },
      ),
      get(key: unknown) {
        return key === FormData ? formData : undefined;
      },
    } as NewsletterContext;

    return actionsController.actions.newsletter(context);
  }

  it("rejects invalid emails", async () => {
    let response = await submitNewsletter(
      new URLSearchParams({ email: "invalid-email" }),
    );
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      ok: false,
      error: "Invalid Email",
    });
  });

  it("rejects invalid tags", async () => {
    let response = await submitNewsletter(
      new URLSearchParams({
        email: "hello@example.com",
        tag: "not-a-number",
      }),
    );
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      ok: false,
      error: "Invalid Tag",
    });
  });

  it("returns success for a valid submission when ConvertKit succeeds", async (t) => {
    let fetchSpy = t.mock.method(globalThis, "fetch", () => {
      return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
    });

    let response = await submitNewsletter(
      new URLSearchParams({
        email: "hello@example.com",
        tag: "123",
      }),
    );

    assert.equal(fetchSpy.mock.calls.length, 1);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      ok: true,
      error: null,
    });
  });

  it("returns a 500 when ConvertKit responds with an error", async (t) => {
    t.mock.method(globalThis, "fetch", () => {
      return Promise.resolve(
        new Response(JSON.stringify({ error: "ConvertKit says no" }), {
          status: 200,
        }),
      );
    });

    let response = await submitNewsletter(
      new URLSearchParams({
        email: "hello@example.com",
      }),
    );

    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), {
      ok: false,
      error: "ConvertKit says no",
    });
  });

  it("returns a 500 when CONVERTKIT_KEY is missing", async () => {
    delete process.env.CONVERTKIT_KEY;
    let response = await submitNewsletter(
      new URLSearchParams({
        email: "hello@example.com",
      }),
    );

    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), {
      ok: false,
      error: "Missing CONVERTKIT_KEY",
    });
  });
});
