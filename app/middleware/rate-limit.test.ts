import * as assert from "remix/assert";
import { createRouter } from "remix/fetch-router";
import { describe, it, type TestContext as RemixTestContext } from "remix/test";
import { rateLimit } from "./rate-limit.ts";

function createMockContext(
  overrides: {
    forwardedFor?: string;
    hostname?: string;
    method?: string;
    pathname?: string;
    search?: string;
  } = {},
) {
  let {
    forwardedFor,
    hostname = "localhost",
    method = "GET",
    pathname = "/",
    search = "",
  } = overrides;
  let url = new URL(`${pathname}${search}`, `http://${hostname}`);
  let headers = new Headers();
  if (forwardedFor !== undefined) {
    headers.set("x-forwarded-for", forwardedFor);
  }
  let request = new Request(url.toString(), { method, headers });

  return {
    request,
    headers: request.headers,
    url: new URL(request.url),
  };
}

function useMockClock(t: RemixTestContext) {
  let now = new Date("2026-01-01T00:00:00.000Z").getTime();
  t.mock.method(Date, "now", () => now);
  return {
    advanceBy(ms: number) {
      now += ms;
    },
  };
}

function createNext(t: RemixTestContext, responseBody = "OK") {
  return t.mock.fn(() => Promise.resolve(new Response(responseBody)));
}

type RequestContext = ReturnType<typeof createMockContext>;
type TestNext = ReturnType<typeof createNext>;
type RateLimitMiddleware = ReturnType<typeof rateLimit>;

function invokeRateLimit(
  middleware: RateLimitMiddleware,
  context: RequestContext,
  next: TestNext,
) {
  return middleware(
    context as unknown as Parameters<RateLimitMiddleware>[0],
    next as unknown as Parameters<RateLimitMiddleware>[1],
  );
}

describe("rateLimit", () => {
  it("returns 429 when limit is exceeded", async (t) => {
    useMockClock(t);
    let middleware = rateLimit({ max: 2, windowMs: 60_000 });
    let next = createNext(t);

    await invokeRateLimit(
      middleware,
      createMockContext({ forwardedFor: "10.0.0.1" }),
      next,
    );
    await invokeRateLimit(
      middleware,
      createMockContext({ forwardedFor: "10.0.0.1" }),
      next,
    );
    let result3 = await invokeRateLimit(
      middleware,
      createMockContext({ forwardedFor: "10.0.0.1" }),
      next,
    );

    assert.equal(next.mock.calls.length, 2);
    assert.equal(result3?.status, 429);
    let body = await result3?.text();
    assert.ok(body?.includes("Too Many Requests"));
  });

  it("sets a deterministic Retry-After header when rate limited", async (t) => {
    let clock = useMockClock(t);
    let middleware = rateLimit({ max: 1, windowMs: 60_000 });
    let next = createNext(t);

    await invokeRateLimit(
      middleware,
      createMockContext({ forwardedFor: "172.16.0.1" }),
      next,
    );
    let immediateResult = await invokeRateLimit(
      middleware,
      createMockContext({ forwardedFor: "172.16.0.1" }),
      next,
    );
    clock.advanceBy(1000);
    let oneSecondLaterResult = await invokeRateLimit(
      middleware,
      createMockContext({ forwardedFor: "172.16.0.1" }),
      next,
    );

    assert.equal(immediateResult?.headers.get("Retry-After"), "60");
    assert.equal(oneSecondLaterResult?.headers.get("Retry-After"), "59");
    assert.equal(immediateResult?.headers.get("Cache-Control"), "no-store");
    assert.equal(
      immediateResult?.headers.get("Content-Type"),
      "text/plain; charset=utf-8",
    );
    assert.equal(immediateResult?.headers.get("X-Remix-Response"), "yes");
  });

  it("tracks different IPs separately", async (t) => {
    useMockClock(t);
    let middleware = rateLimit({ max: 1, windowMs: 60_000 });
    let next = createNext(t);

    await invokeRateLimit(
      middleware,
      createMockContext({ forwardedFor: "192.168.1.1" }),
      next,
    );
    let resultIp1 = await invokeRateLimit(
      middleware,
      createMockContext({ forwardedFor: "192.168.1.1" }),
      next,
    );
    let resultIp2 = await invokeRateLimit(
      middleware,
      createMockContext({ forwardedFor: "192.168.1.2" }),
      next,
    );

    assert.equal(resultIp1?.status, 429);
    assert.equal(resultIp2?.status, 200);
    assert.equal(next.mock.calls.length, 2);
  });

  it("uses first IP when x-forwarded-for has multiple values", async (t) => {
    useMockClock(t);
    let middleware = rateLimit({ max: 1, windowMs: 60_000 });
    let next = createNext(t);

    await invokeRateLimit(
      middleware,
      createMockContext({
        forwardedFor: "203.0.113.1, 70.41.3.18, 150.172.238.178",
      }),
      next,
    );
    let result = await invokeRateLimit(
      middleware,
      createMockContext({ forwardedFor: "203.0.113.1, 203.0.113.99" }),
      next,
    );

    assert.equal(result?.status, 429);
    assert.equal(next.mock.calls.length, 1);
  });

  it("resets count after window expires", async (t) => {
    let clock = useMockClock(t);
    let windowMs = 1000;
    let middleware = rateLimit({ max: 1, windowMs });
    let next = createNext(t);

    await invokeRateLimit(
      middleware,
      createMockContext({ forwardedFor: "10.0.0.5" }),
      next,
    );
    let blocked = await invokeRateLimit(
      middleware,
      createMockContext({ forwardedFor: "10.0.0.5" }),
      next,
    );
    assert.equal(blocked?.status, 429);

    clock.advanceBy(windowMs + 1);

    let allowed = await invokeRateLimit(
      middleware,
      createMockContext({ forwardedFor: "10.0.0.5" }),
      next,
    );
    assert.equal(allowed?.status, 200);
    assert.equal(next.mock.calls.length, 2);
  });

  it("supports skipping selected requests from rate limiting", async (t) => {
    useMockClock(t);
    let middleware = rateLimit({
      max: 1,
      windowMs: 60_000,
      skip: (context) => context.url.pathname === "/healthcheck",
    });
    let next = createNext(t);

    await invokeRateLimit(
      middleware,
      createMockContext({ pathname: "/healthcheck", forwardedFor: "10.0.0.5" }),
      next,
    );
    let second = await invokeRateLimit(
      middleware,
      createMockContext({ pathname: "/healthcheck", forwardedFor: "10.0.0.5" }),
      next,
    );

    assert.equal(second?.status, 200);
    assert.equal(next.mock.calls.length, 2);
  });

  it("supports skipping localhost requests from rate limiting", async (t) => {
    useMockClock(t);
    let middleware = rateLimit({
      max: 1,
      windowMs: 60_000,
      skipLocalhost: true,
    });
    let next = createNext(t);

    await invokeRateLimit(middleware, createMockContext(), next);
    let second = await invokeRateLimit(middleware, createMockContext(), next);

    assert.equal(second?.status, 200);
    assert.equal(next.mock.calls.length, 2);
  });

  it("still rate limits non-localhost requests when localhost skipping is enabled", async (t) => {
    useMockClock(t);
    let middleware = rateLimit({
      max: 1,
      windowMs: 60_000,
      skipLocalhost: true,
    });
    let next = createNext(t);

    await invokeRateLimit(
      middleware,
      createMockContext({ hostname: "example.com" }),
      next,
    );
    let second = await invokeRateLimit(
      middleware,
      createMockContext({ hostname: "example.com" }),
      next,
    );

    assert.equal(second?.status, 429);
    assert.equal(next.mock.calls.length, 1);
  });

  it("rate limits through a real router but skips healthcheck and assets", async (t) => {
    useMockClock(t);
    let router = createRouter({
      middleware: [
        rateLimit({
          max: 1,
          windowMs: 60_000,
          skip: (context) =>
            context.url.pathname === "/healthcheck" ||
            context.url.pathname === "/assets" ||
            context.url.pathname.startsWith("/assets/"),
        }),
      ],
    });

    router.map("*", (context) => {
      return new Response(`ok:${context.url.pathname}`);
    });

    let healthcheckFirst = await router.fetch(
      new Request("http://localhost/healthcheck", {
        headers: { "x-forwarded-for": "198.51.100.10" },
      }),
    );
    let healthcheckSecond = await router.fetch(
      new Request("http://localhost/healthcheck", {
        headers: { "x-forwarded-for": "198.51.100.10" },
      }),
    );

    assert.equal(healthcheckFirst.status, 200);
    assert.equal(healthcheckSecond.status, 200);

    let assetsFirst = await router.fetch(
      new Request("http://localhost/assets/app.js", {
        headers: { "x-forwarded-for": "198.51.100.10" },
      }),
    );
    let assetsSecond = await router.fetch(
      new Request("http://localhost/assets/app.js", {
        headers: { "x-forwarded-for": "198.51.100.10" },
      }),
    );

    assert.equal(assetsFirst.status, 200);
    assert.equal(assetsSecond.status, 200);

    let docsFirst = await router.fetch(
      new Request("http://localhost/docs", {
        headers: { "x-forwarded-for": "198.51.100.10" },
      }),
    );
    let docsSecond = await router.fetch(
      new Request("http://localhost/docs", {
        headers: { "x-forwarded-for": "198.51.100.10" },
      }),
    );

    assert.equal(docsFirst.status, 200);
    assert.equal(docsSecond.status, 429);
  });
});
